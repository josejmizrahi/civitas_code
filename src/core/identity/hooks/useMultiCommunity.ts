import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/providers'
import { getUserCommunitiesOverview } from '../services/identity.service'

export function useMultiCommunityOverview() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['multi-community-overview', user?.id],
    queryFn: () => getUserCommunitiesOverview(user!.id),
    enabled: !!user?.id,
  })
}
