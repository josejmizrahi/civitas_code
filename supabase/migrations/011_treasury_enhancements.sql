-- ============================================
-- CIVITAS: Migration 011 - Treasury Enhancements
-- Delete policy, category is_active, obligation-transaction link
-- ============================================

-- Allow admin/tesorero to delete transactions
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admin/Tesorero can delete transactions'
  ) THEN
    CREATE POLICY "Admin/Tesorero can delete transactions" ON transactions FOR DELETE
      USING (get_user_role(community_id) IN ('admin', 'tesorero'));
  END IF;
END $$;

-- Add is_active flag to categories for soft-delete
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Link payment obligations to the transaction that fulfilled them
ALTER TABLE payment_obligations ADD COLUMN IF NOT EXISTS payment_transaction_id uuid REFERENCES transactions(id);
