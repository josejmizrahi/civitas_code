-- =========================================================================
-- 058: Public read of invitation by token (for /invite/:token accept page)
-- After 046, only "User can read own invitations" (by email) exists, so
-- unauthenticated users cannot load the invite page. This RPC allows
-- loading minimal invitation data by token for the accept flow.
-- =========================================================================

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_inv record;
BEGIN
  SELECT id, community_id, email, role, status, token, expires_at, created_by, created_at
  INTO v_inv
  FROM invitations
  WHERE token = p_token;

  IF v_inv IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'id', v_inv.id,
    'community_id', v_inv.community_id,
    'email', v_inv.email,
    'role', v_inv.role,
    'status', v_inv.status,
    'token', v_inv.token,
    'expires_at', v_inv.expires_at,
    'created_by', v_inv.created_by,
    'created_at', v_inv.created_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_invitation_by_token(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_invitation_by_token(uuid) TO authenticated;

COMMENT ON FUNCTION get_invitation_by_token(uuid) IS 'Returns invitation by token for the accept page. Callable by anon so the invite link works before login.';
