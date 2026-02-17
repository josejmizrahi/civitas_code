-- ============================================
-- CIVITAS: Migration 024 - Moroso Automation
-- Mexican legal moroso (delinquent) computation
-- per LPCI CDMX Art. 2, 36
--
-- A condómino is "moroso" when they owe:
--   >= moroso_threshold_ordinary unpaid ordinary cuotas, OR
--   >= moroso_threshold_extraordinary unpaid extraordinary cuotas
--
-- Moroso members lose: vote, be_elected, quorum_excluded
-- (configurable via community rules.identity.moroso_restrictions)
-- ============================================


-- ============================================
-- 1. NEW COLUMNS ON MEMBERS
-- ============================================

ALTER TABLE members ADD COLUMN IF NOT EXISTS moroso_since timestamptz;
ALTER TABLE members ADD COLUMN IF NOT EXISTS moroso_notified_at timestamptz;

COMMENT ON COLUMN members.moroso_since IS
  'Timestamp when this member was first flagged as moroso. NULL when in good standing.';
COMMENT ON COLUMN members.moroso_notified_at IS
  'Timestamp of last moroso notification sent (Art. 36 requires 7-day notice before assembly).';


-- ============================================
-- 2. ADD obligation_type TO payment_obligations
-- Classifies cuotas as ordinary vs extraordinary
-- for the moroso threshold computation.
-- ============================================

ALTER TABLE payment_obligations ADD COLUMN IF NOT EXISTS obligation_type text NOT NULL DEFAULT 'ordinary';

DO $$ BEGIN
  ALTER TABLE payment_obligations DROP CONSTRAINT IF EXISTS valid_obligation_type;
  ALTER TABLE payment_obligations ADD CONSTRAINT valid_obligation_type
    CHECK (obligation_type IN ('ordinary', 'extraordinary'));
END $$;

COMMENT ON COLUMN payment_obligations.obligation_type IS
  'Type of cuota: ordinary (mantenimiento) or extraordinary. Drives moroso threshold calculation.';

CREATE INDEX IF NOT EXISTS idx_obligations_type
  ON payment_obligations(community_id, member_id, obligation_type, status);


-- ============================================
-- 3. UPDATE financial_standing CONSTRAINT
-- Add 'moroso' as a valid standing value.
-- ============================================

DO $$ BEGIN
  ALTER TABLE members DROP CONSTRAINT IF EXISTS valid_financial_standing;
  ALTER TABLE members ADD CONSTRAINT valid_financial_standing
    CHECK (financial_standing IN ('good_standing', 'grace_period', 'delinquent', 'suspended', 'moroso'));
END $$;


-- ============================================
-- 4. COMPOSITE INDEX FOR MOROSO QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_members_community_standing
  ON members(community_id, financial_standing)
  WHERE status = 'active';


-- ============================================
-- 5. compute_moroso_status FUNCTION
-- Batch function: evaluates all active members
-- in a community against the moroso thresholds
-- and updates their financial_standing.
--
-- Returns a table of affected members.
-- ============================================

CREATE OR REPLACE FUNCTION compute_moroso_status(p_community_id uuid)
RETURNS TABLE (
  member_id uuid,
  old_standing text,
  new_standing text,
  ordinary_unpaid bigint,
  extraordinary_unpaid bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rules              jsonb;
  v_threshold_ordinary int;
  v_threshold_extra    int;
  v_auto_restore       boolean;
BEGIN
  -- 1. Fetch community rules
  SELECT rules INTO v_rules
  FROM communities
  WHERE id = p_community_id;

  v_threshold_ordinary := COALESCE(
    (v_rules -> 'identity' ->> 'moroso_threshold_ordinary')::int, 2
  );
  v_threshold_extra := COALESCE(
    (v_rules -> 'identity' ->> 'moroso_threshold_extraordinary')::int, 1
  );
  v_auto_restore := COALESCE(
    (v_rules -> 'identity' ->> 'auto_restore_on_payment')::boolean, true
  );

  -- 2. Compute unpaid counts per member and update standings
  RETURN QUERY
  WITH debt_counts AS (
    SELECT
      m.id AS mid,
      m.financial_standing AS current_standing,
      COALESCE(SUM(CASE WHEN po.obligation_type = 'ordinary' THEN 1 ELSE 0 END), 0) AS ord_unpaid,
      COALESCE(SUM(CASE WHEN po.obligation_type = 'extraordinary' THEN 1 ELSE 0 END), 0) AS ext_unpaid
    FROM members m
    LEFT JOIN payment_obligations po
      ON po.member_id = m.id
      AND po.community_id = p_community_id
      AND po.status IN ('pending', 'overdue')
    WHERE m.community_id = p_community_id
      AND m.status = 'active'
    GROUP BY m.id, m.financial_standing
  ),
  new_standings AS (
    SELECT
      dc.mid,
      dc.current_standing,
      dc.ord_unpaid,
      dc.ext_unpaid,
      CASE
        WHEN dc.ord_unpaid >= v_threshold_ordinary OR dc.ext_unpaid >= v_threshold_extra
          THEN 'moroso'
        WHEN v_auto_restore AND dc.ord_unpaid = 0 AND dc.ext_unpaid = 0
          THEN 'good_standing'
        ELSE dc.current_standing
      END AS computed_standing
    FROM debt_counts dc
  ),
  updates AS (
    UPDATE members m
    SET
      financial_standing = ns.computed_standing,
      moroso_since = CASE
        WHEN ns.computed_standing = 'moroso' AND (m.moroso_since IS NULL OR m.financial_standing != 'moroso')
          THEN now()
        WHEN ns.computed_standing != 'moroso'
          THEN NULL
        ELSE m.moroso_since
      END
    FROM new_standings ns
    WHERE m.id = ns.mid
      AND m.financial_standing IS DISTINCT FROM ns.computed_standing
    RETURNING m.id AS mid, ns.current_standing AS old_st, ns.computed_standing AS new_st,
              ns.ord_unpaid, ns.ext_unpaid
  )
  SELECT
    updates.mid AS member_id,
    updates.old_st AS old_standing,
    updates.new_st AS new_standing,
    updates.ord_unpaid AS ordinary_unpaid,
    updates.ext_unpaid AS extraordinary_unpaid
  FROM updates;
END;
$$;

COMMENT ON FUNCTION compute_moroso_status(uuid) IS
  'Batch-evaluates moroso thresholds for all active members in a community. Returns members whose standing changed. LPCI CDMX Art. 2.';


-- ============================================
-- 6. get_member_debt_summary FUNCTION
-- Returns debt breakdown for a single member.
-- ============================================

CREATE OR REPLACE FUNCTION get_member_debt_summary(p_member_id uuid)
RETURNS TABLE (
  ordinary_unpaid bigint,
  extraordinary_unpaid bigint,
  total_debt numeric,
  is_moroso boolean,
  moroso_since timestamptz,
  restrictions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_community_id       uuid;
  v_rules              jsonb;
  v_threshold_ordinary int;
  v_threshold_extra    int;
  v_ord_count          bigint;
  v_ext_count          bigint;
  v_total              numeric;
  v_standing           text;
  v_moroso_since       timestamptz;
  v_restrictions       jsonb;
BEGIN
  -- Get community for this member
  SELECT community_id INTO v_community_id
  FROM members
  WHERE id = p_member_id;

  -- Get rules
  SELECT rules INTO v_rules
  FROM communities
  WHERE id = v_community_id;

  v_threshold_ordinary := COALESCE(
    (v_rules -> 'identity' ->> 'moroso_threshold_ordinary')::int, 2
  );
  v_threshold_extra := COALESCE(
    (v_rules -> 'identity' ->> 'moroso_threshold_extraordinary')::int, 1
  );

  -- Count unpaid obligations by type
  SELECT
    COALESCE(SUM(CASE WHEN obligation_type = 'ordinary' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN obligation_type = 'extraordinary' THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(amount), 0)
  INTO v_ord_count, v_ext_count, v_total
  FROM payment_obligations
  WHERE member_id = p_member_id
    AND community_id = v_community_id
    AND status IN ('pending', 'overdue');

  -- Get current standing
  SELECT m.financial_standing, m.moroso_since
  INTO v_standing, v_moroso_since
  FROM members m
  WHERE m.id = p_member_id;

  -- Build restrictions array
  IF v_ord_count >= v_threshold_ordinary OR v_ext_count >= v_threshold_extra THEN
    v_restrictions := COALESCE(
      v_rules -> 'identity' -> 'moroso_restrictions',
      '["vote", "be_elected", "quorum_excluded"]'::jsonb
    );
  ELSE
    v_restrictions := '[]'::jsonb;
  END IF;

  RETURN QUERY SELECT
    v_ord_count,
    v_ext_count,
    v_total,
    (v_standing = 'moroso'),
    v_moroso_since,
    v_restrictions;
END;
$$;

COMMENT ON FUNCTION get_member_debt_summary(uuid) IS
  'Returns a single member''s debt summary including moroso status and applicable restrictions.';
