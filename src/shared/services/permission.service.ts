import { supabase } from '@/shared/lib/supabase'
import { AppError } from '@/shared/lib/errors'
import { getCommunityRules } from '@/shared/services/rules.service'
import { canPerformAction } from '@/shared/services/rules.service'
import { hasPermission, type Role } from '@/shared/types'
import type { FinancialStanding } from '@/shared/types/rules'

/** Actions that require explicit permission check in backend (see P0 security contract). */
export type PermissionAction =
  | 'create_proposal'
  | 'cast_vote'
  | 'start_discussion'
  | 'open_voting'
  | 'close_proposal'
  | 'execute_proposal'
  | 'reconcile_payment'
  | 'create_transaction'
  | 'create_payment_obligation'
  | 'mark_obligation_paid'

export interface MemberRoleInfo {
  role: Role | string
  memberId: string
  financialStanding?: FinancialStanding
}

/** Fetch current user's role and optional financial standing in the community. */
export async function getMemberRoleAndStanding(
  communityId: string,
  userId: string
): Promise<MemberRoleInfo | null> {
  const { data: member, error } = await supabase
    .from('members')
    .select('id, role, financial_standing')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new AppError(error.message, 'SUPABASE', { context: { communityId, userId } })
  if (!member) return null

  const role = (member.role ?? 'observador') as Role | string
  const financialStanding = (member.financial_standing as FinancialStanding | undefined) ?? 'good_standing'
  return {
    role,
    memberId: member.id,
    financialStanding,
  }
}

/** Assert that the user can perform the given action in the community; throws AppError if not. */
export async function assertCanPerformAction(
  communityId: string,
  userId: string,
  action: PermissionAction,
  context?: { memberId?: string; proposalId?: string }
): Promise<void> {
  const info = await getMemberRoleAndStanding(communityId, userId)
  if (!info) {
    throw new AppError('No eres miembro de esta comunidad', 'FORBIDDEN', { context: { communityId, action } })
  }

  const role = info.role as Role

  // Admin-only governance actions
  const adminOnlyActions: PermissionAction[] = [
    'start_discussion',
    'open_voting',
    'close_proposal',
    'execute_proposal',
  ]
  if (adminOnlyActions.includes(action)) {
    if (!hasPermission(role, 'admin')) {
      throw new AppError('Solo un administrador puede realizar esta acción', 'FORBIDDEN', { context: { action } })
    }
    return
  }

  // Treasury: admin or tesorero
  const treasuryActions: PermissionAction[] = [
    'reconcile_payment',
    'create_transaction',
    'create_payment_obligation',
    'mark_obligation_paid',
  ]
  if (treasuryActions.includes(action)) {
    if (!hasPermission(role, 'admin') && !hasPermission(role, 'tesorero')) {
      throw new AppError('No tienes permiso para realizar esta acción de tesorería', 'FORBIDDEN', { context: { action } })
    }
    return
  }

  // create_proposal: role must be allowed by rules (proposal_rights) and canPerformAction('propose')
  if (action === 'create_proposal') {
    const { data: community } = await supabase
      .from('communities')
      .select('config, rules')
      .eq('id', communityId)
      .single()
    const comm = community as { config?: Record<string, unknown>; rules?: Record<string, unknown> } | null
    const rules = getCommunityRules(comm?.config ?? null, comm?.rules ?? null)
    const allowedRoles = rules.governance.proposal_rights ?? ['admin', 'tesorero', 'miembro']
    if (!allowedRoles.includes(role)) {
      throw new AppError('Tu rol no tiene permiso para crear propuestas', 'FORBIDDEN', { context: { action } })
    }
    const check = canPerformAction('propose', role, info.financialStanding ?? 'good_standing', rules)
    if (!check.allowed) {
      throw new AppError(check.reason ?? 'No puedes crear propuestas', 'FORBIDDEN', { context: { action } })
    }
    return
  }

  // cast_vote: must be member with vote permission and canPerformAction('vote')
  if (action === 'cast_vote') {
    const memberId = context?.memberId ?? info.memberId
    const { data: community } = await supabase
      .from('communities')
      .select('config, rules')
      .eq('id', communityId)
      .single()
    const comm = community as { config?: Record<string, unknown>; rules?: Record<string, unknown> } | null
    const rules = getCommunityRules(comm?.config ?? null, comm?.rules ?? null)
    const check = canPerformAction('vote', role, info.financialStanding ?? 'good_standing', rules)
    if (!check.allowed) {
      throw new AppError(check.reason ?? 'No puedes votar en esta propuesta', 'FORBIDDEN', { context: { action, memberId } })
    }
    if (!hasPermission(role, 'miembro')) {
      throw new AppError('Solo los miembros pueden votar', 'FORBIDDEN', { context: { action } })
    }
    return
  }

  throw new AppError(`Acción no reconocida: ${action}`, 'VALIDATION', { context: { action } })
}
