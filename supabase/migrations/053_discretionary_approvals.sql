-- =========================================================================
-- 053: Discretionary approvals (Level 2 authorization flow)
-- =========================================================================

CREATE TABLE IF NOT EXISTS discretionary_approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  amount numeric NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  beneficiary_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by uuid REFERENCES members(id) ON DELETE SET NULL,
  response_note text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discretionary_approvals_community_status
  ON discretionary_approvals(community_id, status);

CREATE INDEX IF NOT EXISTS idx_discretionary_approvals_requested_by
  ON discretionary_approvals(requested_by);

ALTER TABLE discretionary_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS discretionary_read ON discretionary_approvals;
CREATE POLICY discretionary_read
ON discretionary_approvals
FOR SELECT
USING (
  community_id IN (
    SELECT m.community_id
    FROM members m
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
  )
);

DROP POLICY IF EXISTS discretionary_insert ON discretionary_approvals;
CREATE POLICY discretionary_insert
ON discretionary_approvals
FOR INSERT
WITH CHECK (
  community_id IN (
    SELECT m.community_id
    FROM members m
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('admin', 'tesorero', 'platform_admin')
  )
);

DROP POLICY IF EXISTS discretionary_update ON discretionary_approvals;
CREATE POLICY discretionary_update
ON discretionary_approvals
FOR UPDATE
USING (
  community_id IN (
    SELECT m.community_id
    FROM members m
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('admin', 'comite_vigilancia', 'platform_admin')
  )
)
WITH CHECK (
  community_id IN (
    SELECT m.community_id
    FROM members m
    WHERE m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.role IN ('admin', 'comite_vigilancia', 'platform_admin')
  )
);
