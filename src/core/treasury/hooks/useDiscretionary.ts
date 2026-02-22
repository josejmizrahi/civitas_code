import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  createDiscretionaryApproval,
  getDiscretionaryApprovals,
  respondDiscretionaryApproval,
} from '../services/treasury.service'

export function useDiscretionaryApprovals(status?: 'pending' | 'approved' | 'rejected') {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ['discretionary-approvals', communityId, status ?? 'all'],
    queryFn: () => getDiscretionaryApprovals(communityId!, status),
    enabled: !!communityId,
  })
}

export function useCreateDiscretionaryApproval() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      requested_by_member_id: string
      amount: number
      description: string
      category_id?: string | null
      beneficiary_entity_id?: string | null
    }) => createDiscretionaryApproval(communityId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discretionary-approvals'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useRespondDiscretionaryApproval() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      approvalId: string
      responderMemberId: string
      decision: 'approved' | 'rejected'
      responseNote?: string
    }) => respondDiscretionaryApproval(
      payload.approvalId,
      payload.responderMemberId,
      payload.decision,
      payload.responseNote,
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discretionary-approvals'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
