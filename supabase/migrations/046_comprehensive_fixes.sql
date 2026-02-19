-- ============================================================================
-- Migration 046: Comprehensive Fixes
-- Addresses all critical, high, and medium issues found in the schema audit.
-- ============================================================================

BEGIN;

-- ============================================================================
-- P0-1: Create missing get_member_emails RPC
-- Called by email.service.ts but never defined in any migration.
-- ============================================================================

CREATE OR REPLACE FUNCTION get_member_emails(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT au.id AS user_id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION get_member_emails(uuid[]) TO authenticated;

-- ============================================================================
-- P0-2: Restore financial logic in process_auto_executions()
-- Migration 031 accidentally stripped the financial execution logic from 021.
-- This version merges both: grace period checks (031) + financial ops (021).
-- ============================================================================

CREATE OR REPLACE FUNCTION process_auto_executions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal     record;
  v_instruction  jsonb;
  v_type         text;
  v_count        int := 0;
BEGIN
  FOR v_proposal IN
    SELECT p.id, p.community_id, p.financial_instruction, p.title, p.created_by
    FROM proposals p
    WHERE p.status = 'approved'
      AND p.execution_status = 'cool_down'
      AND p.cool_down_until IS NOT NULL
      AND p.cool_down_until <= now()
      AND (p.grace_period_end IS NULL OR p.grace_period_end <= now())
      AND (p.appealed IS NULL OR p.appealed = false)
      AND p.financial_instruction IS NOT NULL
  LOOP
    v_instruction := v_proposal.financial_instruction::jsonb;
    v_type := v_instruction ->> 'type';

    BEGIN
      IF v_type = 'disbursement' THEN
        INSERT INTO transactions (
          community_id, type, amount, description, date, category_id, created_by
        ) VALUES (
          v_proposal.community_id,
          'expense',
          COALESCE((v_instruction ->> 'amount')::numeric, 0),
          '[Auto-ejecución] ' || COALESCE(v_instruction ->> 'description', v_proposal.title),
          CURRENT_DATE,
          CASE WHEN v_instruction ->> 'category_id' != '' THEN (v_instruction ->> 'category_id')::uuid ELSE NULL END,
          v_proposal.created_by
        );

      ELSIF v_type = 'quota_change' THEN
        INSERT INTO payment_obligations (community_id, member_id, amount, due_date, concept, status)
        SELECT
          v_proposal.community_id,
          m.id,
          COALESCE((v_instruction ->> 'new_amount')::numeric, (v_instruction ->> 'amount')::numeric, 0),
          COALESCE((v_instruction ->> 'effective_date')::date, CURRENT_DATE),
          COALESCE(v_instruction ->> 'description', 'Cuota aprobada: ' || v_proposal.title),
          'pending'
        FROM members m
        WHERE m.community_id = v_proposal.community_id AND m.status = 'active';

      ELSIF v_type = 'budget_allocation' AND (v_instruction ->> 'category_id') IS NOT NULL THEN
        INSERT INTO budgets (community_id, category_id, period, amount)
        VALUES (
          v_proposal.community_id,
          (v_instruction ->> 'category_id')::uuid,
          COALESCE(v_instruction ->> 'period', to_char(CURRENT_DATE, 'YYYY-MM')),
          COALESCE((v_instruction ->> 'amount')::numeric, 0)
        )
        ON CONFLICT (community_id, category_id, period) DO UPDATE
        SET amount = EXCLUDED.amount;

      ELSIF v_type = 'config_change' THEN
        UPDATE proposals
        SET execution_status = 'manual'
        WHERE id = v_proposal.id;
        v_count := v_count + 1;
        CONTINUE;
      END IF;

      UPDATE proposals
      SET execution_status = 'executed',
          executed_at = now(),
          status = 'executed'
      WHERE id = v_proposal.id;

      INSERT INTO audit_log (community_id, user_id, action, entity_type, entity_id, details)
      VALUES (
        v_proposal.community_id,
        NULL,
        'auto_execute',
        'proposal',
        v_proposal.id,
        jsonb_build_object(
          'financial_instruction', v_proposal.financial_instruction,
          'instruction_type', v_type,
          'executed_at', now()
        )
      );

      v_count := v_count + 1;

    EXCEPTION WHEN OTHERS THEN
      UPDATE proposals
      SET execution_status = 'failed'
      WHERE id = v_proposal.id;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION process_auto_executions() TO authenticated;

-- ============================================================================
-- P0-3: Fix members INSERT RLS — require valid invitation or admin role
-- Drop the overly-permissive "Users can join via invitation" policy.
-- ============================================================================

DROP POLICY IF EXISTS "Users can join via invitation" ON members;

-- ============================================================================
-- P0-4: Fix pg_cron in 041 — unschedule duplicates from 032, keep only 041 names
-- Wrap in conditional so migration doesn't fail if pg_cron is unavailable.
-- ============================================================================

DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove duplicate jobs from migration 032
    BEGIN PERFORM cron.unschedule('process-auto-executions'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('process-expired-proposals'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('compute-moroso-status'); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN PERFORM cron.unschedule('notify-pending-executions'); EXCEPTION WHEN OTHERS THEN NULL; END;

    -- Re-register with canonical names (same as 041 but wrapped safely)
    BEGIN PERFORM cron.unschedule('close-expired-proposals'); EXCEPTION WHEN OTHERS THEN NULL; END;
    PERFORM cron.schedule('close-expired-proposals', '*/5 * * * *', 'SELECT process_expired_proposals()');

    BEGIN PERFORM cron.unschedule('auto-execute-proposals'); EXCEPTION WHEN OTHERS THEN NULL; END;
    PERFORM cron.schedule('auto-execute-proposals', '*/10 * * * *', 'SELECT process_auto_executions()');

    BEGIN PERFORM cron.unschedule('compute-moroso-daily'); EXCEPTION WHEN OTHERS THEN NULL; END;
    PERFORM cron.schedule('compute-moroso-daily', '0 6 * * *', 'SELECT compute_moroso_status_all()');

    BEGIN PERFORM cron.unschedule('notify-pending-executions-weekly'); EXCEPTION WHEN OTHERS THEN NULL; END;
    PERFORM cron.schedule('notify-pending-executions-weekly', '0 9 * * 1', 'SELECT notify_pending_executions()');

    RAISE NOTICE 'pg_cron jobs deduplicated and rescheduled';
  ELSE
    RAISE NOTICE 'pg_cron not available — skipping job scheduling';
  END IF;
END $cron$;

-- ============================================================================
-- P0-5: Make 043 endorsement policies idempotent
-- ============================================================================

DROP POLICY IF EXISTS endorsements_select ON proposal_endorsements;
CREATE POLICY endorsements_select ON proposal_endorsements
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS endorsements_insert ON proposal_endorsements;
CREATE POLICY endorsements_insert ON proposal_endorsements
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS endorsements_delete ON proposal_endorsements;
CREATE POLICY endorsements_delete ON proposal_endorsements
  FOR DELETE USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- P0-6: Make 044 gamification policies idempotent
-- ============================================================================

DROP POLICY IF EXISTS gamification_select ON member_gamification;
CREATE POLICY gamification_select ON member_gamification
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS gamification_insert ON member_gamification;
CREATE POLICY gamification_insert ON member_gamification
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS gamification_update ON member_gamification;
CREATE POLICY gamification_update ON member_gamification
  FOR UPDATE USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS gam_events_select ON gamification_events;
CREATE POLICY gam_events_select ON gamification_events
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS gam_events_insert ON gamification_events;
CREATE POLICY gam_events_insert ON gamification_events
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ============================================================================
-- P1-1: Fix invitations "Anyone can read" → filter by user's email
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can read invitation by token" ON invitations;
CREATE POLICY "User can read own invitations" ON invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================================================
-- P1-2: Add missing FK constraints on admin_terms, vigilancia_reports, assembly_proxies
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'admin_terms_member_id_fkey' AND table_name = 'admin_terms'
  ) THEN
    ALTER TABLE admin_terms
      ADD CONSTRAINT admin_terms_member_id_fkey
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'admin_terms_elected_in_assembly_fkey' AND table_name = 'admin_terms'
  ) THEN
    ALTER TABLE admin_terms
      ADD CONSTRAINT admin_terms_elected_in_assembly_fkey
      FOREIGN KEY (elected_in_assembly) REFERENCES assemblies(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'vigilancia_reports_author_id_fkey' AND table_name = 'vigilancia_reports'
  ) THEN
    ALTER TABLE vigilancia_reports
      ADD CONSTRAINT vigilancia_reports_author_id_fkey
      FOREIGN KEY (author_id) REFERENCES members(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'assembly_proxies_assembly_id_fkey' AND table_name = 'assembly_proxies'
  ) THEN
    ALTER TABLE assembly_proxies
      ADD CONSTRAINT assembly_proxies_assembly_id_fkey
      FOREIGN KEY (assembly_id) REFERENCES assemblies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- P2-1: Add ON DELETE CASCADE to audit_log.community_id
-- ============================================================================

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'audit_log_community_id_fkey' AND table_name = 'audit_log'
  ) THEN
    ALTER TABLE audit_log DROP CONSTRAINT audit_log_community_id_fkey;
  END IF;

  ALTER TABLE audit_log
    ADD CONSTRAINT audit_log_community_id_fkey
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE CASCADE;
END $$;

-- ============================================================================
-- P2-2: Grant EXECUTE on get_user_community_ids() to authenticated
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_community_ids() TO authenticated;

-- ============================================================================
-- P2-3: Add updated_at triggers for tables that have the column but no trigger
-- ============================================================================

DROP TRIGGER IF EXISTS entities_updated_at ON entities;
CREATE TRIGGER entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS recurring_schedules_updated_at ON recurring_schedules;
CREATE TRIGGER recurring_schedules_updated_at
  BEFORE UPDATE ON recurring_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS contracts_updated_at ON contracts;
CREATE TRIGGER contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS ratings_updated_at ON ratings;
CREATE TRIGGER ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS member_gamification_updated_at ON member_gamification;
CREATE TRIGGER member_gamification_updated_at
  BEFORE UPDATE ON member_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- P2-4: Add created_at to common_areas for consistency
-- ============================================================================

ALTER TABLE common_areas ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- ============================================================================
-- P2-5: Add missing index on notifications.community_id
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_community ON notifications(community_id);

-- ============================================================================
-- P2-6: Standardize UUID generation — ensure gen_random_uuid() works everywhere
-- (pgcrypto provides gen_random_uuid on older Postgres; PG13+ has it built-in)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- P3: Enable Realtime for tables used by the frontend
-- (notifications, transactions, payment_obligations)
-- ============================================================================

DO $rt$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'payment_obligations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE payment_obligations;
  END IF;
END $rt$;

COMMIT;
