-- Migration 030: RLS policy fixes + performance indexes
-- Fixes permissive INSERT policies on audit_log and notifications
-- Adds composite indexes for common query patterns

BEGIN;

-- ============================================================
-- 1. FIX audit_log INSERT policies
-- ============================================================
-- Problem: "Authenticated can insert audit log" uses WITH CHECK (auth.uid() IS NOT NULL)
-- which lets any authenticated user insert audit entries for ANY community.
-- Combined with the second INSERT policy via PERMISSIVE OR, it overrides the stricter check.
-- Fix: Drop the overly-permissive policy and replace with one that enforces both
-- community membership AND actor_id = auth.uid().

DROP POLICY IF EXISTS "Authenticated can insert audit log" ON audit_log;

-- Keep the existing "System can insert audit log" policy (used by SECURITY DEFINER functions).
-- Add a new policy that restricts regular user inserts:
--   a) community_id must be one the user belongs to
--   b) user_id in the inserted row must match auth.uid()
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Members insert own audit log') THEN
    CREATE POLICY "Members insert own audit log"
      ON audit_log FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id = auth.uid()
        AND community_id IN (SELECT get_user_community_ids())
      );
  END IF;
END $$;

-- ============================================================
-- 2. FIX notifications INSERT policy
-- ============================================================
-- Problem: "System can insert notifications" has WITH CHECK (true),
-- meaning any authenticated user can insert notifications for any member.
-- Fix: Drop the wide-open policy. Replace with an admin-only policy.
-- SECURITY DEFINER functions (e.g. triggers) bypass RLS, so system inserts
-- still work without a permissive policy.

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins insert community notifications') THEN
    CREATE POLICY "Admins insert community notifications"
      ON notifications FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM members
          WHERE members.user_id = auth.uid()
            AND members.role = 'admin'
            AND members.community_id = notifications.community_id
            AND members.status = 'active'
        )
      );
  END IF;
END $$;

-- ============================================================
-- 3. arco_requests — verified OK (fixed in migration 029)
-- ============================================================
-- SELECT: user sees own OR admin sees community requests  ✓
-- INSERT: user_id = auth.uid()                            ✓
-- UPDATE: admin of user's community                       ✓
-- No changes needed.

-- ============================================================
-- 4. Performance composite indexes
-- ============================================================

-- Treasury: filter by fund_type, order by date
CREATE INDEX IF NOT EXISTS idx_transactions_community_fund_date
  ON transactions(community_id, fund_type, date DESC);

-- Payment obligations: filter by status and due date
CREATE INDEX IF NOT EXISTS idx_payment_obligations_community_status_due
  ON payment_obligations(community_id, status, due_date);

-- Members: lookup by community + financial standing (moroso queries)
CREATE INDEX IF NOT EXISTS idx_members_community_standing
  ON members(community_id, financial_standing);

-- Votes: lookup by proposal (counting / checking duplicates)
CREATE INDEX IF NOT EXISTS idx_votes_proposal
  ON votes(proposal_id);

-- Audit log: list by community ordered by time
CREATE INDEX IF NOT EXISTS idx_audit_log_community_created
  ON audit_log(community_id, created_at DESC);

-- Notifications: member inbox filtered by read status
CREATE INDEX IF NOT EXISTS idx_notifications_member_read
  ON notifications(member_id, read);

COMMIT;
