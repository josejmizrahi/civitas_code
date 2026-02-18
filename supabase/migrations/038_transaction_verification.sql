-- =========================================================================
-- 038: Transaction Verification
-- Features: TR-025, TR-033
--
-- Adds verification workflow to transactions.
-- Tesoreros/admins can verify reported transactions.
-- =========================================================================

-- Verification status column
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'reported'
    CHECK (verification_status IN ('reported', 'verified', 'disputed'));

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Index for filtering by verification status
CREATE INDEX IF NOT EXISTS idx_transactions_verification
  ON transactions(community_id, verification_status);
