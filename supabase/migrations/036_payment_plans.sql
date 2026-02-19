-- =========================================================================
-- 036: Payment Plans for Delinquent Members
-- Features: TR-034
--
-- Allows moroso members to propose structured payment plans
-- to settle their debt in installments.
-- =========================================================================

-- ---------------------------------------------------------------------------
-- Payment Plans table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  total_debt NUMERIC(12,2) NOT NULL CHECK (total_debt > 0),
  number_of_installments INT NOT NULL CHECK (number_of_installments >= 2 AND number_of_installments <= 36),
  installment_amount NUMERIC(12,2) NOT NULL CHECK (installment_amount > 0),
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  start_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'active', 'completed', 'defaulted', 'cancelled')),
  proposed_by UUID REFERENCES members(id),
  approved_by UUID REFERENCES members(id),
  approved_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookup by member
CREATE INDEX IF NOT EXISTS idx_payment_plans_member ON payment_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_community ON payment_plans(community_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);

-- ---------------------------------------------------------------------------
-- Payment Plan Installments table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_plan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES payment_plans(id) ON DELETE CASCADE,
  installment_number INT NOT NULL CHECK (installment_number >= 1),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
  payment_obligation_id UUID REFERENCES payment_obligations(id),
  paid_at TIMESTAMPTZ,
  paid_amount NUMERIC(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(plan_id, installment_number)
);

-- Index for lookup by plan
CREATE INDEX IF NOT EXISTS idx_plan_installments_plan ON payment_plan_installments(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_installments_due ON payment_plan_installments(due_date) WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- RLS Policies
-- ---------------------------------------------------------------------------
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plan_installments ENABLE ROW LEVEL SECURITY;

-- Members can see their own plans, admins can see all in their community
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payment_plans_select') THEN
    CREATE POLICY payment_plans_select ON payment_plans FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM members m
          WHERE m.id = payment_plans.member_id
          AND m.user_id = auth.uid()
        )
        OR
        EXISTS (
          SELECT 1 FROM members m
          WHERE m.community_id = payment_plans.community_id
          AND m.user_id = auth.uid()
          AND m.role IN ('admin', 'tesorero')
        )
      );
  END IF;
END $$;

-- Members can propose their own plans
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payment_plans_insert') THEN
    CREATE POLICY payment_plans_insert ON payment_plans FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM members m
          WHERE m.id = payment_plans.member_id
          AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Admins/tesorero can update plans (approve/reject)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payment_plans_update') THEN
    CREATE POLICY payment_plans_update ON payment_plans FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM members m
          WHERE m.community_id = payment_plans.community_id
          AND m.user_id = auth.uid()
          AND m.role IN ('admin', 'tesorero')
        )
      );
  END IF;
END $$;

-- Installments: same visibility as parent plan
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'plan_installments_select') THEN
    CREATE POLICY plan_installments_select ON payment_plan_installments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM payment_plans pp
          JOIN members m ON m.id = pp.member_id
          WHERE pp.id = payment_plan_installments.plan_id
          AND (
            m.user_id = auth.uid()
            OR EXISTS (
              SELECT 1 FROM members m2
              WHERE m2.community_id = pp.community_id
              AND m2.user_id = auth.uid()
              AND m2.role IN ('admin', 'tesorero')
            )
          )
        )
      );
  END IF;
END $$;

-- Installments insert/update by admin/tesorero
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'plan_installments_insert') THEN
    CREATE POLICY plan_installments_insert ON payment_plan_installments FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM payment_plans pp
          JOIN members m ON m.community_id = pp.community_id
          WHERE pp.id = payment_plan_installments.plan_id
          AND m.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'plan_installments_update') THEN
    CREATE POLICY plan_installments_update ON payment_plan_installments FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM payment_plans pp
          JOIN members m ON m.community_id = pp.community_id
          WHERE pp.id = payment_plan_installments.plan_id
          AND m.user_id = auth.uid()
          AND m.role IN ('admin', 'tesorero')
        )
      );
  END IF;
END $$;
