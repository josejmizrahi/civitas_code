-- ============================================
-- CIVITAS: Migration 056 - Transaction correction (immutability)
-- Transactions are never edited or deleted; corrections create a new row linked to the original.
-- ============================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS correction_of uuid REFERENCES transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS correction_note text;

COMMENT ON COLUMN transactions.correction_of IS 'ID of the transaction being corrected. NULL for normal transactions.';
COMMENT ON COLUMN transactions.correction_note IS 'Human-readable explanation of the correction (e.g. "Corrección: monto erróneo").';

CREATE INDEX IF NOT EXISTS idx_transactions_correction_of ON transactions(correction_of) WHERE correction_of IS NOT NULL;
