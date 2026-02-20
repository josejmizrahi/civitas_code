import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getEndorsements,
  addEndorsement,
  removeEndorsement,
} from '../services/governance.service'
import { awardXp } from '@/core/gamification/services/gamification.service'

export function useEndorsements(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['endorsements', proposalId],
    queryFn: () => getEndorsements(proposalId!),
    enabled: !!proposalId,
  })
}

export function useAddEndorsement() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ proposalId, memberId }: { proposalId: string; memberId: string }) =>
      addEndorsement(proposalId, memberId, communityId!),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['endorsements', variables.proposalId] })
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
      // Award XP for endorsing
      if (communityId) {
        awardXp(variables.memberId, communityId, 'endorse', { proposal_id: variables.proposalId }).catch(() => {})
      }
    },
  })
}

export function useRemoveEndorsement() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ proposalId, memberId }: { proposalId: string; memberId: string }) =>
      removeEndorsement(proposalId, memberId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['endorsements', variables.proposalId] })
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
    },
  })
}
