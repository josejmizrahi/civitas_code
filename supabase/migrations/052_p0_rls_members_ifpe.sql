-- =========================================================================
-- 052: P0 RLS — members INSERT (invitation or admin), ifpe_webhook_events SELECT (admin/tesorero), indexes
-- See docs/P0-security-contract.md
-- =========================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. members INSERT: allow (1) self-join via valid invitation, (2) admin insert
-- 046 dropped "Users can join via invitation"; restore with invitation check.
-- ---------------------------------------------------------------------------

CREATE POLICY "Users can join via valid invitation"
  ON members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM invitations i
      INNER JOIN auth.users u ON u.id = auth.uid() AND u.email = i.email
      WHERE i.community_id = members.community_id
        AND i.status = 'pending'
        AND i.expires_at > now()
    )
  );

-- ---------------------------------------------------------------------------
-- 2. ifpe_webhook_events SELECT: restrict to admin or tesorero only
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Members can view their community webhook events" ON ifpe_webhook_events;

CREATE POLICY "Admin or tesorero can view webhook events"
  ON ifpe_webhook_events FOR SELECT
  USING (
    get_user_role(community_id) IN ('admin', 'tesorero')
  );

-- ---------------------------------------------------------------------------
-- 3. Index for get_user_role / permission lookups (user_id, community_id, status)
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_members_user_community_active
  ON members(user_id, community_id)
  WHERE status = 'active';

-- ---------------------------------------------------------------------------
-- 4. RPC: lookup community by CLABE only (for ifpe-webhook — no full table scan)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_community_by_clabe(p_clabe text)
RETURNS TABLE(id uuid, rules jsonb)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT c.id, c.rules
  FROM communities c
  WHERE c.rules->'treasury'->>'clabe' = p_clabe
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_community_by_clabe(text) TO service_role;

COMMIT;
