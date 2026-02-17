import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useAuth } from '@/app/providers'
import { getProposals, getProposal, createProposal, updateProposalStatus } from '../services/governance.service'
import type { FinancialInstruction } from '@/shared/types/rules'

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
    }) =>
      createProposal(communityId!, { ...proposal, created_by: user!.id, financial_instruction: proposal.financial_instruction as any }),
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
