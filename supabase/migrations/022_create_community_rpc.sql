-- ============================================================
-- CIVITAS: Atomic community creation RPC
-- Fixes RLS race condition: INSERT community + SELECT back fails
-- because user is not yet a member when .select() triggers RLS.
-- ============================================================

-- Add description column to communities (was in TypeScript types but missing from DB)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS description text;

-- Atomic RPC: creates community + admin member in one transaction
CREATE OR REPLACE FUNCTION create_community_with_admin(
  p_user_id uuid,
  p_name text,
  p_slug text,
  p_type text DEFAULT 'residential',
  p_description text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_community record;
  v_member record;
BEGIN
  -- Validate inputs
  IF p_name IS NULL OR length(trim(p_name)) < 1 THEN
    RAISE EXCEPTION 'Community name is required';
  END IF;

  -- Insert the community
  INSERT INTO communities (name, slug, type, description)
  VALUES (p_name, p_slug, p_type, p_description)
  RETURNING * INTO v_community;

  -- Insert the creator as admin member
  INSERT INTO members (community_id, user_id, role, status)
  VALUES (v_community.id, p_user_id, 'admin', 'active')
  RETURNING * INTO v_member;

  -- Return community data as JSONB
  RETURN jsonb_build_object(
    'id', v_community.id,
    'name', v_community.name,
    'slug', v_community.slug,
    'type', v_community.type,
    'description', v_community.description,
    'config', v_community.config,
    'rules', v_community.rules,
    'created_at', v_community.created_at,
    'updated_at', v_community.updated_at,
    'member_id', v_member.id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION create_community_with_admin(uuid, text, text, text, text) TO authenticated;
