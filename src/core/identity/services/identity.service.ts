import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'
import { sendEmail } from '@/shared/services/email.service'
import { getCommunityConfigPreset, mergeCommunityConfig } from '@/shared/config/community-config'
import { DEFAULT_RULES } from '@/shared/types/rules'
import { getPresetForType } from '@/shared/config/vertical-presets'
import type { CommunityType } from '@/shared/types'
import type { Member, Invitation, Community } from '../types'

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  tesorero: 'Tesorero',
  miembro: 'Miembro',
  observador: 'Observador',
  comite_vigilancia: 'Comité de Vigilancia',
  platform_admin: 'Admin de Plataforma',
}

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
  role: string,
): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
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
  role: string,
  userId: string,
): Promise<Invitation> {
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      community_id: communityId,
      email,
      role,
      created_by: userId,
    })
    .select()
    .single()

  if (error) throw error

  const invitation = data as Invitation
  const inviteLink = `${window.location.origin}/invite/${invitation.token}`

  let communityName = ''
  let inviterName = ''
  try {
    const { data: community } = await supabase
      .from('communities')
      .select('name')
      .eq('id', communityId)
      .single()
    communityName = community?.name || ''

    const { data: { user } } = await supabase.auth.getUser()
    inviterName = user?.user_metadata?.full_name || ''
  } catch {
    // Non-critical — send the email even without enrichment
  }

  sendEmail(email, 'invitation', {
    invite_link: inviteLink,
    community_name: communityName,
    role,
    role_label: ROLE_LABELS[role] || role,
    inviter_name: inviterName,
    app_url: window.location.origin,
  })

  return invitation
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

function resolveCommunityType(type?: string): CommunityType {
  if (type === 'residential' || type === 'religious' || type === 'manufacturing' || type === 'cooperative' || type === 'other') {
    return type
  }
  return 'residential'
}

function hasNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && Object.keys(value as Record<string, unknown>).length > 0)
}

function getDefaultRulesForType(type: CommunityType): Record<string, unknown> {
  const preset = getPresetForType(type)
  return {
    ...DEFAULT_RULES,
    governance: { ...DEFAULT_RULES.governance, ...(preset?.rules.governance ?? {}) },
    treasury: { ...DEFAULT_RULES.treasury, ...(preset?.rules.treasury ?? {}) },
    identity: { ...DEFAULT_RULES.identity, ...(preset?.rules.identity ?? {}) },
  } as unknown as Record<string, unknown>
}

async function seedCommunityDefaults(communityId: string, type: CommunityType): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from('communities')
    .select('config, rules')
    .eq('id', communityId)
    .single()

  if (existingError) {
    logger.warn('Could not read community defaults after creation:', existingError.message)
    return
  }

  const updates: Record<string, unknown> = {}
  const existingConfig = existing?.config as unknown
  const existingRules = existing?.rules as unknown

  if (!hasNonEmptyObject(existingConfig)) {
    const configPreset = getCommunityConfigPreset(type)
    updates.config = mergeCommunityConfig(configPreset, type)
  }

  if (!hasNonEmptyObject(existingRules)) {
    updates.rules = getDefaultRulesForType(type)
  }

  if (Object.keys(updates).length === 0) return

  const { error: updateError } = await supabase
    .from('communities')
    .update(updates)
    .eq('id', communityId)

  if (updateError) {
    logger.warn('Could not seed community defaults after creation:', updateError.message)
  }
}

export async function createCommunity(
  userId: string,
  data: { name: string; type?: string; description?: string; slug?: string },
): Promise<Community> {
  const communityType = resolveCommunityType(data.type)
  const baseSlug = slugify((data.slug ?? '').trim() || data.name)
  const slug = (data.slug ?? '').trim().length > 0
    ? baseSlug || `comunidad-${crypto.randomUUID().slice(0, 6)}`
    : `${baseSlug || 'comunidad'}-${crypto.randomUUID().slice(0, 6)}`

  // Use RPC to atomically create community + admin member in one transaction.
  // This avoids the RLS race condition where .select() after INSERT fails
  // because the user isn't yet a member (SELECT policy checks membership).
  const { data: result, error } = await (supabase as any).rpc('create_community_with_admin', {
    p_user_id: userId,
    p_name: data.name,
    p_slug: slug,
    p_type: communityType,
    p_description: data.description ?? null,
  })

  if (error) {
    // Fallback: if RPC not available yet, try the old way
    logger.warn('create_community_with_admin RPC not available, falling back:', error.message)
    const { data: community, error: communityError } = await supabase
      .from('communities')
      .insert({
        name: data.name,
        slug,
        type: communityType,
        ...(data.description ? { description: data.description } : {}),
      })
      .select()
      .single()

    if (communityError) throw communityError
    await joinCommunity(community.id, userId, 'admin')
    await seedCommunityDefaults(community.id, communityType)
    return community as Community
  }

  const community = result as Community
  await seedCommunityDefaults(community.id, communityType)
  return community
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
  role: string,
): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
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
export async function isSlugAvailable(slug: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('communities')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)

  if (error) return true
  return (count ?? 0) === 0
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

export async function updateCommunityConfig(
  communityId: string,
  config: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabase
    .from('communities')
    .update({ config: config as any })
    .eq('id', communityId)

  if (error) throw error
}

export async function seedCommunityCategories(
  communityId: string,
  categories: { income: string[]; expense: string[] },
): Promise<void> {
  const { count, error: countError } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('community_id', communityId)

  if (countError) throw countError
  if ((count ?? 0) > 0) return

  const unique = <T extends string>(arr: T[]) => [...new Set(arr)]
  const income = unique(categories.income.map((n) => n.trim()).filter(Boolean))
  const expense = unique(categories.expense.map((n) => n.trim()).filter(Boolean))

  const rows = [
    ...income.map((name) => ({ community_id: communityId, name, type: 'income', is_system: true })),
    ...expense.map((name) => ({ community_id: communityId, name, type: 'expense', is_system: true })),
  ]
  if (rows.length === 0) return

  const { error } = await supabase
    .from('categories')
    .insert(rows as any)

  if (error) throw error
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
  const { data, error } = await supabase
    .from('members')
    .update({ status: 'inactive' })
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Member
}

export async function reactivateMember(memberId: string): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
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
  const { error } = await supabase
    .from('invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)

  if (error) throw error
}

export async function updateCommunity(
  communityId: string,
  updates: { name?: string; description?: string; config?: Record<string, unknown> },
): Promise<Community> {
  const { data, error } = await supabase
    .from('communities')
    .update(updates as any)
    .eq('id', communityId)
    .select()
    .single()

  if (error) throw error
  return data as unknown as Community
}
