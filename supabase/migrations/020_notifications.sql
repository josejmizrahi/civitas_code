-- Notifications table for in-app notification system
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id uuid REFERENCES communities(id) NOT NULL,
  member_id uuid REFERENCES members(id) NOT NULL,
  type text NOT NULL, -- 'proposal_opened', 'proposal_closing_soon', 'proposal_closed', 'proposal_approved', 'payment_due', 'payment_overdue', 'obligation_created', 'member_joined', 'execution_completed'
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_member ON notifications(member_id, read, created_at DESC);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members see own notifications" ON notifications FOR SELECT USING (
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Members can update own notifications" ON notifications FOR UPDATE USING (
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid())
);

-- Helper: notify all active members of a community
CREATE OR REPLACE FUNCTION notify_community(
  p_community_id uuid,
  p_type text,
  p_title text,
  p_body text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS int
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count int := 0;
BEGIN
  INSERT INTO notifications (community_id, member_id, type, title, body, metadata)
  SELECT p_community_id, id, p_type, p_title, p_body, p_metadata
  FROM members
  WHERE community_id = p_community_id AND status = 'active';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
GRANT EXECUTE ON FUNCTION notify_community(uuid, text, text, text, jsonb) TO authenticated;

-- Helper: notify a single member
CREATE OR REPLACE FUNCTION notify_member(
  p_community_id uuid,
  p_member_id uuid,
  p_type text,
  p_title text,
  p_body text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO notifications (community_id, member_id, type, title, body, metadata)
  VALUES (p_community_id, p_member_id, p_type, p_title, p_body, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
GRANT EXECUTE ON FUNCTION notify_member(uuid, uuid, text, text, text, jsonb) TO authenticated;
