import { supabase } from '@/shared/lib/supabase'

export interface Notification {
  id: string
  community_id: string
  member_id: string
  type: string
  title: string
  body: string | null
  metadata: Record<string, unknown>
  read: boolean
  created_at: string
}

export async function getNotifications(memberId: string, limit = 50): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as Notification[]
}

export async function getUnreadCount(memberId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('read', false)
  if (error) return 0
  return count ?? 0
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await (supabase.from('notifications') as any)
    .update({ read: true })
    .eq('id', notificationId)
  if (error) throw error
}

export async function markAllAsRead(memberId: string): Promise<void> {
  const { error } = await (supabase.from('notifications') as any)
    .update({ read: true })
    .eq('member_id', memberId)
    .eq('read', false)
  if (error) throw error
}

export async function notifyCommunity(
  communityId: string,
  type: string,
  title: string,
  body?: string,
  metadata?: Record<string, unknown>
): Promise<number> {
  const { data, error } = await (supabase as any).rpc('notify_community', {
    p_community_id: communityId,
    p_type: type,
    p_title: title,
    p_body: body ?? null,
    p_metadata: metadata ?? {},
  })
  if (error) { console.warn('notify_community failed:', error.message); return 0 }
  return (data as number) ?? 0
}

export async function notifyMember(
  communityId: string,
  memberId: string,
  type: string,
  title: string,
  body?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await (supabase as any).rpc('notify_member', {
    p_community_id: communityId,
    p_member_id: memberId,
    p_type: type,
    p_title: title,
    p_body: body ?? null,
    p_metadata: metadata ?? {},
  })
  if (error) console.warn('notify_member failed:', error.message)
}
