-- =========================================================================
-- 049: Missing Indexes
--
-- Adds indexes for foreign keys and frequently-queried columns that
-- were identified as missing during the technical audit.
-- =========================================================================

-- votes.delegated_from — used in delegation vote lookups
CREATE INDEX IF NOT EXISTS idx_votes_delegated_from
  ON votes(delegated_from) WHERE delegated_from IS NOT NULL;

-- contract_installments foreign keys
CREATE INDEX IF NOT EXISTS idx_contract_installments_obligation
  ON contract_installments(payment_obligation_id) WHERE payment_obligation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contract_installments_transaction
  ON contract_installments(transaction_id) WHERE transaction_id IS NOT NULL;

-- payment_plan_installments.plan_id (high-frequency join)
CREATE INDEX IF NOT EXISTS idx_plan_installments_plan
  ON payment_plan_installments(plan_id);

-- transactions.origin — for filtering by origin type
CREATE INDEX IF NOT EXISTS idx_transactions_origin_type
  ON transactions(community_id, origin, type);
