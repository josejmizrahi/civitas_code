-- =========================================================================
-- 031: Governance Lifecycle Enhancement
-- Features: GV-001, GV-006, GV-036, GV-043, GV-045
--
-- Adds: discussion phase, outcome declaration, grace period (appeal),
--        differentiated quorum, proposal templates, pre-execution notification
-- =========================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend proposal statuses to include 'discussion' and 'executed'
-- ---------------------------------------------------------------------------

-- Drop existing constraint if it exists (safe for both cases)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_proposal_status' AND table_name = 'proposals'
  ) THEN
    ALTER TABLE proposals DROP CONSTRAINT valid_proposal_status;
  END IF;
END $$;

-- Add new constraint with extended statuses
ALTER TABLE proposals ADD CONSTRAINT valid_proposal_status
  CHECK (status IN ('draft', 'discussion', 'active', 'closed', 'approved', 'rejected', 'executed'));

-- ---------------------------------------------------------------------------
-- 2. Add discussion period columns
-- ---------------------------------------------------------------------------

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS discussion_start timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS discussion_end timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS discussion_min_hours integer DEFAULT 48;

-- ---------------------------------------------------------------------------
-- 3. Add outcome declaration columns
-- ---------------------------------------------------------------------------

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS outcome_declared text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS outcome_declared_by uuid REFERENCES auth.users(id);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS outcome_declared_at timestamptz;

-- ---------------------------------------------------------------------------
-- 4. Add grace period (appeal window) columns
-- ---------------------------------------------------------------------------

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS grace_period_end timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS appealed boolean DEFAULT false;

-- ---------------------------------------------------------------------------
-- 5. Add template reference
-- ---------------------------------------------------------------------------

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS template_id text;

-- ---------------------------------------------------------------------------
-- 6. Constraints
-- ---------------------------------------------------------------------------

-- Discussion end must be after discussion start
ALTER TABLE proposals ADD CONSTRAINT valid_discussion_period
  CHECK (discussion_end IS NULL OR discussion_start IS NULL OR discussion_end > discussion_start);

-- ---------------------------------------------------------------------------
-- 7. Pre-execution notification function (GV-045)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION notify_pending_executions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_proposal record;
BEGIN
  FOR v_proposal IN
    SELECT id, community_id, title, cool_down_until
    FROM proposals
    WHERE status = 'approved'
      AND execution_status = 'cool_down'
      AND cool_down_until IS NOT NULL
      AND cool_down_until BETWEEN now() AND now() + interval '25 hours'
      AND cool_down_until > now() + interval '23 hours'
  LOOP
    -- Notify the entire community about upcoming execution
    PERFORM notify_community(
      v_proposal.community_id,
      'pre_execution',
      'Ejecucion automatica en ~24h: ' || v_proposal.title,
      'La propuesta "' || v_proposal.title || '" se auto-ejecutara el ' || to_char(v_proposal.cool_down_until, 'DD/MM/YYYY HH24:MI'),
      jsonb_build_object('proposal_id', v_proposal.id, 'cool_down_until', v_proposal.cool_down_until)
    );
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- 8. Update process_auto_executions to respect grace period
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION process_auto_executions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
  v_proposal record;
BEGIN
  FOR v_proposal IN
    SELECT id, community_id, financial_instruction
    FROM proposals
    WHERE status = 'approved'
      AND execution_status = 'cool_down'
      AND cool_down_until IS NOT NULL
      AND cool_down_until <= now()
      -- Respect grace period: don't execute if grace period hasn't ended
      AND (grace_period_end IS NULL OR grace_period_end <= now())
      -- Don't execute if appealed
      AND (appealed IS NULL OR appealed = false)
      AND financial_instruction IS NOT NULL
  LOOP
    -- Execute the financial instruction
    UPDATE proposals
    SET execution_status = 'executed',
        executed_at = now(),
        status = 'executed'
    WHERE id = v_proposal.id;

    -- Log to audit trail
    INSERT INTO audit_log (community_id, user_id, action, entity_type, entity_id, details)
    VALUES (
      v_proposal.community_id,
      NULL, -- system action
      'auto_execute',
      'proposal',
      v_proposal.id,
      jsonb_build_object(
        'financial_instruction', v_proposal.financial_instruction,
        'executed_at', now()
      )
    );

    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- 9. Indexes for performance
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_proposals_discussion ON proposals(community_id, status) WHERE status = 'discussion';
CREATE INDEX IF NOT EXISTS idx_proposals_grace_period ON proposals(grace_period_end) WHERE grace_period_end IS NOT NULL;
