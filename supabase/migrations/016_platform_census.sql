-- ============================================
-- CIVITAS: Migration 016 - Platform Census
-- Aggregate network-level metrics without
-- exposing individual community data.
-- ============================================

-- Platform census function: returns aggregate stats across ALL communities.
-- Uses SECURITY DEFINER to bypass RLS but only returns aggregated numbers.
-- No community names, no member names, no individual financial data.

CREATE OR REPLACE FUNCTION get_platform_census()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_communities',    (SELECT COUNT(*) FROM communities),
    'total_members',        (SELECT COUNT(*) FROM members),
    'active_members',       (SELECT COUNT(*) FROM members WHERE status = 'active'),
    'members_good_standing',(SELECT COUNT(*) FROM members WHERE status = 'active' AND financial_standing = 'good_standing'),
    'members_delinquent',   (SELECT COUNT(*) FROM members WHERE status = 'active' AND financial_standing = 'delinquent'),
    'total_proposals',      (SELECT COUNT(*) FROM proposals),
    'active_proposals',     (SELECT COUNT(*) FROM proposals WHERE status = 'active'),
    'approved_proposals',   (SELECT COUNT(*) FROM proposals WHERE status = 'approved'),
    'total_transactions',   (SELECT COUNT(*) FROM transactions),
    'total_income',         (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'income'),
    'total_expenses',       (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'expense'),
    'total_delegations',    (SELECT COUNT(*) FROM delegations WHERE active = true),
    'total_documents',      (SELECT COUNT(*) FROM documents),
    'community_types',      (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('type', type, 'count', cnt)), '[]'::jsonb)
      FROM (SELECT type, COUNT(*) as cnt FROM communities GROUP BY type) sub
    ),
    'snapshot_at',          now()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION get_platform_census() IS
  'Returns aggregate platform-level census data. No individual community or member data is exposed.';

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION get_platform_census() TO authenticated;
