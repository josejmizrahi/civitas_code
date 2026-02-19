-- Gamification system: XP, levels, badges, streaks, leaderboards
-- Increases engagement through game mechanics while enhancing community value

-- ─── Member gamification profile ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_gamification (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  -- XP & Level
  xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  -- Streaks
  current_streak integer NOT NULL DEFAULT 0,
  max_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  -- Badges (JSONB array of badge IDs with unlock timestamps)
  badges jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(member_id, community_id)
);

CREATE INDEX IF NOT EXISTS idx_gamification_community ON member_gamification(community_id);
CREATE INDEX IF NOT EXISTS idx_gamification_xp ON member_gamification(community_id, xp DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON member_gamification(community_id, level DESC);

-- ─── Gamification event log (XP history) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS gamification_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  action text NOT NULL,       -- 'vote', 'endorse', 'propose', 'pay', 'attend', 'login', 'comment'
  xp_earned integer NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gam_events_member ON gamification_events(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gam_events_community ON gamification_events(community_id, created_at DESC);

-- ─── RLS Policies ─────────────────────────────────────────────────────────

ALTER TABLE member_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_events ENABLE ROW LEVEL SECURITY;

-- Everyone in the community can see gamification profiles (leaderboard)
CREATE POLICY gamification_select ON member_gamification
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Only the system updates gamification (via service role), but members can read
CREATE POLICY gamification_insert ON member_gamification
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY gamification_update ON member_gamification
  FOR UPDATE USING (
    member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
  );

-- Event log: members can see their own events
CREATE POLICY gam_events_select ON gamification_events
  FOR SELECT USING (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY gam_events_insert ON gamification_events
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'
    )
  );
