-- =========================================================================
-- 034: Voting Models
-- Features: GV-012, GV-016, GV-017, GV-022
--
-- Adds: voting_model column, voting_options JSONB,
--        expanded vote values for consensus & multiple choice
-- =========================================================================

-- ---------------------------------------------------------------------------
-- 1. Add voting_model and voting_options to proposals
-- ---------------------------------------------------------------------------

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS voting_model text NOT NULL DEFAULT 'simple';
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS voting_options jsonb DEFAULT '[]'::jsonb;

-- Constraint: valid voting models
ALTER TABLE proposals ADD CONSTRAINT valid_voting_model
  CHECK (voting_model IN ('simple', 'consensus', 'multiple_choice'));

-- ---------------------------------------------------------------------------
-- 2. Expand vote values to support consensus and multiple choice
-- ---------------------------------------------------------------------------

-- Drop existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'valid_vote_value' AND table_name = 'votes'
  ) THEN
    ALTER TABLE votes DROP CONSTRAINT valid_vote_value;
  END IF;
END $$;

-- Add expanded constraint
-- simple: yes, no, abstain
-- consensus: agree, disagree, abstain, block
-- multiple_choice: option_1..option_10
ALTER TABLE votes ADD CONSTRAINT valid_vote_value
  CHECK (value IN (
    'yes', 'no', 'abstain',
    'agree', 'disagree', 'block',
    'option_1', 'option_2', 'option_3', 'option_4', 'option_5',
    'option_6', 'option_7', 'option_8', 'option_9', 'option_10'
  ));

-- ---------------------------------------------------------------------------
-- 3. Add block_reason for consensus voting (required when blocking)
-- ---------------------------------------------------------------------------

ALTER TABLE votes ADD COLUMN IF NOT EXISTS block_reason text;

-- ---------------------------------------------------------------------------
-- 4. Add delegator_override flag (GV-022)
--    When a delegating member votes directly, their delegated vote is overridden
-- ---------------------------------------------------------------------------

ALTER TABLE votes ADD COLUMN IF NOT EXISTS is_override boolean DEFAULT false;
