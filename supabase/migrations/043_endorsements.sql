-- Endorsement system: proposals need N endorsements before notifying everyone
-- Prevents proposal spam by requiring community support before advancing

-- Endorsements table
CREATE TABLE IF NOT EXISTS proposal_endorsements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  endorsed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(proposal_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_endorsements_proposal ON proposal_endorsements(proposal_id);
CREATE INDEX IF NOT EXISTS idx_endorsements_community ON proposal_endorsements(community_id);

-- Add endorsement tracking columns to proposals
ALTER TABLE proposals
  ADD COLUMN IF NOT EXISTS endorsements_required integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS endorsements_met boolean NOT NULL DEFAULT false;

-- RLS policies
ALTER TABLE proposal_endorsements ENABLE ROW LEVEL SECURITY;

-- Members can view endorsements for proposals in their community
CREATE POLICY endorsements_select ON proposal_endorsements
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Members can endorse proposals in their community
CREATE POLICY endorsements_insert ON proposal_endorsements
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Members can remove their own endorsement
CREATE POLICY endorsements_delete ON proposal_endorsements
  FOR DELETE USING (
    member_id IN (
      SELECT id FROM members WHERE user_id = auth.uid()
    )
  );
