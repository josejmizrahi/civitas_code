-- =========================================================================
-- 033: Deliberation System
-- Features: DL-001, DL-002, DL-003, DL-004, DL-010, DL-011, NT-007
--
-- Adds: discussion_comments (threaded), comment_reactions,
--        sentiment tagging, @mentions, attachments
-- =========================================================================

-- ---------------------------------------------------------------------------
-- 1. Discussion Comments table (threaded via parent_comment_id)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS discussion_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES discussion_comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content text NOT NULL,
  content_format text NOT NULL DEFAULT 'plain', -- 'plain' | 'markdown'
  sentiment text DEFAULT 'neutral', -- 'pro' | 'con' | 'neutral' | 'question'
  attachments jsonb DEFAULT '[]'::jsonb, -- [{name, url, type, size}]
  mentions jsonb DEFAULT '[]'::jsonb, -- [{member_id, member_name}]
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. Comment Reactions table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS comment_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES discussion_comments(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  reaction text NOT NULL, -- 'agree' | 'disagree' | 'helpful' | 'question'
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(comment_id, member_id, reaction)
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_comments_proposal ON discussion_comments(proposal_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON discussion_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_author ON discussion_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_sentiment ON discussion_comments(proposal_id, sentiment) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reactions_comment ON comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_reactions_member ON comment_reactions(member_id);

-- ---------------------------------------------------------------------------
-- 4. RLS Policies
-- ---------------------------------------------------------------------------

ALTER TABLE discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Comments: members of the community can read all non-deleted comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can view comments') THEN
    CREATE POLICY "Members can view comments" ON discussion_comments
      FOR SELECT USING (
        community_id IN (
          SELECT community_id FROM members
          WHERE user_id = auth.uid() AND status = 'active'
        )
      );
  END IF;
END $$;

-- Comments: active members can create comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can create comments') THEN
    CREATE POLICY "Members can create comments" ON discussion_comments
      FOR INSERT WITH CHECK (
        community_id IN (
          SELECT community_id FROM members
          WHERE user_id = auth.uid() AND status = 'active'
        )
        AND author_id IN (
          SELECT id FROM members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Comments: authors can update their own comments (edit)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can update own comments') THEN
    CREATE POLICY "Authors can update own comments" ON discussion_comments
      FOR UPDATE USING (
        author_id IN (
          SELECT id FROM members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Comments: authors can soft-delete their own comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authors can delete own comments') THEN
    CREATE POLICY "Authors can delete own comments" ON discussion_comments
      FOR DELETE USING (
        author_id IN (
          SELECT id FROM members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Reactions: members can view reactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can view reactions') THEN
    CREATE POLICY "Members can view reactions" ON comment_reactions
      FOR SELECT USING (
        comment_id IN (
          SELECT dc.id FROM discussion_comments dc
          JOIN members m ON m.community_id = dc.community_id
          WHERE m.user_id = auth.uid() AND m.status = 'active'
        )
      );
  END IF;
END $$;

-- Reactions: members can add reactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can add reactions') THEN
    CREATE POLICY "Members can add reactions" ON comment_reactions
      FOR INSERT WITH CHECK (
        member_id IN (
          SELECT id FROM members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Reactions: members can remove their own reactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members can remove own reactions') THEN
    CREATE POLICY "Members can remove own reactions" ON comment_reactions
      FOR DELETE USING (
        member_id IN (
          SELECT id FROM members WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Sentiment summary view (materialized for performance)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW comment_sentiment_summary AS
SELECT
  proposal_id,
  COUNT(*) FILTER (WHERE sentiment = 'pro' AND deleted_at IS NULL) AS pro_count,
  COUNT(*) FILTER (WHERE sentiment = 'con' AND deleted_at IS NULL) AS con_count,
  COUNT(*) FILTER (WHERE sentiment = 'neutral' AND deleted_at IS NULL) AS neutral_count,
  COUNT(*) FILTER (WHERE sentiment = 'question' AND deleted_at IS NULL) AS question_count,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) AS total_count
FROM discussion_comments
GROUP BY proposal_id;
