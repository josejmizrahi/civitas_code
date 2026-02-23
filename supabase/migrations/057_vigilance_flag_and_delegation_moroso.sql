-- ============================================
-- CIVITAS: Migration 057 - Vigilance flag on transactions + delegation deactivation when moroso
-- ============================================

-- 1. Transactions: allow vigilance committee to flag and add notes
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS vigilance_flag boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vigilance_note text;

COMMENT ON COLUMN transactions.vigilance_flag IS 'Marked by Comité de Vigilancia for review.';
COMMENT ON COLUMN transactions.vigilance_note IS 'Observation or comment from vigilance.';

CREATE INDEX IF NOT EXISTS idx_transactions_vigilance_flag
  ON transactions(community_id, vigilance_flag) WHERE vigilance_flag = true;

-- 2. When a member becomes moroso, deactivate their outgoing delegations (they cannot delegate)
CREATE OR REPLACE FUNCTION trigger_deactivate_delegations_on_moroso()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.financial_standing IN ('moroso', 'delinquent')
     AND (OLD.financial_standing IS NULL OR OLD.financial_standing NOT IN ('moroso', 'delinquent')) THEN
    UPDATE delegations
    SET active = false
    WHERE from_member_id = NEW.id AND active = true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deactivate_delegations_on_moroso ON members;
CREATE TRIGGER trg_deactivate_delegations_on_moroso
  AFTER UPDATE OF financial_standing ON members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_deactivate_delegations_on_moroso();

COMMENT ON FUNCTION trigger_deactivate_delegations_on_moroso() IS
  'Deactivates outgoing delegations when member standing becomes moroso (GAP-12).';
