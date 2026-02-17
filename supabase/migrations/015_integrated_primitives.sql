-- ============================================
-- CIVITAS: Migration 015 - Integrated Primitive System
-- Implements the cross-layer primitives from the whitepaper:
--   1. Community Rules Engine
--   2. Financial Standing
--   3. Executable Proposals
--   4. Financial Standing computation
--   5. Batch refresh of standings
--   6. Census snapshots
--   7. Census snapshot function
-- ============================================


-- ============================================
-- 1. COMMUNITY RULES ENGINE
-- Configurable governance, treasury, and identity
-- rules stored as jsonb on the communities table.
-- ============================================

ALTER TABLE communities ADD COLUMN IF NOT EXISTS rules jsonb NOT NULL DEFAULT '{
  "governance": {
    "default_quorum": 0.5,
    "default_majority": 0.5,
    "delegation_enabled": true,
    "proposal_rights": ["admin", "tesorero", "miembro"],
    "cool_down_hours": 48,
    "auto_execution_enabled": false,
    "auto_execution_threshold": 0
  },
  "treasury": {
    "mode": "import",
    "currency": "MXN",
    "admin_spending_limit": 50000,
    "require_vote_above": 50000
  },
  "identity": {
    "payment_to_vote_enabled": false,
    "grace_period_months": 2,
    "auto_restore_on_payment": true,
    "delinquent_restrictions": ["vote", "propose"]
  }
}'::jsonb;

COMMENT ON COLUMN communities.rules IS
  'Community-level configuration for governance, treasury, and identity primitives. See whitepaper §Integrated Primitives.';


-- ============================================
-- 2. FINANCIAL STANDING
-- Tracks each member''s payment standing to
-- gate governance rights when payment_to_vote
-- is enabled.
-- ============================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS financial_standing text NOT NULL DEFAULT 'good_standing';

-- Add constraint safely (drop-if-exists + create)
DO $$ BEGIN
  ALTER TABLE members DROP CONSTRAINT IF EXISTS valid_financial_standing;
  ALTER TABLE members ADD CONSTRAINT valid_financial_standing
    CHECK (financial_standing IN ('good_standing', 'grace_period', 'delinquent', 'suspended'));
END $$;

CREATE INDEX IF NOT EXISTS idx_members_financial_standing
  ON members(community_id, financial_standing);

COMMENT ON COLUMN members.financial_standing IS
  'Computed standing: good_standing | grace_period | delinquent | suspended. Drives governance eligibility.';


-- ============================================
-- 3. EXECUTABLE PROPOSALS
-- Extend proposals with financial instructions,
-- execution status, and cool-down tracking.
-- ============================================

-- Financial instruction payload (disbursement, budget_allocation, quota_change, or none)
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS financial_instruction jsonb DEFAULT NULL;

COMMENT ON COLUMN proposals.financial_instruction IS
  'Optional financial payload: { "type": "disbursement"|"budget_allocation"|"quota_change"|"none", ... }';

-- Execution lifecycle
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS execution_status text DEFAULT NULL;

DO $$ BEGIN
  ALTER TABLE proposals DROP CONSTRAINT IF EXISTS valid_execution_status;
  ALTER TABLE proposals ADD CONSTRAINT valid_execution_status
    CHECK (execution_status IS NULL OR execution_status IN ('pending', 'cool_down', 'executed', 'failed', 'manual'));
END $$;

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS executed_at timestamptz DEFAULT NULL;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS cool_down_until timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_proposals_execution_status
  ON proposals(community_id, execution_status)
  WHERE execution_status IS NOT NULL;

COMMENT ON COLUMN proposals.execution_status IS
  'Lifecycle of the financial instruction: pending → cool_down → executed | failed | manual.';


-- ============================================
-- 4. FINANCIAL STANDING COMPUTATION
-- Pure function that derives a member''s standing
-- from their overdue payment_obligations and
-- the community rules.
-- ============================================

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
  -- Fetch the community rules
  SELECT rules INTO v_rules
  FROM communities
  WHERE id = p_community_id;

  v_payment_to_vote := COALESCE((v_rules -> 'identity' ->> 'payment_to_vote_enabled')::boolean, false);

  -- When payment-to-vote is disabled everyone is in good standing
  IF NOT v_payment_to_vote THEN
    RETURN 'good_standing';
  END IF;

  v_grace_months := COALESCE((v_rules -> 'identity' ->> 'grace_period_months')::int, 2);

  -- Count overdue obligations and find the oldest due date
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

  -- Approximate months overdue (30.44 avg days/month)
  v_months_overdue := EXTRACT(EPOCH FROM (CURRENT_DATE - v_oldest_overdue_date)) / (30.44 * 86400);

  IF v_months_overdue <= v_grace_months THEN
    RETURN 'grace_period';
  ELSE
    RETURN 'delinquent';
  END IF;
END;
$$;

COMMENT ON FUNCTION compute_financial_standing(uuid, uuid) IS
  'Derives a member''s financial standing from overdue obligations and community identity rules.';


-- ============================================
-- 5. BATCH REFRESH OF STANDINGS
-- Updates financial_standing for every active
-- member in a community in a single pass.
-- ============================================

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

COMMENT ON FUNCTION refresh_financial_standings(uuid) IS
  'Batch-recomputes financial_standing for all active members in a community.';


-- ============================================
-- 6. CENSUS SNAPSHOTS TABLE
-- Daily (or on-demand) community-level KPI
-- snapshots for dashboards and analytics.
-- ============================================

CREATE TABLE IF NOT EXISTS census_snapshots (
  id                    uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id          uuid           NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  total_members         int            NOT NULL DEFAULT 0,
  active_members        int            NOT NULL DEFAULT 0,
  members_good_standing int            NOT NULL DEFAULT 0,
  members_delinquent    int            NOT NULL DEFAULT 0,
  total_income          numeric(14,2)  NOT NULL DEFAULT 0,
  total_expenses        numeric(14,2)  NOT NULL DEFAULT 0,
  active_proposals      int            NOT NULL DEFAULT 0,
  snapshot_date         date           NOT NULL DEFAULT CURRENT_DATE,
  metadata              jsonb          NOT NULL DEFAULT '{}',
  created_at            timestamptz    NOT NULL DEFAULT now(),

  UNIQUE(community_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_census_community_date
  ON census_snapshots(community_id, snapshot_date DESC);

-- Enable RLS
ALTER TABLE census_snapshots ENABLE ROW LEVEL SECURITY;

-- Members can read census for their communities
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Members can view census'
  ) THEN
    CREATE POLICY "Members can view census"
      ON census_snapshots FOR SELECT
      USING (community_id IN (SELECT get_user_community_ids()));
  END IF;
END $$;

-- Admins can manage (insert/update/delete) census rows
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage census'
  ) THEN
    CREATE POLICY "Admins can manage census"
      ON census_snapshots FOR ALL
      USING (get_user_role(community_id) = 'admin');
  END IF;
END $$;


-- ============================================
-- 7. CENSUS SNAPSHOT FUNCTION
-- Computes and upserts a single-day snapshot.
-- ============================================

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
  SELECT COUNT(*)
  INTO v_total
  FROM members
  WHERE community_id = p_community_id;

  SELECT COUNT(*)
  INTO v_active
  FROM members
  WHERE community_id = p_community_id
    AND status = 'active';

  SELECT COUNT(*)
  INTO v_good
  FROM members
  WHERE community_id = p_community_id
    AND status = 'active'
    AND financial_standing = 'good_standing';

  SELECT COUNT(*)
  INTO v_delinquent
  FROM members
  WHERE community_id = p_community_id
    AND status = 'active'
    AND financial_standing = 'delinquent';

  SELECT COALESCE(SUM(amount), 0)
  INTO v_income
  FROM transactions
  WHERE community_id = p_community_id
    AND type = 'income';

  SELECT COALESCE(SUM(amount), 0)
  INTO v_expenses
  FROM transactions
  WHERE community_id = p_community_id
    AND type = 'expense';

  SELECT COUNT(*)
  INTO v_proposals
  FROM proposals
  WHERE community_id = p_community_id
    AND status = 'active';

  INSERT INTO census_snapshots (
    community_id,
    total_members,
    active_members,
    members_good_standing,
    members_delinquent,
    total_income,
    total_expenses,
    active_proposals,
    snapshot_date
  ) VALUES (
    p_community_id,
    v_total,
    v_active,
    v_good,
    v_delinquent,
    v_income,
    v_expenses,
    v_proposals,
    CURRENT_DATE
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

COMMENT ON FUNCTION take_census_snapshot(uuid) IS
  'Computes community KPIs and upserts a census_snapshots row for today.';
