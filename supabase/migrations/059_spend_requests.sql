-- =========================================================================
-- 059: Spend Requests (solicitudes de gasto con ciclo de vida)
-- Treasury Redesign: egresos pasan por spend_request antes de transacción.
-- =========================================================================

CREATE TABLE IF NOT EXISTS spend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,

  title text NOT NULL,
  description text,
  amount numeric NOT NULL CHECK (amount > 0),
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  fund text NOT NULL DEFAULT 'general',
  beneficiary_entity_id uuid REFERENCES entities(id) ON DELETE SET NULL,
  evidence_url text,

  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_approval',
    'pending_vote',
    'approved',
    'executing',
    'executed',
    'verified',
    'rejected',
    'cancelled'
  )),

  authorization_level integer CHECK (authorization_level IN (1, 2, 3, 4)),
  budget_id uuid REFERENCES budgets(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES members(id) ON DELETE SET NULL,
  approval_note text,
  rejection_reason text,

  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  payment_reference text,
  paid_at timestamptz,

  verified_by uuid REFERENCES members(id) ON DELETE SET NULL,
  verification_note text,
  verified_at timestamptz,

  is_emergency boolean NOT NULL DEFAULT false,
  ratification_proposal_id uuid REFERENCES proposals(id) ON DELETE SET NULL,
  ratification_deadline timestamptz,

  requested_by uuid NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_spend_requests_community ON spend_requests(community_id);
CREATE INDEX IF NOT EXISTS idx_spend_requests_community_status ON spend_requests(community_id, status);
CREATE INDEX IF NOT EXISTS idx_spend_requests_category ON spend_requests(category_id);
CREATE INDEX IF NOT EXISTS idx_spend_requests_requested_by ON spend_requests(requested_by);

-- Attachments (cotizaciones, facturas, evidencia)
CREATE TABLE IF NOT EXISTS spend_request_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spend_request_id uuid NOT NULL REFERENCES spend_requests(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('quote', 'invoice', 'receipt', 'evidence', 'delivery', 'other')),
  file_url text NOT NULL,
  description text,
  uploaded_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sr_attachments_spend_request ON spend_request_attachments(spend_request_id);

-- Comments/thread on spend requests
CREATE TABLE IF NOT EXISTS spend_request_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spend_request_id uuid NOT NULL REFERENCES spend_requests(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sr_comments_spend_request ON spend_request_comments(spend_request_id);

-- Link transactions to spend request
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS spend_request_id uuid REFERENCES spend_requests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_spend_request ON transactions(spend_request_id) WHERE spend_request_id IS NOT NULL;

-- RLS
ALTER TABLE spend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_read_sr" ON spend_requests;
CREATE POLICY "members_read_sr" ON spend_requests
  FOR SELECT USING (
    community_id IN (
      SELECT m.community_id FROM members m
      WHERE m.user_id = auth.uid() AND m.status = 'active'
    )
    AND (
      status != 'draft'
      OR requested_by IN (SELECT id FROM members WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "admin_treasurer_insert_sr" ON spend_requests;
CREATE POLICY "admin_treasurer_insert_sr" ON spend_requests
  FOR INSERT WITH CHECK (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND status = 'active'
      AND role IN ('admin', 'tesorero', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS "admin_treasurer_update_sr" ON spend_requests;
CREATE POLICY "admin_treasurer_update_sr" ON spend_requests
  FOR UPDATE USING (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND status = 'active'
      AND role IN ('admin', 'tesorero', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS "vigilance_approve_sr" ON spend_requests;
CREATE POLICY "vigilance_approve_sr" ON spend_requests
  FOR UPDATE USING (
    community_id IN (
      SELECT community_id FROM members
      WHERE user_id = auth.uid() AND status = 'active'
      AND role IN ('admin', 'comite_vigilancia', 'platform_admin')
    )
  );

-- Attachments: same as spend_requests visibility
ALTER TABLE spend_request_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read_sr_attachments" ON spend_request_attachments FOR SELECT USING (
  spend_request_id IN (SELECT id FROM spend_requests)
);
CREATE POLICY "admin_treasurer_manage_sr_attachments" ON spend_request_attachments
  FOR ALL USING (
    spend_request_id IN (
      SELECT id FROM spend_requests WHERE community_id IN (
        SELECT community_id FROM members
        WHERE user_id = auth.uid() AND status = 'active'
        AND role IN ('admin', 'tesorero', 'platform_admin')
      )
    )
  );

-- Comments: members can read, admin/tesorero/vigilance can insert
ALTER TABLE spend_request_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_read_sr_comments" ON spend_request_comments FOR SELECT USING (
  spend_request_id IN (SELECT id FROM spend_requests)
);
CREATE POLICY "members_insert_sr_comments" ON spend_request_comments FOR INSERT WITH CHECK (
  member_id IN (SELECT id FROM members WHERE user_id = auth.uid() AND status = 'active')
);

-- =========================================================================
-- Classify spend request: returns 1=within budget, 2=discretionary, 3=vote, 4=emergency
-- Reads budgets.period as YYYY-MM (month); compares with spend_requests in same period.
-- =========================================================================
CREATE OR REPLACE FUNCTION classify_spend_request(p_spend_request_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_sr record;
  v_rules jsonb;
  v_discretionary numeric;
  v_budget record;
  v_spent numeric;
  v_available numeric;
  v_period_start date;
  v_period_end date;
BEGIN
  SELECT * INTO v_sr FROM spend_requests WHERE id = p_spend_request_id;
  IF v_sr IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_sr.is_emergency THEN
    RETURN 4;
  END IF;

  SELECT c.rules INTO v_rules FROM communities c WHERE c.id = v_sr.community_id;
  v_discretionary := COALESCE(
    (v_rules->'treasury'->>'discretionary_threshold')::numeric,
    (v_rules->'treasury'->>'admin_spending_limit')::numeric,
    0
  );

  -- Level 1: check budget (budgets.period is YYYY-MM)
  SELECT b.* INTO v_budget
  FROM budgets b
  WHERE b.community_id = v_sr.community_id
    AND b.category_id = v_sr.category_id
    AND b.fund_type = COALESCE(NULLIF(v_sr.fund, 'general'), 'mantenimiento')
    AND b.period = to_char(now(), 'YYYY-MM')
  LIMIT 1;

  IF FOUND THEN
    v_period_start := (v_budget.period || '-01')::date;
    v_period_end := (date_trunc('month', v_period_start) + interval '1 month' - interval '1 day')::date;

    SELECT COALESCE(SUM(t.amount), 0) INTO v_spent
    FROM transactions t
    WHERE t.community_id = v_sr.community_id
      AND t.category_id = v_sr.category_id
      AND t.fund_type = COALESCE(NULLIF(v_sr.fund, 'general'), 'mantenimiento')
      AND t.type = 'expense'
      AND t.date::date BETWEEN v_period_start AND v_period_end;

    v_available := v_budget.amount - v_spent;
    IF v_sr.amount <= v_available AND v_available >= 0 THEN
      RETURN 1;
    END IF;
  END IF;

  IF v_discretionary > 0 AND v_sr.amount <= v_discretionary THEN
    RETURN 2;
  END IF;

  RETURN 3;
END;
$$;

GRANT EXECUTE ON FUNCTION classify_spend_request(uuid) TO authenticated;

COMMENT ON TABLE spend_requests IS 'Solicitudes de gasto con ciclo de vida (Nivel 1-4). La transacción se crea al ejecutar.';
COMMENT ON FUNCTION classify_spend_request(uuid) IS 'Clasifica nivel de autorización: 1=presupuesto, 2=discrecional, 3=votación, 4=emergencia.';
