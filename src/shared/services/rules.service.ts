import { supabase } from '@/shared/lib/supabase'
import type { CommunityRules, FinancialStanding } from '@/shared/types/rules'
import { DEFAULT_RULES } from '@/shared/types/rules'
import type { Role } from '@/shared/types'
import { AppError } from '@/shared/lib/errors'

export function getCommunityRules(config: Record<string, unknown> | null, rules?: Record<string, unknown> | null): CommunityRules {
  const raw = rules || config?.rules as Record<string, unknown> | undefined
  if (!raw) return { ...DEFAULT_RULES }
  return {
    governance: { ...DEFAULT_RULES.governance, ...(raw.governance as any || {}) },
    treasury: { ...DEFAULT_RULES.treasury, ...(raw.treasury as any || {}) },
    identity: { ...DEFAULT_RULES.identity, ...(raw.identity as any || {}) },
    compliance: { ...DEFAULT_RULES.compliance, ...(raw.compliance as any || {}) },
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

export type ProtectedAction =
  | 'create_proposal'
  | 'cast_vote'
  | 'delegate_vote'
  | 'endorse_proposal'
  | 'open_voting'
  | 'close_proposal'
  | 'execute_proposal'
  | 'register_transaction'
  | 'register_income'
  | 'approve_discretionary'
  | 'create_spend_request'
  | 'approve_spend_request'
  | 'execute_spend_request'
  | 'verify_spend_request'
  | 'cancel_spend_request'
  | 'create_emergency_spend'
  | 'reconcile_payment'
  | 'flag_transaction'
  | 'request_audit'
  | 'invite_member'
  | 'change_role'
  | 'modify_settings'
  | 'create_category'
  | 'export_report'
  | 'manage_assembly'
  | 'sign_minutes'

function hasRole(memberRole: Role, allowed: Role[]): boolean {
  return allowed.includes(memberRole)
}

function mapProtectedActionToRuleAction(action: ProtectedAction): 'vote' | 'propose' | 'delegate' | null {
  if (action === 'create_proposal' || action === 'endorse_proposal') return 'propose'
  if (action === 'cast_vote') return 'vote'
  if (action === 'delegate_vote') return 'delegate'
  return null
}

export async function assertCanPerformAction(
  communityId: string,
  memberId: string,
  action: ProtectedAction,
): Promise<void> {
  const [{ data: member, error: memberError }, { data: community, error: communityError }] = await Promise.all([
    supabase
      .from('members')
      .select('id, community_id, role, status, financial_standing')
      .eq('id', memberId)
      .eq('community_id', communityId)
      .single(),
    supabase
      .from('communities')
      .select('id, config, rules')
      .eq('id', communityId)
      .single(),
  ])

  if (memberError || !member) {
    throw new AppError('Miembro no encontrado en la comunidad activa.', 'NOT_FOUND')
  }
  if (communityError || !community) {
    throw new AppError('Comunidad no encontrada.', 'NOT_FOUND')
  }
  if (member.status !== 'active') {
    throw new AppError('Solo miembros activos pueden realizar esta acción.', 'FORBIDDEN')
  }

  const role = member.role as Role
  const rules = getCommunityRules(
    (community.config ?? null) as Record<string, unknown> | null,
    (community.rules ?? null) as Record<string, unknown> | null,
  )

  const roleGuards: Partial<Record<ProtectedAction, Role[]>> = {
    open_voting: ['admin', 'platform_admin'],
    close_proposal: ['admin', 'platform_admin'],
    execute_proposal: ['admin', 'platform_admin'],
    register_transaction: ['admin', 'platform_admin', 'tesorero'],
    register_income: ['admin', 'platform_admin', 'tesorero'],
    approve_discretionary: ['admin', 'platform_admin', 'comite_vigilancia'],
    create_spend_request: ['admin', 'platform_admin', 'tesorero'],
    approve_spend_request: ['admin', 'platform_admin', 'comite_vigilancia'],
    execute_spend_request: ['admin', 'platform_admin', 'tesorero'],
    verify_spend_request: ['admin', 'platform_admin', 'comite_vigilancia'],
    cancel_spend_request: ['admin', 'platform_admin', 'tesorero'],
    create_emergency_spend: ['admin', 'platform_admin', 'tesorero'],
    reconcile_payment: ['admin', 'platform_admin', 'tesorero'],
    flag_transaction: ['admin', 'platform_admin', 'comite_vigilancia'],
    request_audit: ['admin', 'platform_admin', 'comite_vigilancia', 'miembro'],
    invite_member: ['admin', 'platform_admin'],
    change_role: ['admin', 'platform_admin'],
    modify_settings: ['admin', 'platform_admin'],
    create_category: ['admin', 'platform_admin', 'tesorero'],
    export_report: ['admin', 'platform_admin', 'tesorero', 'comite_vigilancia', 'miembro'],
    manage_assembly: ['admin', 'platform_admin'],
    sign_minutes: ['admin', 'platform_admin', 'comite_vigilancia'],
  }

  const allowedRoles = roleGuards[action]
  if (allowedRoles && !hasRole(role, allowedRoles)) {
    throw new AppError('Tu rol no tiene permiso para realizar esta acción.', 'FORBIDDEN')
  }

  const mappedAction = mapProtectedActionToRuleAction(action)
  if (!mappedAction) return

  const check = canPerformAction(mappedAction, role, member.financial_standing as FinancialStanding, rules)
  if (!check.allowed) {
    throw new AppError(check.reason ?? 'No autorizado por reglas de la comunidad.', 'FORBIDDEN')
  }
}
