-- =========================================================================
-- 037: Rule Version History
-- Features: RE-004, RE-005, RE-006
--
-- Tracks every change to community rules (the "social smart contract").
-- Every rule update creates a snapshot for auditability and rollback.
-- =========================================================================

-- ---------------------------------------------------------------------------
-- Rule versions table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  rules JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  proposal_id UUID REFERENCES proposals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(community_id, version_number)
);

-- Index for latest version lookup
CREATE INDEX IF NOT EXISTS idx_rule_versions_community ON rule_versions(community_id, version_number DESC);

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------
ALTER TABLE rule_versions ENABLE ROW LEVEL SECURITY;

-- All members can read rule history
CREATE POLICY rule_versions_select ON rule_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.community_id = rule_versions.community_id
      AND m.user_id = auth.uid()
    )
  );

-- Only admins can create rule versions (through rule update service)
CREATE POLICY rule_versions_insert ON rule_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members m
      WHERE m.community_id = rule_versions.community_id
      AND m.user_id = auth.uid()
      AND m.role = 'admin'
    )
  );

-- ---------------------------------------------------------------------------
-- Helper function: get next version number
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_next_rule_version(p_community_id UUID)
RETURNS INT
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM rule_versions
  WHERE community_id = p_community_id;
$$;
