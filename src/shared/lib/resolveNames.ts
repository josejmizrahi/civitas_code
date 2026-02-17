import { supabase } from './supabase'

/**
 * Resolves auth.users UUIDs to display names via member_profiles.
 * Maps user_id → full_name for the given community.
 */
export async function resolveUserNames(
  communityId: string,
  userIds: string[]
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map()
  const { data } = await supabase
    .from('member_profiles')
    .select('user_id, full_name')
    .eq('community_id', communityId)
    .in('user_id', userIds)
  return new Map((data ?? []).map((d: any) => [d.user_id, d.full_name]))
}

/**
 * Resolves member IDs to display names via member_profiles.
 * Maps member.id → full_name for the given community.
 */
export async function resolveMemberNames(
  communityId: string,
  memberIds: string[]
): Promise<Map<string, string>> {
  if (memberIds.length === 0) return new Map()
  const { data } = await supabase
    .from('member_profiles')
    .select('id, full_name')
    .eq('community_id', communityId)
    .in('id', memberIds)
  return new Map((data ?? []).map((d: any) => [d.id, d.full_name]))
}
