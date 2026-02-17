import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getCensusSnapshots, takeCensusSnapshot, getLatestCensus, getPlatformCensus } from '../services/census.service'

export function useCensusSnapshots() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ['census', communityId],
    queryFn: () => getCensusSnapshots(communityId!),
    enabled: !!communityId,
  })
}

export function useLatestCensus() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ['census', 'latest', communityId],
    queryFn: () => getLatestCensus(communityId!),
    enabled: !!communityId,
  })
}

export function useTakeCensusSnapshot() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => takeCensusSnapshot(communityId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['census', communityId] })
      queryClient.invalidateQueries({ queryKey: ['census', 'latest', communityId] })
    },
  })
}

export function usePlatformCensus() {
  return useQuery({
    queryKey: ['platform-census'],
    queryFn: getPlatformCensus,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
