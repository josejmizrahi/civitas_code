import { useCommunityContext } from '@/app/providers'
import { mergeCommunityConfig } from '@/shared/config/community-config'

export function useCommunityConfig() {
  const { community } = useCommunityContext()

  const type = community?.type ?? 'other'
  const config = mergeCommunityConfig(community?.config, type)

  return {
    vertical: config.vertical,
    memberLabel: config.member_label,
    entityLabel: config.entity_label,
    contributionLabel: config.contribution_label,
    votingWeight: config.voting_weight,
    membershipAttributes: config.membership_attributes,
    categories: config.financial_categories,
  }
}
