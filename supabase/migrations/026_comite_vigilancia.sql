-- Migration 026: Comite de Vigilancia y Terminos Administrativos
-- Implements LPCI CDMX Art. 42-46 compliance
-- Admin term tracking + Vigilancia committee oversight reports

-- ============================================================================
-- 1. Admin Terms table — tracks consecutive terms for admin & comite_vigilancia
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) NOT NULL,
  member_id uuid NOT NULL,
  role text NOT NULL, -- 'admin' or 'comite_vigilancia'
  term_start timestamptz NOT NULL DEFAULT now(),
  term_end timestamptz,
  term_number integer NOT NULL DEFAULT 1, -- consecutive term count
  elected_in_assembly uuid, -- references assemblies(id)
  status text NOT NULL DEFAULT 'active', -- 'active', 'completed', 'removed'
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_admin_terms_community_member_status
  ON admin_terms(community_id, member_id, status);

-- RLS
ALTER TABLE admin_terms ENABLE ROW LEVEL SECURITY;

-- Community members can read admin terms
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_terms_select') THEN
    CREATE POLICY "admin_terms_select" ON admin_terms
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM members
          WHERE members.community_id = admin_terms.community_id
            AND members.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Only admins can insert/update admin terms
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_terms_insert') THEN
    CREATE POLICY "admin_terms_insert" ON admin_terms
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM members
          WHERE members.community_id = admin_terms.community_id
            AND members.user_id = auth.uid()
            AND members.role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admin_terms_update') THEN
    CREATE POLICY "admin_terms_update" ON admin_terms
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM members
          WHERE members.community_id = admin_terms.community_id
            AND members.user_id = auth.uid()
            AND members.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- 2. Vigilancia Reports table — Art. 45-46 oversight reporting
-- ============================================================================

CREATE TABLE IF NOT EXISTS vigilancia_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid REFERENCES communities(id) NOT NULL,
  author_id uuid NOT NULL,
  period text NOT NULL, -- e.g. '2026-Q1'
  report_type text NOT NULL DEFAULT 'quarterly', -- 'quarterly', 'annual', 'special'
  title text NOT NULL,
  content text NOT NULL,
  findings jsonb DEFAULT '[]',
  recommendations jsonb DEFAULT '[]',
  status text NOT NULL DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed'
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_vigilancia_reports_community
  ON vigilancia_reports(community_id, status);

-- RLS
ALTER TABLE vigilancia_reports ENABLE ROW LEVEL SECURITY;

-- Community members can read submitted/reviewed reports
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vigilancia_reports_select') THEN
    CREATE POLICY "vigilancia_reports_select" ON vigilancia_reports
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM members
          WHERE members.community_id = vigilancia_reports.community_id
            AND members.user_id = auth.uid()
        )
        AND (
          -- Authors can see their own drafts
          vigilancia_reports.author_id IN (
            SELECT m.id FROM members m WHERE m.user_id = auth.uid()
              AND m.community_id = vigilancia_reports.community_id
          )
          -- Everyone can see submitted/reviewed
          OR vigilancia_reports.status IN ('submitted', 'reviewed')
        )
      );
  END IF;
END $$;

-- Comite de vigilancia members and admins can insert
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vigilancia_reports_insert') THEN
    CREATE POLICY "vigilancia_reports_insert" ON vigilancia_reports
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM members
          WHERE members.community_id = vigilancia_reports.community_id
            AND members.user_id = auth.uid()
            AND members.role IN ('admin', 'comite_vigilancia')
        )
      );
  END IF;
END $$;

-- Authors can update their own reports, admins can update any
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'vigilancia_reports_update') THEN
    CREATE POLICY "vigilancia_reports_update" ON vigilancia_reports
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM members m
          WHERE m.community_id = vigilancia_reports.community_id
            AND m.user_id = auth.uid()
            AND (
              m.role = 'admin'
              OR m.id = vigilancia_reports.author_id
            )
        )
      );
  END IF;
END $$;
