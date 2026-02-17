-- ============================================================
-- CIVITAS: Server-side auto-close of proposals
-- Moves proposal auto-close from React client to Postgres
-- ============================================================

-- 1. Function to auto-close a single expired proposal
CREATE OR REPLACE FUNCTION close_expired_proposal(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proposal      record;
  v_yes           numeric := 0;
  v_no            numeric := 0;
  v_abstain       numeric := 0;
  v_total_weight  numeric := 0;
  v_total_voted   numeric := 0;
  v_participation numeric;
  v_quorum_met    boolean;
  v_majority_met  boolean;
  v_result_status text;
  v_result_text   text;
  v_vote          record;
BEGIN
  SELECT * INTO v_proposal
  FROM proposals
  WHERE id = p_proposal_id
    AND status = 'active'
    AND voting_end IS NOT NULL
    AND voting_end < now();

  IF NOT FOUND THEN
    RETURN; -- Not eligible for auto-close
  END IF;

  -- Calculate total available weight from active members
  SELECT COALESCE(SUM(COALESCE(voting_weight, 1)), 0)
  INTO v_total_weight
  FROM members
  WHERE community_id = v_proposal.community_id
    AND status = 'active';

  -- Tally votes by weight
  FOR v_vote IN
    SELECT value, COALESCE(weight, 1) as w
    FROM votes
    WHERE proposal_id = p_proposal_id
  LOOP
    v_total_voted := v_total_voted + v_vote.w;
    CASE v_vote.value
      WHEN 'yes' THEN v_yes := v_yes + v_vote.w;
      WHEN 'no' THEN v_no := v_no + v_vote.w;
      ELSE v_abstain := v_abstain + v_vote.w;
    END CASE;
  END LOOP;

  -- Compute participation and thresholds
  v_participation := CASE WHEN v_total_weight > 0
    THEN v_total_voted / v_total_weight
    ELSE 0 END;
  v_quorum_met := v_participation >= v_proposal.quorum_required;
  v_majority_met := CASE WHEN (v_yes + v_no) > 0
    THEN (v_yes / (v_yes + v_no)) >= v_proposal.majority_required
    ELSE false END;

  -- Determine result
  IF v_quorum_met AND v_majority_met THEN
    v_result_status := 'approved';
    v_result_text := 'Aprobada por mayoría (cierre automático)';
  ELSIF NOT v_quorum_met THEN
    v_result_status := 'rejected';
    v_result_text := 'Rechazada - no alcanzó quórum (cierre automático)';
  ELSE
    v_result_status := 'rejected';
    v_result_text := 'Rechazada - no alcanzó mayoría (cierre automático)';
  END IF;

  -- Update proposal
  UPDATE proposals
  SET status    = v_result_status,
      result    = v_result_text,
      closed_at = now(),
      closed_by = NULL -- NULL indicates auto-close (no human closer)
  WHERE id = p_proposal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION close_expired_proposal(uuid) TO authenticated;

-- 2. Function to process ALL expired proposals across all communities
--    Designed to be called by pg_cron or invoked manually
CREATE OR REPLACE FUNCTION process_expired_proposals()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_proposal_id uuid;
  v_count       int := 0;
BEGIN
  FOR v_proposal_id IN
    SELECT id FROM proposals
    WHERE status = 'active'
      AND voting_end IS NOT NULL
      AND voting_end < now()
  LOOP
    PERFORM close_expired_proposal(v_proposal_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION process_expired_proposals() TO authenticated;

-- 3. Trigger that auto-closes on any read/write interaction with proposals
--    This provides "lazy" server-side auto-close without pg_cron
CREATE OR REPLACE FUNCTION trigger_auto_close_proposals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only act on active proposals with expired voting_end
  IF NEW.status = 'active' AND NEW.voting_end IS NOT NULL AND NEW.voting_end < now() THEN
    PERFORM close_expired_proposal(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trg_auto_close_proposal ON proposals;

-- Apply trigger on UPDATE (e.g. when a vote triggers a refetch)
-- This catches cases where the client touches the proposal after expiry
CREATE TRIGGER trg_auto_close_proposal
  AFTER UPDATE ON proposals
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION trigger_auto_close_proposals();

-- NOTE: For full automation without client interaction, enable pg_cron:
-- SELECT cron.schedule('auto-close-proposals', '*/5 * * * *', 'SELECT process_expired_proposals()');
-- pg_cron must be enabled in Supabase Dashboard > Database > Extensions
