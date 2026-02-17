import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useAuth } from '@/app/providers'
import { getDataSources, createDataSource } from '../services/ingestion.service'

export function useDataSources() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['data-sources', communityId],
    queryFn: () => getDataSources(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateDataSource() {
  const { communityId } = useCommunityContext()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (source: { name: string; type: string }) =>
      createDataSource(communityId!, { ...source, created_by: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-sources', communityId] })
    },
  })
}
