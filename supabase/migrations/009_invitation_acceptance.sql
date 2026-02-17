-- ============================================
-- CIVITAS: Migration 009 - Invitation Acceptance
-- RPC for accepting invitations via token
-- ============================================

-- RPC: accept_invitation
-- Atomically validates token, creates member, updates invitation
create or replace function accept_invitation(p_token uuid, p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_invitation record;
begin
  -- Find valid invitation
  select * into v_invitation
  from invitations
  where token = p_token
    and status = 'pending'
    and expires_at > now();

  if not found then
    raise exception 'Invitación no válida, expirada o ya utilizada';
  end if;

  -- Create member record (ignore if already exists)
  insert into members (community_id, user_id, role, status)
  values (v_invitation.community_id, p_user_id, v_invitation.role, 'active')
  on conflict (community_id, user_id) do nothing;

  -- Mark invitation as accepted
  update invitations
  set status = 'accepted'
  where id = v_invitation.id;
end;
$$;
