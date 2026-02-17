-- ============================================
-- CIVITAS: Migration 010 - Governance Enhancements
-- voting_weight, proposal result/closed, minutes signatures
-- ============================================

-- Add voting weight to members (default 1, updated by vertical triggers)
ALTER TABLE members ADD COLUMN IF NOT EXISTS voting_weight numeric(10,4) NOT NULL DEFAULT 1;

-- Add result tracking to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS result text;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS closed_at timestamptz;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES auth.users(id);

-- Add approval and signature tracking to minutes
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id);
ALTER TABLE minutes ADD COLUMN IF NOT EXISTS signatures jsonb NOT NULL DEFAULT '[]';
