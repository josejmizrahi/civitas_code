import { useCommunityContext } from '@/app/providers'
import { mergeCommunityConfig } from '@/shared/config/community-config'

export function useCommunityConfig() {
  const { community } = useCommunityContext()

  const type = community?.type ?? 'other'
  const config = mergeCommunityConfig(community?.config, type)

  const rules = community?.rules as Record<string, unknown> | undefined
  const treasuryRules = rules?.treasury as Record<string, unknown> | undefined
  const mode = (config.treasury_mode ?? treasuryRules?.mode ?? 'manual') as string
  const separateFunds =
    config.separate_funds ??
    (treasuryRules?.reserva_fund_percentage != null && Number(treasuryRules.reserva_fund_percentage) > 0)
  const funds = Array.isArray(config.funds) && config.funds.length > 0
    ? config.funds
    : separateFunds
      ? ['mantenimiento', 'reserva']
      : ['general']

  return {
    vertical: config.vertical,
    memberLabel: config.member_label,
    entityLabel: config.entity_label,
    contributionLabel: config.contribution_label,
    votingWeight: config.voting_weight,
    membershipAttributes: config.membership_attributes,
    categories: config.financial_categories,
    separateFunds: Boolean(separateFunds),
    funds,
    treasuryMode: mode === 'ifpe' ? 'ifpe' : mode === 'hybrid' ? 'hybrid' : 'manual',
  }
}
