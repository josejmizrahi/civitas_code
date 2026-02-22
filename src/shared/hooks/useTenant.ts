import { useCommunityContext } from '@/app/providers'

export function useTenant() {
  const { communityId, currentMember, community, communityLoading } = useCommunityContext()
  const role = currentMember?.role ?? null

  return {
    communityId,
    community,
    membership: currentMember,
    role,
    communityLoading,
    isAdmin: role === 'admin' || role === 'platform_admin',
    isTreasurer: role === 'admin' || role === 'platform_admin' || role === 'tesorero',
    isVigilance: role === 'admin' || role === 'platform_admin' || role === 'comite_vigilancia',
  }
}
