import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getDashboardStats } from '../services/treasury.service'

export function useDashboard() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['dashboard', communityId],
    queryFn: () => getDashboardStats(communityId!),
    enabled: !!communityId,
  })
}
