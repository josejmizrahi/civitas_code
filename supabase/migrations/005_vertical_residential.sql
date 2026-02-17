-- ============================================
-- CIVITAS: Layer 5 - Vertical: Residential
-- Units, Common Areas, Maintenance Requests
-- ============================================

create table units (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  unit_number text not null,
  floor int,
  tower text,
  indiviso_pct numeric(6,4),
  area_m2 numeric(8,2),

  unique(community_id, unit_number)
);

create index idx_units_community on units(community_id);

create table common_areas (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  name text not null,
  rules text,
  reservation_enabled boolean not null default false
);

create table maintenance_requests (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  description text not null,
  status text not null default 'open',
  priority text not null default 'medium',
  assigned_to uuid references members(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),

  constraint valid_maint_status check (status in ('open', 'in_progress', 'resolved', 'closed')),
  constraint valid_maint_priority check (priority in ('low', 'medium', 'high', 'urgent'))
);

create index idx_maint_community on maintenance_requests(community_id);
