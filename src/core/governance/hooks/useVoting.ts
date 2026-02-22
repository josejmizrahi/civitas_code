import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getVotes,
  castVote,
  castVoteWithDelegations,
  getMemberVoteWeight,
  getVoteSummary,
  closeProposal,
  approveMinutes,
  signMinutes,
  executeProposal,
} from '../services/governance.service'
export function useVotes(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['votes', proposalId],
    queryFn: () => getVotes(proposalId!),
    enabled: !!proposalId,
  })
}

export function useVoteSummary(
  proposalId: string | undefined,
  quorumRequired: number,
  majorityRequired: number
) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['vote-summary', proposalId, quorumRequired, majorityRequired],
    queryFn: () => getVoteSummary(proposalId!, communityId!, quorumRequired, majorityRequired),
    enabled: !!proposalId && !!communityId,
  })
}

export function useMemberVoteWeight(memberId: string | undefined) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ['member-vote-weight', communityId, memberId],
    queryFn: () => getMemberVoteWeight(memberId!, communityId!),
    enabled: !!communityId && !!memberId,
  })
}

export function useCastVote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (vote: { proposal_id: string; member_id: string; value: string }) =>
      castVote(vote),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['votes', variables.proposal_id] })
      queryClient.invalidateQueries({ queryKey: ['vote-summary', variables.proposal_id] })
    },
  })
}

export function useCastVoteWithDelegations() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({ proposalId, memberId, value, blockReason }: { proposalId: string; memberId: string; value: string; blockReason?: string }) =>
      castVoteWithDelegations(proposalId, memberId, value, communityId!, blockReason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['votes', variables.proposalId] })
      queryClient.invalidateQueries({ queryKey: ['vote-summary', variables.proposalId] })
    },
  })
}

export function useCloseProposal() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({ proposalId, userId }: { proposalId: string; userId: string }) =>
      closeProposal(proposalId, communityId!, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['vote-summary', variables.proposalId] })
    },
  })
}

export function useApproveMinutes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ minutesId, userId }: { minutesId: string; userId: string }) =>
      approveMinutes(minutesId, userId),
    onSuccess: (_data, _variables) => {
      queryClient.invalidateQueries({ queryKey: ['minutes'] })
    },
  })
}

export function useSignMinutes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ minutesId, memberId, memberName }: { minutesId: string; memberId: string; memberName: string }) =>
      signMinutes(minutesId, memberId, memberName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['minutes'] })
    },
  })
}

export function useExecuteProposal() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({ proposalId, userId }: { proposalId: string; userId: string }) =>
      executeProposal(proposalId, communityId!, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets', communityId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
