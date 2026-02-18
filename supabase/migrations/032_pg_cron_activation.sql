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

DO $$
BEGIN
  -- Check if pg_cron extension exists
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN

    -- Schedule auto-execution processing every hour
    PERFORM cron.schedule(
      'process-auto-executions',
      '0 * * * *',  -- Every hour at minute 0
      $$SELECT process_auto_executions()$$
    );

    -- Schedule expired proposals processing every hour
    PERFORM cron.schedule(
      'process-expired-proposals',
      '5 * * * *',  -- Every hour at minute 5
      $$SELECT process_expired_proposals()$$
    );

    -- Schedule moroso status computation daily at 3 AM
    PERFORM cron.schedule(
      'compute-moroso-status',
      '0 3 * * *',  -- Daily at 3:00 AM
      $$SELECT compute_moroso_status()$$
    );

    -- Schedule pre-execution notifications daily at 9 AM
    PERFORM cron.schedule(
      'notify-pending-executions',
      '0 9 * * *',  -- Daily at 9:00 AM
      $$SELECT notify_pending_executions()$$
    );

    RAISE NOTICE 'pg_cron jobs scheduled successfully';

  ELSE
    RAISE NOTICE 'pg_cron extension not available — skipping job scheduling. Enable pg_cron in the Supabase dashboard to activate scheduled jobs.';
  END IF;
END $$;
