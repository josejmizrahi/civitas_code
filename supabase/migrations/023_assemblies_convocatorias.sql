-- ============================================================================
-- Migration 023: Assemblies & Convocatorias (LPCI CDMX Art. 31-34)
-- Phase 1 of Mexican Legal Compliance
-- ============================================================================

-- 1. Assemblies table
CREATE TABLE IF NOT EXISTS assemblies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'ordinary',
  title text NOT NULL,
  scheduled_date timestamptz NOT NULL,
  location text NOT NULL DEFAULT '',
  called_by uuid NOT NULL REFERENCES members(id),
  agenda jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'scheduled',
  current_call int NOT NULL DEFAULT 1,
  first_call_at timestamptz,
  second_call_at timestamptz,
  third_call_at timestamptz,
  quorum_met boolean DEFAULT false,
  quorum_pct numeric(7,4),
  attendance jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_assembly_type CHECK (type IN ('ordinary', 'extraordinary')),
  CONSTRAINT valid_assembly_status CHECK (status IN ('scheduled', 'convened', 'in_session', 'first_call', 'second_call', 'third_call', 'completed', 'cancelled'))
);

-- 2. Convocatorias table (formal assembly notices per Art. 34)
CREATE TABLE IF NOT EXISTS convocatorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  assembly_id uuid NOT NULL REFERENCES assemblies(id) ON DELETE CASCADE,
  call_number int NOT NULL DEFAULT 1,
  type text NOT NULL,
  scheduled_date timestamptz NOT NULL,
  location text NOT NULL DEFAULT '',
  agenda jsonb NOT NULL DEFAULT '[]',
  called_by uuid NOT NULL REFERENCES members(id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  minimum_notice_days int NOT NULL DEFAULT 7,
  delivery_method text NOT NULL DEFAULT 'in_app',
  delivery_log jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_assemblies_community ON assemblies(community_id);
CREATE INDEX idx_assemblies_status ON assemblies(community_id, status);
CREATE INDEX idx_assemblies_scheduled ON assemblies(scheduled_date);
CREATE INDEX idx_convocatorias_assembly ON convocatorias(assembly_id);
CREATE INDEX idx_convocatorias_community ON convocatorias(community_id);

-- 4. RLS policies for assemblies
ALTER TABLE assemblies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their community assemblies"
  ON assemblies FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert assemblies"
  ON assemblies FOR INSERT
  WITH CHECK (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
    )
  );

CREATE POLICY "Admins can update assemblies"
  ON assemblies FOR UPDATE
  USING (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
    )
  );

-- 5. RLS policies for convocatorias
ALTER TABLE convocatorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their community convocatorias"
  ON convocatorias FOR SELECT
  USING (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert convocatorias"
  ON convocatorias FOR INSERT
  WITH CHECK (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
    )
  );

CREATE POLICY "Admins can update convocatorias"
  ON convocatorias FOR UPDATE
  USING (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')
    )
  );

-- 6. Add assembly_id to proposals and minutes for linking
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS assembly_id uuid REFERENCES assemblies(id);
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS assembly_id uuid REFERENCES assemblies(id);

CREATE INDEX IF NOT EXISTS idx_proposals_assembly ON proposals(assembly_id);
CREATE INDEX IF NOT EXISTS idx_minutes_assembly ON minutes(assembly_id);
