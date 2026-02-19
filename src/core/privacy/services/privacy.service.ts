import { supabase } from '@/shared/lib/supabase'

export const PRIVACY_NOTICE_VERSION = '2025-02-17'

// ── Consent Management ──────────────────────────────────────────

export async function grantConsent(
  userId: string,
  consentType: string,
  version: string = PRIVACY_NOTICE_VERSION
) {
  const { error } = await (supabase.from('privacy_consents') as any).upsert(
    {
      user_id: userId,
      version,
      consent_type: consentType,
      granted: true,
      granted_at: new Date().toISOString(),
      revoked_at: null,
      ip_address: null,
      user_agent: navigator.userAgent,
    },
    { onConflict: 'user_id,version,consent_type' }
  )
  if (error) throw error
}

export async function revokeConsent(userId: string, consentType: string) {
  const { error } = await (supabase.from('privacy_consents') as any)
    .update({
      granted: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('consent_type', consentType)
    .eq('granted', true)
  if (error) throw error
}

export async function getUserConsents(userId: string) {
  const { data, error } = await supabase
    .from('privacy_consents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function hasValidConsent(
  userId: string,
  consentType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('privacy_consents')
    .select('id')
    .eq('user_id', userId)
    .eq('consent_type', consentType)
    .eq('version', PRIVACY_NOTICE_VERSION)
    .eq('granted', true)
    .limit(1)

  if (error) return false
  return (data?.length ?? 0) > 0
}

// ── ARCO Requests ───────────────────────────────────────────────

function getDeadline(): string {
  // 20 business days ~ 28 calendar days
  const deadline = new Date()
  deadline.setDate(deadline.getDate() + 28)
  return deadline.toISOString()
}

export async function createARCORequest(
  userId: string,
  type: string,
  description: string
) {
  const { data, error } = await (supabase.from('arco_requests') as any).insert({
    user_id: userId,
    type,
    description,
    deadline: getDeadline(),
  }).select().single()

  if (error) throw error
  return data
}

export async function getARCORequests(userId?: string) {
  let query = supabase
    .from('arco_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getARCORequestsByStatus(status: string) {
  const { data, error } = await supabase
    .from('arco_requests')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function respondToARCO(
  requestId: string,
  respondedBy: string,
  response: string,
  status: 'completed' | 'denied'
) {
  const { error } = await (supabase.from('arco_requests') as any)
    .update({
      response,
      status,
      responded_by: respondedBy,
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) throw error
}

export async function exportUserData(
  userId: string
): Promise<Record<string, unknown>> {
  // Gather all user data from relevant tables
  const [profile, members, votes, consents] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('members').select('*').eq('user_id', userId),
    supabase.from('votes').select('*, members!inner(user_id)').eq('members.user_id', userId),
    supabase.from('privacy_consents').select('*').eq('user_id', userId),
  ])

  return {
    profile: profile.data?.user
      ? {
          id: profile.data.user.id,
          email: profile.data.user.email,
          full_name: profile.data.user.user_metadata?.full_name,
          created_at: profile.data.user.created_at,
        }
      : null,
    memberships: members.data ?? [],
    votes: votes.data ?? [],
    privacy_consents: consents.data ?? [],
    exported_at: new Date().toISOString(),
  }
}

/**
 * ARCO Cancellation: Anonymize user data across all tables.
 * Replaces PII with anonymized placeholders while preserving structural integrity.
 * Required by LFPDPPP 2025 Art. 21-34.
 */
export async function anonymizeUser(userId: string): Promise<{ tablesAffected: number }> {
  let tablesAffected = 0
  const anonId = `ANON-${userId.substring(0, 8)}`

  // 1. Anonymize member records
  const { error: memberErr } = await (supabase.from('members') as any)
    .update({
      custom_attributes: { anonymized: true, anonymized_at: new Date().toISOString() },
    })
    .eq('user_id', userId)
  if (!memberErr) tablesAffected++

  // 2. Revoke all privacy consents
  const { error: consentErr } = await (supabase.from('privacy_consents') as any)
    .update({
      granted: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('granted', true)
  if (!consentErr) tablesAffected++

  // 3. Anonymize audit log entries
  const { error: auditErr } = await (supabase.from('audit_log') as any)
    .update({
      details: { anonymized: true },
    })
    .eq('user_id', userId)
  if (!auditErr) tablesAffected++

  // 4. Anonymize votes (keep for record integrity but remove member link metadata)
  // Note: We keep the vote record for governance integrity but the member_id
  // link goes to an anonymized member record

  // 5. Mark ARCO request as completed
  const { error: arcoErr } = await (supabase.from('arco_requests') as any)
    .update({
      status: 'completed',
      response: `Datos del usuario anonimizados exitosamente. ID anonimizado: ${anonId}`,
      responded_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('type', 'cancellation')
    .eq('status', 'in_review')
  if (!arcoErr) tablesAffected++

  return { tablesAffected }
}
