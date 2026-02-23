-- =========================================================================
-- 055: BROXEL / IFPE subscription and onboarding
--
-- Communities can request access to BROXEL (IFPE). Access is gated by
-- subscription: submit application, upload docs, KYB approval.
-- =========================================================================

-- Status of IFPE access for a community (in communities)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS ifpe_status TEXT DEFAULT 'inactive'
  CHECK (ifpe_status IS NULL OR ifpe_status IN ('inactive', 'pending_kyb', 'active', 'suspended'));
ALTER TABLE communities ADD COLUMN IF NOT EXISTS ifpe_clabe TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS ifpe_account_id TEXT;
COMMENT ON COLUMN communities.ifpe_status IS 'BROXEL/IFPE access: inactive (default), pending_kyb (application under review), active, suspended';

-- Subscription applications: one active/pending per community; history kept
CREATE TABLE IF NOT EXISTS ifpe_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'pending_kyb', 'approved', 'rejected')),
  -- Legal / KYB data
  legal_name TEXT,
  rfc TEXT,
  representative_name TEXT,
  representative_role TEXT,
  fiscal_address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  -- Document storage paths (bucket/key or URL)
  id_document_path TEXT,
  address_document_path TEXT,
  legal_rep_document_path TEXT,
  -- Filled on approval (from Broxel)
  ifpe_account_id TEXT,
  ifpe_clabe TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ifpe_applications_community ON ifpe_applications(community_id);
CREATE INDEX IF NOT EXISTS idx_ifpe_applications_status ON ifpe_applications(status);

ALTER TABLE ifpe_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community members can view their ifpe_applications"
  ON ifpe_applications FOR SELECT
  USING (
    community_id IN (
      SELECT m.community_id FROM members m WHERE m.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert ifpe_applications for their community"
  ON ifpe_applications FOR INSERT
  WITH CHECK (
    community_id IN (
      SELECT m.community_id FROM members m
      WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'tesorero')
    )
  );

CREATE POLICY "Admins can update their community ifpe_applications"
  ON ifpe_applications FOR UPDATE
  USING (
    community_id IN (
      SELECT m.community_id FROM members m
      WHERE m.user_id = auth.uid() AND m.role IN ('admin', 'tesorero')
    )
  );

-- Default ifpe_status for existing communities
UPDATE communities SET ifpe_status = 'inactive' WHERE ifpe_status IS NULL;
