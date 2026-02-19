-- ============================================================================
-- 042: Invitations system
-- Creates the invitations table, accept_invitation RPC, and RLS policies.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Table
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  email       text NOT NULL,
  role        text NOT NULL DEFAULT 'miembro',
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','accepted','expired','cancelled')),
  token       uuid NOT NULL DEFAULT gen_random_uuid(),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT valid_invitation_role
    CHECK (role IN ('admin','tesorero','comite_vigilancia','miembro','observador'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_community ON invitations(community_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invitations' AND policyname = 'Members can view invitations'
  ) THEN
    CREATE POLICY "Members can view invitations" ON invitations
      FOR SELECT USING (
        community_id IN (
          SELECT community_id FROM members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invitations' AND policyname = 'Admins can create invitations'
  ) THEN
    CREATE POLICY "Admins can create invitations" ON invitations
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM members
          WHERE community_id = invitations.community_id
            AND user_id = auth.uid()
            AND role IN ('admin', 'platform_admin')
            AND status = 'active'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invitations' AND policyname = 'Admins can update invitations'
  ) THEN
    CREATE POLICY "Admins can update invitations" ON invitations
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM members
          WHERE community_id = invitations.community_id
            AND user_id = auth.uid()
            AND role IN ('admin', 'platform_admin')
            AND status = 'active'
        )
      );
  END IF;
END $$;

-- Anyone can read their own invitation by token (for the accept page)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invitations' AND policyname = 'Anyone can read invitation by token'
  ) THEN
    CREATE POLICY "Anyone can read invitation by token" ON invitations
      FOR SELECT USING (true);
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- RPC: accept_invitation
-- Atomically: validate token → create member → mark invitation accepted
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION accept_invitation(p_token uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv record;
BEGIN
  -- Fetch and lock the invitation
  SELECT * INTO v_inv
    FROM invitations
   WHERE token = p_token
     FOR UPDATE;

  IF v_inv IS NULL THEN
    RAISE EXCEPTION 'Invitación no encontrada';
  END IF;

  IF v_inv.status <> 'pending' THEN
    RAISE EXCEPTION 'Esta invitación ya fue utilizada o cancelada';
  END IF;

  IF v_inv.expires_at < now() THEN
    UPDATE invitations SET status = 'expired' WHERE id = v_inv.id;
    RAISE EXCEPTION 'Esta invitación ha expirado';
  END IF;

  -- Check the user is not already a member of this community
  IF EXISTS (
    SELECT 1 FROM members
    WHERE community_id = v_inv.community_id AND user_id = p_user_id
  ) THEN
    -- Already a member, just mark the invitation as accepted
    UPDATE invitations SET status = 'accepted' WHERE id = v_inv.id;
    RETURN;
  END IF;

  -- Create the member record
  INSERT INTO members (community_id, user_id, role, status)
  VALUES (v_inv.community_id, p_user_id, v_inv.role, 'active');

  -- Mark invitation as accepted
  UPDATE invitations SET status = 'accepted' WHERE id = v_inv.id;
END;
$$;
