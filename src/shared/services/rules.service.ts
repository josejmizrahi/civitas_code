import { supabase } from '@/shared/lib/supabase'
import type { CommunityRules, FinancialStanding } from '@/shared/types/rules'
import { DEFAULT_RULES } from '@/shared/types/rules'
import type { Role } from '@/shared/types'

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
  rules: CommunityRules,
  changeReason?: string,
  proposalId?: string
): Promise<void> {
  // Snapshot current rules in rule_versions before updating
  const { data: nextVersion } = await (supabase as any).rpc('get_next_rule_version', {
    p_community_id: communityId,
  })

  const { data: { user } } = await supabase.auth.getUser()

  await supabase.from('rule_versions').insert({
    community_id: communityId,
    version_number: nextVersion ?? 1,
    rules: rules as any,
    changed_by: user?.id ?? null,
    change_reason: changeReason ?? null,
    proposal_id: proposalId ?? null,
  })

  const { error } = await supabase.from('communities')
    .update({ rules: rules as any })
    .eq('id', communityId)
  if (error) throw error
}

export async function getMemberFinancialStanding(
  memberId: string,
  communityId: string
): Promise<FinancialStanding> {
  const { data, error } = await (supabase as any).rpc('compute_financial_standing', {
    p_member_id: memberId,
    p_community_id: communityId,
  })
  if (error) return 'good_standing'
  return (data as FinancialStanding) || 'good_standing'
}

export async function refreshFinancialStandings(communityId: string): Promise<void> {
  const { error } = await (supabase as any).rpc('refresh_financial_standings', {
    p_community_id: communityId,
  })
  if (error) throw error
}

// Check if a member can perform an action based on rules
export function canPerformAction(
  action: 'vote' | 'propose' | 'delegate' | 'be_elected' | 'quorum_excluded',
  memberRole: Role | string,
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

  // Check moroso-specific restrictions (LPCI Art. 2, 36)
  if (financialStanding === 'moroso' && rules.identity.payment_to_vote_enabled) {
    if (rules.identity.moroso_restrictions.includes(action)) {
      if (action === 'vote') {
        return { allowed: false, reason: 'Como moroso, tienes voz pero no voto. Regulariza tus pagos para recuperar tus derechos. (Art. 2 LPCI)' }
      }
      if (action === 'be_elected') {
        return { allowed: false, reason: 'Los morosos no pueden ser electos para cargos de administración. (Art. 2 LPCI)' }
      }
      if (action === 'quorum_excluded') {
        return { allowed: true, reason: 'Los morosos son excluidos del cálculo de quórum. (Art. 2 LPCI)' }
      }
      return { allowed: false, reason: 'No puedes realizar esta acción por tener pagos vencidos (moroso). (Art. 2 LPCI)' }
    }
  }

  // Check financial standing restrictions for delinquent (non-moroso)
  if (rules.identity.payment_to_vote_enabled && financialStanding !== 'good_standing' && financialStanding !== 'moroso') {
    if (rules.identity.delinquent_restrictions.includes(action)) {
      if (financialStanding === 'grace_period') {
        return { allowed: true, reason: 'Estás en periodo de gracia. Regulariza tus pagos.' }
      }
      return { allowed: false, reason: 'No puedes realizar esta acción por tener pagos vencidos. Regulariza tus pagos para recuperar tus derechos.' }
    }
  }

  return { allowed: true }
}
