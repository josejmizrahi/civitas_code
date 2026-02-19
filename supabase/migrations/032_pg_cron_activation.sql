-- =========================================================================
-- 032: pg_cron Activation for Scheduled Jobs
-- Features: GV-041, GV-045
--
-- Schedules:
--   - process_auto_executions: hourly (cool-down expirations)
--   - process_expired_proposals: hourly (auto-close expired votes)
--   - compute_moroso_status: daily (recalculate financial standing)
--   - notify_pending_executions: daily (24h pre-execution notice)
-- =========================================================================

-- ---------------------------------------------------------------------------
-- Note: pg_cron must be enabled in the Supabase dashboard (Extensions)
-- These jobs will only activate if pg_cron is available.
-- If pg_cron is not enabled, these statements will fail silently.
-- ---------------------------------------------------------------------------

-- Wrapper: compute moroso status for ALL communities (called by pg_cron)
CREATE OR REPLACE FUNCTION compute_moroso_status_all()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_community_id uuid;
BEGIN
  FOR v_community_id IN SELECT id FROM communities LOOP
    PERFORM compute_moroso_status(v_community_id);
  END LOOP;
END;
$fn$;

-- Wrapper: notify pending executions for ALL communities
DROP FUNCTION IF EXISTS notify_pending_executions();
CREATE OR REPLACE FUNCTION notify_pending_executions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_proposal RECORD;
BEGIN
  FOR v_proposal IN
    SELECT p.id, p.community_id, p.title
    FROM proposals p
    WHERE p.status = 'approved'
      AND p.grace_period_end IS NOT NULL
      AND p.grace_period_end > now()
      AND p.grace_period_end <= now() + interval '24 hours'
      AND NOT p.appealed
  LOOP
    PERFORM notify_community(
      v_proposal.community_id,
      'pre_execution',
      'Ejecucion proxima: ' || v_proposal.title,
      'La propuesta "' || v_proposal.title || '" sera ejecutada en menos de 24 horas.',
      jsonb_build_object('proposal_id', v_proposal.id)
    );
  END LOOP;
END;
$fn$;

DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    PERFORM cron.schedule(
      'process-auto-executions',
      '0 * * * *',
      'SELECT process_auto_executions()'
    );

    PERFORM cron.schedule(
      'process-expired-proposals',
      '5 * * * *',
      'SELECT process_expired_proposals()'
    );

    PERFORM cron.schedule(
      'compute-moroso-status',
      '0 3 * * *',
      'SELECT compute_moroso_status_all()'
    );

    PERFORM cron.schedule(
      'notify-pending-executions',
      '0 9 * * *',
      'SELECT notify_pending_executions()'
    );

    RAISE NOTICE 'pg_cron jobs scheduled successfully';

  ELSE
    RAISE NOTICE 'pg_cron extension not available — skipping job scheduling.';
  END IF;
END $cron$;
