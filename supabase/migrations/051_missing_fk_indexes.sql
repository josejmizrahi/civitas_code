-- =========================================================================
-- 051: Missing FK indexes (performance)
-- Adds indexes for foreign keys identified by advisor and hot-path tables.
-- =========================================================================

-- votes.delegated_from — delegation lookups
CREATE INDEX IF NOT EXISTS idx_votes_delegated_from
  ON votes(delegated_from) WHERE delegated_from IS NOT NULL;

-- contract_installments FKs
CREATE INDEX IF NOT EXISTS idx_contract_installments_obligation
  ON contract_installments(payment_obligation_id) WHERE payment_obligation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contract_installments_transaction
  ON contract_installments(transaction_id) WHERE transaction_id IS NOT NULL;

-- payment_plan_installments.plan_id — high-frequency join
CREATE INDEX IF NOT EXISTS idx_plan_installments_plan
  ON payment_plan_installments(plan_id);

-- transactions filtering
CREATE INDEX IF NOT EXISTS idx_transactions_origin_type
  ON transactions(community_id, origin, type);

-- admin_terms.elected_in_assembly — advisor
CREATE INDEX IF NOT EXISTS idx_admin_terms_elected_in_assembly
  ON admin_terms(elected_in_assembly) WHERE elected_in_assembly IS NOT NULL;

-- payment_obligations — list by member/community
CREATE INDEX IF NOT EXISTS idx_payment_obligations_member
  ON payment_obligations(community_id, member_id);
CREATE INDEX IF NOT EXISTS idx_payment_obligations_payment_tx
  ON payment_obligations(payment_transaction_id) WHERE payment_transaction_id IS NOT NULL;

-- proposals — list by assembly/community
CREATE INDEX IF NOT EXISTS idx_proposals_assembly
  ON proposals(community_id, assembly_id) WHERE assembly_id IS NOT NULL;

-- votes — by proposal (counting, listing)
CREATE INDEX IF NOT EXISTS idx_votes_proposal
  ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_member
  ON votes(proposal_id, member_id);

-- discussion_comments — by proposal
CREATE INDEX IF NOT EXISTS idx_discussion_comments_proposal
  ON discussion_comments(proposal_id);
