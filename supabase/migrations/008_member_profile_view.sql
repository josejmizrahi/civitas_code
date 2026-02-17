-- ============================================
-- CIVITAS: Member Profile View
-- Joins members with auth.users for email/name
-- + Vote delete policy for upsert pattern
-- ============================================

-- Create a view that exposes member profile info
-- This safely joins members with auth.users
create or replace view member_profiles as
select
  m.id,
  m.community_id,
  m.user_id,
  m.role,
  m.status,
  m.custom_attributes,
  m.joined_at,
  m.created_at,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.email) as full_name
from members m
join auth.users u on u.id = m.user_id;

-- Grant access to the view
grant select on member_profiles to authenticated;

-- RLS: The view inherits the underlying table's RLS policies
-- But we need to ensure select works through the view
-- Views in Supabase run with the invoker's permissions by default

-- Add delete policy on votes for the upsert pattern (delete old vote before re-voting)
create policy "Members can delete their own vote"
  on votes for delete
  using (
    member_id in (
      select id from members where user_id = auth.uid()
    )
  );

-- Add delete policy on column_mappings for re-mapping
create policy "Admin/Tesorero can delete column mappings"
  on column_mappings for delete
  using (get_user_role(community_id) in ('admin', 'tesorero'));

-- Add delete policy on category_mappings for re-mapping
create policy "Admin/Tesorero can delete category mappings"
  on category_mappings for delete
  using (get_user_role(community_id) in ('admin', 'tesorero'));
