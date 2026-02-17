import { useMemo } from 'react'
import { useCommunityContext } from '@/app/providers'
import { getCommunityRules, canPerformAction } from '@/shared/services/rules.service'
import type { CommunityRules, FinancialStanding } from '@/shared/types/rules'

export function useRulesEngine() {
  const { community, currentMember } = useCommunityContext()

  const rules: CommunityRules = useMemo(() => {
    if (!community) return getCommunityRules(null)
    return getCommunityRules(community.config, (community as any).rules)
  }, [community])

  const financialStanding: FinancialStanding = 
    ((currentMember as any)?.financial_standing as FinancialStanding) || 'good_standing'

  const checkAction = (action: 'vote' | 'propose' | 'delegate') => {
    if (!currentMember) return { allowed: false, reason: 'No eres miembro de esta comunidad' }
    return canPerformAction(action, currentMember.role, financialStanding, rules)
  }

  return {
    rules,
    financialStanding,
    canVote: checkAction('vote'),
    canPropose: checkAction('propose'),
    canDelegate: checkAction('delegate'),
    checkAction,
    isPaymentToVoteEnabled: rules.identity.payment_to_vote_enabled,
    treasuryMode: rules.treasury.mode,
  }
}
