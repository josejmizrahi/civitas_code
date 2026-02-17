-- ============================================
-- CIVITAS: Layer 2 - Treasury
-- Categories, Transactions, Budgets, Payments
-- ============================================

-- Categories: configurable per community
create table categories (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  name text not null,
  type text not null,
  parent_id uuid references categories(id) on delete set null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),

  constraint valid_category_type check (type in ('income', 'expense'))
);

create index idx_categories_community on categories(community_id);

-- Transactions: every financial movement
-- source_id and external_ref enable ingestion traceability
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  type text not null,
  amount numeric(12,2) not null,
  category_id uuid references categories(id) on delete set null,
  description text not null default '',
  date date not null,
  source_id uuid, -- FK added after data_sources table exists
  evidence_url text,
  external_ref text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),

  constraint valid_transaction_type check (type in ('income', 'expense')),
  constraint positive_amount check (amount > 0)
);

create index idx_transactions_community on transactions(community_id);
create index idx_transactions_date on transactions(community_id, date);
create index idx_transactions_category on transactions(category_id);
create index idx_transactions_source on transactions(source_id);
create index idx_transactions_external_ref on transactions(community_id, external_ref);

-- Budgets: linked to governance via approved_by_proposal_id
create table budgets (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  period text not null, -- e.g. '2026-Q1', '2026-01', '2026'
  amount numeric(12,2) not null,
  approved_by_proposal_id uuid, -- FK added after proposals table exists
  created_at timestamptz not null default now(),

  unique(community_id, category_id, period),
  constraint positive_budget check (amount >= 0)
);

-- Payment obligations: dues/contributions owed by members
create table payment_obligations (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid not null references communities(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  amount numeric(12,2) not null,
  due_date date not null,
  status text not null default 'pending',
  concept text not null,
  created_at timestamptz not null default now(),

  constraint valid_payment_status check (status in ('pending', 'paid', 'overdue', 'partial')),
  constraint positive_obligation check (amount > 0)
);

create index idx_obligations_community on payment_obligations(community_id);
create index idx_obligations_member on payment_obligations(member_id);
