-- ============================================================
-- 017: Entities, Recurring Schedules, Contracts & Ratings
-- Adds: related parties (partners/suppliers), recurring 
-- payments/collections, contracts with payment plans, and 
-- a rating system for all related parties.
-- ============================================================

-- ==================== ENTITIES ====================
-- Commercial partners, suppliers, contractors, landlords, etc.
CREATE TABLE IF NOT EXISTS entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'proveedor'
    CHECK (type IN ('proveedor','socio_comercial','contratista','arrendador','gobierno','institucion','otro')),
  rfc text,
  email text,
  phone text,
  address text,
  clabe text,
  bank_name text,
  contact_person text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','inactive','blacklisted')),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entities_community ON entities(community_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(community_id, type);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(community_id, status);

-- ==================== ENTITY CONTACTS ====================
CREATE TABLE IF NOT EXISTS entity_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  email text,
  phone text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_entity_contacts_entity ON entity_contacts(entity_id);

-- ==================== RECURRING SCHEDULES ====================
-- Templates that generate payment obligations or expense records on a schedule
CREATE TABLE IF NOT EXISTS recurring_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'collection'
    CHECK (type IN ('collection','payment')),
  frequency text NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('weekly','biweekly','monthly','bimonthly','quarterly','semiannual','annual','custom')),
  custom_interval_days int,
  amount numeric(14,2) NOT NULL,
  currency text DEFAULT 'MXN',
  category_id uuid REFERENCES categories(id),
  -- Targets: who gets charged (collection) or who gets paid (payment)
  target_type text NOT NULL DEFAULT 'all_members'
    CHECK (target_type IN ('all_members','specific_members','entity')),
  target_entity_id uuid REFERENCES entities(id),
  target_member_ids jsonb DEFAULT '[]'::jsonb,
  -- Schedule config
  day_of_month int DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  start_date date NOT NULL,
  end_date date,
  next_run_date date NOT NULL,
  last_run_date date,
  -- Status
  is_active boolean DEFAULT true,
  auto_generate boolean DEFAULT true,
  runs_completed int DEFAULT 0,
  -- Audit
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_community ON recurring_schedules(community_id);
CREATE INDEX IF NOT EXISTS idx_recurring_next_run ON recurring_schedules(next_run_date) WHERE is_active = true;

-- ==================== CONTRACTS ====================
-- Agreements between a community and an entity or member
CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'servicio'
    CHECK (type IN ('servicio','obra','arrendamiento','mantenimiento','suministro','asesoria','otro')),
  -- Related party (one of entity or member)
  entity_id uuid REFERENCES entities(id),
  member_id uuid REFERENCES members(id),
  -- Financial terms
  total_amount numeric(14,2) NOT NULL,
  currency text DEFAULT 'MXN',
  payment_frequency text DEFAULT 'monthly'
    CHECK (payment_frequency IN ('one_time','weekly','biweekly','monthly','bimonthly','quarterly','semiannual','annual','custom')),
  number_of_installments int NOT NULL DEFAULT 1,
  -- Dates
  start_date date NOT NULL,
  end_date date,
  -- Status & compliance
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','completed','defaulted','cancelled','suspended')),
  compliance_score numeric(3,2) DEFAULT 1.00 CHECK (compliance_score BETWEEN 0 AND 1),
  -- Additional terms
  terms jsonb DEFAULT '{}'::jsonb,
  document_ids jsonb DEFAULT '[]'::jsonb,
  -- Approval
  approved_by_proposal_id uuid REFERENCES proposals(id),
  -- Audit
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contracts_community ON contracts(community_id);
CREATE INDEX IF NOT EXISTS idx_contracts_entity ON contracts(entity_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(community_id, status);

-- ==================== CONTRACT INSTALLMENTS ====================
-- Individual scheduled payments for a contract
CREATE TABLE IF NOT EXISTS contract_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  installment_number int NOT NULL,
  amount numeric(14,2) NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','overdue','partial','cancelled')),
  -- Links
  payment_obligation_id uuid REFERENCES payment_obligations(id),
  transaction_id uuid REFERENCES transactions(id),
  -- Payment info
  paid_amount numeric(14,2) DEFAULT 0,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_installments_contract ON contract_installments(contract_id);
CREATE INDEX IF NOT EXISTS idx_installments_community ON contract_installments(community_id);
CREATE INDEX IF NOT EXISTS idx_installments_due ON contract_installments(due_date) WHERE status IN ('pending','overdue');

-- ==================== RATINGS ====================
-- Rating system for entities and members
CREATE TABLE IF NOT EXISTS ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('entity','member')),
  target_id uuid NOT NULL,
  rated_by uuid NOT NULL REFERENCES members(id),
  overall_score smallint NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
  -- Dimension scores (1-5 each, stored as JSON for flexibility)
  dimensions jsonb DEFAULT '{}'::jsonb,
  -- e.g. {"punctuality":4, "quality":5, "communication":3, "compliance":5, "value":4}
  comment text,
  -- Optional link to a contract being rated
  contract_id uuid REFERENCES contracts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  -- One rating per rater per target per contract
  UNIQUE(community_id, target_type, target_id, rated_by, contract_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_target ON ratings(community_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_ratings_contract ON ratings(contract_id);

-- ==================== AGGREGATE VIEW ====================
-- Average ratings per entity/member
CREATE OR REPLACE VIEW entity_ratings_summary AS
SELECT
  community_id,
  target_type,
  target_id,
  COUNT(*) AS total_ratings,
  ROUND(AVG(overall_score), 2) AS avg_score,
  ROUND(AVG((dimensions->>'punctuality')::numeric), 2) AS avg_punctuality,
  ROUND(AVG((dimensions->>'quality')::numeric), 2) AS avg_quality,
  ROUND(AVG((dimensions->>'communication')::numeric), 2) AS avg_communication,
  ROUND(AVG((dimensions->>'compliance')::numeric), 2) AS avg_compliance,
  ROUND(AVG((dimensions->>'value')::numeric), 2) AS avg_value
FROM ratings
GROUP BY community_id, target_type, target_id;

-- ==================== HELPER FUNCTIONS ====================

-- Generate obligations from a recurring schedule
CREATE OR REPLACE FUNCTION generate_recurring_obligations(p_schedule_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule recurring_schedules%ROWTYPE;
  v_member_ids uuid[];
  v_count int := 0;
  v_next date;
  v_mid uuid;
BEGIN
  SELECT * INTO v_schedule FROM recurring_schedules WHERE id = p_schedule_id AND is_active = true;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Only run if next_run_date <= today
  IF v_schedule.next_run_date > CURRENT_DATE THEN RETURN 0; END IF;

  -- Determine target members
  IF v_schedule.type = 'collection' THEN
    IF v_schedule.target_type = 'all_members' THEN
      SELECT array_agg(id) INTO v_member_ids
      FROM members WHERE community_id = v_schedule.community_id AND status = 'active';
    ELSIF v_schedule.target_type = 'specific_members' THEN
      SELECT array_agg(value::uuid) INTO v_member_ids
      FROM jsonb_array_elements_text(v_schedule.target_member_ids);
    END IF;

    IF v_member_ids IS NOT NULL THEN
      FOREACH v_mid IN ARRAY v_member_ids LOOP
        INSERT INTO payment_obligations (community_id, member_id, amount, due_date, concept, status)
        VALUES (v_schedule.community_id, v_mid, v_schedule.amount, v_schedule.next_run_date,
                v_schedule.name || ' — ' || to_char(v_schedule.next_run_date, 'Mon YYYY'), 'pending');
        v_count := v_count + 1;
      END LOOP;
    END IF;
  END IF;

  -- If payment to entity, create a transaction record
  IF v_schedule.type = 'payment' AND v_schedule.target_entity_id IS NOT NULL THEN
    INSERT INTO transactions (community_id, type, amount, category_id, description, date, created_by)
    VALUES (v_schedule.community_id, 'expense', v_schedule.amount, v_schedule.category_id,
            'Pago recurrente: ' || v_schedule.name || ' — ' || to_char(v_schedule.next_run_date, 'Mon YYYY'),
            v_schedule.next_run_date, v_schedule.created_by);
    v_count := v_count + 1;
  END IF;

  -- Advance next_run_date
  v_next := CASE v_schedule.frequency
    WHEN 'weekly' THEN v_schedule.next_run_date + INTERVAL '7 days'
    WHEN 'biweekly' THEN v_schedule.next_run_date + INTERVAL '14 days'
    WHEN 'monthly' THEN v_schedule.next_run_date + INTERVAL '1 month'
    WHEN 'bimonthly' THEN v_schedule.next_run_date + INTERVAL '2 months'
    WHEN 'quarterly' THEN v_schedule.next_run_date + INTERVAL '3 months'
    WHEN 'semiannual' THEN v_schedule.next_run_date + INTERVAL '6 months'
    WHEN 'annual' THEN v_schedule.next_run_date + INTERVAL '1 year'
    WHEN 'custom' THEN v_schedule.next_run_date + (COALESCE(v_schedule.custom_interval_days, 30) || ' days')::interval
    ELSE v_schedule.next_run_date + INTERVAL '1 month'
  END;

  -- Deactivate if past end_date
  IF v_schedule.end_date IS NOT NULL AND v_next > v_schedule.end_date THEN
    UPDATE recurring_schedules SET is_active = false, next_run_date = v_next, last_run_date = v_schedule.next_run_date,
      runs_completed = runs_completed + 1, updated_at = now() WHERE id = p_schedule_id;
  ELSE
    UPDATE recurring_schedules SET next_run_date = v_next, last_run_date = v_schedule.next_run_date,
      runs_completed = runs_completed + 1, updated_at = now() WHERE id = p_schedule_id;
  END IF;

  RETURN v_count;
END;
$$;

-- Process all due recurring schedules for a community
CREATE OR REPLACE FUNCTION process_recurring_schedules(p_community_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_schedule_id uuid;
  v_total int := 0;
  v_count int;
BEGIN
  FOR v_schedule_id IN
    SELECT id FROM recurring_schedules
    WHERE community_id = p_community_id AND is_active = true AND next_run_date <= CURRENT_DATE
  LOOP
    SELECT generate_recurring_obligations(v_schedule_id) INTO v_count;
    v_total := v_total + v_count;
  END LOOP;
  RETURN v_total;
END;
$$;

-- Update contract compliance score based on installment payment history
CREATE OR REPLACE FUNCTION update_contract_compliance(p_contract_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total int;
  v_on_time int;
  v_score numeric(3,2);
BEGIN
  SELECT COUNT(*) INTO v_total FROM contract_installments
    WHERE contract_id = p_contract_id AND status != 'cancelled';

  IF v_total = 0 THEN RETURN 1.00; END IF;

  SELECT COUNT(*) INTO v_on_time FROM contract_installments
    WHERE contract_id = p_contract_id AND status = 'paid';

  v_score := v_on_time::numeric / v_total::numeric;

  UPDATE contracts SET compliance_score = v_score, updated_at = now() WHERE id = p_contract_id;

  RETURN v_score;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_recurring_obligations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION process_recurring_schedules(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_contract_compliance(uuid) TO authenticated;

-- ==================== RLS POLICIES ====================

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Entities: viewable by community members, manageable by tesorero+
DROP POLICY IF EXISTS entities_select ON entities;
CREATE POLICY entities_select ON entities FOR SELECT USING (
  community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active')
);
DROP POLICY IF EXISTS entities_insert ON entities;
CREATE POLICY entities_insert ON entities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE community_id = entities.community_id AND user_id = auth.uid() AND role IN ('admin','tesorero'))
);
DROP POLICY IF EXISTS entities_update ON entities;
CREATE POLICY entities_update ON entities FOR UPDATE USING (
  EXISTS (SELECT 1 FROM members WHERE community_id = entities.community_id AND user_id = auth.uid() AND role IN ('admin','tesorero'))
);
DROP POLICY IF EXISTS entities_delete ON entities;
CREATE POLICY entities_delete ON entities FOR DELETE USING (
  EXISTS (SELECT 1 FROM members WHERE community_id = entities.community_id AND user_id = auth.uid() AND role = 'admin')
);

-- Entity contacts: same as entities
DROP POLICY IF EXISTS entity_contacts_select ON entity_contacts;
CREATE POLICY entity_contacts_select ON entity_contacts FOR SELECT USING (
  entity_id IN (SELECT id FROM entities WHERE community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active'))
);
DROP POLICY IF EXISTS entity_contacts_modify ON entity_contacts;
CREATE POLICY entity_contacts_modify ON entity_contacts FOR ALL USING (
  entity_id IN (SELECT id FROM entities WHERE community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND role IN ('admin','tesorero')))
);

-- Recurring schedules
DROP POLICY IF EXISTS recurring_select ON recurring_schedules;
CREATE POLICY recurring_select ON recurring_schedules FOR SELECT USING (
  community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active')
);
DROP POLICY IF EXISTS recurring_modify ON recurring_schedules;
CREATE POLICY recurring_modify ON recurring_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE community_id = recurring_schedules.community_id AND user_id = auth.uid() AND role IN ('admin','tesorero'))
);

-- Contracts
DROP POLICY IF EXISTS contracts_select ON contracts;
CREATE POLICY contracts_select ON contracts FOR SELECT USING (
  community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active')
);
DROP POLICY IF EXISTS contracts_modify ON contracts;
CREATE POLICY contracts_modify ON contracts FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE community_id = contracts.community_id AND user_id = auth.uid() AND role IN ('admin','tesorero'))
);

-- Contract installments
DROP POLICY IF EXISTS installments_select ON contract_installments;
CREATE POLICY installments_select ON contract_installments FOR SELECT USING (
  community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active')
);
DROP POLICY IF EXISTS installments_modify ON contract_installments;
CREATE POLICY installments_modify ON contract_installments FOR ALL USING (
  EXISTS (SELECT 1 FROM members WHERE community_id = contract_installments.community_id AND user_id = auth.uid() AND role IN ('admin','tesorero'))
);

-- Ratings: viewable by all, creatable by miembro+
DROP POLICY IF EXISTS ratings_select ON ratings;
CREATE POLICY ratings_select ON ratings FOR SELECT USING (
  community_id IN (SELECT community_id FROM members WHERE user_id = auth.uid() AND status = 'active')
);
DROP POLICY IF EXISTS ratings_insert ON ratings;
CREATE POLICY ratings_insert ON ratings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM members WHERE community_id = ratings.community_id AND user_id = auth.uid() AND role IN ('admin','tesorero','miembro'))
);
DROP POLICY IF EXISTS ratings_update ON ratings;
CREATE POLICY ratings_update ON ratings FOR UPDATE USING (
  rated_by IN (SELECT id FROM members WHERE user_id = auth.uid())
);

COMMENT ON TABLE entities IS 'Related parties: suppliers, commercial partners, contractors, landlords, government entities, etc.';
COMMENT ON TABLE recurring_schedules IS 'Templates for automated recurring collections (member dues) or payments (vendor subscriptions)';
COMMENT ON TABLE contracts IS 'Agreements between the community and an entity or member, with payment plans and compliance tracking';
COMMENT ON TABLE contract_installments IS 'Individual installments/payments for a contract, linked to payment_obligations and transactions';
COMMENT ON TABLE ratings IS 'Rating system for entities and members, with dimension-based scoring';
