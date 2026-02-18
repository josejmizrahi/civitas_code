import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useAuth } from '@/app/providers'
import {
  getProposals,
  getProposal,
  createProposal,
  updateProposalStatus,
  startDiscussion,
  openVotingFromDiscussion,
  declareOutcome,
  appealProposal,
} from '../services/governance.service'
import type { FinancialInstruction } from '@/shared/types/rules'
import type { VotingModel } from '@/shared/types'

export function useProposals(status?: string) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['proposals', communityId, status],
    queryFn: () => getProposals(communityId!, status),
    enabled: !!communityId,
  })
}

export function useProposal(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['proposal', proposalId],
    queryFn: () => getProposal(proposalId!),
    enabled: !!proposalId,
  })
}

export function useCreateProposal() {
  const { communityId } = useCommunityContext()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (proposal: {
      title: string
      description: string
      type: string
      quorum_required: number
      majority_required: number
      voting_start: string | null
      voting_end: string | null
      financial_instruction?: FinancialInstruction
      template_id?: string
      discussion_min_hours?: number
      voting_model?: VotingModel
      voting_options?: { id: string; label: string }[]
    }) =>
      createProposal(communityId!, {
        ...proposal,
        created_by: user!.id,
        financial_instruction: proposal.financial_instruction as any,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
    },
  })
}

export function useUpdateProposalStatus() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ proposalId, status }: { proposalId: string; status: string }) =>
      updateProposalStatus(proposalId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
    },
  })
}

// ---------------------------------------------------------------------------
// Lifecycle hooks — GV-001, GV-006, GV-043
// ---------------------------------------------------------------------------

export function useStartDiscussion() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ proposalId, discussionHours }: { proposalId: string; discussionHours: number }) =>
      startDiscussion(proposalId, communityId!, discussionHours),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
    },
  })
}

export function useOpenVoting() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ proposalId, votingEnd }: { proposalId: string; votingEnd: string | null }) =>
      openVotingFromDiscussion(proposalId, communityId!, votingEnd),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
    },
  })
}

export function useDeclareOutcome() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ proposalId, outcome, userId }: { proposalId: string; outcome: string; userId: string }) =>
      declareOutcome(proposalId, outcome, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
    },
  })
}

export function useAppealProposal() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ proposalId, userId }: { proposalId: string; userId: string }) =>
      appealProposal(proposalId, communityId!, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals', communityId] })
      queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] })
    },
  })
}
