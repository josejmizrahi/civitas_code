import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'
import type { Role } from '@/shared/types'
import type { Member, Invitation, Community } from '../types'

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

/**
 * List members of a community (from member_profiles view when available).
 * Optionally marks the current user with is_current_user.
 */
export async function getMembers(communityId: string, currentUserId?: string): Promise<Member[]> {
  // Use the member_profiles view which joins auth.users for email/full_name
  const { data, error } = await (supabase
    .from('member_profiles' as any) as any)
    .select('*')
    .eq('community_id', communityId)
    .order('joined_at', { ascending: false })

  if (error) {
    // Fallback: if view doesn't exist yet, use plain members table
    const { data: fallback, error: fbErr } = await supabase
      .from('members')
      .select('*')
      .eq('community_id', communityId)
      .order('joined_at', { ascending: false })
    if (fbErr) throw fbErr
    return (fallback ?? []) as Member[]
  }

  type MemberRow = Member & { user_id?: string }
  return (data ?? []).map((m: MemberRow) => ({
    ...m,
    is_current_user: currentUserId ? m.user_id === currentUserId : false,
  })) as Member[]
}

/** Fetch a single member by ID from the members table. */
export async function getMember(memberId: string): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('id', memberId)
    .single()

  if (error) throw error
  return data as Member
}

/**
 * Fetches a single member with profile data (email, full_name from member_profiles view).
 * Falls back to members table if the view is unavailable.
 */
export async function getMemberProfile(memberId: string): Promise<Member> {
  const { data, error } = await (supabase
    .from('member_profiles' as any) as any)
    .select('*')
    .eq('id', memberId)
    .single()

  if (error) {
    const { data: fallback, error: fbErr } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single()
    if (fbErr) throw fbErr
    return fallback as Member
  }
  return data as Member
}

export async function updateMemberRole(
  memberId: string,
  role: Role,
): Promise<Member> {
  const { data, error } = await (supabase
    .from('members') as any)
    .update({ role })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data as Member
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export async function createInvitation(
  communityId: string,
  email: string,
  role: Role,
  userId: string,
): Promise<Invitation> {
  const { data, error } = await (supabase
    .from('invitations') as any)
    .insert({
      community_id: communityId,
      email,
      role,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error
  return data as Invitation
}

export async function getInvitations(
  communityId: string,
): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Invitation[]
}

// ---------------------------------------------------------------------------
// Communities
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9áéíóúñ-]/g, '')
    .replace(/-+/g, '-')
}

export async function createCommunity(
  userId: string,
  data: { name: string; type?: string; description?: string },
): Promise<Community> {
  const slug = `${slugify(data.name)}-${crypto.randomUUID().slice(0, 6)}`

  // Use RPC to atomically create community + admin member in one transaction.
  // This avoids the RLS race condition where .select() after INSERT fails
  // because the user isn't yet a member (SELECT policy checks membership).
  const { data: result, error } = await (supabase as any).rpc('create_community_with_admin', {
    p_user_id: userId,
    p_name: data.name,
    p_slug: slug,
    p_type: data.type ?? 'residential',
    p_description: data.description ?? null,
  })

  if (error) {
    // Fallback: if RPC not available yet, try the old way
    logger.warn('create_community_with_admin RPC not available, falling back:', error.message)
    const { data: community, error: communityError } = await (supabase
      .from('communities') as any)
      .insert({
        name: data.name,
        slug,
        type: data.type ?? 'residential',
        ...(data.description ? { description: data.description } : {}),
      })
      .select()
      .single()

    if (communityError) throw communityError
    await joinCommunity(community.id, userId, 'admin')
    return community as Community
  }

  return result as Community
}

export async function getUserCommunities(
  userId: string,
): Promise<Community[]> {
  const { data, error } = await supabase
    .from('members')
    .select(
      `
      communities:community_id (
        id,
        name,
        slug,
        type,
        description,
        config,
        rules,
        created_at,
        updated_at
      )
    `,
    )
    .eq('user_id', userId)

  if (error) throw error

  return (data ?? []).map((row: { communities?: unknown }) => row.communities as Community | null).filter(Boolean) as Community[]
}

export async function joinCommunity(
  communityId: string,
  userId: string,
  role: Role,
): Promise<Member> {
  const { data, error } = await (supabase
    .from('members') as any)
    .insert({
      community_id: communityId,
      user_id: userId,
      role,
    })
    .select()
    .single()

  if (error) throw error
  return data as Member
}


// ---------------------------------------------------------------------------
// Community fetching (for enriched context)
// ---------------------------------------------------------------------------

export async function getCommunity(communityId: string): Promise<Community> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .single()

  if (error) throw error
  return data as Community
}

export async function getCurrentMember(
  communityId: string,
  userId: string,
): Promise<Member | null> {
  const { data, error } = await (supabase
    .from('member_profiles' as any) as any)
    .select('*')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single()

  if (error) {
    const { data: fallback, error: fbErr } = await supabase
      .from('members')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .single()
    if (fbErr) return null
    return fallback as Member
  }

  return data as Member
}

// ---------------------------------------------------------------------------
// Member lifecycle
// ---------------------------------------------------------------------------

export async function deactivateMember(memberId: string): Promise<Member> {
  const { data, error } = await (supabase
    .from('members') as any)
    .update({ status: 'inactive' })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Member
}

export async function reactivateMember(memberId: string): Promise<Member> {
  const { data, error } = await (supabase
    .from('members') as any)
    .update({ status: 'active' })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Member
}

// ---------------------------------------------------------------------------
// Invitation acceptance
// ---------------------------------------------------------------------------

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (error) return null
  return data as Invitation
}

export async function acceptInvitation(token: string, userId: string): Promise<void> {
  const { error } = await (supabase as any).rpc('accept_invitation', {
    p_token: token,
    p_user_id: userId,
  })
  if (error) throw error
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await (supabase
    .from('invitations') as any)
    .update({ status: 'cancelled' })
    .eq('id', invitationId)

  if (error) throw error
}

export async function updateCommunity(
  communityId: string,
  updates: { name?: string; description?: string; config?: Record<string, unknown> },
): Promise<Community> {
  const { data, error } = await (supabase
    .from('communities') as any)
    .update(updates)
    .eq('id', communityId)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Community
}
