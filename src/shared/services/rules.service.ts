import { supabase } from '@/shared/lib/supabase'
import type { CommunityRules, FinancialStanding } from '@/shared/types/rules'
import { DEFAULT_RULES } from '@/shared/types/rules'

export function getCommunityRules(config: Record<string, unknown> | null, rules?: Record<string, unknown> | null): CommunityRules {
  const raw = rules || config?.rules as Record<string, unknown> | undefined
  if (!raw) return { ...DEFAULT_RULES }
  return {
    governance: { ...DEFAULT_RULES.governance, ...(raw.governance as any || {}) },
    treasury: { ...DEFAULT_RULES.treasury, ...(raw.treasury as any || {}) },
    identity: { ...DEFAULT_RULES.identity, ...(raw.identity as any || {}) },
  }
}

export async function updateCommunityRules(
  communityId: string,
  rules: CommunityRules
): Promise<void> {
  const { error } = await supabase.from('communities')
    .update({ rules: rules as any })
    .eq('id', communityId)
  if (error) throw error
}

export async function getMemberFinancialStanding(
  memberId: string,
  communityId: string
): Promise<FinancialStanding> {
  const { data, error } = await supabase.rpc('compute_financial_standing', {
    p_member_id: memberId,
    p_community_id: communityId,
  })
  if (error) return 'good_standing'
  return (data as FinancialStanding) || 'good_standing'
}

export async function refreshFinancialStandings(communityId: string): Promise<void> {
  const { error } = await supabase.rpc('refresh_financial_standings', {
    p_community_id: communityId,
  })
  if (error) throw error
}

// Check if a member can perform an action based on rules
export function canPerformAction(
  action: 'vote' | 'propose' | 'delegate',
  memberRole: string,
  financialStanding: FinancialStanding,
  rules: CommunityRules
): { allowed: boolean; reason?: string } {
  // Check role-based permission for proposals
  if (action === 'propose' && !rules.governance.proposal_rights.includes(memberRole)) {
    return { allowed: false, reason: 'Tu rol no tiene permiso para crear propuestas' }
  }

  // Check delegation permission
  if (action === 'delegate' && !rules.governance.delegation_enabled) {
    return { allowed: false, reason: 'La delegación está desactivada en esta comunidad' }
  }

  // Check financial standing restrictions
  if (rules.identity.payment_to_vote_enabled && financialStanding !== 'good_standing') {
    if (rules.identity.delinquent_restrictions.includes(action)) {
      if (financialStanding === 'grace_period') {
        return { allowed: true, reason: 'Estás en periodo de gracia. Regulariza tus pagos.' }
      }
      return { allowed: false, reason: 'No puedes realizar esta acción por tener pagos vencidos. Regulariza tus pagos para recuperar tus derechos.' }
    }
  }

  return { allowed: true }
}
