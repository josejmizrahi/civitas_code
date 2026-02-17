-- ============================================
-- CIVITAS: Layer 1 - Identity
-- Communities, Members, Roles, Invitations
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Communities: each tenant
create table communities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  type text not null default 'residential',
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_communities_slug on communities(slug);

-- Members: links auth.users to a community with a role
create table members (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'miembro',
  status text not null default 'active',
  custom_attributes jsonb not null default '{}',
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique(community_id, user_id),
  constraint valid_role check (role in ('admin', 'tesorero', 'miembro', 'observador')),
  constraint valid_status check (status in ('active', 'inactive', 'pending'))
);

create index idx_members_community on members(community_id);
create index idx_members_user on members(user_id);

-- Roles: configurable per community (for advanced RBAC)
create table roles (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  name text not null,
  permissions jsonb not null default '{}',
  created_at timestamptz not null default now(),

  unique(community_id, name)
);

-- Invitations: pending invites
create table invitations (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  email text not null,
  role text not null default 'miembro',
  status text not null default 'pending',
  token uuid not null default uuid_generate_v4(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),

  constraint valid_invitation_role check (role in ('admin', 'tesorero', 'miembro', 'observador')),
  constraint valid_invitation_status check (status in ('pending', 'accepted', 'expired', 'cancelled'))
);

create index idx_invitations_token on invitations(token);
create index idx_invitations_email on invitations(email);

-- Helper function: get community IDs for current user
create or replace function get_user_community_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select community_id from members
  where user_id = auth.uid() and status = 'active';
$$;

-- Helper function: get user role in a specific community
create or replace function get_user_role(p_community_id uuid)
returns text
language sql
security definer
stable
as $$
  select role from members
  where user_id = auth.uid()
    and community_id = p_community_id
    and status = 'active'
  limit 1;
$$;

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger communities_updated_at
  before update on communities
  for each row execute function update_updated_at();
