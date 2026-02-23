-- =============================================================
-- Fintoc KYB Application (onboarding / document collection)
-- =============================================================

CREATE TABLE IF NOT EXISTS fintoc_applications (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Application status
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'documents_pending', 'submitted', 'under_review', 'approved', 'rejected', 'requires_info')),

  -- Step 1: Company info
  company_legal_name text,
  company_rfc text,
  company_address text,
  company_city text,
  company_state text,
  company_zip text,
  company_incorporation_date date,
  company_registro_publico text,

  -- Step 2: Legal representative
  rep_legal_name text,
  rep_legal_email text,
  rep_legal_phone text,
  rep_legal_id_type text CHECK (rep_legal_id_type IS NULL OR rep_legal_id_type IN ('ine', 'passport')),

  -- Step 3: Shareholders (stored as JSONB array)
  -- Each: { name, id_type, id_number, ownership_pct, is_foreign, is_moral }
  shareholders jsonb DEFAULT '[]',

  -- Step 5: Settlement bank account
  settlement_bank_name text,
  settlement_account_number text,
  settlement_clabe text,
  settlement_account_holder text,

  -- Annex A: Contact / billing
  annex_a_billing_email text,
  annex_a_contract_email text,
  annex_a_support_email text,
  annex_a_escalation jsonb DEFAULT '[]',

  -- Annex B: Dashboard users (JSONB array)
  -- Each: { name, email, role: 'admin'|'operator'|'capturer'|'authorizer' }
  annex_b_users jsonb DEFAULT '[]',

  -- Annex D: Transactional profile
  annex_d_fund_origin text[],
  annex_d_monthly_volume text,
  annex_d_monthly_operations text,

  -- Documents (references to storage paths)
  documents jsonb DEFAULT '{}',

  -- Tracking
  rejection_reason text,
  fintoc_notes text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fintoc_app_community ON fintoc_applications(community_id);
CREATE UNIQUE INDEX idx_fintoc_app_active ON fintoc_applications(community_id) WHERE status NOT IN ('rejected');

-- RLS
ALTER TABLE fintoc_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage their community applications"
  ON fintoc_applications FOR ALL
  USING (community_id IN (
    SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
  ))
  WITH CHECK (community_id IN (
    SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
  ));

-- Storage bucket for KYB documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('fintoc-kyb', 'fintoc-kyb', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload KYB docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'fintoc-kyb'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM communities WHERE id IN (
        SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
      )
    )
  );

CREATE POLICY "Admins can view KYB docs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'fintoc-kyb'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM communities WHERE id IN (
        SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
      )
    )
  );
