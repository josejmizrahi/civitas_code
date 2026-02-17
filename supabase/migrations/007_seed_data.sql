-- ============================================
-- CIVITAS: Seed Data
-- Demo community for development
-- ============================================

-- Insert demo community
insert into communities (id, name, slug, type, config) values (
  '00000000-0000-0000-0000-000000000001',
  'Residencial Las Palmas',
  'las-palmas',
  'residential',
  '{
    "address": "Av. Insurgentes Sur 1234, CDMX",
    "total_units": 48,
    "towers": ["A", "B"],
    "floors_per_tower": 6,
    "monthly_fee_base": 3500,
    "currency": "MXN"
  }'::jsonb
);

-- Insert default expense categories
insert into categories (community_id, name, type, is_system) values
  ('00000000-0000-0000-0000-000000000001', 'Mantenimiento General', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Agua', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Electricidad Áreas Comunes', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Seguridad', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Limpieza', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Jardinería', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Fondo de Reserva', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Reparaciones', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Seguros', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Administración', 'expense', true),
  ('00000000-0000-0000-0000-000000000001', 'Cuotas Extraordinarias', 'expense', true);

-- Insert default income categories
insert into categories (community_id, name, type, is_system) values
  ('00000000-0000-0000-0000-000000000001', 'Cuota de Mantenimiento', 'income', true),
  ('00000000-0000-0000-0000-000000000001', 'Cuota Extraordinaria', 'income', true),
  ('00000000-0000-0000-0000-000000000001', 'Recargos', 'income', true),
  ('00000000-0000-0000-0000-000000000001', 'Renta Áreas Comunes', 'income', true),
  ('00000000-0000-0000-0000-000000000001', 'Otros Ingresos', 'income', true);

-- Insert default roles
insert into roles (community_id, name, permissions) values
  ('00000000-0000-0000-0000-000000000001', 'Administrador', '{"manage_members": true, "manage_treasury": true, "manage_governance": true, "manage_settings": true, "import_data": true}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Tesorero', '{"manage_treasury": true, "import_data": true, "create_proposals": true, "vote": true}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Miembro', '{"create_proposals": true, "vote": true, "create_maintenance_requests": true}'::jsonb),
  ('00000000-0000-0000-0000-000000000001', 'Observador', '{"view_only": true}'::jsonb);

-- Insert common areas for demo
insert into common_areas (community_id, name, rules, reservation_enabled) values
  ('00000000-0000-0000-0000-000000000001', 'Salón de Eventos', 'Reservar con 48 horas de anticipación. Capacidad máxima: 50 personas.', true),
  ('00000000-0000-0000-0000-000000000001', 'Gimnasio', 'Horario: 6:00 AM - 10:00 PM. Uso exclusivo para residentes.', false),
  ('00000000-0000-0000-0000-000000000001', 'Alberca', 'Horario: 8:00 AM - 8:00 PM. Niños menores de 12 años con acompañante adulto.', false),
  ('00000000-0000-0000-0000-000000000001', 'Jardín Central', 'No se permiten mascotas sin correa.', false),
  ('00000000-0000-0000-0000-000000000001', 'Estacionamiento Visitas', 'Máximo 24 horas. Registrar en caseta.', false);
