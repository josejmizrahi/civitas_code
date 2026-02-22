-- =========================================================================
-- 050: Security hardening — advisors remediation
-- - member_profiles: SECURITY INVOKER + revoke anon (no auth.users exposure)
-- - decision_archive, comment_sentiment_summary, entity_ratings_summary: SECURITY INVOKER
-- - All functions: SET search_path = public
-- =========================================================================

-- ---------------------------------------------------------------------------
-- 1. member_profiles: run as invoker so RLS applies, revoke anon
-- ---------------------------------------------------------------------------
REVOKE SELECT ON member_profiles FROM anon;
DROP VIEW IF EXISTS member_profiles;

CREATE VIEW member_profiles
  WITH (security_invoker = on)
AS
SELECT
  m.id,
  m.community_id,
  m.user_id,
  m.role,
  m.status,
  m.custom_attributes,
  m.joined_at,
  m.created_at,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.email) AS full_name
FROM members m
JOIN auth.users u ON u.id = m.user_id;

GRANT SELECT ON member_profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 2. decision_archive: SECURITY INVOKER
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS decision_archive;

CREATE VIEW decision_archive
  WITH (security_invoker = on)
AS
SELECT
  p.id,
  p.community_id,
  p.title,
  p.description,
  p.type,
  p.status,
  p.result,
  p.template_id,
  p.voting_model,
  p.quorum_required,
  p.majority_required,
  p.created_at,
  p.closed_at,
  p.executed_at,
  p.outcome_declared,
  (SELECT COUNT(*) FROM votes v WHERE v.proposal_id = p.id) AS vote_count,
  (SELECT COUNT(*) FROM discussion_comments dc WHERE dc.proposal_id = p.id AND dc.deleted_at IS NULL) AS comment_count,
  (SELECT COUNT(*) FROM implementation_tasks it WHERE it.proposal_id = p.id) AS task_count,
  (SELECT COUNT(*) FROM implementation_tasks it WHERE it.proposal_id = p.id AND it.status = 'completed') AS tasks_completed,
  (SELECT COALESCE(AVG(it.progress_pct), 0) FROM implementation_tasks it WHERE it.proposal_id = p.id) AS avg_progress
FROM proposals p
WHERE p.status IN ('closed', 'approved', 'rejected', 'executed');

GRANT SELECT ON decision_archive TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. comment_sentiment_summary: SECURITY INVOKER
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS comment_sentiment_summary;

CREATE VIEW comment_sentiment_summary
  WITH (security_invoker = on)
AS
SELECT
  proposal_id,
  COUNT(*) FILTER (WHERE sentiment = 'pro' AND deleted_at IS NULL) AS pro_count,
  COUNT(*) FILTER (WHERE sentiment = 'con' AND deleted_at IS NULL) AS con_count,
  COUNT(*) FILTER (WHERE sentiment = 'neutral' AND deleted_at IS NULL) AS neutral_count,
  COUNT(*) FILTER (WHERE sentiment = 'question' AND deleted_at IS NULL) AS question_count,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_count
FROM discussion_comments
GROUP BY proposal_id;

GRANT SELECT ON comment_sentiment_summary TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. entity_ratings_summary: SECURITY INVOKER
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS entity_ratings_summary;

CREATE VIEW entity_ratings_summary
  WITH (security_invoker = on)
AS
SELECT
  community_id,
  target_type,
  target_id,
  COUNT(*) AS total_ratings,
  ROUND(AVG(overall_score), 2) AS avg_score,
  ROUND(AVG((dimensions->>'punctuality')::numeric), 2) AS avg_punctuality,
  ROUND(AVG((dimensions->>'quality')::numeric), 2) AS avg_quality,
  ROUND(AVG((dimensions->>'communication')::numeric), 2) AS avg_communication,
  ROUND(AVG((dimensions->>'compliance')::numeric), 2) AS avg_compliance,
  ROUND(AVG((dimensions->>'value')::numeric), 2) AS avg_value
FROM ratings
GROUP BY community_id, target_type, target_id;

GRANT SELECT ON entity_ratings_summary TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Functions: set search_path = public (each in block to avoid failing on missing)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND (p.proconfig IS NULL OR NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) c WHERE c LIKE 'search_path=%'
      ))
  ) LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not set search_path for %: %', r.sig, SQLERRM;
    END;
  END LOOP;
END $$;
