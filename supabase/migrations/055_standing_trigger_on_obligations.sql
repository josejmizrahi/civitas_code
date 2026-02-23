-- ============================================
-- CIVITAS: Migration 055 - Standing trigger on obligations
-- Recompute member financial_standing immediately when payment_obligations
-- change (INSERT/UPDATE), so standing is up-to-date without waiting for daily cron.
-- ============================================

CREATE OR REPLACE FUNCTION trigger_refresh_standing_on_obligation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_community_id uuid;
BEGIN
  v_community_id := COALESCE(NEW.community_id, OLD.community_id);
  IF v_community_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  PERFORM compute_moroso_status(v_community_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_standing_on_obligation_change ON payment_obligations;
CREATE TRIGGER trg_standing_on_obligation_change
  AFTER INSERT OR UPDATE OR DELETE ON payment_obligations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_standing_on_obligation();

COMMENT ON FUNCTION trigger_refresh_standing_on_obligation() IS
  'Refreshes member financial_standing for the affected community when obligations change.';
