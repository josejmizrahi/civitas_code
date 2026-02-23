import { supabase } from '@/shared/lib/supabase'
import type { Announcement } from '../types'

export async function getAnnouncements(communityId: string, memberId?: string): Promise<Announcement[]> {
  const { data, error } = await (supabase as any)
    .from('announcements')
    .select('*')
    .eq('community_id', communityId)
    .order('pinned', { ascending: false })
    .order('published_at', { ascending: false })

  if (error) throw error

  const announcements = (data ?? []) as Announcement[]

  if (memberId && announcements.length > 0) {
    const { data: reads } = await (supabase as any)
      .from('announcement_reads')
      .select('announcement_id')
      .eq('member_id', memberId)
      .in('announcement_id', announcements.map((a) => a.id))

    const readSet = new Set((reads ?? []).map((r: { announcement_id: string }) => r.announcement_id))
    return announcements.map((a) => ({ ...a, read: readSet.has(a.id) }))
  }

  return announcements
}

export async function createAnnouncement(
  communityId: string,
  authorId: string,
  announcement: { title: string; body: string; priority?: string; pinned?: boolean; expires_at?: string | null },
): Promise<Announcement> {
  const { data, error } = await (supabase as any)
    .from('announcements')
    .insert({
      community_id: communityId,
      author_id: authorId,
      ...announcement,
    })
    .select()
    .single()

  if (error) throw error
  return data as Announcement
}

export async function updateAnnouncement(
  announcementId: string,
  updates: { title?: string; body?: string; priority?: string; pinned?: boolean; expires_at?: string | null },
): Promise<Announcement> {
  const { data, error } = await (supabase as any)
    .from('announcements')
    .update(updates)
    .eq('id', announcementId)
    .select()
    .single()

  if (error) throw error
  return data as Announcement
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('announcements')
    .delete()
    .eq('id', announcementId)

  if (error) throw error
}

export async function markAnnouncementRead(announcementId: string, memberId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('announcement_reads')
    .upsert({ announcement_id: announcementId, member_id: memberId }, { onConflict: 'announcement_id,member_id' })

  if (error) throw error
}
