-- ============================================
-- CIVITAS: Row-Level Security Policies
-- Multi-tenant isolation + role-based access
-- ============================================

-- Enable RLS on all tables
alter table communities enable row level security;
alter table members enable row level security;
alter table roles enable row level security;
alter table invitations enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table budgets enable row level security;
alter table payment_obligations enable row level security;
alter table proposals enable row level security;
alter table votes enable row level security;
alter table delegations enable row level security;
alter table minutes enable row level security;
alter table documents enable row level security;

-- ==================
-- COMMUNITIES
-- ==================
-- Users can see communities they belong to
create policy "Members can view their communities"
  on communities for select
  using (id in (select get_user_community_ids()));

-- Only allow community creation by authenticated users
create policy "Authenticated users can create communities"
  on communities for insert
  with check (auth.uid() is not null);

-- Only admins can update their community
create policy "Admins can update their community"
  on communities for update
  using (get_user_role(id) = 'admin');

-- ==================
-- MEMBERS
-- ==================
-- Members can see other members in their community
create policy "Members can view community members"
  on members for select
  using (community_id in (select get_user_community_ids()));

-- Only admins can add members
create policy "Admins can insert members"
  on members for insert
  with check (get_user_role(community_id) = 'admin');

-- Admins can update member roles/status
create policy "Admins can update members"
  on members for update
  using (get_user_role(community_id) = 'admin');

-- Users can insert themselves (for accepting invitations)
create policy "Users can join via invitation"
  on members for insert
  with check (user_id = auth.uid());

-- ==================
-- ROLES
-- ==================
create policy "Members can view roles"
  on roles for select
  using (community_id in (select get_user_community_ids()));

create policy "Admins can manage roles"
  on roles for all
  using (get_user_role(community_id) = 'admin');

-- ==================
-- INVITATIONS
-- ==================
create policy "Members can view invitations"
  on invitations for select
  using (community_id in (select get_user_community_ids()));

create policy "Admins can create invitations"
  on invitations for insert
  with check (get_user_role(community_id) = 'admin');

create policy "Admins can update invitations"
  on invitations for update
  using (get_user_role(community_id) = 'admin');

-- Invited users can view their invitation by token
create policy "Invited users can view their invitation"
  on invitations for select
  using (email = (select email from auth.users where id = auth.uid()));

-- ==================
-- CATEGORIES
-- ==================
create policy "Members can view categories"
  on categories for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin/Tesorero can manage categories"
  on categories for all
  using (get_user_role(community_id) in ('admin', 'tesorero'));

-- ==================
-- TRANSACTIONS
-- ==================
-- All members can view transactions (transparency!)
create policy "Members can view transactions"
  on transactions for select
  using (community_id in (select get_user_community_ids()));

-- Admin/Tesorero can insert (manual capture fallback)
create policy "Admin/Tesorero can insert transactions"
  on transactions for insert
  with check (get_user_role(community_id) in ('admin', 'tesorero'));

create policy "Admin/Tesorero can update transactions"
  on transactions for update
  using (get_user_role(community_id) in ('admin', 'tesorero'));

-- ==================
-- BUDGETS
-- ==================
create policy "Members can view budgets"
  on budgets for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin/Tesorero can manage budgets"
  on budgets for all
  using (get_user_role(community_id) in ('admin', 'tesorero'));

-- ==================
-- PAYMENT OBLIGATIONS
-- ==================
-- Members can see their own obligations, admin/tesorero see all
create policy "Members can view their obligations"
  on payment_obligations for select
  using (
    community_id in (select get_user_community_ids())
    and (
      member_id in (select id from members where user_id = auth.uid())
      or get_user_role(community_id) in ('admin', 'tesorero')
    )
  );

create policy "Admin/Tesorero can manage obligations"
  on payment_obligations for all
  using (get_user_role(community_id) in ('admin', 'tesorero'));

-- ==================
-- PROPOSALS
-- ==================
create policy "Members can view proposals"
  on proposals for select
  using (community_id in (select get_user_community_ids()));

-- Admin/Tesorero/Miembro can create proposals (not observador)
create policy "Active members can create proposals"
  on proposals for insert
  with check (get_user_role(community_id) in ('admin', 'tesorero', 'miembro'));

create policy "Proposal creator or admin can update"
  on proposals for update
  using (
    created_by = auth.uid()
    or get_user_role(community_id) = 'admin'
  );

-- ==================
-- VOTES
-- ==================
create policy "Members can view votes"
  on votes for select
  using (
    proposal_id in (
      select id from proposals
      where community_id in (select get_user_community_ids())
    )
  );

-- Active members can vote (not observador)
create policy "Active members can vote"
  on votes for insert
  with check (
    member_id in (
      select m.id from members m
      join proposals p on p.community_id = m.community_id
      where p.id = proposal_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'tesorero', 'miembro')
        and m.status = 'active'
    )
  );

-- ==================
-- DELEGATIONS
-- ==================
create policy "Members can view delegations"
  on delegations for select
  using (community_id in (select get_user_community_ids()));

create policy "Members can manage their delegations"
  on delegations for all
  using (
    from_member_id in (
      select id from members where user_id = auth.uid()
    )
  );

-- ==================
-- MINUTES
-- ==================
create policy "Members can view minutes"
  on minutes for select
  using (community_id in (select get_user_community_ids()));

create policy "Admin can manage minutes"
  on minutes for all
  using (get_user_role(community_id) = 'admin');

-- ==================
-- DOCUMENTS
-- ==================
create policy "Members can view documents"
  on documents for select
  using (community_id in (select get_user_community_ids()));

create policy "Active members can upload documents"
  on documents for insert
  with check (get_user_role(community_id) in ('admin', 'tesorero', 'miembro'));
