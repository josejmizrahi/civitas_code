import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getDelegations, createDelegation, revokeDelegation } from '../services/governance.service'
export function useDelegations() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['delegations', communityId],
    queryFn: () => getDelegations(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateDelegation() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (delegation: { from_member_id: string; to_member_id: string; scope: string }) =>
      createDelegation({ community_id: communityId!, ...delegation }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations', communityId] })
    },
  })
}

export function useRevokeDelegation() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (delegationId: string) => revokeDelegation(delegationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delegations', communityId] })
    },
  })
}
