-- ============================================================
-- CIVITAS: Funciones SQL faltantes
-- Ejecutar en SQL Editor de Supabase
-- ============================================================

-- 1. get_user_role (identity)
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

-- 2. accept_invitation
CREATE OR REPLACE FUNCTION accept_invitation(p_token uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation record;
BEGIN
  SELECT * INTO v_invitation
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitación no válida, expirada o ya utilizada';
  END IF;

  INSERT INTO members (community_id, user_id, role, status)
  VALUES (v_invitation.community_id, p_user_id, v_invitation.role, 'active')
  ON CONFLICT (community_id, user_id) DO NOTHING;

  UPDATE invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_invitation(uuid, uuid) TO authenticated;

-- 3. compute_financial_standing
CREATE OR REPLACE FUNCTION compute_financial_standing(p_member_id uuid, p_community_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rules              jsonb;
  v_grace_months       int;
  v_payment_to_vote    boolean;
  v_overdue_count      int;
  v_oldest_overdue_date date;
  v_months_overdue     numeric;
BEGIN
  SELECT rules INTO v_rules
  FROM communities
  WHERE id = p_community_id;

  v_payment_to_vote := COALESCE((v_rules -> 'identity' ->> 'payment_to_vote_enabled')::boolean, false);

  IF NOT v_payment_to_vote THEN
    RETURN 'good_standing';
  END IF;

  v_grace_months := COALESCE((v_rules -> 'identity' ->> 'grace_period_months')::int, 2);

  SELECT COUNT(*), MIN(due_date)
  INTO v_overdue_count, v_oldest_overdue_date
  FROM payment_obligations
  WHERE member_id  = p_member_id
    AND community_id = p_community_id
    AND status IN ('pending', 'overdue')
    AND due_date < CURRENT_DATE;

  IF v_overdue_count = 0 THEN
    RETURN 'good_standing';
  END IF;

  v_months_overdue := EXTRACT(EPOCH FROM (CURRENT_DATE - v_oldest_overdue_date)) / (30.44 * 86400);

  IF v_months_overdue <= v_grace_months THEN
    RETURN 'grace_period';
  ELSE
    RETURN 'delinquent';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION compute_financial_standing(uuid, uuid) TO authenticated;

-- 4. refresh_financial_standings
CREATE OR REPLACE FUNCTION refresh_financial_standings(p_community_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE members
  SET financial_standing = compute_financial_standing(id, p_community_id)
  WHERE community_id = p_community_id
    AND status = 'active';
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_financial_standings(uuid) TO authenticated;

-- 5. take_census_snapshot
CREATE OR REPLACE FUNCTION take_census_snapshot(p_community_id uuid)
RETURNS census_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result      census_snapshots;
  v_total       int;
  v_active      int;
  v_good        int;
  v_delinquent  int;
  v_income      numeric;
  v_expenses    numeric;
  v_proposals   int;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM members WHERE community_id = p_community_id;

  SELECT COUNT(*) INTO v_active
  FROM members WHERE community_id = p_community_id AND status = 'active';

  SELECT COUNT(*) INTO v_good
  FROM members WHERE community_id = p_community_id AND status = 'active' AND financial_standing = 'good_standing';

  SELECT COUNT(*) INTO v_delinquent
  FROM members WHERE community_id = p_community_id AND status = 'active' AND financial_standing = 'delinquent';

  SELECT COALESCE(SUM(amount), 0) INTO v_income
  FROM transactions WHERE community_id = p_community_id AND type = 'income';

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM transactions WHERE community_id = p_community_id AND type = 'expense';

  SELECT COUNT(*) INTO v_proposals
  FROM proposals WHERE community_id = p_community_id AND status = 'active';

  INSERT INTO census_snapshots (
    community_id, total_members, active_members,
    members_good_standing, members_delinquent,
    total_income, total_expenses, active_proposals, snapshot_date
  ) VALUES (
    p_community_id, v_total, v_active,
    v_good, v_delinquent,
    v_income, v_expenses, v_proposals, CURRENT_DATE
  )
  ON CONFLICT (community_id, snapshot_date) DO UPDATE SET
    total_members         = EXCLUDED.total_members,
    active_members        = EXCLUDED.active_members,
    members_good_standing = EXCLUDED.members_good_standing,
    members_delinquent    = EXCLUDED.members_delinquent,
    total_income          = EXCLUDED.total_income,
    total_expenses        = EXCLUDED.total_expenses,
    active_proposals      = EXCLUDED.active_proposals
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION take_census_snapshot(uuid) TO authenticated;

-- 6. get_platform_census
CREATE OR REPLACE FUNCTION get_platform_census()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_communities',    (SELECT COUNT(*) FROM communities),
    'total_members',        (SELECT COUNT(*) FROM members),
    'active_members',       (SELECT COUNT(*) FROM members WHERE status = 'active'),
    'members_good_standing',(SELECT COUNT(*) FROM members WHERE status = 'active' AND financial_standing = 'good_standing'),
    'members_delinquent',   (SELECT COUNT(*) FROM members WHERE status = 'active' AND financial_standing = 'delinquent'),
    'total_proposals',      (SELECT COUNT(*) FROM proposals),
    'active_proposals',     (SELECT COUNT(*) FROM proposals WHERE status = 'active'),
    'approved_proposals',   (SELECT COUNT(*) FROM proposals WHERE status = 'approved'),
    'total_transactions',   (SELECT COUNT(*) FROM transactions),
    'total_income',         (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'income'),
    'total_expenses',       (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'expense'),
    'total_delegations',    (SELECT COUNT(*) FROM delegations WHERE active = true),
    'total_documents',      (SELECT COUNT(*) FROM documents),
    'community_types',      (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('type', type, 'count', cnt)), '[]'::jsonb)
      FROM (SELECT type, COUNT(*) as cnt FROM communities GROUP BY type) sub
    ),
    'snapshot_at',          now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_platform_census() TO authenticated;

-- 7. generate_recurring_obligations
CREATE OR REPLACE FUNCTION generate_recurring_obligations(p_schedule_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule recurring_schedules%ROWTYPE;
  v_member_ids uuid[];
  v_count int := 0;
  v_next date;
  v_mid uuid;
BEGIN
  SELECT * INTO v_schedule FROM recurring_schedules WHERE id = p_schedule_id AND is_active = true;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF v_schedule.next_run_date > CURRENT_DATE THEN RETURN 0; END IF;

  IF v_schedule.type = 'collection' THEN
    IF v_schedule.target_type = 'all_members' THEN
      SELECT array_agg(id) INTO v_member_ids
      FROM members WHERE community_id = v_schedule.community_id AND status = 'active';
    ELSIF v_schedule.target_type = 'specific_members' THEN
      SELECT array_agg(value::uuid) INTO v_member_ids
      FROM jsonb_array_elements_text(v_schedule.target_member_ids);
    END IF;

    IF v_member_ids IS NOT NULL THEN
      FOREACH v_mid IN ARRAY v_member_ids LOOP
        INSERT INTO payment_obligations (community_id, member_id, amount, due_date, concept, status)
        VALUES (v_schedule.community_id, v_mid, v_schedule.amount, v_schedule.next_run_date,
                v_schedule.name || ' — ' || to_char(v_schedule.next_run_date, 'Mon YYYY'), 'pending');
        v_count := v_count + 1;
      END LOOP;
    END IF;
  END IF;

  IF v_schedule.type = 'payment' AND v_schedule.target_entity_id IS NOT NULL THEN
    INSERT INTO transactions (community_id, type, amount, category_id, description, date, created_by)
    VALUES (v_schedule.community_id, 'expense', v_schedule.amount, v_schedule.category_id,
            'Pago recurrente: ' || v_schedule.name || ' — ' || to_char(v_schedule.next_run_date, 'Mon YYYY'),
            v_schedule.next_run_date, v_schedule.created_by);
    v_count := v_count + 1;
  END IF;

  v_next := CASE v_schedule.frequency
    WHEN 'weekly' THEN v_schedule.next_run_date + INTERVAL '7 days'
    WHEN 'biweekly' THEN v_schedule.next_run_date + INTERVAL '14 days'
    WHEN 'monthly' THEN v_schedule.next_run_date + INTERVAL '1 month'
    WHEN 'bimonthly' THEN v_schedule.next_run_date + INTERVAL '2 months'
    WHEN 'quarterly' THEN v_schedule.next_run_date + INTERVAL '3 months'
    WHEN 'semiannual' THEN v_schedule.next_run_date + INTERVAL '6 months'
    WHEN 'annual' THEN v_schedule.next_run_date + INTERVAL '1 year'
    WHEN 'custom' THEN v_schedule.next_run_date + (COALESCE(v_schedule.custom_interval_days, 30) || ' days')::interval
    ELSE v_schedule.next_run_date + INTERVAL '1 month'
  END;

  IF v_schedule.end_date IS NOT NULL AND v_next > v_schedule.end_date THEN
    UPDATE recurring_schedules SET is_active = false, next_run_date = v_next, last_run_date = v_schedule.next_run_date,
      runs_completed = runs_completed + 1, updated_at = now() WHERE id = p_schedule_id;
  ELSE
    UPDATE recurring_schedules SET next_run_date = v_next, last_run_date = v_schedule.next_run_date,
      runs_completed = runs_completed + 1, updated_at = now() WHERE id = p_schedule_id;
  END IF;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_recurring_obligations(uuid) TO authenticated;

-- 8. process_recurring_schedules
CREATE OR REPLACE FUNCTION process_recurring_schedules(p_community_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule_id uuid;
  v_total int := 0;
  v_count int;
BEGIN
  FOR v_schedule_id IN
    SELECT id FROM recurring_schedules
    WHERE community_id = p_community_id AND is_active = true AND next_run_date <= CURRENT_DATE
  LOOP
    SELECT generate_recurring_obligations(v_schedule_id) INTO v_count;
    v_total := v_total + v_count;
  END LOOP;
  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION process_recurring_schedules(uuid) TO authenticated;

-- 9. update_contract_compliance
CREATE OR REPLACE FUNCTION update_contract_compliance(p_contract_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total int;
  v_on_time int;
  v_score numeric(3,2);
BEGIN
  SELECT COUNT(*) INTO v_total FROM contract_installments
    WHERE contract_id = p_contract_id AND status != 'cancelled';

  IF v_total = 0 THEN RETURN 1.00; END IF;

  SELECT COUNT(*) INTO v_on_time FROM contract_installments
    WHERE contract_id = p_contract_id AND status = 'paid';

  v_score := v_on_time::numeric / v_total::numeric;

  UPDATE contracts SET compliance_score = v_score, updated_at = now() WHERE id = p_contract_id;

  RETURN v_score;
END;
$$;

GRANT EXECUTE ON FUNCTION update_contract_compliance(uuid) TO authenticated;
