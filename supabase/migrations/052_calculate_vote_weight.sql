-- =========================================================================
-- 052: Backend vote weight function
-- Enforces vote weight calculation from community config on the backend.
-- =========================================================================

CREATE OR REPLACE FUNCTION calculate_vote_weight(
  p_member_id uuid,
  p_community_id uuid
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_formula text;
  v_source_field text;
  v_member_custom jsonb;
  v_member_weight numeric;
  v_attr_key text;
  v_value_text text;
BEGIN
  SELECT
    COALESCE(c.config -> 'voting_weight' ->> 'formula', 'one_person_one_vote'),
    NULLIF(c.config -> 'voting_weight' ->> 'source_field', '')
  INTO v_formula, v_source_field
  FROM communities c
  WHERE c.id = p_community_id;

  SELECT m.custom_attributes, m.voting_weight
  INTO v_member_custom, v_member_weight
  FROM members m
  WHERE m.id = p_member_id
    AND m.community_id = p_community_id
    AND m.status = 'active';

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF v_formula = 'one_person_one_vote' THEN
    RETURN 1.0;
  END IF;

  IF v_formula = 'custom_attribute' THEN
    IF v_source_field IS NULL THEN
      RETURN COALESCE(v_member_weight, 1.0);
    END IF;

    -- Supports both "custom_attributes.some_key" and "some_key"
    v_attr_key := split_part(v_source_field, '.', 2);
    IF v_attr_key = '' THEN
      v_attr_key := v_source_field;
    END IF;

    v_value_text := v_member_custom ->> v_attr_key;

    BEGIN
      RETURN COALESCE(NULLIF(v_value_text, '')::numeric, COALESCE(v_member_weight, 1.0), 1.0);
    EXCEPTION
      WHEN invalid_text_representation THEN
        RETURN COALESCE(v_member_weight, 1.0);
    END;
  END IF;

  -- Backward-compatible fallback with existing persisted weight.
  RETURN COALESCE(v_member_weight, 1.0);
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_vote_weight(uuid, uuid) TO authenticated;
