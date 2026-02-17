-- ============================================
-- CIVITAS: Layer 3 - Governance
-- Proposals, Votes, Delegations, Minutes, Documents
-- ============================================

-- Proposals
create table proposals (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  title text not null,
  description text not null default '',
  type text not null default 'ordinary',
  status text not null default 'draft',
  quorum_required numeric(5,4) not null default 0.5,
  majority_required numeric(5,4) not null default 0.5,
  voting_start timestamptz,
  voting_end timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),

  constraint valid_proposal_type check (type in ('ordinary', 'extraordinary', 'budget', 'election', 'amendment')),
  constraint valid_proposal_status check (status in ('draft', 'active', 'closed', 'approved', 'rejected')),
  constraint valid_quorum check (quorum_required > 0 and quorum_required <= 1),
  constraint valid_majority check (majority_required > 0 and majority_required <= 1),
  constraint valid_voting_period check (voting_end is null or voting_start is null or voting_end > voting_start)
);

create index idx_proposals_community on proposals(community_id);
create index idx_proposals_status on proposals(community_id, status);

-- Votes: one per member per proposal
create table votes (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid not null references proposals(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  value text not null,
  weight numeric(10,4) not null default 1,
  delegated_from uuid references members(id),
  cast_at timestamptz not null default now(),

  unique(proposal_id, member_id),
  constraint valid_vote_value check (value in ('yes', 'no', 'abstain')),
  constraint positive_weight check (weight > 0)
);

create index idx_votes_proposal on votes(proposal_id);

-- Delegations: liquid democracy
create table delegations (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  from_member_id uuid not null references members(id) on delete cascade,
  to_member_id uuid not null references members(id) on delete cascade,
  scope text not null default 'all', -- 'all' or specific proposal type
  active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint no_self_delegation check (from_member_id != to_member_id)
);

create index idx_delegations_community on delegations(community_id);

-- Minutes: auto-generated records
create table minutes (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  proposal_id uuid references proposals(id) on delete set null,
  content text not null,
  generated_at timestamptz not null default now(),
  approved boolean not null default false
);

-- Documents: community files
create table documents (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  title text not null,
  file_url text not null,
  category text not null default 'general',
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Add cross-layer FK: budgets -> proposals
alter table budgets
  add constraint budgets_proposal_fk
  foreign key (approved_by_proposal_id)
  references proposals(id) on delete set null;
