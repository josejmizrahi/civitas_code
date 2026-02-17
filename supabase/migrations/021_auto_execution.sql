-- ============================================================
-- CIVITAS: Auto-execution of approved proposals after cool-down
-- ============================================================

-- Function: process proposals in cool_down state whose cool_down_until has passed
-- For MVP, only disbursement type is auto-executed server-side.
-- budget_allocation, quota_change, config_change still require client-side executeProposal().
CREATE OR REPLACE FUNCTION process_auto_executions()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proposal     record;
  v_instruction  jsonb;
  v_type         text;
  v_count        int := 0;
BEGIN
  FOR v_proposal IN
    SELECT p.*, c.rules
    FROM proposals p
    JOIN communities c ON c.id = p.community_id
    WHERE p.status = 'approved'
      AND p.execution_status = 'cool_down'
      AND p.cool_down_until IS NOT NULL
      AND p.cool_down_until < now()
      AND p.financial_instruction IS NOT NULL
  LOOP
    v_instruction := v_proposal.financial_instruction::jsonb;
    v_type := v_instruction ->> 'type';

    BEGIN
      -- Auto-execute disbursement server-side
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

        UPDATE proposals
        SET execution_status = 'executed',
            executed_at = now()
        WHERE id = v_proposal.id;

        v_count := v_count + 1;

      -- For quota_change: generate obligations for all active members
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

        UPDATE proposals
        SET execution_status = 'executed',
            executed_at = now()
        WHERE id = v_proposal.id;

        v_count := v_count + 1;

      -- For budget_allocation: create/update budget
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

        UPDATE proposals
        SET execution_status = 'executed',
            executed_at = now()
        WHERE id = v_proposal.id;

        v_count := v_count + 1;

      -- For config_change: update community rules
      ELSIF v_type = 'config_change' AND (v_instruction ->> 'config_key') IS NOT NULL THEN
        -- Config changes are complex (dot notation parsing). Mark as 'manual' for client-side execution.
        UPDATE proposals
        SET execution_status = 'manual'
        WHERE id = v_proposal.id;

        v_count := v_count + 1;
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Mark failed; don't block other proposals
      UPDATE proposals
      SET execution_status = 'failed'
      WHERE id = v_proposal.id;
    END;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION process_auto_executions() TO authenticated;

-- NOTE: For full automation, enable pg_cron:
-- SELECT cron.schedule('auto-execute-proposals', '*/5 * * * *', 'SELECT process_auto_executions()');
