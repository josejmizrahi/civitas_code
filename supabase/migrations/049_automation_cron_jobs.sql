-- =========================================================================
-- 049: Automation cron jobs
-- - process_all_recurring_schedules: daily, generate obligations from recurring schedules
-- - advance_expired_discussions: every 5 min, move proposals from discussion to voting
-- - send_payment_reminders: daily 9 AM, notify members with obligations due in 3 days
-- - process_overdue_obligations: daily 7 AM, mark overdue and notify
-- =========================================================================

-- ---------------------------------------------------------------------------
-- 1. Wrapper: process recurring schedules for ALL communities
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_all_recurring_schedules()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_community_id uuid;
BEGIN
  FOR v_community_id IN SELECT id FROM communities LOOP
    PERFORM process_recurring_schedules(v_community_id);
  END LOOP;
END;
$fn$;

GRANT EXECUTE ON FUNCTION process_all_recurring_schedules() TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. Advance proposals from discussion to voting when discussion_end has passed
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION advance_expired_discussions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_proposal record;
  v_count int := 0;
  v_voting_end timestamptz;
BEGIN
  FOR v_proposal IN
    SELECT id, community_id, title
    FROM proposals
    WHERE status = 'discussion'
      AND discussion_end IS NOT NULL
      AND discussion_end <= now()
  LOOP
    v_voting_end := now() + interval '7 days';

    UPDATE proposals
    SET status = 'active',
        voting_start = now(),
        voting_end = v_voting_end,
        updated_at = now()
    WHERE id = v_proposal.id;

    PERFORM notify_community(
      v_proposal.community_id,
      'proposal_opened',
      'Votación abierta: ' || v_proposal.title,
      'El periodo de discusión terminó. Puedes votar hasta ' || to_char(v_voting_end, 'DD/MM/YYYY HH24:MI'),
      jsonb_build_object('proposal_id', v_proposal.id)
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$fn$;

GRANT EXECUTE ON FUNCTION advance_expired_discussions() TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Send payment reminders (obligations due in the next 3 days)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION send_payment_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_ob record;
  v_count int := 0;
  v_days int;
BEGIN
  FOR v_ob IN
    SELECT po.id, po.community_id, po.member_id, po.concept, po.amount, po.due_date
    FROM payment_obligations po
    WHERE po.status = 'pending'
      AND po.due_date > current_date
      AND po.due_date <= current_date + interval '3 days'
  LOOP
    v_days := (v_ob.due_date::date - current_date);
    PERFORM notify_member(
      v_ob.community_id,
      v_ob.member_id,
      'payment_reminder',
      'Pago próximo: ' || coalesce(v_ob.concept, 'Obligación'),
      'Tu pago de $' || trim(to_char(v_ob.amount, '999999990.00')) || ' vence en ' || v_days || ' día(s) (' || to_char(v_ob.due_date::date, 'DD/MM/YYYY') || ').',
      jsonb_build_object('obligation_id', v_ob.id, 'due_date', v_ob.due_date, 'amount', v_ob.amount)
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$fn$;

GRANT EXECUTE ON FUNCTION send_payment_reminders() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Mark overdue obligations and notify members (only for newly marked rows)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION process_overdue_obligations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_ob record;
  v_count int := 0;
BEGIN
  FOR v_ob IN
    UPDATE payment_obligations
    SET status = 'overdue',
        updated_at = now()
    WHERE status = 'pending'
      AND due_date < current_date
    RETURNING id, community_id, member_id, concept, amount, due_date
  LOOP
    PERFORM notify_member(
      v_ob.community_id,
      v_ob.member_id,
      'payment_overdue',
      'Pago vencido: ' || coalesce(v_ob.concept, 'Obligación'),
      'Tu pago de $' || trim(to_char(v_ob.amount, '999999990.00')) || ' venció el ' || to_char(v_ob.due_date::date, 'DD/MM/YYYY') || '. Regulariza tu situación.',
      jsonb_build_object('obligation_id', v_ob.id, 'concept', v_ob.concept, 'amount', v_ob.amount, 'due_date', v_ob.due_date)
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$fn$;

GRANT EXECUTE ON FUNCTION process_overdue_obligations() TO authenticated;

-- ---------------------------------------------------------------------------
-- Schedule pg_cron jobs (if extension is available)
-- ---------------------------------------------------------------------------
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    BEGIN PERFORM cron.unschedule('process-all-recurring-schedules'); EXCEPTION WHEN OTHERS THEN NULL; END;
    PERFORM cron.schedule(
      'process-all-recurring-schedules',
      '0 1 * * *',
      'SELECT process_all_recurring_schedules()'
    );

    BEGIN PERFORM cron.unschedule('advance-expired-discussions'); EXCEPTION WHEN OTHERS THEN NULL; END;
    PERFORM cron.schedule(
      'advance-expired-discussions',
      '*/5 * * * *',
      'SELECT advance_expired_discussions()'
    );

    BEGIN PERFORM cron.unschedule('send-payment-reminders'); EXCEPTION WHEN OTHERS THEN NULL; END;
    PERFORM cron.schedule(
      'send-payment-reminders',
      '0 9 * * *',
      'SELECT send_payment_reminders()'
    );

    BEGIN PERFORM cron.unschedule('process-overdue-obligations'); EXCEPTION WHEN OTHERS THEN NULL; END;
    PERFORM cron.schedule(
      'process-overdue-obligations',
      '0 7 * * *',
      'SELECT process_overdue_obligations()'
    );

    RAISE NOTICE '049: Automation cron jobs scheduled';
  ELSE
    RAISE NOTICE '049: pg_cron not available — automation jobs not scheduled';
  END IF;
END $cron$;
