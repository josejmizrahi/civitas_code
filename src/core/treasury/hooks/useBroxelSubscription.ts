import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getCommunityIfpeStatus,
  getBroxelApplication,
  upsertBroxelApplicationDraft,
  submitBroxelApplication,
  type IfpeApplicationPayload,
} from '../services/broxel-subscription.service'

export function useCommunityIfpeStatus() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ['community-ifpe-status', communityId],
    queryFn: () => getCommunityIfpeStatus(communityId!),
    enabled: !!communityId,
  })
}

export function useBroxelApplication() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ['broxel-application', communityId],
    queryFn: () => getBroxelApplication(communityId!),
    enabled: !!communityId,
  })
}

export function useUpsertBroxelDraft() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (payload: Partial<IfpeApplicationPayload>) =>
      upsertBroxelApplicationDraft(communityId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broxel-application'] })
    },
  })
}

export function useSubmitBroxelApplication() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: () => submitBroxelApplication(communityId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broxel-application'] })
      queryClient.invalidateQueries({ queryKey: ['community-ifpe-status'] })
      queryClient.invalidateQueries({ queryKey: ['community', communityId] })
    },
  })
}
