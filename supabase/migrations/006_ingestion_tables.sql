-- ============================================
-- CIVITAS: Ingestion Layer
-- Data Sources, Import Jobs, Mappings
-- ============================================

-- Data sources configured per community
create table data_sources (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  name text not null,
  type text not null default 'csv',
  config jsonb not null default '{}',
  last_sync_at timestamptz,
  status text not null default 'active',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),

  constraint valid_source_type check (type in ('csv', 'excel', 'api', 'manual')),
  constraint valid_source_status check (status in ('active', 'inactive', 'error'))
);

create index idx_sources_community on data_sources(community_id);

-- Import jobs: log of each import execution
create table import_jobs (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  source_id uuid not null references data_sources(id) on delete cascade,
  status text not null default 'pending',
  file_url text,
  rows_total int not null default 0,
  rows_imported int not null default 0,
  rows_skipped int not null default 0,
  error_log jsonb not null default '[]',
  started_at timestamptz not null default now(),
  completed_at timestamptz,

  constraint valid_job_status check (status in ('pending', 'processing', 'completed', 'failed'))
);

create index idx_jobs_community on import_jobs(community_id);
create index idx_jobs_source on import_jobs(source_id);

-- Category mappings: external name -> internal category
create table category_mappings (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  source_id uuid not null references data_sources(id) on delete cascade,
  external_name text not null,
  internal_category_id uuid not null references categories(id) on delete cascade,
  auto_matched boolean not null default false,

  unique(community_id, source_id, external_name)
);

-- Column mappings: external column -> internal field
create table column_mappings (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  source_id uuid not null references data_sources(id) on delete cascade,
  external_column text not null,
  internal_field text not null,
  transform jsonb not null default '{}',

  unique(community_id, source_id, external_column)
);

-- Add FK from transactions to data_sources
alter table transactions
  add constraint transactions_source_fk
  foreign key (source_id)
  references data_sources(id) on delete set null;

-- Enable RLS on ingestion tables
alter table data_sources enable row level security;
alter table import_jobs enable row level security;
alter table category_mappings enable row level security;
alter table column_mappings enable row level security;

-- RLS policies for ingestion
create policy "Members can view data sources"
  on data_sources for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin can manage data sources"
  on data_sources for all
  using (get_user_role(community_id) = 'admin');

create policy "Admin/Tesorero can insert data sources"
  on data_sources for insert
  with check (get_user_role(community_id) in ('admin', 'tesorero'));

create policy "Members can view import jobs"
  on import_jobs for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin/Tesorero can manage import jobs"
  on import_jobs for all
  using (get_user_role(community_id) in ('admin', 'tesorero'));

create policy "Members can view category mappings"
  on category_mappings for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin/Tesorero can manage category mappings"
  on category_mappings for all
  using (get_user_role(community_id) in ('admin', 'tesorero'));

create policy "Members can view column mappings"
  on column_mappings for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin/Tesorero can manage column mappings"
  on column_mappings for all
  using (get_user_role(community_id) in ('admin', 'tesorero'));

-- RLS for residential tables
alter table units enable row level security;
alter table common_areas enable row level security;
alter table maintenance_requests enable row level security;

create policy "Members can view units"
  on units for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin can manage units"
  on units for all
  using (get_user_role(community_id) = 'admin');

create policy "Members can view common areas"
  on common_areas for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin can manage common areas"
  on common_areas for all
  using (get_user_role(community_id) = 'admin');

create policy "Members can view maintenance requests"
  on maintenance_requests for select
  using (community_id in (select get_user_community_ids()));

create policy "Members can create maintenance requests"
  on maintenance_requests for insert
  with check (get_user_role(community_id) in ('admin', 'tesorero', 'miembro'));

create policy "Admin can manage maintenance requests"
  on maintenance_requests for update
  using (get_user_role(community_id) = 'admin');
