-- Migration 028: Actas Legales Mejoradas, Proxies (Representación), y Retención Documental
-- Implements: LPCI CDMX Art. 35-36, Código de Comercio Art. 38-52, NOM-151
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Assembly Proxies / Representación (Art. 36 LPCI CDMX)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS assembly_proxies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) NOT NULL,
  assembly_id uuid NOT NULL,  -- references assemblies(id)
  grantor_id uuid NOT NULL,   -- member giving proxy
  representative_id uuid NOT NULL, -- member receiving proxy
  granted_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  -- Art. 36 LPCI: a member cannot represent themselves
  CONSTRAINT different_members CHECK (grantor_id != representative_id)
);

-- Indexes for proxy lookups
CREATE INDEX IF NOT EXISTS idx_assembly_proxies_assembly ON assembly_proxies(assembly_id);
CREATE INDEX IF NOT EXISTS idx_assembly_proxies_community ON assembly_proxies(community_id);
CREATE INDEX IF NOT EXISTS idx_assembly_proxies_representative ON assembly_proxies(representative_id, assembly_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_assembly_proxies_grantor ON assembly_proxies(grantor_id, assembly_id) WHERE is_active = true;

-- RLS for assembly_proxies
ALTER TABLE assembly_proxies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can view proxies for their community') THEN
    CREATE POLICY "Members can view proxies for their community"
      ON assembly_proxies FOR SELECT
      USING (
        community_id IN (
          SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can insert proxies for their community') THEN
    CREATE POLICY "Members can insert proxies for their community"
      ON assembly_proxies FOR INSERT
      WITH CHECK (
        community_id IN (
          SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can update proxies for their community') THEN
    CREATE POLICY "Members can update proxies for their community"
      ON assembly_proxies FOR UPDATE
      USING (
        community_id IN (
          SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Validate proxy limits function (Art. 36 LPCI CDMX)
--    - Max 2 active proxies per representative per assembly
--    - Admin (administrador) cannot be a representative
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_proxy_limits(
  p_community_id uuid,
  p_assembly_id uuid,
  p_representative_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_proxy_count integer;
  v_role text;
  v_result jsonb;
BEGIN
  -- Check if representative is admin
  SELECT role INTO v_role
  FROM members
  WHERE id = p_representative_id
    AND community_id = p_community_id
    AND status = 'active'
  LIMIT 1;

  IF v_role = 'admin' THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'El administrador no puede representar a otros condóminos (Art. 36 LPCI)'
    );
  END IF;

  -- Count active proxies for this representative in this assembly
  SELECT COUNT(*) INTO v_proxy_count
  FROM assembly_proxies
  WHERE assembly_id = p_assembly_id
    AND representative_id = p_representative_id
    AND is_active = true;

  IF v_proxy_count >= 2 THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Un condómino no puede representar a más de 2 personas (Art. 36 LPCI)'
    );
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. Enhanced minutes fields (Actas Legales Mejoradas)
-- ---------------------------------------------------------------------------

ALTER TABLE minutes ADD COLUMN IF NOT EXISTS legal_type text DEFAULT 'general';
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS assembly_type text;
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS attendee_count integer;
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS quorum_pct numeric(5,2);
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS integrity_hash text;
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS retention_until timestamptz;

-- Index for retention expiry queries
CREATE INDEX IF NOT EXISTS idx_minutes_retention ON minutes(retention_until) WHERE retention_until IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. Document Retention (Código de Comercio Art. 38-52, NOM-151)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_retention (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) NOT NULL,
  document_type text NOT NULL,  -- 'minutes', 'financial_statement', 'convocatoria', 'report'
  document_id uuid NOT NULL,
  retention_years integer NOT NULL DEFAULT 10, -- Código de Comercio: 10 years minimum
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  integrity_hash text,  -- SHA-256 for NOM-151 compliance
  archived boolean DEFAULT false,
  archived_at timestamptz
);

-- Indexes for retention queries
CREATE INDEX IF NOT EXISTS idx_document_retention_community ON document_retention(community_id);
CREATE INDEX IF NOT EXISTS idx_document_retention_expires ON document_retention(expires_at) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_document_retention_type ON document_retention(community_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_retention_document ON document_retention(document_id);

-- RLS for document_retention
ALTER TABLE document_retention ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can view retention records for their community') THEN
    CREATE POLICY "Members can view retention records for their community"
      ON document_retention FOR SELECT
      USING (
        community_id IN (
          SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can insert retention records') THEN
    CREATE POLICY "Admins can insert retention records"
      ON document_retention FOR INSERT
      WITH CHECK (
        community_id IN (
          SELECT community_id FROM members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update retention records') THEN
    CREATE POLICY "Admins can update retention records"
      ON document_retention FOR UPDATE
      USING (
        community_id IN (
          SELECT community_id FROM members WHERE user_id = auth.uid() AND role = 'admin' AND status = 'active'
        )
      );
  END IF;
END $$;
