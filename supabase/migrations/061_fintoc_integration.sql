-- =============================================================
-- Fintoc Integration (replaces Broxel/IFPE)
-- =============================================================

-- 1. Add Fintoc columns to communities (replace ifpe_*)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS fintoc_status text NOT NULL DEFAULT 'inactive'
  CHECK (fintoc_status IN ('inactive', 'pending', 'active', 'suspended'));
ALTER TABLE communities ADD COLUMN IF NOT EXISTS fintoc_account_id text;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS fintoc_root_clabe text;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS fintoc_public_key text;

-- 2. Add per-member CLABE for auto-reconciliation
ALTER TABLE members ADD COLUMN IF NOT EXISTS fintoc_clabe text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS fintoc_account_number_id text;

-- 3. Fintoc webhook events (replaces ifpe_webhook_events)
CREATE TABLE IF NOT EXISTS fintoc_events (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  fintoc_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}',
  amount integer,
  currency text DEFAULT 'MXN',
  counterparty_name text,
  counterparty_clabe text,
  tracking_key text,
  account_number_id text,
  reconciliation_status text NOT NULL DEFAULT 'pending'
    CHECK (reconciliation_status IN ('pending', 'matched', 'manual', 'unmatched', 'ignored')),
  matched_obligation_id uuid REFERENCES payment_obligations(id),
  matched_transaction_id uuid REFERENCES transactions(id),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fintoc_events_community ON fintoc_events(community_id, created_at DESC);
CREATE INDEX idx_fintoc_events_status ON fintoc_events(community_id, reconciliation_status);
CREATE INDEX idx_fintoc_events_tracking ON fintoc_events(tracking_key);

-- 4. Fintoc checkout sessions (track payment intents)
CREATE TABLE IF NOT EXISTS fintoc_checkout_sessions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  obligation_id uuid REFERENCES payment_obligations(id),
  fintoc_session_id text NOT NULL UNIQUE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'finished', 'expired', 'failed')),
  redirect_url text,
  payment_intent_id text,
  payment_status text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fintoc_sessions_community ON fintoc_checkout_sessions(community_id);
CREATE INDEX idx_fintoc_sessions_member ON fintoc_checkout_sessions(member_id);
CREATE INDEX idx_fintoc_sessions_obligation ON fintoc_checkout_sessions(obligation_id);

-- 5. Fintoc outbound transfers (track payouts to providers)
CREATE TABLE IF NOT EXISTS fintoc_transfers (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  fintoc_transfer_id text UNIQUE,
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'MXN',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'rejected', 'returned')),
  counterparty_clabe text,
  counterparty_name text,
  comment text,
  reference_id text,
  tracking_key text,
  spend_request_id uuid,
  linked_transaction_id uuid REFERENCES transactions(id),
  metadata jsonb DEFAULT '{}',
  error_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fintoc_transfers_community ON fintoc_transfers(community_id, created_at DESC);

-- 6. Update transaction origin to include 'fintoc'
-- (existing check might block this, so we use a safe approach)
DO $$ BEGIN
  ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_origin_check;
  ALTER TABLE transactions ADD CONSTRAINT transactions_origin_check
    CHECK (origin IN ('manual', 'import', 'rail', 'system', 'fintoc'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7. RLS
ALTER TABLE fintoc_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintoc_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fintoc_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fintoc events"
  ON fintoc_events FOR SELECT
  USING (community_id IN (
    SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
  ));

CREATE POLICY "Service role manages fintoc events"
  ON fintoc_events FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Members can view own checkout sessions"
  ON fintoc_checkout_sessions FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all checkout sessions"
  ON fintoc_checkout_sessions FOR SELECT
  USING (community_id IN (
    SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
  ));

CREATE POLICY "Service role manages checkout sessions"
  ON fintoc_checkout_sessions FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Admins can view fintoc transfers"
  ON fintoc_transfers FOR SELECT
  USING (community_id IN (
    SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
  ));

CREATE POLICY "Service role manages fintoc transfers"
  ON fintoc_transfers FOR ALL
  USING (true) WITH CHECK (true);
