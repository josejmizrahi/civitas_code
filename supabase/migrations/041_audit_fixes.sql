-- ============================================================================
-- Migration 041: Audit fixes
-- - Remove duplicate trigger on units
-- - Remove duplicate DELETE policy on documents
-- - Ensure pg_cron extension and scheduled jobs
-- ============================================================================

-- 1. Remove duplicate trigger on units (two triggers calling same function)
DROP TRIGGER IF EXISTS units_sync_voting_weight ON units;

-- 2. Remove duplicate DELETE policy on documents
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'documents' AND policyname = 'Admin can delete documents'
  ) THEN
    DROP POLICY "Admin can delete documents" ON documents;
  END IF;
END $$;

-- 3. Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 4. Schedule cron jobs (idempotent: unschedule first, then schedule)
DO $cron$
BEGIN
  PERFORM cron.unschedule('close-expired-proposals');
EXCEPTION WHEN OTHERS THEN NULL;
END $cron$;
SELECT cron.schedule('close-expired-proposals', '*/5 * * * *', 'SELECT process_expired_proposals()');

DO $cron$
BEGIN
  PERFORM cron.unschedule('auto-execute-proposals');
EXCEPTION WHEN OTHERS THEN NULL;
END $cron$;
SELECT cron.schedule('auto-execute-proposals', '*/10 * * * *', 'SELECT process_auto_executions()');

DO $cron$
BEGIN
  PERFORM cron.unschedule('compute-moroso-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $cron$;
SELECT cron.schedule('compute-moroso-daily', '0 6 * * *', 'SELECT compute_moroso_status_all()');

DO $cron$
BEGIN
  PERFORM cron.unschedule('notify-pending-executions');
EXCEPTION WHEN OTHERS THEN NULL;
END $cron$;
SELECT cron.schedule('notify-pending-executions', '0 9 * * 1', 'SELECT notify_pending_executions()');
