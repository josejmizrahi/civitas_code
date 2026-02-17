-- ============================================================
-- CIVITAS: Seed Data Completo
-- Datos realistas para demo de toda la plataforma
-- ============================================================
-- NOTA: Ejecutar en el SQL Editor de Supabase (tiene permisos de superuser)
-- ============================================================

-- ==================== LIMPIEZA PREVIA ====================
-- Eliminar datos existentes en orden de dependencias
DELETE FROM ratings;
DELETE FROM contract_installments;
DELETE FROM contracts;
DELETE FROM recurring_schedules;
DELETE FROM entity_contacts;
DELETE FROM entities;
DELETE FROM census_snapshots;
DELETE FROM audit_log;
DELETE FROM payment_obligations;
DELETE FROM budgets;
DELETE FROM minutes;
DELETE FROM votes;
DELETE FROM delegations;
DELETE FROM documents;
DELETE FROM invitations;
DELETE FROM proposals;
DELETE FROM transactions;
DELETE FROM categories;
DELETE FROM members;
DELETE FROM communities;

-- ==================== AUTH USERS ====================
-- Los usuarios ya fueron creados via la API de signup.
-- IDs reales:
-- admin@civitas.demo      -> 01f81e79-7774-4ee2-83c6-bd1778c542b4
-- tesorero@civitas.demo   -> 957a636c-b0ce-4574-92cf-2e356804e73b
-- miembro1@civitas.demo   -> 9326f0f3-cfeb-48e2-b71d-8442feaad5b5
-- miembro2@civitas.demo   -> 7fb17927-1235-409a-9ad7-117c6900f469
-- miembro3@civitas.demo   -> 0b26268c-20a5-4b7f-8983-44ef541e698f
-- observador@civitas.demo -> d69dcd68-8baa-4af4-8c2f-74e7453753a2
-- admin2@civitas.demo     -> 9ed9c917-402f-4b34-98e2-31ba2d769bf3
-- Password: Test1234! para todos

-- ==================== COMMUNITIES ====================
INSERT INTO communities (id, name, slug, type, config, rules) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Residencial Las Palmas', 'las-palmas', 'residential',
   '{"address": "Av. Insurgentes Sur 1234, Col. Del Valle, CDMX", "total_units": 48, "towers": ["A", "B"], "floors_per_tower": 6, "monthly_fee_base": 3500, "currency": "MXN"}'::jsonb,
   '{"governance": {"default_quorum": 0.5, "default_majority": 0.5, "delegation_enabled": true, "proposal_rights": ["admin","tesorero","miembro"], "cool_down_hours": 48, "auto_execution_enabled": false}, "treasury": {"mode": "import", "currency": "MXN", "admin_spending_limit": 50000, "require_vote_above": 50000, "clabe": null, "bank_name": null, "beneficiary_name": null, "payment_reference_prefix": "RLP-", "auto_reconciliation": false, "collection_reminder_days": 5}, "identity": {"payment_to_vote_enabled": true, "grace_period_months": 2, "auto_restore_on_payment": true, "delinquent_restrictions": ["vote","propose"]}}'::jsonb),

  ('c0000000-0000-0000-0000-000000000002', 'Cooperativa Solar del Valle', 'solar-del-valle', 'cooperative',
   '{"address": "Calle 5 de Mayo 456, Oaxaca de Juárez", "total_members": 25, "sector": "energia_solar", "currency": "MXN"}'::jsonb,
   '{"governance": {"default_quorum": 0.6, "default_majority": 0.5, "delegation_enabled": false, "proposal_rights": ["admin","miembro"], "cool_down_hours": 72, "auto_execution_enabled": false}, "treasury": {"mode": "import", "currency": "MXN", "admin_spending_limit": 100000, "require_vote_above": 100000, "clabe": null, "bank_name": null, "beneficiary_name": null, "payment_reference_prefix": "CSV-", "auto_reconciliation": false, "collection_reminder_days": 7}, "identity": {"payment_to_vote_enabled": false, "grace_period_months": 3, "auto_restore_on_payment": true, "delinquent_restrictions": ["vote"]}}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ==================== MEMBERS ====================
-- Community 1: Las Palmas
INSERT INTO members (id, community_id, user_id, role, status, voting_weight, financial_standing, custom_attributes) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '01f81e79-7774-4ee2-83c6-bd1778c542b4', 'admin', 'active', 1.0, 'good_standing',
   '{"unit": "A-601", "tower": "A", "floor": 6}'::jsonb),
  ('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '957a636c-b0ce-4574-92cf-2e356804e73b', 'tesorero', 'active', 1.0, 'good_standing',
   '{"unit": "A-501", "tower": "A", "floor": 5}'::jsonb),
  ('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', '9326f0f3-cfeb-48e2-b71d-8442feaad5b5', 'miembro', 'active', 1.0, 'good_standing',
   '{"unit": "A-401", "tower": "A", "floor": 4}'::jsonb),
  ('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', '7fb17927-1235-409a-9ad7-117c6900f469', 'miembro', 'active', 1.0, 'grace_period',
   '{"unit": "B-301", "tower": "B", "floor": 3}'::jsonb),
  ('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', '0b26268c-20a5-4b7f-8983-44ef541e698f', 'miembro', 'active', 1.0, 'delinquent',
   '{"unit": "B-201", "tower": "B", "floor": 2}'::jsonb),
  ('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'd69dcd68-8baa-4af4-8c2f-74e7453753a2', 'observador', 'active', 0.5, 'good_standing',
   '{"unit": "B-101", "tower": "B", "floor": 1}'::jsonb)
ON CONFLICT (community_id, user_id) DO NOTHING;

-- Community 2: Solar del Valle
INSERT INTO members (id, community_id, user_id, role, status, voting_weight, financial_standing) VALUES
  ('b0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000002', '9ed9c917-402f-4b34-98e2-31ba2d769bf3', 'admin', 'active', 1.0, 'good_standing'),
  ('b0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000002', '9326f0f3-cfeb-48e2-b71d-8442feaad5b5', 'miembro', 'active', 1.0, 'good_standing'),
  ('b0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000002', '7fb17927-1235-409a-9ad7-117c6900f469', 'miembro', 'active', 1.0, 'good_standing')
ON CONFLICT (community_id, user_id) DO NOTHING;

-- ==================== CATEGORIES ====================
-- Community 1: Las Palmas - Expenses
INSERT INTO categories (id, community_id, name, type, is_system) VALUES
  ('ca000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Mantenimiento General', 'expense', true),
  ('ca000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'Agua', 'expense', true),
  ('ca000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'Electricidad Áreas Comunes', 'expense', true),
  ('ca000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'Seguridad', 'expense', true),
  ('ca000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Limpieza', 'expense', true),
  ('ca000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'Jardinería', 'expense', true),
  ('ca000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'Fondo de Reserva', 'expense', true),
  ('ca000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'Reparaciones', 'expense', true),
  ('ca000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'Seguros', 'expense', true),
  ('ca000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'Administración', 'expense', true)
ON CONFLICT (id) DO NOTHING;

-- Community 1: Las Palmas - Income
INSERT INTO categories (id, community_id, name, type, is_system) VALUES
  ('ca000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000001', 'Cuota de Mantenimiento', 'income', true),
  ('ca000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000001', 'Cuota Extraordinaria', 'income', true),
  ('ca000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000001', 'Recargos', 'income', true),
  ('ca000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000001', 'Renta Áreas Comunes', 'income', true),
  ('ca000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000001', 'Otros Ingresos', 'income', true)
ON CONFLICT (id) DO NOTHING;

-- Community 2: Solar del Valle
INSERT INTO categories (id, community_id, name, type, is_system) VALUES
  ('ca000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000002', 'Paneles Solares', 'expense', true),
  ('ca000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000002', 'Infraestructura', 'expense', true),
  ('ca000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000002', 'Cuota Cooperativa', 'income', true),
  ('ca000000-0000-0000-0000-000000000033', 'c0000000-0000-0000-0000-000000000002', 'Venta Energía', 'income', true)
ON CONFLICT (id) DO NOTHING;

-- ==================== TRANSACTIONS (6 months of data) ====================
INSERT INTO transactions (id, community_id, type, amount, category_id, description, date, created_by) VALUES
  -- January 2025
  ('da000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'income', 168000.00, 'ca000000-0000-0000-0000-000000000020', 'Cuotas enero - 48 departamentos', '2025-01-05', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'expense', 25000.00, 'ca000000-0000-0000-0000-000000000001', 'Mantenimiento general enero', '2025-01-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'expense', 12500.00, 'ca000000-0000-0000-0000-000000000004', 'Servicio de vigilancia enero', '2025-01-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'expense', 8700.00, 'ca000000-0000-0000-0000-000000000002', 'Recibo CFE áreas comunes enero', '2025-01-15', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'expense', 6500.00, 'ca000000-0000-0000-0000-000000000005', 'Servicio limpieza enero', '2025-01-12', '957a636c-b0ce-4574-92cf-2e356804e73b'),

  -- February 2025
  ('da000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'income', 161000.00, 'ca000000-0000-0000-0000-000000000020', 'Cuotas febrero (46 de 48 pagaron)', '2025-02-05', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'expense', 25000.00, 'ca000000-0000-0000-0000-000000000001', 'Mantenimiento general febrero', '2025-02-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'expense', 12500.00, 'ca000000-0000-0000-0000-000000000004', 'Servicio de vigilancia febrero', '2025-02-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'expense', 9200.00, 'ca000000-0000-0000-0000-000000000003', 'Electricidad áreas comunes febrero', '2025-02-15', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'expense', 15000.00, 'ca000000-0000-0000-0000-000000000008', 'Reparación bomba de agua', '2025-02-20', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'income', 3500.00, 'ca000000-0000-0000-0000-000000000022', 'Recargos morosos febrero', '2025-02-28', '957a636c-b0ce-4574-92cf-2e356804e73b'),

  -- March 2025
  ('da000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'income', 168000.00, 'ca000000-0000-0000-0000-000000000020', 'Cuotas marzo - 48 departamentos', '2025-03-05', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', 'expense', 25000.00, 'ca000000-0000-0000-0000-000000000001', 'Mantenimiento general marzo', '2025-03-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000001', 'expense', 12500.00, 'ca000000-0000-0000-0000-000000000004', 'Servicio de vigilancia marzo', '2025-03-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000001', 'expense', 4500.00, 'ca000000-0000-0000-0000-000000000006', 'Jardinería y poda trimestral', '2025-03-15', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000001', 'income', 8000.00, 'ca000000-0000-0000-0000-000000000023', 'Renta salón de eventos (2 eventos)', '2025-03-20', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000001', 'expense', 45000.00, 'ca000000-0000-0000-0000-000000000009', 'Póliza de seguro anual (prorrateado)', '2025-03-25', '957a636c-b0ce-4574-92cf-2e356804e73b'),

  -- April 2025
  ('da000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000001', 'income', 164500.00, 'ca000000-0000-0000-0000-000000000020', 'Cuotas abril (47 pagaron)', '2025-04-05', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000019', 'c0000000-0000-0000-0000-000000000001', 'expense', 25000.00, 'ca000000-0000-0000-0000-000000000001', 'Mantenimiento general abril', '2025-04-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000020', 'c0000000-0000-0000-0000-000000000001', 'expense', 12500.00, 'ca000000-0000-0000-0000-000000000004', 'Servicio de vigilancia abril', '2025-04-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000021', 'c0000000-0000-0000-0000-000000000001', 'expense', 35000.00, 'ca000000-0000-0000-0000-000000000008', 'Impermeabilización azotea Torre A', '2025-04-18', '957a636c-b0ce-4574-92cf-2e356804e73b'),

  -- May 2025
  ('da000000-0000-0000-0000-000000000022', 'c0000000-0000-0000-0000-000000000001', 'income', 168000.00, 'ca000000-0000-0000-0000-000000000020', 'Cuotas mayo', '2025-05-05', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000023', 'c0000000-0000-0000-0000-000000000001', 'expense', 25000.00, 'ca000000-0000-0000-0000-000000000001', 'Mantenimiento general mayo', '2025-05-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000024', 'c0000000-0000-0000-0000-000000000001', 'expense', 12500.00, 'ca000000-0000-0000-0000-000000000004', 'Servicio de vigilancia mayo', '2025-05-10', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000025', 'c0000000-0000-0000-0000-000000000001', 'expense', 6500.00, 'ca000000-0000-0000-0000-000000000005', 'Servicio limpieza mayo', '2025-05-12', '957a636c-b0ce-4574-92cf-2e356804e73b'),
  ('da000000-0000-0000-0000-000000000026', 'c0000000-0000-0000-0000-000000000001', 'income', 12000.00, 'ca000000-0000-0000-0000-000000000021', 'Cuota extraordinaria fumigación', '2025-05-20', '957a636c-b0ce-4574-92cf-2e356804e73b'),

  -- Community 2: Solar del Valle
  ('da000000-0000-0000-0000-000000000030', 'c0000000-0000-0000-0000-000000000002', 'income', 50000.00, 'ca000000-0000-0000-0000-000000000032', 'Cuotas cooperativa Q1', '2025-01-15', '9ed9c917-402f-4b34-98e2-31ba2d769bf3'),
  ('da000000-0000-0000-0000-000000000031', 'c0000000-0000-0000-0000-000000000002', 'expense', 120000.00, 'ca000000-0000-0000-0000-000000000030', 'Compra 10 paneles solares', '2025-02-01', '9ed9c917-402f-4b34-98e2-31ba2d769bf3'),
  ('da000000-0000-0000-0000-000000000032', 'c0000000-0000-0000-0000-000000000002', 'income', 35000.00, 'ca000000-0000-0000-0000-000000000033', 'Venta energía excedente feb-mar', '2025-03-30', '9ed9c917-402f-4b34-98e2-31ba2d769bf3')
ON CONFLICT (id) DO NOTHING;

-- ==================== BUDGETS ====================
INSERT INTO budgets (id, community_id, category_id, period, amount) VALUES
  ('db000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000001', '2025', 300000.00),
  ('db000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000004', '2025', 150000.00),
  ('db000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000002', '2025', 100000.00),
  ('db000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000003', '2025', 120000.00),
  ('db000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000005', '2025', 78000.00),
  ('db000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000008', '2025', 200000.00),
  ('db000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000009', '2025', 45000.00),
  ('db000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'ca000000-0000-0000-0000-000000000007', '2025', 240000.00)
ON CONFLICT (community_id, category_id, period) DO NOTHING;

-- ==================== PAYMENT OBLIGATIONS ====================
INSERT INTO payment_obligations (id, community_id, member_id, amount, due_date, status, concept) VALUES
  -- Good standing members - all paid
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3500.00, '2025-01-01', 'paid', 'Cuota mantenimiento enero 2025'),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3500.00, '2025-02-01', 'paid', 'Cuota mantenimiento febrero 2025'),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 3500.00, '2025-03-01', 'paid', 'Cuota mantenimiento marzo 2025'),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 3500.00, '2025-01-01', 'paid', 'Cuota mantenimiento enero 2025'),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 3500.00, '2025-02-01', 'paid', 'Cuota mantenimiento febrero 2025'),
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 3500.00, '2025-03-01', 'paid', 'Cuota mantenimiento marzo 2025'),

  -- Grace period member - paid jan/feb, pending mar
  ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 3500.00, '2025-01-01', 'paid', 'Cuota mantenimiento enero 2025'),
  ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 3500.00, '2025-02-01', 'paid', 'Cuota mantenimiento febrero 2025'),
  ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 3500.00, '2025-03-01', 'overdue', 'Cuota mantenimiento marzo 2025'),
  ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 3500.00, '2025-04-01', 'pending', 'Cuota mantenimiento abril 2025'),

  -- Delinquent member - only paid january
  ('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2025-01-01', 'paid', 'Cuota mantenimiento enero 2025'),
  ('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2025-02-01', 'overdue', 'Cuota mantenimiento febrero 2025'),
  ('e0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2025-03-01', 'overdue', 'Cuota mantenimiento marzo 2025'),
  ('e0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2025-04-01', 'overdue', 'Cuota mantenimiento abril 2025'),
  ('e0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 3500.00, '2025-05-01', 'pending', 'Cuota mantenimiento mayo 2025'),

  -- Roberto (miembro3) - all paid
  ('e0000000-0000-0000-0000-000000000016', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 3500.00, '2025-01-01', 'paid', 'Cuota mantenimiento enero 2025'),
  ('e0000000-0000-0000-0000-000000000017', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 3500.00, '2025-02-01', 'paid', 'Cuota mantenimiento febrero 2025'),
  ('e0000000-0000-0000-0000-000000000018', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 3500.00, '2025-03-01', 'paid', 'Cuota mantenimiento marzo 2025')
ON CONFLICT (id) DO NOTHING;

-- ==================== PROPOSALS ====================
INSERT INTO proposals (id, community_id, title, description, type, status, quorum_required, majority_required, voting_start, voting_end, result, closed_at, created_by) VALUES
  -- Approved proposal
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Remodelación del lobby principal',
   'Se propone remodelar el lobby de la Torre A incluyendo nuevo mobiliario, iluminación LED y pintura. Presupuesto estimado: $85,000 MXN. El proveedor seleccionado es Interiores Modernos SA de CV.',
   'extraordinary', 'approved', 0.5, 0.5,
   '2025-02-01 09:00:00', '2025-02-08 18:00:00',
   'Aprobada por mayoría', '2025-02-08 18:00:00',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  -- Active proposal with financial instruction
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'Instalación de cámaras de seguridad adicionales',
   'Se propone instalar 8 cámaras IP adicionales en estacionamiento y áreas comunes. Incluye DVR y 1 año de almacenamiento en nube. Presupuesto: $45,000 MXN.',
   'ordinary', 'active', 0.5, 0.5,
   '2025-05-01 09:00:00', '2025-05-15 18:00:00',
   NULL, NULL,
   '9326f0f3-cfeb-48e2-b71d-8442feaad5b5'),

  -- Draft proposal
  ('f0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001',
   'Aumento de cuota de mantenimiento 2026',
   'Debido al incremento en costos de servicios, se propone aumentar la cuota mensual de $3,500 a $4,000 MXN a partir de enero 2026. El incremento cubre: inflación (8%), mejoras en seguridad y fondo de reserva.',
   'extraordinary', 'draft', 0.6, 0.6,
   NULL, NULL, NULL, NULL,
   '957a636c-b0ce-4574-92cf-2e356804e73b'),

  -- Rejected proposal
  ('f0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001',
   'Cambio de empresa de vigilancia',
   'Se propone cambiar de Grupo Seguridad Plus a VigiMax por mejor precio ($10,500/mes vs $12,500). Sin embargo, VigiMax tiene menos experiencia en condominios.',
   'ordinary', 'rejected', 0.5, 0.5,
   '2025-03-01 09:00:00', '2025-03-08 18:00:00',
   'Rechazada - no alcanzó mayoría', '2025-03-08 18:00:00',
   '9326f0f3-cfeb-48e2-b71d-8442feaad5b5'),

  -- Approved with financial instruction (executed)
  ('f0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001',
   'Compra de desfibrilador para áreas comunes',
   'Por seguridad de los residentes, se propone adquirir un desfibrilador automático externo (DEA) para el gimnasio. Costo: $28,000 MXN.',
   'ordinary', 'approved', 0.5, 0.5,
   '2025-04-01 09:00:00', '2025-04-08 18:00:00',
   'Aprobada por mayoría', '2025-04-08 18:00:00',
   '957a636c-b0ce-4574-92cf-2e356804e73b')
ON CONFLICT (id) DO NOTHING;

-- Set financial instruction on proposal 5
UPDATE proposals SET
  financial_instruction = '{"type": "disbursement", "amount": 28000, "description": "Compra de desfibrilador DEA", "beneficiary": "MedEquip México"}'::jsonb,
  execution_status = 'executed',
  executed_at = '2025-04-10 14:00:00'
WHERE id = 'f0000000-0000-0000-0000-000000000005';

-- Set financial instruction on proposal 2 (active)
UPDATE proposals SET
  financial_instruction = '{"type": "disbursement", "amount": 45000, "description": "Instalación cámaras de seguridad", "beneficiary": "TechSec Solutions"}'::jsonb,
  execution_status = 'pending'
WHERE id = 'f0000000-0000-0000-0000-000000000002';

-- ==================== VOTES ====================
INSERT INTO votes (id, proposal_id, member_id, value, weight) VALUES
  -- Votes on proposal 1 (approved: 4 yes, 1 no)
  ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'no', 1.0),
  ('f1000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'yes', 1.0),

  -- Votes on proposal 2 (active: 2 yes, 1 abstain so far)
  ('f1000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 'abstain', 1.0),

  -- Votes on proposal 4 (rejected: 2 yes, 3 no)
  ('f1000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'no', 1.0),
  ('f1000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'no', 1.0),
  ('f1000000-0000-0000-0000-000000000011', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000012', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000013', 'f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'no', 1.0),

  -- Votes on proposal 5 (approved: 5 yes, 1 abstain)
  ('f1000000-0000-0000-0000-000000000014', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000015', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000016', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000017', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000018', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'yes', 1.0),
  ('f1000000-0000-0000-0000-000000000019', 'f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000006', 'abstain', 0.5)
ON CONFLICT (proposal_id, member_id) DO NOTHING;

-- ==================== DELEGATIONS ====================
INSERT INTO delegations (id, community_id, from_member_id, to_member_id, scope, active) VALUES
  ('de000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'all', true),
  ('de000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', 'all', true)
ON CONFLICT (id) DO NOTHING;

-- ==================== ENTITIES ====================
INSERT INTO entities (id, community_id, name, type, rfc, email, phone, address, clabe, bank_name, contact_person, status, notes, created_by) VALUES
  ('ee000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Grupo Seguridad Plus SA de CV', 'proveedor', 'GSP180523MN4',
   'contacto@seguridadplus.mx', '55 1234 5678', 'Av. Revolución 567, CDMX',
   '012345678901234567', 'Banorte', 'Ing. Pedro Vargas',
   'active', 'Proveedor de vigilancia desde 2020. Contrato anual.',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('ee000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'Interiores Modernos SA de CV', 'contratista', 'IMO190815KL2',
   'ventas@intermod.mx', '55 9876 5432', 'Calle Durango 234, Col. Roma, CDMX',
   NULL, NULL, 'Arq. Laura Mejía',
   'active', 'Realizó la remodelación del lobby. Buen trabajo.',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('ee000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001',
   'LimpiaMax Servicios', 'proveedor', 'LMS200101AB3',
   'admin@limpiamax.com', '55 4567 8901', 'Tlalpan 890, CDMX',
   NULL, NULL, 'Sr. Juan Herrera',
   'active', 'Servicio de limpieza semanal.',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('ee000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001',
   'TechSec Solutions', 'proveedor', 'TSS210301CD4',
   'info@techsec.mx', '55 2345 6789', 'Santa Fe 456, CDMX',
   '987654321098765432', 'BBVA', 'Ing. Ricardo Flores',
   'active', 'Proveedor de cámaras y sistemas de seguridad electrónica.',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('ee000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001',
   'Jardines del Sur', 'proveedor', 'JDS190601EF5',
   'contacto@jardinesdelsur.mx', '55 3456 7890', 'Xochimilco 123, CDMX',
   NULL, NULL, 'Don Miguel Paredes',
   'active', 'Servicio de jardinería y mantenimiento de áreas verdes.',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('ee000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001',
   'Impermeabilizadora Nacional', 'contratista', 'INA180901GH6',
   'obras@impernacional.mx', '55 5678 9012', 'Iztapalapa 789, CDMX',
   NULL, NULL, 'Ing. Marco Ruiz',
   'inactive', 'Realizó impermeabilización en abril 2025. Trabajo con observaciones.',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('ee000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001',
   'Ayuntamiento Benito Juárez', 'gobierno', NULL,
   'atencion@alcaldiabenitojuarez.gob.mx', '55 5000 0001', 'Av. Municipio Libre 1, CDMX',
   NULL, NULL, 'Lic. Fernanda Ochoa',
   'active', 'Contacto para trámites y permisos municipales.',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4')
ON CONFLICT (id) DO NOTHING;

-- ==================== ENTITY CONTACTS ====================
INSERT INTO entity_contacts (id, entity_id, name, role, email, phone, is_primary) VALUES
  ('ec000000-0000-0000-0000-000000000001', 'ee000000-0000-0000-0000-000000000001', 'Ing. Pedro Vargas', 'Director de Operaciones', 'pvargas@seguridadplus.mx', '55 1234 5679', true),
  ('ec000000-0000-0000-0000-000000000002', 'ee000000-0000-0000-0000-000000000001', 'Cap. Roberto Ávila', 'Jefe de Turno', 'ravila@seguridadplus.mx', '55 1234 5680', false),
  ('ec000000-0000-0000-0000-000000000003', 'ee000000-0000-0000-0000-000000000002', 'Arq. Laura Mejía', 'Directora de Proyectos', 'lmejia@intermod.mx', '55 9876 5433', true),
  ('ec000000-0000-0000-0000-000000000004', 'ee000000-0000-0000-0000-000000000003', 'Sr. Juan Herrera', 'Gerente General', 'jherrera@limpiamax.com', '55 4567 8902', true),
  ('ec000000-0000-0000-0000-000000000005', 'ee000000-0000-0000-0000-000000000004', 'Ing. Ricardo Flores', 'Director Comercial', 'rflores@techsec.mx', '55 2345 6790', true),
  ('ec000000-0000-0000-0000-000000000006', 'ee000000-0000-0000-0000-000000000004', 'Lic. Diana Mora', 'Ejecutiva de Cuenta', 'dmora@techsec.mx', '55 2345 6791', false)
ON CONFLICT (id) DO NOTHING;

-- ==================== RECURRING SCHEDULES ====================
INSERT INTO recurring_schedules (id, community_id, name, description, type, frequency, amount, category_id, target_type, day_of_month, start_date, next_run_date, is_active, created_by) VALUES
  ('ae000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Cuota Mantenimiento Mensual', 'Cuota ordinaria mensual de $3,500 por departamento',
   'collection', 'monthly', 3500.00, 'ca000000-0000-0000-0000-000000000020', 'all_members', 1,
   '2025-01-01', '2025-06-01', true, '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('ae000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'Pago Vigilancia', 'Pago mensual al servicio de vigilancia Grupo Seguridad Plus',
   'payment', 'monthly', 12500.00, 'ca000000-0000-0000-0000-000000000004', 'entity', 10,
   '2025-01-01', '2025-06-10', true, '957a636c-b0ce-4574-92cf-2e356804e73b'),

  ('ae000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001',
   'Pago Limpieza', 'Pago mensual al servicio de limpieza LimpiaMax',
   'payment', 'monthly', 6500.00, 'ca000000-0000-0000-0000-000000000005', 'entity', 12,
   '2025-01-01', '2025-06-12', true, '957a636c-b0ce-4574-92cf-2e356804e73b'),

  ('ae000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001',
   'Pago Jardinería Trimestral', 'Servicio trimestral de jardinería',
   'payment', 'quarterly', 4500.00, 'ca000000-0000-0000-0000-000000000006', 'entity', 15,
   '2025-01-15', '2025-07-15', true, '957a636c-b0ce-4574-92cf-2e356804e73b')
ON CONFLICT (id) DO NOTHING;

-- Set entity references for payment schedules
UPDATE recurring_schedules SET target_entity_id = 'ee000000-0000-0000-0000-000000000001' WHERE id = 'ae000000-0000-0000-0000-000000000002';
UPDATE recurring_schedules SET target_entity_id = 'ee000000-0000-0000-0000-000000000003' WHERE id = 'ae000000-0000-0000-0000-000000000003';
UPDATE recurring_schedules SET target_entity_id = 'ee000000-0000-0000-0000-000000000005' WHERE id = 'ae000000-0000-0000-0000-000000000004';

-- ==================== CONTRACTS ====================
INSERT INTO contracts (id, community_id, name, description, type, entity_id, total_amount, payment_frequency, number_of_installments, start_date, end_date, status, compliance_score, created_by) VALUES
  ('cc000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'Contrato Vigilancia 2025', 'Servicio de vigilancia 24/7 con 4 elementos. Incluye rondines, control de acceso y reportes mensuales.',
   'servicio', 'ee000000-0000-0000-0000-000000000001',
   150000.00, 'monthly', 12, '2025-01-01', '2025-12-31', 'active', 1.00,
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('cc000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'Remodelación Lobby Torre A', 'Obra de remodelación completa del lobby incluyendo mobiliario, iluminación y pintura.',
   'obra', 'ee000000-0000-0000-0000-000000000002',
   85000.00, 'monthly', 3, '2025-03-01', '2025-05-31', 'completed', 1.00,
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('cc000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001',
   'Contrato Limpieza 2025', 'Servicio de limpieza de áreas comunes, lunes a sábado.',
   'mantenimiento', 'ee000000-0000-0000-0000-000000000003',
   78000.00, 'monthly', 12, '2025-01-01', '2025-12-31', 'active', 0.83,
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('cc000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001',
   'Impermeabilización Azotea Torre A', 'Impermeabilización completa de azotea con garantía de 5 años.',
   'obra', 'ee000000-0000-0000-0000-000000000006',
   35000.00, 'one_time', 1, '2025-04-15', '2025-04-30', 'completed', 0.70,
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),

  ('cc000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001',
   'Instalación Cámaras de Seguridad', 'Instalación de 8 cámaras IP, DVR y configuración de acceso remoto.',
   'servicio', 'ee000000-0000-0000-0000-000000000004',
   45000.00, 'monthly', 3, '2025-06-01', '2025-08-31', 'draft', 1.00,
   '01f81e79-7774-4ee2-83c6-bd1778c542b4')
ON CONFLICT (id) DO NOTHING;

-- Set proposal reference
UPDATE contracts SET approved_by_proposal_id = 'f0000000-0000-0000-0000-000000000001' WHERE id = 'cc000000-0000-0000-0000-000000000002';

-- ==================== CONTRACT INSTALLMENTS ====================
INSERT INTO contract_installments (id, contract_id, community_id, installment_number, amount, due_date, status, paid_amount, paid_at) VALUES
  -- Vigilancia (5 of 12 paid)
  ('cd000000-0000-0000-0000-000000000001', 'cc000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 1, 12500.00, '2025-01-10', 'paid', 12500.00, '2025-01-10'),
  ('cd000000-0000-0000-0000-000000000002', 'cc000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 2, 12500.00, '2025-02-10', 'paid', 12500.00, '2025-02-10'),
  ('cd000000-0000-0000-0000-000000000003', 'cc000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 3, 12500.00, '2025-03-10', 'paid', 12500.00, '2025-03-10'),
  ('cd000000-0000-0000-0000-000000000004', 'cc000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 4, 12500.00, '2025-04-10', 'paid', 12500.00, '2025-04-10'),
  ('cd000000-0000-0000-0000-000000000005', 'cc000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 5, 12500.00, '2025-05-10', 'paid', 12500.00, '2025-05-10'),
  ('cd000000-0000-0000-0000-000000000006', 'cc000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 6, 12500.00, '2025-06-10', 'pending', 0, NULL),
  ('cd000000-0000-0000-0000-000000000007', 'cc000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 7, 12500.00, '2025-07-10', 'pending', 0, NULL),

  -- Remodelación Lobby (all 3 paid - completed)
  ('cd000000-0000-0000-0000-000000000010', 'cc000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 1, 28333.33, '2025-03-01', 'paid', 28333.33, '2025-03-01'),
  ('cd000000-0000-0000-0000-000000000011', 'cc000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 2, 28333.33, '2025-04-01', 'paid', 28333.33, '2025-04-01'),
  ('cd000000-0000-0000-0000-000000000012', 'cc000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 3, 28333.34, '2025-05-01', 'paid', 28333.34, '2025-05-01'),

  -- Limpieza (5 of 12 paid, 1 overdue)
  ('cd000000-0000-0000-0000-000000000020', 'cc000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 1, 6500.00, '2025-01-12', 'paid', 6500.00, '2025-01-12'),
  ('cd000000-0000-0000-0000-000000000021', 'cc000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 2, 6500.00, '2025-02-12', 'paid', 6500.00, '2025-02-15'),
  ('cd000000-0000-0000-0000-000000000022', 'cc000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 3, 6500.00, '2025-03-12', 'paid', 6500.00, '2025-03-12'),
  ('cd000000-0000-0000-0000-000000000023', 'cc000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 4, 6500.00, '2025-04-12', 'paid', 6500.00, '2025-04-12'),
  ('cd000000-0000-0000-0000-000000000024', 'cc000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 5, 6500.00, '2025-05-12', 'paid', 6500.00, '2025-05-12'),
  ('cd000000-0000-0000-0000-000000000025', 'cc000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 6, 6500.00, '2025-06-12', 'pending', 0, NULL),

  -- Impermeabilización (1 payment, completed but with issues)
  ('cd000000-0000-0000-0000-000000000030', 'cc000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 1, 35000.00, '2025-04-30', 'paid', 35000.00, '2025-05-05')
ON CONFLICT (id) DO NOTHING;

-- ==================== RATINGS ====================
INSERT INTO ratings (id, community_id, target_type, target_id, rated_by, overall_score, dimensions, comment, contract_id) VALUES
  -- Ratings for Seguridad Plus
  ('ab000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'entity', 'ee000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000001', 5,
   '{"punctuality": 5, "quality": 5, "communication": 4, "compliance": 5, "value": 4}'::jsonb,
   'Excelente servicio de vigilancia. Siempre puntuales y profesionales.', 'cc000000-0000-0000-0000-000000000001'),

  ('ab000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'entity', 'ee000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002', 4,
   '{"punctuality": 4, "quality": 4, "communication": 5, "compliance": 4, "value": 4}'::jsonb,
   'Buen servicio en general. A veces faltan reportes de incidentes.', NULL),

  -- Ratings for Interiores Modernos
  ('ab000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'entity', 'ee000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000001', 5,
   '{"punctuality": 4, "quality": 5, "communication": 5, "compliance": 5, "value": 4}'::jsonb,
   'La remodelación del lobby quedó espectacular. Muy profesionales.', 'cc000000-0000-0000-0000-000000000002'),

  ('ab000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 'entity', 'ee000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000003', 4,
   '{"punctuality": 3, "quality": 5, "communication": 4, "compliance": 4, "value": 4}'::jsonb,
   'Buen trabajo, pero se retrasaron una semana.', 'cc000000-0000-0000-0000-000000000002'),

  -- Ratings for LimpiaMax
  ('ab000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'entity', 'ee000000-0000-0000-0000-000000000003',
   'b0000000-0000-0000-0000-000000000001', 4,
   '{"punctuality": 4, "quality": 4, "communication": 3, "compliance": 4, "value": 5}'::jsonb,
   'Servicio consistente y buen precio. Comunicación podría mejorar.', 'cc000000-0000-0000-0000-000000000003'),

  -- Ratings for Impermeabilizadora (bad rating)
  ('ab000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'entity', 'ee000000-0000-0000-0000-000000000006',
   'b0000000-0000-0000-0000-000000000001', 2,
   '{"punctuality": 2, "quality": 2, "communication": 3, "compliance": 2, "value": 2}'::jsonb,
   'Trabajo deficiente. Se detectaron filtraciones a los 2 meses. Garantía difícil de hacer válida.', 'cc000000-0000-0000-0000-000000000004'),

  ('ab000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', 'entity', 'ee000000-0000-0000-0000-000000000006',
   'b0000000-0000-0000-0000-000000000002', 2,
   '{"punctuality": 1, "quality": 3, "communication": 2, "compliance": 1, "value": 2}'::jsonb,
   'No recomiendo. Incumplieron con los tiempos y la calidad no fue la esperada.', 'cc000000-0000-0000-0000-000000000004')
ON CONFLICT (community_id, target_type, target_id, rated_by, contract_id) DO NOTHING;

-- ==================== MINUTES ====================
INSERT INTO minutes (id, community_id, proposal_id, content, generated_at, approved, approved_at, approved_by, signatures) VALUES
  ('ac000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001',
   E'ACTA DE VOTACIÓN\n==================\n\nPropuesta: Remodelación del lobby principal\nTipo: extraordinary\nFecha: 08/02/2025\n\nDESCRIPCIÓN:\nSe propone remodelar el lobby de la Torre A incluyendo nuevo mobiliario, iluminación LED y pintura.\n\nRESULTADOS:\n- A favor: 4 (peso)\n- En contra: 1 (peso)\n- Abstenciones: 0 (peso)\n- Participación: 83.3%\n- Quórum requerido: 50%\n- Quórum alcanzado: Sí\n\nRESOLUCIÓN: La propuesta ha sido APROBADA.',
   '2025-02-08 18:30:00', true, '2025-02-09 10:00:00', '01f81e79-7774-4ee2-83c6-bd1778c542b4',
   '[{"member_id": "b0000000-0000-0000-0000-000000000001", "member_name": "Carlos Mendoza García", "signed_at": "2025-02-09T10:00:00Z", "hash": "abc123def456"}, {"member_id": "b0000000-0000-0000-0000-000000000002", "member_name": "María Elena Rodríguez", "signed_at": "2025-02-09T10:30:00Z", "hash": "def789ghi012"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ==================== INVITATIONS ====================
INSERT INTO invitations (id, community_id, email, role, status, token, expires_at, created_by) VALUES
  ('af000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
   'nuevo.vecino@gmail.com', 'miembro', 'pending',
   'b0000000-0000-0000-0000-000000000001', now() + interval '7 days',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4'),
  ('af000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001',
   'arrendatario@hotmail.com', 'observador', 'pending',
   'b0000000-0000-0000-0000-000000000002', now() + interval '7 days',
   '01f81e79-7774-4ee2-83c6-bd1778c542b4')
ON CONFLICT (id) DO NOTHING;

-- ==================== CENSUS SNAPSHOTS ====================
INSERT INTO census_snapshots (id, community_id, total_members, active_members, members_good_standing, members_delinquent, total_income, total_expenses, active_proposals, snapshot_date) VALUES
  ('ce000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 6, 6, 4, 1, 168000, 52700, 0, '2025-01-31'),
  ('ce000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 6, 6, 4, 1, 332500, 114400, 0, '2025-02-28'),
  ('ce000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 6, 6, 3, 1, 508500, 201400, 0, '2025-03-31'),
  ('ce000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', 6, 6, 3, 1, 673000, 273900, 1, '2025-04-30'),
  ('ce000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 6, 6, 3, 1, 853000, 317900, 1, '2025-05-31')
ON CONFLICT (community_id, snapshot_date) DO NOTHING;

-- ==================== AUDIT LOG ====================
INSERT INTO audit_log (id, community_id, user_id, action, entity_type, entity_id, details) VALUES
  ('ad000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', '01f81e79-7774-4ee2-83c6-bd1778c542b4', 'create', 'community', 'c0000000-0000-0000-0000-000000000001', '{"name": "Residencial Las Palmas"}'::jsonb),
  ('ad000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', '01f81e79-7774-4ee2-83c6-bd1778c542b4', 'create', 'proposal', 'f0000000-0000-0000-0000-000000000001', '{"title": "Remodelación del lobby principal"}'::jsonb),
  ('ad000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', '01f81e79-7774-4ee2-83c6-bd1778c542b4', 'approve', 'proposal', 'f0000000-0000-0000-0000-000000000001', '{"result": "Aprobada por mayoría"}'::jsonb),
  ('ad000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001', '957a636c-b0ce-4574-92cf-2e356804e73b', 'create', 'transaction', 'da000000-0000-0000-0000-000000000001', '{"amount": 168000, "description": "Cuotas enero"}'::jsonb),
  ('ad000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', '01f81e79-7774-4ee2-83c6-bd1778c542b4', 'execute', 'proposal', 'f0000000-0000-0000-0000-000000000005', '{"amount": 28000, "description": "Compra de desfibrilador DEA"}'::jsonb),
  ('ad000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', '01f81e79-7774-4ee2-83c6-bd1778c542b4', 'create', 'entity', 'ee000000-0000-0000-0000-000000000001', '{"name": "Grupo Seguridad Plus SA de CV"}'::jsonb),
  ('ad000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000001', '01f81e79-7774-4ee2-83c6-bd1778c542b4', 'create', 'contract', 'cc000000-0000-0000-0000-000000000001', '{"name": "Contrato Vigilancia 2025"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ==================== DONE ====================
-- Summary:
-- 2 communities (Las Palmas + Solar del Valle)
-- 7 auth users (login with email + Test1234!)
-- 9 members across 2 communities
-- 19 categories
-- 8 budgets
-- 28+ transactions (6 months of data)
-- 18 payment obligations (mix of paid/pending/overdue)
-- 5 proposals (draft, active, approved, rejected, executed)
-- 19 votes
-- 2 delegations
-- 1 minutes with signatures
-- 7 entities (providers, contractors, government)
-- 6 entity contacts
-- 4 recurring schedules
-- 5 contracts
-- 17 contract installments
-- 7 ratings
-- 2 invitations
-- 5 census snapshots
-- 7 audit log entries
SELECT 'Seed data loaded successfully! 🌱' as result;
