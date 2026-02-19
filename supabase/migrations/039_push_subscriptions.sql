-- =========================================================================
-- 039: Push Subscriptions & Email Triggers
-- Features: NT-001, NT-002, NT-009, NT-010
--
-- Web Push subscription storage and email notification triggers.
-- =========================================================================

-- ---------------------------------------------------------------------------
-- Push subscriptions table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_member ON push_subscriptions(member_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'push_subscriptions_own') THEN
    CREATE POLICY push_subscriptions_own ON push_subscriptions
      FOR ALL USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Notification delivery tracking columns
-- ---------------------------------------------------------------------------
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  ADD COLUMN IF NOT EXISTS delivery_channel TEXT DEFAULT 'in_app'
    CHECK (delivery_channel IN ('in_app', 'email', 'push', 'all')),
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Trigger: email notification for critical events
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_email_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IN (
    'proposal_opened',
    'proposal_closed',
    'payment_overdue',
    'execution_completed',
    'moroso_notice',
    'convocatoria'
  ) THEN
    NEW.delivery_channel := 'all';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_email_notification ON notifications;
CREATE TRIGGER trg_email_notification
  BEFORE INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_notification();
