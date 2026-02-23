-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_community ON announcements(community_id, published_at DESC);
CREATE INDEX idx_announcements_pinned ON announcements(community_id, pinned, published_at DESC);

-- Read receipts
CREATE TABLE IF NOT EXISTS announcement_reads (
  announcement_id uuid NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, member_id)
);

-- RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view announcements in their community"
  ON announcements FOR SELECT
  USING (community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage announcements"
  ON announcements FOR ALL
  USING (community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')))
  WITH CHECK (community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin', 'tesorero')));

CREATE POLICY "Members can view their own reads"
  ON announcement_reads FOR SELECT
  USING (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));

CREATE POLICY "Members can mark as read"
  ON announcement_reads FOR INSERT
  WITH CHECK (member_id IN (SELECT id FROM members WHERE user_id = auth.uid()));
