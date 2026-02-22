import { useCommunityContext } from '@/app/providers'

export type TenantStanding = 'good_standing' | 'grace_period' | 'delinquent' | 'suspended' | 'moroso' | null

export function useTenant() {
  const { communityId, currentMember, community, communityLoading } = useCommunityContext()
  const role = currentMember?.role ?? null
  const standing: TenantStanding =
    (currentMember?.financial_standing as TenantStanding) ?? null
  const isObserver = role === 'observador'
  const canVote =
    !isObserver &&
    standing !== 'moroso' &&
    (standing === 'good_standing' || standing === 'grace_period' || standing === null)

  return {
    communityId,
    community,
    membership: currentMember,
    role,
    standing,
    communityLoading,
    isAdmin: role === 'admin' || role === 'platform_admin',
    isTreasurer: role === 'admin' || role === 'platform_admin' || role === 'tesorero',
    isVigilance: role === 'admin' || role === 'platform_admin' || role === 'comite_vigilancia',
    isObserver,
    canVote,
  }
}
