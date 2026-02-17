-- ============================================
-- CIVITAS Phase 5: Dual Fund Accounting
-- LPCI CDMX Art. 57-58 Compliance
-- Mantenimiento + Reserva fund separation
-- ============================================

-- 1. Add fund_type to transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS fund_type text NOT NULL DEFAULT 'mantenimiento';

ALTER TABLE transactions
  ADD CONSTRAINT valid_fund_type CHECK (fund_type IN ('mantenimiento', 'reserva'));

CREATE INDEX IF NOT EXISTS idx_transactions_fund_type
  ON transactions(community_id, fund_type);

-- 2. Add fund_type to budgets
ALTER TABLE budgets
  ADD COLUMN IF NOT EXISTS fund_type text NOT NULL DEFAULT 'mantenimiento';

ALTER TABLE budgets
  ADD CONSTRAINT valid_budget_fund_type CHECK (fund_type IN ('mantenimiento', 'reserva'));

CREATE INDEX IF NOT EXISTS idx_budgets_fund_type
  ON budgets(community_id, fund_type);

-- 3. Add fund_type to payment_obligations
ALTER TABLE payment_obligations
  ADD COLUMN IF NOT EXISTS fund_type text NOT NULL DEFAULT 'mantenimiento';

ALTER TABLE payment_obligations
  ADD CONSTRAINT valid_obligation_fund_type CHECK (fund_type IN ('mantenimiento', 'reserva'));

CREATE INDEX IF NOT EXISTS idx_obligations_fund_type
  ON payment_obligations(community_id, fund_type);

-- 4. Create financial_statements table
CREATE TABLE IF NOT EXISTS financial_statements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  period text NOT NULL,                          -- e.g. '2026-01'
  fund_type text NOT NULL DEFAULT 'mantenimiento',
  opening_balance numeric(12,2) DEFAULT 0,
  total_income numeric(12,2) DEFAULT 0,
  total_expense numeric(12,2) DEFAULT 0,
  closing_balance numeric(12,2) DEFAULT 0,
  line_items jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz DEFAULT now(),
  generated_by uuid REFERENCES auth.users(id),
  approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),

  CONSTRAINT valid_statement_fund_type CHECK (fund_type IN ('mantenimiento', 'reserva')),
  UNIQUE(community_id, period, fund_type)
);

CREATE INDEX IF NOT EXISTS idx_statements_community
  ON financial_statements(community_id);

CREATE INDEX IF NOT EXISTS idx_statements_period
  ON financial_statements(community_id, period);

CREATE INDEX IF NOT EXISTS idx_statements_fund_type
  ON financial_statements(community_id, fund_type);

-- 5. RLS policies for financial_statements
ALTER TABLE financial_statements ENABLE ROW LEVEL SECURITY;

-- All community members can view financial statements (transparency — Art. 43)
CREATE POLICY "Members can view financial statements"
  ON financial_statements FOR SELECT
  USING (community_id IN (SELECT get_user_community_ids()));

-- Admin/Tesorero can generate and manage statements
CREATE POLICY "Admin/Tesorero can insert statements"
  ON financial_statements FOR INSERT
  WITH CHECK (get_user_role(community_id) IN ('admin', 'tesorero'));

CREATE POLICY "Admin/Tesorero can update statements"
  ON financial_statements FOR UPDATE
  USING (get_user_role(community_id) IN ('admin', 'tesorero'));

CREATE POLICY "Admin/Tesorero can delete statements"
  ON financial_statements FOR DELETE
  USING (get_user_role(community_id) IN ('admin', 'tesorero'));

-- 6. SQL function to generate monthly statement
CREATE OR REPLACE FUNCTION generate_monthly_statement(
  p_community_id uuid,
  p_period text,
  p_fund_type text DEFAULT 'mantenimiento',
  p_generated_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_statement_id uuid;
  v_opening_balance numeric(12,2) := 0;
  v_total_income numeric(12,2) := 0;
  v_total_expense numeric(12,2) := 0;
  v_closing_balance numeric(12,2) := 0;
  v_line_items jsonb := '[]'::jsonb;
  v_period_start date;
  v_period_end date;
  v_prev_period text;
BEGIN
  -- Calculate period boundaries (period = 'YYYY-MM')
  v_period_start := (p_period || '-01')::date;
  v_period_end := (v_period_start + interval '1 month' - interval '1 day')::date;

  -- Calculate previous period for opening balance
  v_prev_period := to_char(v_period_start - interval '1 month', 'YYYY-MM');

  -- Get opening balance from previous period's closing balance
  SELECT closing_balance INTO v_opening_balance
  FROM financial_statements
  WHERE community_id = p_community_id
    AND period = v_prev_period
    AND fund_type = p_fund_type;

  IF v_opening_balance IS NULL THEN
    -- If no previous statement, calculate from all prior transactions
    SELECT COALESCE(
      SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0
    ) INTO v_opening_balance
    FROM transactions
    WHERE community_id = p_community_id
      AND fund_type = p_fund_type
      AND date < v_period_start;
  END IF;

  -- Calculate totals for this period
  SELECT
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
  INTO v_total_income, v_total_expense
  FROM transactions
  WHERE community_id = p_community_id
    AND fund_type = p_fund_type
    AND date >= v_period_start
    AND date <= v_period_end;

  v_closing_balance := v_opening_balance + v_total_income - v_total_expense;

  -- Build line items as JSON array
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'category', COALESCE(c.name, 'Sin categoría'),
      'description', t.description,
      'amount', t.amount,
      'date', t.date::text
    ) ORDER BY t.date, t.created_at
  ), '[]'::jsonb) INTO v_line_items
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  WHERE t.community_id = p_community_id
    AND t.fund_type = p_fund_type
    AND t.date >= v_period_start
    AND t.date <= v_period_end;

  -- Upsert the statement (replace if exists for same period/fund)
  INSERT INTO financial_statements (
    community_id, period, fund_type,
    opening_balance, total_income, total_expense, closing_balance,
    line_items, generated_by, generated_at
  ) VALUES (
    p_community_id, p_period, p_fund_type,
    v_opening_balance, v_total_income, v_total_expense, v_closing_balance,
    v_line_items, p_generated_by, now()
  )
  ON CONFLICT (community_id, period, fund_type)
  DO UPDATE SET
    opening_balance = EXCLUDED.opening_balance,
    total_income = EXCLUDED.total_income,
    total_expense = EXCLUDED.total_expense,
    closing_balance = EXCLUDED.closing_balance,
    line_items = EXCLUDED.line_items,
    generated_by = EXCLUDED.generated_by,
    generated_at = now(),
    -- Reset approval on regeneration
    approved = false,
    approved_at = NULL,
    approved_by = NULL
  RETURNING id INTO v_statement_id;

  RETURN v_statement_id;
END;
$$;
