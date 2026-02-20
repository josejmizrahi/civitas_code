-- =========================================================================
-- 047: Transaction Origin Flag
-- 
-- Adds `origin` column to track how each transaction entered the system:
--   - 'manual'  : captured by a human via the UI
--   - 'import'  : bulk-imported from CSV/Excel
--   - 'rail'    : received via fintech rail (SPEI webhook)
--   - 'system'  : auto-generated (e.g. recurring schedules, obligation payments)
--
-- Backfills existing rows based on available metadata.
-- =========================================================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS origin TEXT NOT NULL DEFAULT 'manual'
    CHECK (origin IN ('manual', 'import', 'rail', 'system'));

CREATE INDEX IF NOT EXISTS idx_transactions_origin
  ON transactions(community_id, origin);

-- Backfill: rows with import_job_id → 'import'
UPDATE transactions SET origin = 'import' WHERE import_job_id IS NOT NULL AND origin = 'manual';

-- Backfill: rows with source_id (data sources) → 'import'
UPDATE transactions SET origin = 'import' WHERE source_id IS NOT NULL AND origin = 'manual';
