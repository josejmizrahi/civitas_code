-- ============================================
-- CIVITAS: Migration 012 - Residential Enhancements
-- Trigger: sync voting_weight from unit indiviso
-- ============================================

CREATE OR REPLACE FUNCTION sync_member_voting_weight()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_member_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_member_id := OLD.member_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.member_id IS DISTINCT FROM NEW.member_id THEN
      IF OLD.member_id IS NOT NULL THEN
        UPDATE members SET voting_weight = COALESCE(
          (SELECT SUM(indiviso_pct) FROM units WHERE member_id = OLD.member_id AND indiviso_pct IS NOT NULL), 1
        ) WHERE id = OLD.member_id;
      END IF;
    END IF;
    affected_member_id := NEW.member_id;
  ELSE
    affected_member_id := NEW.member_id;
  END IF;
  
  IF affected_member_id IS NOT NULL THEN
    UPDATE members SET voting_weight = COALESCE(
      (SELECT SUM(indiviso_pct) FROM units WHERE member_id = affected_member_id AND indiviso_pct IS NOT NULL), 1
    ) WHERE id = affected_member_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_voting_weight ON units;
CREATE TRIGGER trigger_sync_voting_weight
  AFTER INSERT OR UPDATE OR DELETE ON units
  FOR EACH ROW EXECUTE FUNCTION sync_member_voting_weight();
