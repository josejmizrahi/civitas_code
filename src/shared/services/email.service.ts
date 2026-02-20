import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'

/**
 * Fire-and-forget email via the send-email Edge Function.
 * Never throws — email failures must not break the calling flow.
 */
export async function sendEmail(
  to: string,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { to, type, data },
    })
    if (error) logger.warn(`[email] Failed to send "${type}" to ${to}:`, error.message)
  } catch (err) {
    logger.warn(`[email] Failed to send "${type}" to ${to}:`, err)
  }
}

/**
 * Send an email of the given type to every active member in a community.
 * Fetches member emails from auth metadata via member_profiles, then
 * fires each email independently (no single failure blocks the rest).
 */
export async function sendEmailToMembers(
  communityId: string,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: members, error } = await supabase
      .from('members')
      .select('user_id')
      .eq('community_id', communityId)
      .eq('status', 'active')

    if (error || !members?.length) return

    const { data: profiles } = await (supabase as any).rpc('get_member_emails', {
      p_user_ids: members.map((m: any) => m.user_id),
    })

    if (!profiles?.length) {
      // Fallback: try auth.users via profiles view
      const { data: fallbackProfiles } = await supabase
        .from('member_profiles')
        .select('email')
        .eq('community_id', communityId)
        .eq('status', 'active')

      const emails = (fallbackProfiles ?? [])
        .map((p: any) => p.email)
        .filter(Boolean) as string[]

      for (const email of emails) {
        sendEmail(email, type, data)
      }
      return
    }

    for (const profile of profiles as { email: string }[]) {
      if (profile.email) {
        sendEmail(profile.email, type, data)
      }
    }
  } catch (err) {
    logger.warn(`[email] Failed to send "${type}" to community ${communityId}:`, err)
  }
}
