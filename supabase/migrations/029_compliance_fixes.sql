-- Migration 029: Compliance Fixes
-- C2: Fix arco_requests RLS (restrict to own + admin)
-- A6: Create moroso_notices table
-- A6: Add convocatoria is_valid column (trigger-computed; timestamptz+interval is not immutable)

-- ============================================================
-- 1. Fix arco_requests RLS policies
-- ============================================================

-- Drop existing overly-permissive policies
DROP POLICY IF EXISTS "Authenticated can update arco requests" ON arco_requests;
DROP POLICY IF EXISTS "Authenticated can view arco requests" ON arco_requests;
DROP POLICY IF EXISTS "Users can create arco requests" ON arco_requests;
DROP POLICY IF EXISTS "Users can view own arco requests" ON arco_requests;

-- SELECT: Users see own requests OR admin of any community the requester belongs to
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users see own or admin sees community requests') THEN
    CREATE POLICY "Users see own or admin sees community requests"
      ON arco_requests FOR SELECT
      USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM members
          WHERE members.user_id = auth.uid()
            AND members.role = 'admin'
            AND members.community_id IN (
              SELECT m2.community_id FROM members m2 WHERE m2.user_id = arco_requests.user_id
            )
        )
      );
  END IF;
END $$;

-- INSERT: Users can only create requests for themselves
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create own requests') THEN
    CREATE POLICY "Users create own requests"
      ON arco_requests FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- UPDATE: Only admin of a community the requester belongs to can respond
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin responds to community requests') THEN
    CREATE POLICY "Admin responds to community requests"
      ON arco_requests FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM members
          WHERE members.user_id = auth.uid()
            AND members.role = 'admin'
            AND members.community_id IN (
              SELECT m2.community_id FROM members m2 WHERE m2.user_id = arco_requests.user_id
            )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM members
          WHERE members.user_id = auth.uid()
            AND members.role = 'admin'
            AND members.community_id IN (
              SELECT m2.community_id FROM members m2 WHERE m2.user_id = arco_requests.user_id
            )
        )
      );
  END IF;
END $$;

-- ============================================================
-- 2. Create moroso_notices table
-- ============================================================

CREATE TABLE IF NOT EXISTS moroso_notices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid NOT NULL REFERENCES communities(id),
  member_id uuid NOT NULL REFERENCES members(id),
  notice_type text NOT NULL DEFAULT 'warning'
    CHECK (notice_type IN ('pre_assembly', 'warning', 'suspension')),
  assembly_id uuid REFERENCES assemblies(id),
  outstanding_amount numeric NOT NULL DEFAULT 0,
  outstanding_obligations jsonb DEFAULT '[]',
  issued_at timestamptz NOT NULL DEFAULT now(),
  deadline timestamptz,
  response_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'acknowledged', 'resolved', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE moroso_notices ENABLE ROW LEVEL SECURITY;

-- SELECT: Members see own notices OR admin/comite_vigilancia sees community notices
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members see own notices') THEN
    CREATE POLICY "Members see own notices"
      ON moroso_notices FOR SELECT
      USING (
        member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
        OR community_id IN (
          SELECT community_id FROM members
          WHERE user_id = auth.uid()
            AND role IN ('admin', 'comite_vigilancia')
        )
      );
  END IF;
END $$;

-- INSERT: Only admin can create notices
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin creates notices') THEN
    CREATE POLICY "Admin creates notices"
      ON moroso_notices FOR INSERT
      WITH CHECK (
        community_id IN (
          SELECT community_id FROM members
          WHERE user_id = auth.uid()
            AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================
-- 3. Add convocatoria is_valid column (trigger-based)
--    GENERATED ALWAYS AS won't work because timestamptz + interval
--    uses the stable (not immutable) timestamptz_pl_interval operator.
-- ============================================================

ALTER TABLE convocatorias ADD COLUMN IF NOT EXISTS is_valid boolean DEFAULT false;

CREATE OR REPLACE FUNCTION compute_convocatoria_is_valid()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.is_valid := (NEW.issued_at + (NEW.minimum_notice_days * interval '1 day')) <= NEW.scheduled_date;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_convocatoria_is_valid ON convocatorias;
CREATE TRIGGER trg_convocatoria_is_valid
  BEFORE INSERT OR UPDATE ON convocatorias
  FOR EACH ROW
  EXECUTE FUNCTION compute_convocatoria_is_valid();

-- Backfill existing rows
UPDATE convocatorias
  SET is_valid = (issued_at + (minimum_notice_days * interval '1 day')) <= scheduled_date;
