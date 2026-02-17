-- ============================================================
-- CIVITAS: Correcciones Backend Consolidadas
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- ==================== 1. DELETE policy para documents ====================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'documents' AND policyname = 'Admins can delete documents'
  ) THEN
    CREATE POLICY "Admins can delete documents"
      ON documents FOR DELETE
      USING (
        community_id IN (SELECT get_user_community_ids())
        AND EXISTS (
          SELECT 1 FROM members
          WHERE members.user_id = auth.uid()
            AND members.community_id = documents.community_id
            AND members.role IN ('admin', 'tesorero')
            AND members.status = 'active'
        )
      );
  END IF;
END $$;

-- ==================== 2. updated_at triggers ====================
-- Función ya existe (creada en migration 001), solo agregar triggers

-- contracts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'contracts_updated_at') THEN
    CREATE TRIGGER contracts_updated_at
      BEFORE UPDATE ON contracts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- entities
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'entities_updated_at') THEN
    CREATE TRIGGER entities_updated_at
      BEFORE UPDATE ON entities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- recurring_schedules
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'recurring_schedules_updated_at') THEN
    CREATE TRIGGER recurring_schedules_updated_at
      BEFORE UPDATE ON recurring_schedules
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ratings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'ratings_updated_at') THEN
    CREATE TRIGGER ratings_updated_at
      BEFORE UPDATE ON ratings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- ==================== 3. Índice en transactions.import_job_id ====================
CREATE INDEX IF NOT EXISTS idx_transactions_import_job ON transactions(import_job_id)
  WHERE import_job_id IS NOT NULL;

-- ==================== 4. Índice en audit_log.user_id ====================
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);

-- ==================== 5. Storage bucket (idempotente) ====================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage policies (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload documents"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public read access for documents'
  ) THEN
    CREATE POLICY "Public read access for documents"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'documents');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can delete documents'
  ) THEN
    CREATE POLICY "Authenticated users can delete documents"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END $$;

-- ==================== 6. Verificar/crear todas las funciones RPC ====================

-- get_user_role
CREATE OR REPLACE FUNCTION get_user_role(p_community_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM members
  WHERE user_id = auth.uid()
    AND community_id = p_community_id
    AND status = 'active'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated;

-- get_user_community_ids (usado internamente por RLS)
CREATE OR REPLACE FUNCTION get_user_community_ids()
RETURNS setof uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT community_id FROM members
  WHERE user_id = auth.uid()
    AND status = 'active';
$$;

-- accept_invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_token uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
BEGIN
  SELECT * INTO v_invitation FROM invitations
  WHERE token = p_token AND status = 'pending' AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found, expired, or already used';
  END IF;

  INSERT INTO members (community_id, user_id, role, status)
  VALUES (v_invitation.community_id, p_user_id, v_invitation.role, 'active')
  ON CONFLICT (community_id, user_id) DO NOTHING;

  UPDATE invitations SET status = 'accepted' WHERE id = v_invitation.id;
END;
$$;
GRANT EXECUTE ON FUNCTION accept_invitation(uuid, uuid) TO authenticated;

-- compute_financial_standing
CREATE OR REPLACE FUNCTION compute_financial_standing(p_member_id uuid, p_community_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_overdue_count int;
  v_grace_months int;
  v_rules jsonb;
BEGIN
  SELECT rules INTO v_rules FROM communities WHERE id = p_community_id;
  v_grace_months := COALESCE((v_rules->'identity'->>'grace_period_months')::int, 2);

  SELECT count(*) INTO v_overdue_count
  FROM payment_obligations
  WHERE member_id = p_member_id
    AND community_id = p_community_id
    AND status = 'overdue';

  IF v_overdue_count = 0 THEN
    RETURN 'good_standing';
  ELSIF v_overdue_count <= v_grace_months THEN
    RETURN 'grace_period';
  ELSE
    RETURN 'delinquent';
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION compute_financial_standing(uuid, uuid) TO authenticated;

-- refresh_financial_standings
CREATE OR REPLACE FUNCTION refresh_financial_standings(p_community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_member record;
  v_standing text;
BEGIN
  -- Mark overdue obligations
  UPDATE payment_obligations
  SET status = 'overdue'
  WHERE community_id = p_community_id
    AND status = 'pending'
    AND due_date < CURRENT_DATE;

  -- Recompute each member's standing
  FOR v_member IN
    SELECT id FROM members
    WHERE community_id = p_community_id AND status = 'active'
  LOOP
    v_standing := compute_financial_standing(v_member.id, p_community_id);
    UPDATE members SET financial_standing = v_standing WHERE id = v_member.id;
  END LOOP;
END;
$$;
GRANT EXECUTE ON FUNCTION refresh_financial_standings(uuid) TO authenticated;

-- take_census_snapshot
CREATE OR REPLACE FUNCTION take_census_snapshot(p_community_id uuid)
RETURNS census_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result census_snapshots;
  v_total int;
  v_active int;
  v_good int;
  v_delinquent int;
  v_income numeric;
  v_expenses numeric;
  v_proposals int;
BEGIN
  SELECT count(*) INTO v_total FROM members WHERE community_id = p_community_id;
  SELECT count(*) INTO v_active FROM members WHERE community_id = p_community_id AND status = 'active';
  SELECT count(*) INTO v_good FROM members WHERE community_id = p_community_id AND status = 'active' AND financial_standing = 'good_standing';
  SELECT count(*) INTO v_delinquent FROM members WHERE community_id = p_community_id AND status = 'active' AND financial_standing = 'delinquent';
  SELECT COALESCE(sum(amount), 0) INTO v_income FROM transactions WHERE community_id = p_community_id AND type = 'income';
  SELECT COALESCE(sum(amount), 0) INTO v_expenses FROM transactions WHERE community_id = p_community_id AND type = 'expense';
  SELECT count(*) INTO v_proposals FROM proposals WHERE community_id = p_community_id AND status = 'active';

  INSERT INTO census_snapshots (community_id, total_members, active_members, members_good_standing, members_delinquent, total_income, total_expenses, active_proposals, snapshot_date)
  VALUES (p_community_id, v_total, v_active, v_good, v_delinquent, v_income, v_expenses, v_proposals, CURRENT_DATE)
  ON CONFLICT (community_id, snapshot_date) DO UPDATE SET
    total_members = EXCLUDED.total_members,
    active_members = EXCLUDED.active_members,
    members_good_standing = EXCLUDED.members_good_standing,
    members_delinquent = EXCLUDED.members_delinquent,
    total_income = EXCLUDED.total_income,
    total_expenses = EXCLUDED.total_expenses,
    active_proposals = EXCLUDED.active_proposals
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION take_census_snapshot(uuid) TO authenticated;

-- get_platform_census
CREATE OR REPLACE FUNCTION get_platform_census()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_communities', (SELECT count(*) FROM communities),
    'total_members', (SELECT count(*) FROM members),
    'active_members', (SELECT count(*) FROM members WHERE status = 'active'),
    'members_good_standing', (SELECT count(*) FROM members WHERE status = 'active' AND financial_standing = 'good_standing'),
    'members_delinquent', (SELECT count(*) FROM members WHERE status = 'active' AND financial_standing = 'delinquent'),
    'total_proposals', (SELECT count(*) FROM proposals),
    'active_proposals', (SELECT count(*) FROM proposals WHERE status = 'active'),
    'approved_proposals', (SELECT count(*) FROM proposals WHERE status = 'approved'),
    'total_delegations', (SELECT count(*) FROM delegations WHERE active = true),
    'total_transactions', (SELECT count(*) FROM transactions),
    'total_income', (SELECT COALESCE(sum(amount), 0) FROM transactions WHERE type = 'income'),
    'total_expenses', (SELECT COALESCE(sum(amount), 0) FROM transactions WHERE type = 'expense'),
    'community_types', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('type', type, 'count', cnt)), '[]'::jsonb)
      FROM (SELECT type, count(*) as cnt FROM communities GROUP BY type) sub
    ),
    'snapshot_at', now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;
GRANT EXECUTE ON FUNCTION get_platform_census() TO authenticated;

-- generate_recurring_obligations
CREATE OR REPLACE FUNCTION generate_recurring_obligations(p_schedule_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule record;
  v_count int := 0;
  v_member record;
BEGIN
  SELECT * INTO v_schedule FROM recurring_schedules WHERE id = p_schedule_id AND is_active = true;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_schedule.type = 'collection' AND v_schedule.target_type = 'all_members' THEN
    FOR v_member IN
      SELECT id FROM members WHERE community_id = v_schedule.community_id AND status = 'active'
    LOOP
      INSERT INTO payment_obligations (community_id, member_id, amount, due_date, status, concept)
      VALUES (v_schedule.community_id, v_member.id, v_schedule.amount, v_schedule.next_run_date, 'pending', v_schedule.name)
      ON CONFLICT DO NOTHING;
      v_count := v_count + 1;
    END LOOP;
  ELSIF v_schedule.type = 'payment' THEN
    INSERT INTO transactions (community_id, type, amount, category_id, description, date)
    VALUES (v_schedule.community_id, 'expense', v_schedule.amount, v_schedule.category_id, v_schedule.name, v_schedule.next_run_date);
    v_count := 1;
  END IF;

  -- Advance next_run_date
  UPDATE recurring_schedules SET
    last_run_date = next_run_date,
    runs_completed = runs_completed + 1,
    next_run_date = CASE v_schedule.frequency
      WHEN 'weekly' THEN next_run_date + interval '7 days'
      WHEN 'biweekly' THEN next_run_date + interval '14 days'
      WHEN 'monthly' THEN next_run_date + interval '1 month'
      WHEN 'bimonthly' THEN next_run_date + interval '2 months'
      WHEN 'quarterly' THEN next_run_date + interval '3 months'
      WHEN 'semiannual' THEN next_run_date + interval '6 months'
      WHEN 'annual' THEN next_run_date + interval '1 year'
      ELSE next_run_date + (COALESCE(v_schedule.custom_interval_days, 30) || ' days')::interval
    END
  WHERE id = p_schedule_id;

  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION generate_recurring_obligations(uuid) TO authenticated;

-- process_recurring_schedules
CREATE OR REPLACE FUNCTION process_recurring_schedules(p_community_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule record;
  v_total int := 0;
  v_count int;
BEGIN
  FOR v_schedule IN
    SELECT id FROM recurring_schedules
    WHERE community_id = p_community_id
      AND is_active = true
      AND next_run_date <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
  LOOP
    v_count := generate_recurring_obligations(v_schedule.id);
    v_total := v_total + v_count;
  END LOOP;

  RETURN v_total;
END;
$$;
GRANT EXECUTE ON FUNCTION process_recurring_schedules(uuid) TO authenticated;

-- update_contract_compliance
CREATE OR REPLACE FUNCTION update_contract_compliance(p_contract_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total int;
  v_paid int;
  v_score numeric(3,2);
BEGIN
  SELECT count(*) INTO v_total FROM contract_installments WHERE contract_id = p_contract_id;
  IF v_total = 0 THEN RETURN 1.00; END IF;

  SELECT count(*) INTO v_paid FROM contract_installments
  WHERE contract_id = p_contract_id AND status = 'paid';

  v_score := ROUND(v_paid::numeric / v_total::numeric, 2);

  UPDATE contracts SET compliance_score = v_score WHERE id = p_contract_id;

  RETURN v_score;
END;
$$;
GRANT EXECUTE ON FUNCTION update_contract_compliance(uuid) TO authenticated;

-- ==================== 7. Refresh entity_ratings_summary view ====================
DROP VIEW IF EXISTS entity_ratings_summary;
CREATE VIEW entity_ratings_summary AS
SELECT
  community_id,
  target_type,
  target_id,
  count(*)::int as total_ratings,
  round(avg(overall_score)::numeric, 1) as avg_score,
  round(avg((dimensions->>'punctuality')::numeric), 1) as avg_punctuality,
  round(avg((dimensions->>'quality')::numeric), 1) as avg_quality,
  round(avg((dimensions->>'communication')::numeric), 1) as avg_communication,
  round(avg((dimensions->>'compliance')::numeric), 1) as avg_compliance,
  round(avg((dimensions->>'value')::numeric), 1) as avg_value
FROM ratings
GROUP BY community_id, target_type, target_id;

GRANT SELECT ON entity_ratings_summary TO authenticated;

-- ==================== 8. Refresh member_profiles view ====================
DROP VIEW IF EXISTS member_profiles;
CREATE VIEW member_profiles AS
SELECT
  m.*,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name
FROM members m
JOIN auth.users u ON u.id = m.user_id;

GRANT SELECT ON member_profiles TO authenticated;

-- ==================== DONE ====================
SELECT 'All backend fixes applied successfully!' as result;
