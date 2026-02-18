import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getDecisionArchive, searchDecisions } from '../services/accountability.service'

export function useDecisionArchive() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['decision-archive', communityId],
    queryFn: () => getDecisionArchive(communityId!),
    enabled: !!communityId,
  })
}

export function useSearchDecisions(query: string) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['decision-search', communityId, query],
    queryFn: () => searchDecisions(communityId!, query),
    enabled: !!communityId && query.length >= 2,
    staleTime: 60_000,
  })
}
