-- =========================================================================
-- 035: Accountability System
-- Features: AC-001, AC-002, AC-004, AC-005, AC-007
--
-- Adds: implementation_tasks table, decision_archive view,
--        full-text search function for decisions
-- =========================================================================

-- ---------------------------------------------------------------------------
-- 1. Implementation Tasks table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS implementation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  responsible_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  progress_pct integer DEFAULT 0,
  due_date date,
  completed_at timestamptz,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_task_status CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  CONSTRAINT valid_progress CHECK (progress_pct >= 0 AND progress_pct <= 100)
);

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_impl_tasks_proposal ON implementation_tasks(proposal_id);
CREATE INDEX IF NOT EXISTS idx_impl_tasks_responsible ON implementation_tasks(responsible_member_id) WHERE responsible_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_impl_tasks_status ON implementation_tasks(community_id, status);

-- ---------------------------------------------------------------------------
-- 3. RLS Policies
-- ---------------------------------------------------------------------------

ALTER TABLE implementation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tasks" ON implementation_tasks
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "Admin can manage tasks" ON implementation_tasks
  FOR ALL USING (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('admin', 'comite_vigilancia')
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Decision Archive View (join proposals + vote count + task progress)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW decision_archive AS
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
  -- Vote counts
  (SELECT COUNT(*) FROM votes v WHERE v.proposal_id = p.id) AS vote_count,
  -- Comment count
  (SELECT COUNT(*) FROM discussion_comments dc WHERE dc.proposal_id = p.id AND dc.deleted_at IS NULL) AS comment_count,
  -- Implementation progress
  (SELECT COUNT(*) FROM implementation_tasks it WHERE it.proposal_id = p.id) AS task_count,
  (SELECT COUNT(*) FROM implementation_tasks it WHERE it.proposal_id = p.id AND it.status = 'completed') AS tasks_completed,
  (SELECT COALESCE(AVG(it.progress_pct), 0) FROM implementation_tasks it WHERE it.proposal_id = p.id) AS avg_progress
FROM proposals p
WHERE p.status IN ('closed', 'approved', 'rejected', 'executed');

-- ---------------------------------------------------------------------------
-- 5. Full-text search function for decisions (Spanish)
-- ---------------------------------------------------------------------------

-- Add full-text search index on proposals
CREATE INDEX IF NOT EXISTS idx_proposals_fts ON proposals
  USING GIN (to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, '')));

CREATE OR REPLACE FUNCTION search_decisions(
  p_community_id uuid,
  p_query text
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type text,
  status text,
  result text,
  created_at timestamptz,
  closed_at timestamptz,
  rank real
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.description,
    p.type,
    p.status,
    p.result,
    p.created_at,
    p.closed_at,
    ts_rank(
      to_tsvector('spanish', coalesce(p.title, '') || ' ' || coalesce(p.description, '')),
      plainto_tsquery('spanish', p_query)
    ) AS rank
  FROM proposals p
  WHERE p.community_id = p_community_id
    AND p.status IN ('closed', 'approved', 'rejected', 'executed')
    AND to_tsvector('spanish', coalesce(p.title, '') || ' ' || coalesce(p.description, ''))
        @@ plainto_tsquery('spanish', p_query)
  ORDER BY rank DESC, p.closed_at DESC NULLS LAST
  LIMIT 50;
END;
$$;
