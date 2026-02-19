-- ============================================================================
-- CIVITAS: Comprehensive Seed Data
-- Run with: supabase db reset (applies after all migrations)
-- All passwords: "password123"
-- ============================================================================

-- ============================================================================
-- 1. AUTH USERS (6 demo users)
-- ============================================================================

-- ============================================================================
-- 0. CLEANUP: Remove existing demo data to allow re-seeding
-- ============================================================================
DO $cleanup$
DECLARE
  v_community_id uuid;
BEGIN
  SELECT id INTO v_community_id FROM communities WHERE slug = 'las-palmas';
  IF v_community_id IS NOT NULL THEN
    DELETE FROM audit_log WHERE community_id = v_community_id;
    DELETE FROM notifications WHERE community_id = v_community_id;
    DELETE FROM comment_reactions WHERE comment_id IN (SELECT id FROM discussion_comments WHERE community_id = v_community_id);
    DELETE FROM discussion_comments WHERE community_id = v_community_id;
    DELETE FROM contract_installments WHERE community_id = v_community_id;
    DELETE FROM ratings WHERE community_id = v_community_id;
    DELETE FROM contracts WHERE community_id = v_community_id;
    DELETE FROM votes WHERE proposal_id IN (SELECT id FROM proposals WHERE community_id = v_community_id);
    DELETE FROM implementation_tasks WHERE community_id = v_community_id;
    DELETE FROM budgets WHERE community_id = v_community_id;
    DELETE FROM proposals WHERE community_id = v_community_id;
    DELETE FROM payment_plan_installments WHERE plan_id IN (SELECT id FROM payment_plans WHERE community_id = v_community_id);
    DELETE FROM payment_plans WHERE community_id = v_community_id;
    DELETE FROM payment_obligations WHERE community_id = v_community_id;
    DELETE FROM transactions WHERE community_id = v_community_id;
    DELETE FROM recurring_schedules WHERE community_id = v_community_id;
    DELETE FROM categories WHERE community_id = v_community_id;
    DELETE FROM entity_contacts WHERE entity_id IN (SELECT id FROM entities WHERE community_id = v_community_id);
    DELETE FROM entities WHERE community_id = v_community_id;
    DELETE FROM delegations WHERE community_id = v_community_id;
    DELETE FROM vigilancia_reports WHERE community_id = v_community_id;
    DELETE FROM admin_terms WHERE community_id = v_community_id;
    DELETE FROM census_snapshots WHERE community_id = v_community_id;
    DELETE FROM convocatorias WHERE community_id = v_community_id;
    DELETE FROM assemblies WHERE community_id = v_community_id;
    DELETE FROM documents WHERE community_id = v_community_id;
    DELETE FROM minutes WHERE community_id = v_community_id;
    DELETE FROM maintenance_requests WHERE unit_id IN (SELECT id FROM units WHERE community_id = v_community_id);
    DELETE FROM units WHERE community_id = v_community_id;
    DELETE FROM common_areas WHERE community_id = v_community_id;
    DELETE FROM roles WHERE community_id = v_community_id;
    DELETE FROM invitations WHERE community_id = v_community_id;
    DELETE FROM financial_statements WHERE community_id = v_community_id;
    DELETE FROM members WHERE community_id = v_community_id;
    DELETE FROM communities WHERE id = v_community_id;
  END IF;
END $cleanup$;

DELETE FROM auth.users WHERE email IN ('carlos@laspalmas.mx','maria@laspalmas.mx','roberto@laspalmas.mx','ana@laspalmas.mx','pedro@laspalmas.mx','laura@laspalmas.mx','vecino@laspalmas.mx');

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token,
  email_change_token_new, email_change, phone_change, phone_change_token,
  email_change_token_current, email_change_confirm_status,
  reauthentication_token, is_sso_user, is_anonymous
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated',
    'carlos@laspalmas.mx',
    crypt('password123', gen_salt('bf', 10)),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"a0000000-0000-0000-0000-000000000001","email":"carlos@laspalmas.mx","full_name":"Carlos Martínez","email_verified":true,"phone_verified":false}'::jsonb,
    now() - interval '6 months', now(), '', '',
    '', '', '', '', '', 0, '', false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated',
    'maria@laspalmas.mx',
    crypt('password123', gen_salt('bf', 10)),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"a0000000-0000-0000-0000-000000000002","email":"maria@laspalmas.mx","full_name":"María González","email_verified":true,"phone_verified":false}'::jsonb,
    now() - interval '6 months', now(), '', '',
    '', '', '', '', '', 0, '', false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated',
    'roberto@laspalmas.mx',
    crypt('password123', gen_salt('bf', 10)),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"a0000000-0000-0000-0000-000000000003","email":"roberto@laspalmas.mx","full_name":"Roberto López","email_verified":true,"phone_verified":false}'::jsonb,
    now() - interval '5 months', now(), '', '',
    '', '', '', '', '', 0, '', false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000004',
    'authenticated', 'authenticated',
    'ana@laspalmas.mx',
    crypt('password123', gen_salt('bf', 10)),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"a0000000-0000-0000-0000-000000000004","email":"ana@laspalmas.mx","full_name":"Ana Rodríguez","email_verified":true,"phone_verified":false}'::jsonb,
    now() - interval '5 months', now(), '', '',
    '', '', '', '', '', 0, '', false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000005',
    'authenticated', 'authenticated',
    'pedro@laspalmas.mx',
    crypt('password123', gen_salt('bf', 10)),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"a0000000-0000-0000-0000-000000000005","email":"pedro@laspalmas.mx","full_name":"Pedro Sánchez","email_verified":true,"phone_verified":false}'::jsonb,
    now() - interval '4 months', now(), '', '',
    '', '', '', '', '', 0, '', false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000006',
    'authenticated', 'authenticated',
    'laura@laspalmas.mx',
    crypt('password123', gen_salt('bf', 10)),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"a0000000-0000-0000-0000-000000000006","email":"laura@laspalmas.mx","full_name":"Laura Torres","email_verified":true,"phone_verified":false}'::jsonb,
    now() - interval '3 months', now(), '', '',
    '', '', '', '', '', 0, '', false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'a0000000-0000-0000-0000-000000000007',
    'authenticated', 'authenticated',
    'vecino@laspalmas.mx',
    crypt('password123', gen_salt('bf', 10)),
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"sub":"a0000000-0000-0000-0000-000000000007","email":"vecino@laspalmas.mx","full_name":"Diego Ramírez","email_verified":true,"phone_verified":false}'::jsonb,
    now() - interval '4 months', now(), '', '',
    '', '', '', '', '', 0, '', false, false
  )
ON CONFLICT (id) DO NOTHING;

-- Auth identities (required for Supabase GoTrue to work)
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
) VALUES
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001', '{"sub":"a0000000-0000-0000-0000-000000000001","email":"carlos@laspalmas.mx","email_verified":true,"phone_verified":false}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000001', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002', '{"sub":"a0000000-0000-0000-0000-000000000002","email":"maria@laspalmas.mx","email_verified":true,"phone_verified":false}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000002', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003', '{"sub":"a0000000-0000-0000-0000-000000000003","email":"roberto@laspalmas.mx","email_verified":true,"phone_verified":false}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000003', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004', '{"sub":"a0000000-0000-0000-0000-000000000004","email":"ana@laspalmas.mx","email_verified":true,"phone_verified":false}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000004', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005', '{"sub":"a0000000-0000-0000-0000-000000000005","email":"pedro@laspalmas.mx","email_verified":true,"phone_verified":false}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000005', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000006', '{"sub":"a0000000-0000-0000-0000-000000000006","email":"laura@laspalmas.mx","email_verified":true,"phone_verified":false}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000006', now(), now(), now()),
  (gen_random_uuid(), 'a0000000-0000-0000-0000-000000000007', '{"sub":"a0000000-0000-0000-0000-000000000007","email":"vecino@laspalmas.mx","email_verified":true,"phone_verified":false}'::jsonb, 'email', 'a0000000-0000-0000-0000-000000000007', now(), now(), now())
ON CONFLICT (provider_id, provider) DO NOTHING;

-- ============================================================================
-- 2. COMMUNITY (demo condo)
-- ============================================================================

INSERT INTO communities (id, name, slug, type, config, rules) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Residencial Las Palmas',
  'las-palmas',
  'residential',
  '{
    "address": "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX",
    "total_units": 48,
    "towers": ["A", "B"],
    "floors_per_tower": 6,
    "monthly_fee_base": 3500,
    "currency": "MXN"
  }'::jsonb,
  '{
    "governance": {
      "default_quorum": 0.5,
      "default_majority": 0.5,
      "delegation_enabled": true,
      "proposal_rights": ["admin", "tesorero", "miembro"],
      "cool_down_hours": 48,
      "auto_execution_enabled": true,
      "auto_execution_threshold": 50000,
      "mandatory_discussion_enabled": true,
      "default_discussion_hours": 72,
      "grace_period_hours": 48,
      "quorum_by_type": {"ordinary": 0.5, "extraordinary": 0.66, "budget": 0.5, "amendment": 0.66},
      "majority_by_type": {"ordinary": 0.5, "extraordinary": 0.66, "budget": 0.5, "amendment": 0.66}
    },
    "treasury": {
      "mode": "import",
      "currency": "MXN",
      "admin_spending_limit": 50000,
      "require_vote_above": 50000,
      "clabe": "",
      "bank_name": ""
    },
    "identity": {
      "payment_to_vote_enabled": true,
      "grace_period_months": 2,
      "auto_restore_on_payment": true,
      "delinquent_restrictions": ["vote", "propose"]
    }
  }'::jsonb
);

-- ============================================================================
-- 3. MEMBERS (6 members with different roles)
-- ============================================================================

INSERT INTO members (id, community_id, user_id, role, status, financial_standing, voting_weight, custom_attributes, joined_at) VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'admin', 'active', 'good_standing', 1.0000,
    '{"unit": "A-101", "phone": "+52 55 1234 5678"}'::jsonb,
    now() - interval '6 months'
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000002',
    'tesorero', 'active', 'good_standing', 1.0000,
    '{"unit": "A-201", "phone": "+52 55 2345 6789"}'::jsonb,
    now() - interval '6 months'
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'comite_vigilancia', 'active', 'good_standing', 1.0000,
    '{"unit": "A-301", "phone": "+52 55 3456 7890"}'::jsonb,
    now() - interval '5 months'
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000004',
    'miembro', 'active', 'good_standing', 1.0000,
    '{"unit": "B-102", "phone": "+52 55 4567 8901"}'::jsonb,
    now() - interval '5 months'
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000005',
    'miembro', 'active', 'delinquent', 1.0000,
    '{"unit": "B-202", "phone": "+52 55 5678 9012"}'::jsonb,
    now() - interval '4 months'
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000006',
    'observador', 'active', 'good_standing', 1.0000,
    '{"unit": "B-302", "phone": "+52 55 6789 0123"}'::jsonb,
    now() - interval '3 months'
  ),
  (
    'b0000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000007',
    'miembro', 'active', 'good_standing', 1.0000,
    '{"unit": "C-101", "phone": "+52 55 7890 1234"}'::jsonb,
    now() - interval '4 months'
  )
ON CONFLICT (community_id, user_id) DO NOTHING;

-- ============================================================================
-- 4. CATEGORIES
-- ============================================================================

INSERT INTO categories (id, community_id, name, type, is_system) VALUES
  ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Cuota de Mantenimiento', 'income', true),
  ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Cuota Extraordinaria', 'income', true),
  ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Recargos', 'income', true),
  ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Renta Áreas Comunes', 'income', true),
  ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Otros Ingresos', 'income', true),
  ('c0000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Mantenimiento General', 'expense', true),
  ('c0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Agua', 'expense', true),
  ('c0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Electricidad Áreas Comunes', 'expense', true),
  ('c0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Seguridad', 'expense', true),
  ('c0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Limpieza', 'expense', true),
  ('c0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'Jardinería', 'expense', true),
  ('c0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'Fondo de Reserva', 'expense', true),
  ('c0000000-0000-0000-0000-000000000017', '00000000-0000-0000-0000-000000000001', 'Reparaciones', 'expense', true),
  ('c0000000-0000-0000-0000-000000000018', '00000000-0000-0000-0000-000000000001', 'Seguros', 'expense', true),
  ('c0000000-0000-0000-0000-000000000019', '00000000-0000-0000-0000-000000000001', 'Administración', 'expense', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. TRANSACTIONS (6 months of financial history)
-- ============================================================================

INSERT INTO transactions (id, community_id, type, amount, category_id, description, date, created_by, verification_status) VALUES
  -- Income: monthly maintenance collections
  ('d0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'income', 168000.00, 'c0000000-0000-0000-0000-000000000001', 'Cuotas de mantenimiento - Septiembre 2025', '2025-09-05', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'income', 161000.00, 'c0000000-0000-0000-0000-000000000001', 'Cuotas de mantenimiento - Octubre 2025', '2025-10-05', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'income', 154000.00, 'c0000000-0000-0000-0000-000000000001', 'Cuotas de mantenimiento - Noviembre 2025', '2025-11-05', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'income', 168000.00, 'c0000000-0000-0000-0000-000000000001', 'Cuotas de mantenimiento - Diciembre 2025', '2025-12-05', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'income', 157500.00, 'c0000000-0000-0000-0000-000000000001', 'Cuotas de mantenimiento - Enero 2026', '2026-01-05', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'income', 150500.00, 'c0000000-0000-0000-0000-000000000001', 'Cuotas de mantenimiento - Febrero 2026', '2026-02-05', 'a0000000-0000-0000-0000-000000000002', 'reported'),

  -- Income: extraordinary
  ('d0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'income', 96000.00, 'c0000000-0000-0000-0000-000000000002', 'Cuota extraordinaria - Reparación elevador Torre A', '2025-10-15', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'income', 4500.00, 'c0000000-0000-0000-0000-000000000004', 'Renta salón de eventos - Familia Hernández', '2025-11-20', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'income', 8200.00, 'c0000000-0000-0000-0000-000000000003', 'Recargos cobrados Q4 2025', '2025-12-31', 'a0000000-0000-0000-0000-000000000002', 'verified'),

  -- Expenses
  ('d0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'expense', 45000.00, 'c0000000-0000-0000-0000-000000000013', 'Seguridad privada - Septiembre 2025', '2025-09-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'expense', 45000.00, 'c0000000-0000-0000-0000-000000000013', 'Seguridad privada - Octubre 2025', '2025-10-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'expense', 45000.00, 'c0000000-0000-0000-0000-000000000013', 'Seguridad privada - Noviembre 2025', '2025-11-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'expense', 45000.00, 'c0000000-0000-0000-0000-000000000013', 'Seguridad privada - Diciembre 2025', '2025-12-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000024', '00000000-0000-0000-0000-000000000001', 'expense', 45000.00, 'c0000000-0000-0000-0000-000000000013', 'Seguridad privada - Enero 2026', '2026-01-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000025', '00000000-0000-0000-0000-000000000001', 'expense', 45000.00, 'c0000000-0000-0000-0000-000000000013', 'Seguridad privada - Febrero 2026', '2026-02-01', 'a0000000-0000-0000-0000-000000000002', 'reported'),
  ('d0000000-0000-0000-0000-000000000026', '00000000-0000-0000-0000-000000000001', 'expense', 18500.00, 'c0000000-0000-0000-0000-000000000014', 'Limpieza áreas comunes - Septiembre', '2025-09-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000027', '00000000-0000-0000-0000-000000000001', 'expense', 18500.00, 'c0000000-0000-0000-0000-000000000014', 'Limpieza áreas comunes - Octubre', '2025-10-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000028', '00000000-0000-0000-0000-000000000001', 'expense', 18500.00, 'c0000000-0000-0000-0000-000000000014', 'Limpieza áreas comunes - Noviembre', '2025-11-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000029', '00000000-0000-0000-0000-000000000001', 'expense', 12000.00, 'c0000000-0000-0000-0000-000000000011', 'Agua - Bimestre Sep-Oct 2025', '2025-10-15', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000030', '00000000-0000-0000-0000-000000000001', 'expense', 13200.00, 'c0000000-0000-0000-0000-000000000011', 'Agua - Bimestre Nov-Dic 2025', '2025-12-15', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000001', 'expense', 8500.00, 'c0000000-0000-0000-0000-000000000012', 'Electricidad áreas comunes - Septiembre', '2025-09-20', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000001', 'expense', 9200.00, 'c0000000-0000-0000-0000-000000000012', 'Electricidad áreas comunes - Noviembre', '2025-11-20', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000001', 'expense', 15000.00, 'c0000000-0000-0000-0000-000000000015', 'Jardinería y mantenimiento áreas verdes - Q4', '2025-12-01', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000034', '00000000-0000-0000-0000-000000000001', 'expense', 87500.00, 'c0000000-0000-0000-0000-000000000017', 'Reparación elevador Torre A', '2025-11-10', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000035', '00000000-0000-0000-0000-000000000001', 'expense', 25000.00, 'c0000000-0000-0000-0000-000000000016', 'Aportación fondo de reserva - Q4 2025', '2025-12-31', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000036', '00000000-0000-0000-0000-000000000001', 'expense', 32000.00, 'c0000000-0000-0000-0000-000000000018', 'Seguro de inmueble - Póliza anual 2026', '2026-01-15', 'a0000000-0000-0000-0000-000000000002', 'verified'),
  ('d0000000-0000-0000-0000-000000000037', '00000000-0000-0000-0000-000000000001', 'expense', 22000.00, 'c0000000-0000-0000-0000-000000000019', 'Honorarios administración - Enero 2026', '2026-01-31', 'a0000000-0000-0000-0000-000000000002', 'verified')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. PAYMENT OBLIGATIONS (monthly dues for each member)
-- ============================================================================

INSERT INTO payment_obligations (id, community_id, member_id, amount, due_date, status, concept) VALUES
  -- January 2026 - all paid except Pedro
  ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3500.00, '2026-01-01', 'paid', 'Cuota mantenimiento - Enero 2026'),
  ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 3500.00, '2026-01-01', 'paid', 'Cuota mantenimiento - Enero 2026'),
  ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 3500.00, '2026-01-01', 'paid', 'Cuota mantenimiento - Enero 2026'),
  ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 3500.00, '2026-01-01', 'paid', 'Cuota mantenimiento - Enero 2026'),
  ('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2026-01-01', 'overdue', 'Cuota mantenimiento - Enero 2026'),

  -- February 2026 - mix of paid and pending
  ('e0000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3500.00, '2026-02-01', 'paid', 'Cuota mantenimiento - Febrero 2026'),
  ('e0000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 3500.00, '2026-02-01', 'paid', 'Cuota mantenimiento - Febrero 2026'),
  ('e0000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 3500.00, '2026-02-01', 'pending', 'Cuota mantenimiento - Febrero 2026'),
  ('e0000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 3500.00, '2026-02-01', 'paid', 'Cuota mantenimiento - Febrero 2026'),
  ('e0000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2026-02-01', 'overdue', 'Cuota mantenimiento - Febrero 2026'),

  -- Diego (miembro) - paid January, pending February
  ('e0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 3500.00, '2026-01-01', 'paid', 'Cuota mantenimiento - Enero 2026'),
  ('e0000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007', 3500.00, '2026-02-01', 'pending', 'Cuota mantenimiento - Febrero 2026'),

  -- Pedro has 3 months of overdue debt (Nov, Dec, Jan, Feb)
  ('e0000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2025-11-01', 'overdue', 'Cuota mantenimiento - Noviembre 2025'),
  ('e0000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2025-12-01', 'overdue', 'Cuota mantenimiento - Diciembre 2025')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. PROPOSALS (mix of statuses and types)
-- ============================================================================

INSERT INTO proposals (id, community_id, title, description, type, status, quorum_required, majority_required, voting_model, voting_start, voting_end, created_by, created_at, result, closed_at, template_id) VALUES
  (
    'f0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Reparación del elevador Torre A',
    'Se propone aprobar el gasto de $87,500 MXN para la reparación completa del elevador de la Torre A, que presenta fallas intermitentes desde julio 2025. Se cotizó con 3 proveedores: Elevadores Otis ($92,000), ThyssenKrupp ($87,500) y Schindler ($95,000). Se recomienda ThyssenKrupp por mejor relación costo-beneficio y garantía de 2 años.',
    'extraordinary', 'approved', 0.6600, 0.6600, 'simple',
    now() - interval '3 months', now() - interval '3 months' + interval '7 days',
    'a0000000-0000-0000-0000-000000000001',
    now() - interval '3 months' - interval '3 days',
    'approved',
    now() - interval '3 months' + interval '7 days',
    'gasto'
  ),
  (
    'f0000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Incremento de cuota mensual 2026',
    'Debido al aumento en costos de servicios (agua +12%, electricidad +8%, seguridad +5%), se propone incrementar la cuota de mantenimiento de $3,500 a $3,800 MXN mensuales a partir de marzo 2026. El incremento del 8.57% está por debajo de la inflación acumulada del 9.2%.',
    'budget', 'active', 0.5000, 0.5000, 'simple',
    now() - interval '3 days', now() + interval '4 days',
    'a0000000-0000-0000-0000-000000000001',
    now() - interval '7 days',
    NULL, NULL, 'cambio_regla'
  ),
  (
    'f0000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Selección de proveedor de seguridad 2026',
    'El contrato actual con Seguridad Integral vence en abril 2026. Se presentan 3 opciones para votación múltiple.',
    'ordinary', 'active', 0.5000, 0.5000, 'multiple_choice',
    now() - interval '2 days', now() + interval '5 days',
    'a0000000-0000-0000-0000-000000000002',
    now() - interval '5 days',
    NULL, NULL, NULL
  ),
  (
    'f0000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Instalación de cámaras en estacionamiento',
    'Se propone instalar 8 cámaras de seguridad CCTV en el estacionamiento subterráneo. Presupuesto estimado: $45,000 MXN. Incluye grabación 24/7 y acceso remoto.',
    'ordinary', 'discussion', 0.5000, 0.5000, 'consensus',
    NULL, NULL,
    'a0000000-0000-0000-0000-000000000004',
    now() - interval '1 day',
    NULL, NULL, 'gasto'
  ),
  (
    'f0000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Aprobación de presupuesto Q1 2026',
    'Presentación y aprobación del presupuesto para el primer trimestre de 2026. Total: $450,000 MXN distribuidos en las categorías principales.',
    'budget', 'executed', 0.5000, 0.5000, 'simple',
    now() - interval '2 months', now() - interval '2 months' + interval '5 days',
    'a0000000-0000-0000-0000-000000000001',
    now() - interval '2 months' - interval '5 days',
    'approved',
    now() - interval '2 months' + interval '5 days',
    NULL
  ),
  (
    'f0000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Normas de uso de áreas comunes',
    'Propuesta de reglamento actualizado para el uso de áreas comunes, incluyendo horarios, reservaciones y sanciones.',
    'amendment', 'rejected', 0.6600, 0.6600, 'simple',
    now() - interval '1 month', now() - interval '1 month' + interval '7 days',
    'a0000000-0000-0000-0000-000000000003',
    now() - interval '1 month' - interval '3 days',
    'rejected',
    now() - interval '1 month' + interval '7 days',
    'cambio_regla'
  )
ON CONFLICT DO NOTHING;

-- Add voting options for multiple choice proposal
UPDATE proposals SET voting_options = '[
  {"id": "option_1", "label": "Seguridad Integral (renovar contrato actual) - $45,000/mes"},
  {"id": "option_2", "label": "ProSeguridad CDMX (nueva propuesta) - $42,000/mes"},
  {"id": "option_3", "label": "Grupo CUSAEM (nueva propuesta) - $48,000/mes con equipo táctico"}
]'::jsonb
WHERE id = 'f0000000-0000-0000-0000-000000000003';

-- Add discussion period for the discussion-phase proposal
UPDATE proposals SET
  discussion_start = now() - interval '1 day',
  discussion_end = now() + interval '2 days',
  discussion_min_hours = 72
WHERE id = 'f0000000-0000-0000-0000-000000000004';

-- Add execution status for executed proposal
UPDATE proposals SET
  execution_status = 'executed',
  executed_at = now() - interval '2 months' + interval '7 days',
  financial_instruction = '{"type": "budget_allocation", "categories": [{"name": "Seguridad", "amount": 135000}, {"name": "Limpieza", "amount": 55500}, {"name": "Agua", "amount": 36000}, {"name": "Electricidad", "amount": 27000}, {"name": "Mantenimiento", "amount": 75000}, {"name": "Reserva", "amount": 25000}, {"name": "Administración", "amount": 66000}, {"name": "Otros", "amount": 30500}]}'::jsonb
WHERE id = 'f0000000-0000-0000-0000-000000000005';

-- ============================================================================
-- 8. VOTES
-- ============================================================================

INSERT INTO votes (id, proposal_id, member_id, value, weight, cast_at) VALUES
  -- Votes for elevator repair (approved 4-1)
  ('11000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'yes', 1.0000, now() - interval '3 months' + interval '1 day'),
  ('11000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'yes', 1.0000, now() - interval '3 months' + interval '2 days'),
  ('11000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'yes', 1.0000, now() - interval '3 months' + interval '2 days'),
  ('11000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'yes', 1.0000, now() - interval '3 months' + interval '3 days'),
  ('11000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'no', 1.0000, now() - interval '3 months' + interval '5 days'),

  -- Votes for fee increase (in progress: 2 yes, 1 no so far)
  ('11000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'yes', 1.0000, now() - interval '2 days'),
  ('11000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'yes', 1.0000, now() - interval '1 day'),
  ('11000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'no', 1.0000, now() - interval '1 day'),

  -- Votes for security provider (multiple choice)
  ('11000000-0000-0000-0000-000000000020', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'option_2', 1.0000, now() - interval '1 day'),
  ('11000000-0000-0000-0000-000000000021', 'f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'option_1', 1.0000, now() - interval '1 day'),

  -- Votes for Q1 budget (approved 5-0)
  ('11000000-0000-0000-0000-000000000030', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'yes', 1.0000, now() - interval '2 months' + interval '1 day'),
  ('11000000-0000-0000-0000-000000000031', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'yes', 1.0000, now() - interval '2 months' + interval '2 days'),
  ('11000000-0000-0000-0000-000000000032', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'yes', 1.0000, now() - interval '2 months' + interval '2 days'),
  ('11000000-0000-0000-0000-000000000033', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'yes', 1.0000, now() - interval '2 months' + interval '3 days'),
  ('11000000-0000-0000-0000-000000000034', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'yes', 1.0000, now() - interval '2 months' + interval '4 days'),

  -- Votes for rules update (rejected 2-3)
  ('11000000-0000-0000-0000-000000000040', 'f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 'yes', 1.0000, now() - interval '1 month' + interval '1 day'),
  ('11000000-0000-0000-0000-000000000041', 'f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'yes', 1.0000, now() - interval '1 month' + interval '2 days'),
  ('11000000-0000-0000-0000-000000000042', 'f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'no', 1.0000, now() - interval '1 month' + interval '3 days'),
  ('11000000-0000-0000-0000-000000000043', 'f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000002', 'no', 1.0000, now() - interval '1 month' + interval '3 days'),
  ('11000000-0000-0000-0000-000000000044', 'f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', 'no', 1.0000, now() - interval '1 month' + interval '5 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. DISCUSSION COMMENTS
-- ============================================================================

INSERT INTO discussion_comments (id, community_id, proposal_id, parent_comment_id, author_id, content, sentiment, created_at) VALUES
  -- Comments on fee increase
  ('12000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', NULL, 'b0000000-0000-0000-0000-000000000001', 'El incremento es necesario para mantener la calidad de servicios. Los costos de proveedores han subido considerablemente este año.', 'pro', now() - interval '5 days'),
  ('12000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', NULL, 'b0000000-0000-0000-0000-000000000005', 'El incremento es excesivo. Muchos vecinos ya tenemos dificultades para pagar la cuota actual. Propongo un aumento escalonado.', 'con', now() - interval '4 days'),
  ('12000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Entiendo la preocupación, Pedro. Un aumento escalonado podría funcionar: $3,650 en marzo y $3,800 en junio. ¿Qué opinan?', 'neutral', now() - interval '4 days'),
  ('12000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'Me parece razonable el escalonamiento. Así el impacto es más gradual.', 'pro', now() - interval '3 days'),

  -- Comments on cameras (discussion phase)
  ('12000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', NULL, 'b0000000-0000-0000-0000-000000000004', '¿Se ha considerado la privacidad de los residentes? Las cámaras deben enfocarse solo en áreas comunes del estacionamiento.', 'question', now() - interval '18 hours'),
  ('12000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', '12000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'Sí, las cámaras solo cubrirán pasillos de circulación y accesos, no los cajones individuales. Cumplimos con la LFPDPPP.', 'pro', now() - interval '12 hours'),
  ('12000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', NULL, 'b0000000-0000-0000-0000-000000000003', 'Como comité de vigilancia, apoyo esta iniciativa. Han habido 3 incidentes de daño a vehículos en los últimos 6 meses sin poder identificar responsables.', 'pro', now() - interval '6 hours')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. COMMENT REACTIONS
-- ============================================================================

INSERT INTO comment_reactions (comment_id, member_id, reaction) VALUES
  ('12000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'agree'),
  ('12000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'agree'),
  ('12000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', 'helpful'),
  ('12000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'helpful'),
  ('12000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', 'agree'),
  ('12000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', 'agree'),
  ('12000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000004', 'agree')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. ENTITIES (providers)
-- ============================================================================

INSERT INTO entities (id, community_id, name, type, rfc, email, phone, contact_person, status, created_by) VALUES
  (
    '13000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Seguridad Integral CDMX S.A. de C.V.',
    'proveedor', 'SIC201015ABC', 'contacto@seguridadintegral.mx', '+52 55 5555 1234',
    'Lic. Ramón Fuentes', 'active',
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '13000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Limpieza Profesional del Valle S.A.',
    'proveedor', 'LPV180623XYZ', 'info@limpiezadelvalle.mx', '+52 55 5555 2345',
    'Sra. Patricia Reyes', 'active',
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '13000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'ThyssenKrupp Elevadores México',
    'contratista', 'TKE150812DEF', 'servicio@thyssenkrupp.mx', '+52 55 5555 3456',
    'Ing. Fernando Vega', 'active',
    'a0000000-0000-0000-0000-000000000002'
  ),
  (
    '13000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Jardines y Paisajismo Verde CDMX',
    'proveedor', 'JPV190305GHI', 'ventas@jardinesverde.mx', '+52 55 5555 4567',
    'José Luis Moreno', 'active',
    'a0000000-0000-0000-0000-000000000002'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. CONTRACTS
-- ============================================================================

INSERT INTO contracts (id, community_id, name, description, type, entity_id, total_amount, start_date, end_date, status, created_by) VALUES
  (
    '14000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Contrato de seguridad 2025-2026',
    'Servicio de vigilancia 24/7 con 3 elementos por turno',
    'servicio',
    '13000000-0000-0000-0000-000000000001',
    540000.00,
    '2025-05-01', '2026-04-30',
    'active',
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '14000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Contrato de limpieza 2025-2026',
    'Limpieza diaria de áreas comunes, pasillos y lobby',
    'servicio',
    '13000000-0000-0000-0000-000000000002',
    222000.00,
    '2025-01-01', '2025-12-31',
    'completed',
    'a0000000-0000-0000-0000-000000000001'
  ),
  (
    '14000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Reparación elevador Torre A',
    'Reparación integral del sistema de tracción y tablero de control',
    'obra',
    '13000000-0000-0000-0000-000000000003',
    87500.00,
    '2025-11-15', '2025-12-15',
    'completed',
    'a0000000-0000-0000-0000-000000000002'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. RATINGS
-- ============================================================================

INSERT INTO ratings (community_id, target_type, target_id, rated_by, overall_score, dimensions, comment) VALUES
  ('00000000-0000-0000-0000-000000000001', 'entity', '13000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 4, '{"punctuality": 4, "quality": 4, "communication": 3, "compliance": 5, "value": 4}'::jsonb, 'Buen servicio, aunque la comunicación con el coordinador de turno podría mejorar.'),
  ('00000000-0000-0000-0000-000000000001', 'entity', '13000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 5, '{"punctuality": 5, "quality": 5, "communication": 5, "compliance": 5, "value": 4}'::jsonb, 'Excelente trabajo en la reparación del elevador. Terminaron antes de tiempo.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 14. ASSEMBLIES
-- ============================================================================

INSERT INTO assemblies (id, community_id, type, title, scheduled_date, location, called_by, agenda, status, quorum_met, quorum_pct) VALUES
  (
    '15000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'ordinary',
    'Asamblea Ordinaria Anual 2025',
    '2025-12-15 10:00:00-06',
    'Salón de Eventos, Planta Baja',
    'b0000000-0000-0000-0000-000000000001',
    '[
      {"order": 1, "title": "Lista de asistencia y verificación de quórum"},
      {"order": 2, "title": "Lectura y aprobación del acta anterior"},
      {"order": 3, "title": "Informe financiero Q3-Q4 2025"},
      {"order": 4, "title": "Aprobación presupuesto Q1 2026"},
      {"order": 5, "title": "Elección de comité de vigilancia"},
      {"order": 6, "title": "Asuntos generales"}
    ]'::jsonb,
    'completed', true, 58.3300
  ),
  (
    '15000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'extraordinary',
    'Asamblea Extraordinaria - Seguridad 2026',
    '2026-03-15 18:00:00-06',
    'Salón de Eventos, Planta Baja',
    'b0000000-0000-0000-0000-000000000001',
    '[
      {"order": 1, "title": "Lista de asistencia y verificación de quórum"},
      {"order": 2, "title": "Evaluación de proveedores de seguridad"},
      {"order": 3, "title": "Votación para selección de proveedor"},
      {"order": 4, "title": "Aprobación de instalación de cámaras CCTV"}
    ]'::jsonb,
    'scheduled', false, NULL
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 15. NOTIFICATIONS
-- ============================================================================

INSERT INTO notifications (community_id, member_id, type, title, body, read, created_at) VALUES
  -- For Carlos (admin)
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'proposal_opened', 'Nueva propuesta: Instalación de cámaras', 'Ana Rodríguez ha creado una nueva propuesta para instalar cámaras de seguridad en el estacionamiento.', false, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'payment_overdue', 'Pago vencido: Pedro Sánchez', 'Pedro Sánchez tiene 4 cuotas vencidas por un total de $14,000 MXN.', true, now() - interval '5 days'),

  -- For María (tesorera)
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'proposal_opened', 'Nueva propuesta: Instalación de cámaras', 'Ana Rodríguez ha creado una nueva propuesta para instalar cámaras de seguridad en el estacionamiento.', false, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'obligation_created', 'Cuotas de febrero generadas', 'Se han generado las cuotas de mantenimiento de febrero 2026 para todos los miembros activos.', true, now() - interval '18 days'),

  -- For Ana (member)
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'proposal_closing_soon', 'Votación por cerrar: Incremento de cuota', 'La votación sobre el incremento de cuota mensual cierra en 4 días. ¡No olvides votar!', false, now() - interval '6 hours'),

  -- For Pedro (delinquent)
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'payment_overdue', 'Tienes cuotas vencidas', 'Tienes 4 cuotas vencidas por un total de $14,000 MXN. Tu standing financiero ha cambiado a "moroso". Contacta al tesorero para opciones de plan de pago.', false, now() - interval '3 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 16. IMPLEMENTATION TASKS (from approved proposals)
-- ============================================================================

INSERT INTO implementation_tasks (community_id, proposal_id, title, description, responsible_member_id, status, progress_pct, due_date, completed_at) VALUES
  -- Tasks for elevator repair (completed)
  ('00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Firmar contrato con ThyssenKrupp', '', 'b0000000-0000-0000-0000-000000000001', 'completed', 100, '2025-11-15', now() - interval '3 months' + interval '10 days'),
  ('00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Supervisar inicio de obra', '', 'b0000000-0000-0000-0000-000000000003', 'completed', 100, '2025-11-20', now() - interval '2 months' - interval '15 days'),
  ('00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Recepción y verificación de reparación', '', 'b0000000-0000-0000-0000-000000000003', 'completed', 100, '2025-12-15', now() - interval '2 months'),
  ('00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Liberar pago final a ThyssenKrupp', '', 'b0000000-0000-0000-0000-000000000002', 'completed', 100, '2025-12-20', now() - interval '2 months' + interval '5 days'),

  -- Tasks for Q1 budget (in progress)
  ('00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'Distribuir presupuesto por categoría', '', 'b0000000-0000-0000-0000-000000000002', 'completed', 100, '2026-01-10', now() - interval '1 month' - interval '10 days'),
  ('00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'Revisar y renovar contratos de proveedores', '', 'b0000000-0000-0000-0000-000000000001', 'in_progress', 60, '2026-03-15', NULL),
  ('00000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005', 'Informe trimestral de ejecución presupuestal', '', 'b0000000-0000-0000-0000-000000000002', 'pending', 0, '2026-03-31', NULL)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 17. DELEGATIONS
-- ============================================================================

INSERT INTO delegations (community_id, from_member_id, to_member_id, scope, active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000004', 'all', true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 18. VIGILANCIA REPORTS
-- ============================================================================

INSERT INTO vigilancia_reports (community_id, author_id, period, report_type, title, content, findings, recommendations, status, submitted_at) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000003',
    '2025-Q4',
    'quarterly',
    'Informe de Vigilancia Q4 2025',
    'Se realizó la revisión trimestral de las operaciones financieras y administrativas de la comunidad correspondiente al período octubre-diciembre 2025.',
    '[
      {"type": "observation", "description": "Los gastos de mantenimiento se mantienen dentro del presupuesto aprobado."},
      {"type": "concern", "description": "La morosidad incrementó de 4% a 8% en el trimestre."},
      {"type": "positive", "description": "La reparación del elevador se completó en tiempo y forma, dentro del presupuesto."}
    ]'::jsonb,
    '[
      {"priority": "high", "description": "Implementar plan de cobro más agresivo para morosos con más de 2 meses de atraso."},
      {"priority": "medium", "description": "Solicitar cotizaciones para renovación de contrato de limpieza en enero 2026."}
    ]'::jsonb,
    'submitted',
    now() - interval '1 month' - interval '15 days'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 19. ADMIN TERMS
-- ============================================================================

INSERT INTO admin_terms (community_id, member_id, role, term_start, term_end, term_number, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'admin', now() - interval '1 year', now() + interval '1 year', 1, 'active'),
  ('00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'comite_vigilancia', now() - interval '1 year', now() + interval '1 year', 1, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 20. DOCUMENTS
-- ============================================================================

INSERT INTO documents (community_id, title, file_url, category, uploaded_by, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Acta Constitutiva', 'https://storage.civitas.app/docs/acta-constitutiva.pdf', 'legal', 'a0000000-0000-0000-0000-000000000001', now() - interval '6 months'),
  ('00000000-0000-0000-0000-000000000001', 'Reglamento Interno 2025', 'https://storage.civitas.app/docs/reglamento-2025.pdf', 'legal', 'a0000000-0000-0000-0000-000000000001', now() - interval '6 months'),
  ('00000000-0000-0000-0000-000000000001', 'Estado Financiero Q4 2025', 'https://storage.civitas.app/docs/estado-financiero-q4-2025.pdf', 'financial', 'a0000000-0000-0000-0000-000000000002', now() - interval '1 month'),
  ('00000000-0000-0000-0000-000000000001', 'Acta Asamblea Ordinaria Dic 2025', 'https://storage.civitas.app/docs/acta-asamblea-dic-2025.pdf', 'minutes', 'a0000000-0000-0000-0000-000000000001', now() - interval '2 months'),
  ('00000000-0000-0000-0000-000000000001', 'Póliza de Seguro 2026', 'https://storage.civitas.app/docs/poliza-seguro-2026.pdf', 'general', 'a0000000-0000-0000-0000-000000000002', now() - interval '1 month')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 21. BUDGETS
-- ============================================================================

INSERT INTO budgets (community_id, category_id, period, amount, approved_by_proposal_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000013', '2026-Q1', 135000.00, 'f0000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000014', '2026-Q1', 55500.00, 'f0000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000011', '2026-Q1', 36000.00, 'f0000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000012', '2026-Q1', 27000.00, 'f0000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000010', '2026-Q1', 75000.00, 'f0000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000016', '2026-Q1', 25000.00, 'f0000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000019', '2026-Q1', 66000.00, 'f0000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 22. CENSUS SNAPSHOTS (historical data for charts)
-- ============================================================================

INSERT INTO census_snapshots (community_id, total_members, active_members, members_good_standing, members_delinquent, total_income, total_expenses, active_proposals, snapshot_date) VALUES
  ('00000000-0000-0000-0000-000000000001', 6, 6, 6, 0, 168000, 82000, 0, '2025-09-30'),
  ('00000000-0000-0000-0000-000000000001', 6, 6, 6, 0, 429200, 175900, 2, '2025-10-31'),
  ('00000000-0000-0000-0000-000000000001', 6, 6, 5, 1, 591700, 290600, 1, '2025-11-30'),
  ('00000000-0000-0000-0000-000000000001', 6, 6, 5, 1, 867900, 400300, 1, '2025-12-31'),
  ('00000000-0000-0000-0000-000000000001', 6, 6, 5, 1, 1025400, 502300, 0, '2026-01-31'),
  ('00000000-0000-0000-0000-000000000001', 6, 6, 5, 1, 1175900, 547300, 3, '2026-02-15')
ON CONFLICT (community_id, snapshot_date) DO NOTHING;

-- ============================================================================
-- 23. AUDIT LOG (sample entries)
-- ============================================================================

INSERT INTO audit_log (community_id, user_id, action, entity_type, entity_id, details, created_at) VALUES
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'create', 'proposal', 'f0000000-0000-0000-0000-000000000001', '{"title":"Reparación del elevador Torre A"}'::jsonb, now() - interval '3 months' - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'update', 'proposal', 'f0000000-0000-0000-0000-000000000001', '{"status":"approved","previous_status":"active"}'::jsonb, now() - interval '3 months' + interval '7 days'),
  ('00000000-0000-0000-0000-000000000001', NULL, 'auto_execute', 'proposal', 'f0000000-0000-0000-0000-000000000005', '{"financial_instruction":"budget_allocation","executed_at":"auto"}'::jsonb, now() - interval '2 months' + interval '7 days'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'create', 'transaction', 'd0000000-0000-0000-0000-000000000036', '{"amount":32000,"description":"Seguro de inmueble"}'::jsonb, now() - interval '1 month'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'verify', 'transaction', 'd0000000-0000-0000-0000-000000000005', '{"status":"verified"}'::jsonb, now() - interval '2 weeks'),
  ('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004', 'create', 'proposal', 'f0000000-0000-0000-0000-000000000004', '{"title":"Instalación de cámaras en estacionamiento"}'::jsonb, now() - interval '1 day')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 24. RECURRING SCHEDULE (monthly dues)
-- ============================================================================

INSERT INTO recurring_schedules (id, community_id, name, description, type, frequency, amount, category_id, target_type, day_of_month, start_date, next_run_date, is_active, created_by) VALUES
  (
    '16000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Cuota de mantenimiento mensual',
    'Generación automática de cuotas de mantenimiento para todos los miembros activos',
    'collection', 'monthly', 3500.00,
    'c0000000-0000-0000-0000-000000000001',
    'all_members', 1, '2025-09-01', '2026-03-01', true,
    'a0000000-0000-0000-0000-000000000002'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 25. COMMON AREAS (for residential vertical)
-- ============================================================================

INSERT INTO common_areas (id, community_id, name, rules, reservation_enabled) VALUES
  ('17000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Salón de Eventos', 'Reservar con 48 horas de anticipación. Capacidad máxima: 50 personas. Depósito de $2,000 MXN.', true),
  ('17000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Gimnasio', 'Horario: 6:00 AM - 10:00 PM. Uso exclusivo para residentes.', false),
  ('17000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Alberca', 'Horario: 8:00 AM - 8:00 PM. Niños menores de 12 años con acompañante adulto.', false),
  ('17000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Jardín Central', 'No se permiten mascotas sin correa. No hacer ruido después de las 10 PM.', false),
  ('17000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Estacionamiento Visitas', 'Máximo 24 horas. Registrar en caseta de vigilancia.', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 26. UNITS (residential units)
-- ============================================================================

INSERT INTO units (id, community_id, member_id, unit_number, floor, tower, indiviso_pct, area_m2) VALUES
  ('18000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'A-101', 1, 'A', 2.0833, 85.00),
  ('18000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'A-201', 2, 'A', 2.0833, 85.00),
  ('18000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'A-301', 3, 'A', 2.0833, 85.00),
  ('18000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'B-102', 1, 'B', 2.0833, 90.00),
  ('18000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'B-202', 2, 'B', 2.0833, 90.00),
  ('18000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'B-302', 3, 'B', 2.0833, 90.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 27. CONVOCATORIAS (assembly notices)
-- ============================================================================

INSERT INTO convocatorias (id, community_id, assembly_id, call_number, type, scheduled_date, location, agenda, called_by, minimum_notice_days, delivery_method) VALUES
  (
    '19000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '15000000-0000-0000-0000-000000000001',
    1, 'ordinary',
    '2025-12-15 10:00:00-06',
    'Salon de Eventos, Planta Baja',
    '[{"order":1,"title":"Lista de asistencia"},{"order":2,"title":"Informe financiero"},{"order":3,"title":"Presupuesto 2026"}]'::jsonb,
    'b0000000-0000-0000-0000-000000000001',
    7, 'in_app'
  ),
  (
    '19000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '15000000-0000-0000-0000-000000000002',
    1, 'extraordinary',
    '2026-02-20 18:00:00-06',
    'Salon de Eventos, Planta Baja',
    '[{"order":1,"title":"Seleccion proveedor seguridad"},{"order":2,"title":"Aprobacion contrato"}]'::jsonb,
    'b0000000-0000-0000-0000-000000000001',
    7, 'in_app'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 28. CONTRACT INSTALLMENTS
-- ============================================================================

INSERT INTO contract_installments (id, contract_id, community_id, installment_number, amount, due_date, status) VALUES
  ('1a000000-0000-0000-0000-000000000001', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 45000.00, '2025-06-01', 'paid'),
  ('1a000000-0000-0000-0000-000000000002', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 2, 45000.00, '2025-07-01', 'paid'),
  ('1a000000-0000-0000-0000-000000000003', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 3, 45000.00, '2025-08-01', 'paid'),
  ('1a000000-0000-0000-0000-000000000004', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 4, 45000.00, '2025-09-01', 'paid'),
  ('1a000000-0000-0000-0000-000000000005', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 5, 45000.00, '2025-10-01', 'paid'),
  ('1a000000-0000-0000-0000-000000000006', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 6, 45000.00, '2025-11-01', 'paid'),
  ('1a000000-0000-0000-0000-000000000007', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 7, 45000.00, '2025-12-01', 'paid'),
  ('1a000000-0000-0000-0000-000000000008', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 8, 45000.00, '2026-01-01', 'pending'),
  ('1a000000-0000-0000-0000-000000000009', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 9, 45000.00, '2026-02-01', 'pending'),
  ('1a000000-0000-0000-0000-000000000010', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 10, 45000.00, '2026-03-01', 'pending'),
  ('1a000000-0000-0000-0000-000000000011', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 11, 45000.00, '2026-04-01', 'pending'),
  ('1a000000-0000-0000-0000-000000000012', '14000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 12, 45000.00, '2026-04-30', 'pending')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 29. MOROSO NOTICES (for delinquent member Pedro)
-- ============================================================================

INSERT INTO moroso_notices (id, community_id, member_id, notice_type, outstanding_amount, outstanding_obligations, status, deadline) VALUES
  (
    '1b000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000005',
    'warning', 7000.00,
    '[{"concept":"Cuota Oct 2025","amount":3500},{"concept":"Cuota Nov 2025","amount":3500}]'::jsonb,
    'pending',
    (now() + interval '30 days')::timestamptz
  ),
  (
    '1b000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000005',
    'pre_assembly', 7000.00,
    '[{"concept":"Cuota Oct 2025","amount":3500},{"concept":"Cuota Nov 2025","amount":3500}]'::jsonb,
    'acknowledged',
    null
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 30. RULE VERSIONS (governance rules history)
-- ============================================================================

INSERT INTO rule_versions (id, community_id, version_number, rules, changed_by, change_reason) VALUES
  (
    '1c000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    1,
    '{"governance":{"default_quorum":0.5,"default_majority":0.5,"delegation_enabled":true}}'::jsonb,
    'a0000000-0000-0000-0000-000000000001',
    'Reglamento inicial aprobado en asamblea constitutiva'
  ),
  (
    '1c000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    2,
    '{"governance":{"default_quorum":0.5,"default_majority":0.5,"delegation_enabled":true,"auto_execution_enabled":true,"auto_execution_threshold":50000}}'::jsonb,
    'a0000000-0000-0000-0000-000000000001',
    'Habilitacion de ejecucion automatica de propuestas menores a $50,000'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 31. PAYMENT PLANS (for delinquent member Pedro)
-- ============================================================================

INSERT INTO payment_plans (id, community_id, member_id, total_debt, number_of_installments, installment_amount, frequency, start_date, status, proposed_by, notes) VALUES
  (
    '1d000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000005',
    7000.00, 3, 2333.33, 'monthly',
    '2026-03-01', 'proposed',
    'b0000000-0000-0000-0000-000000000002',
    'Plan de pago propuesto para regularizar adeudo de cuotas Oct-Nov 2025'
  )
ON CONFLICT DO NOTHING;

INSERT INTO payment_plan_installments (id, plan_id, installment_number, amount, due_date, status) VALUES
  ('1e000000-0000-0000-0000-000000000001', '1d000000-0000-0000-0000-000000000001', 1, 2333.33, '2026-03-01', 'pending'),
  ('1e000000-0000-0000-0000-000000000002', '1d000000-0000-0000-0000-000000000001', 2, 2333.33, '2026-04-01', 'pending'),
  ('1e000000-0000-0000-0000-000000000003', '1d000000-0000-0000-0000-000000000001', 3, 2333.34, '2026-05-01', 'pending')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 32. GAMIFICATION (XP, levels, badges, streaks for each member)
-- ============================================================================

INSERT INTO member_gamification (id, community_id, member_id, xp, level, current_streak, max_streak, last_activity_date, badges) VALUES
  -- Carlos (admin) - Level 5, very active
  ('1f000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   1850, 5, 12, 30, CURRENT_DATE,
   '[{"id":"first_vote","earnedAt":"2025-09-01"},{"id":"first_proposal","earnedAt":"2025-09-05"},{"id":"pagador_puntual","earnedAt":"2025-10-01"},{"id":"streak_7","earnedAt":"2025-11-15"},{"id":"streak_30","earnedAt":"2025-12-15"},{"id":"voter_10","earnedAt":"2026-01-10"},{"id":"proposer_5","earnedAt":"2026-01-20"},{"id":"comentarista","earnedAt":"2025-10-10"}]'::jsonb),
  -- María (tesorero) - Level 4
  ('1f000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002',
   1200, 4, 8, 20, CURRENT_DATE - interval '1 day',
   '[{"id":"first_vote","earnedAt":"2025-09-02"},{"id":"pagador_puntual","earnedAt":"2025-10-01"},{"id":"streak_7","earnedAt":"2025-11-20"},{"id":"voter_10","earnedAt":"2026-01-15"},{"id":"comentarista","earnedAt":"2025-11-01"}]'::jsonb),
  -- Roberto (comité vigilancia) - Level 3
  ('1f000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003',
   700, 3, 3, 10, CURRENT_DATE - interval '2 days',
   '[{"id":"first_vote","earnedAt":"2025-10-01"},{"id":"pagador_puntual","earnedAt":"2025-11-01"},{"id":"comentarista","earnedAt":"2025-12-05"}]'::jsonb),
  -- Ana (miembro activa) - Level 3
  ('1f000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004',
   650, 3, 5, 14, CURRENT_DATE - interval '1 day',
   '[{"id":"first_vote","earnedAt":"2025-10-15"},{"id":"pagador_puntual","earnedAt":"2025-11-01"},{"id":"first_proposal","earnedAt":"2025-12-01"},{"id":"streak_7","earnedAt":"2026-01-05"}]'::jsonb),
  -- Pedro (miembro moroso) - Level 1, inactive
  ('1f000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005',
   80, 1, 0, 2, CURRENT_DATE - interval '30 days',
   '[{"id":"first_vote","earnedAt":"2025-11-01"}]'::jsonb),
  -- Laura (observador) - Level 2
  ('1f000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006',
   250, 2, 2, 5, CURRENT_DATE - interval '3 days',
   '[{"id":"first_vote","earnedAt":"2025-12-01"},{"id":"comentarista","earnedAt":"2026-01-10"}]'::jsonb),
  -- Diego (miembro regular) - Level 2, moderately active
  ('1f000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000007',
   320, 2, 4, 7, CURRENT_DATE,
   '[{"id":"first_vote","earnedAt":"2025-11-15"},{"id":"pagador_puntual","earnedAt":"2025-12-01"},{"id":"comentarista","earnedAt":"2026-01-20"}]'::jsonb)
ON CONFLICT DO NOTHING;
