import { supabase } from '@/shared/lib/supabase'
import { sendEmail } from '@/shared/services/email.service'
import type { Member, MorosoNotice, MorosoNoticeType } from '../types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DebtSummary {
  ordinary_unpaid: number
  extraordinary_unpaid: number
  total_debt: number
  is_moroso: boolean
  moroso_since: string | null
  restrictions: string[]
}

export interface MorosoChangeRecord {
  member_id: string
  old_standing: string
  new_standing: string
  ordinary_unpaid: number
  extraordinary_unpaid: number
}

// ---------------------------------------------------------------------------
// Compute moroso status (batch, via SQL function)
// ---------------------------------------------------------------------------

/**
 * Batch-recompute moroso status for all active members in a community.
 * Calls the `compute_moroso_status` SQL function which evaluates thresholds
 * from community rules and updates financial_standing accordingly.
 *
 * Returns a list of members whose standing changed.
 */
export async function computeMorosoStatus(
  communityId: string,
): Promise<MorosoChangeRecord[]> {
  const { data, error } = await (supabase as any).rpc('compute_moroso_status', {
    p_community_id: communityId,
  })

  if (error) throw error
  return (data ?? []) as MorosoChangeRecord[]
}

// ---------------------------------------------------------------------------
// Get moroso members
// ---------------------------------------------------------------------------

/**
 * Fetches all active members with financial_standing = 'moroso'
 * for the given community.
 */
export async function getMorosoMembers(
  communityId: string,
): Promise<Member[]> {
  const { data, error } = await (supabase
    .from('member_profiles' as any) as any)
    .select('*')
    .eq('community_id', communityId)
    .eq('financial_standing', 'moroso')
    .eq('status', 'active')
    .order('moroso_since', { ascending: true })

  if (error) {
    // Fallback: if view doesn't exist, use plain members table
    const { data: fallback, error: fbErr } = await supabase
      .from('members')
      .select('*')
      .eq('community_id', communityId)
      .eq('financial_standing' as any, 'moroso')
      .eq('status' as any, 'active')
      .order('moroso_since' as any, { ascending: true })

    if (fbErr) throw fbErr
    return (fallback ?? []) as Member[]
  }

  return (data ?? []) as Member[]
}

// ---------------------------------------------------------------------------
// Get member debt summary
// ---------------------------------------------------------------------------

/**
 * Returns a detailed debt breakdown for a single member,
 * including moroso status and applicable restrictions.
 */
export async function getMemberDebtSummary(
  memberId: string,
): Promise<DebtSummary> {
  const { data, error } = await (supabase as any).rpc('get_member_debt_summary', {
    p_member_id: memberId,
  })

  if (error) throw error

  // The RPC returns a single row as an array
  const row = Array.isArray(data) ? data[0] : data

  if (!row) {
    return {
      ordinary_unpaid: 0,
      extraordinary_unpaid: 0,
      total_debt: 0,
      is_moroso: false,
      moroso_since: null,
      restrictions: [],
    }
  }

  return {
    ordinary_unpaid: Number(row.ordinary_unpaid ?? 0),
    extraordinary_unpaid: Number(row.extraordinary_unpaid ?? 0),
    total_debt: Number(row.total_debt ?? 0),
    is_moroso: Boolean(row.is_moroso),
    moroso_since: row.moroso_since ?? null,
    restrictions: Array.isArray(row.restrictions)
      ? row.restrictions
      : typeof row.restrictions === 'string'
        ? (() => { try { return JSON.parse(row.restrictions) } catch { return [] } })()
        : [],
  }
}

// ---------------------------------------------------------------------------
// Notify morosos
// ---------------------------------------------------------------------------

/**
 * Marks all current moroso members as notified (sets moroso_notified_at).
 * In a production system this would also trigger email/push notifications.
 * For now, it updates the timestamp so the admin panel can track it.
 */
export async function notifyMorosos(
  communityId: string,
): Promise<void> {
  const { error } = await (supabase
    .from('members') as any)
    .update({ moroso_notified_at: new Date().toISOString() })
    .eq('community_id', communityId)
    .eq('financial_standing', 'moroso')

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Moroso notices (formal notifications per Art. 59 LPCI)
// ---------------------------------------------------------------------------

export async function getMorosoNotices(
  communityId: string,
): Promise<MorosoNotice[]> {
  const { data, error } = await supabase
    .from('moroso_notices')
    .select('*')
    .eq('community_id', communityId)
    .order('issued_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as MorosoNotice[]
}

export async function getMemberNotices(
  communityId: string,
  memberId: string,
): Promise<MorosoNotice[]> {
  const { data, error } = await supabase
    .from('moroso_notices')
    .select('*')
    .eq('community_id', communityId)
    .eq('member_id', memberId)
    .order('issued_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as MorosoNotice[]
}

export async function createMorosoNotice(
  communityId: string,
  memberId: string,
  noticeType: MorosoNoticeType,
  outstandingAmount: number,
  opts?: { assemblyId?: string; deadline?: string; obligations?: Record<string, unknown>[] },
): Promise<MorosoNotice> {
  const { data, error } = await supabase
    .from('moroso_notices')
    .insert({
      community_id: communityId,
      member_id: memberId,
      notice_type: noticeType,
      outstanding_amount: outstandingAmount,
      assembly_id: opts?.assemblyId ?? null,
      deadline: opts?.deadline ?? null,
      outstanding_obligations: (opts?.obligations ?? []) as unknown as any,
    })
    .select()
    .single()

  if (error) throw error

  const notice = data as MorosoNotice
  // Send moroso email to the affected member (fire-and-forget)
  Promise.resolve(
    supabase
      .from('member_profiles' as any)
      .select('email')
      .eq('id', memberId)
      .single()
  ).then(({ data: profile }) => {
    const email = (profile as any)?.email
    if (email) {
      sendEmail(email, 'moroso_notice', {
        overdue_count: opts?.obligations?.length ?? 1,
        total_debt: outstandingAmount,
        currency: 'MXN',
        community_name: communityId,
        app_url: window.location.origin,
      })
    }
  }).catch(() => {})

  return notice
}

export async function acknowledgeMorosoNotice(
  noticeId: string,
): Promise<void> {
  const { error } = await supabase
    .from('moroso_notices')
    .update({ status: 'acknowledged', response_at: new Date().toISOString() })
    .eq('id', noticeId)

  if (error) throw error
}

export async function resolveMorosoNotice(
  noticeId: string,
): Promise<void> {
  const { error } = await supabase
    .from('moroso_notices')
    .update({ status: 'resolved', response_at: new Date().toISOString() })
    .eq('id', noticeId)

  if (error) throw error
}
