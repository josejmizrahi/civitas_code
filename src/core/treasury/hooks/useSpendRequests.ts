import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import * as spendRequestService from '../services/spend-request.service'
import type { SpendRequestStatus } from '../types'

export function useSpendRequests(filters?: { status?: SpendRequestStatus | SpendRequestStatus[]; category_id?: string }) {
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useQuery({
    queryKey: ['spend-requests', communityId, filters],
    queryFn: () => spendRequestService.listSpendRequests(communityId, filters),
    enabled: !!communityId,
  })
}

export function useSpendRequest(id: string | null) {
  return useQuery({
    queryKey: ['spend-request', id],
    queryFn: () => (id ? spendRequestService.getSpendRequest(id) : null),
    enabled: !!id,
  })
}

export function useCreateSpendRequest() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: (vars: {
      requestedByUserId: string
      title: string
      description?: string
      amount: number
      category_id: string
      fund?: string
      beneficiary_entity_id?: string | null
      evidence_url?: string | null
      is_emergency?: boolean
    }) => {
      const { requestedByUserId, ...payload } = vars
      return spendRequestService.createSpendRequest(communityId, requestedByUserId, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spend-requests', communityId] })
    },
  })
}

export function useSubmitSpendRequest() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: ({ spendRequestId, requestedByUserId }: { spendRequestId: string; requestedByUserId: string }) =>
      spendRequestService.submitSpendRequest(communityId, spendRequestId, requestedByUserId),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['spend-request', spendRequestId] })
    },
  })
}

export function useApproveSpendRequest() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: ({
      spendRequestId,
      approvedByUserId,
      note,
    }: {
      spendRequestId: string
      approvedByUserId: string
      note?: string
    }) => spendRequestService.approveSpendRequest(communityId, spendRequestId, approvedByUserId, note),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['spend-request', spendRequestId] })
    },
  })
}

export function useRejectSpendRequest() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: ({
      spendRequestId,
      rejectedByUserId,
      reason,
    }: {
      spendRequestId: string
      rejectedByUserId: string
      reason: string
    }) => spendRequestService.rejectSpendRequest(communityId, spendRequestId, rejectedByUserId, reason),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['spend-request', spendRequestId] })
    },
  })
}

export function useExecuteSpendRequest() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: ({
      spendRequestId,
      executedByUserId,
      paymentReference,
    }: {
      spendRequestId: string
      executedByUserId: string
      paymentReference?: string
    }) =>
      spendRequestService.executeSpendRequest(communityId, spendRequestId, executedByUserId, paymentReference),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['spend-request', spendRequestId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useVerifySpendRequest() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: ({
      spendRequestId,
      verifiedByUserId,
      note,
    }: {
      spendRequestId: string
      verifiedByUserId: string
      note?: string
    }) => spendRequestService.verifySpendRequest(communityId, spendRequestId, verifiedByUserId, note),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['spend-request', spendRequestId] })
    },
  })
}

export function useCancelSpendRequest() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: ({ spendRequestId, cancelledByUserId }: { spendRequestId: string; cancelledByUserId: string }) =>
      spendRequestService.cancelSpendRequest(communityId, spendRequestId, cancelledByUserId),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['spend-request', spendRequestId] })
    },
  })
}

export function useClassifySpendRequest() {
  return useMutation({
    mutationFn: (spendRequestId: string) => spendRequestService.classifySpendRequest(spendRequestId),
  })
}

/** Creates a governance proposal linked to an N3 spend request */
export function useCreateProposalForSpendRequest() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: ({ spendRequestId, createdByUserId }: { spendRequestId: string; createdByUserId: string }) =>
      spendRequestService.createProposalForSpendRequest(communityId, spendRequestId, createdByUserId),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-requests', communityId] })
      queryClient.invalidateQueries({ queryKey: ['spend-request', spendRequestId] })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })
}

export function useSpendRequestAttachments(spendRequestId: string | null) {
  return useQuery({
    queryKey: ['spend-request-attachments', spendRequestId],
    queryFn: () => (spendRequestId ? spendRequestService.listSpendRequestAttachments(spendRequestId) : []),
    enabled: !!spendRequestId,
  })
}

export function useAddSpendRequestAttachment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ spendRequestId, ...payload }: {
      spendRequestId: string
      type: string
      file_url: string
      description?: string
      uploaded_by?: string
    }) => spendRequestService.addSpendRequestAttachment(spendRequestId, payload),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-request-attachments', spendRequestId] })
    },
  })
}

export function useSpendRequestComments(spendRequestId: string | null) {
  return useQuery({
    queryKey: ['spend-request-comments', spendRequestId],
    queryFn: () => (spendRequestId ? spendRequestService.listSpendRequestComments(spendRequestId) : []),
    enabled: !!spendRequestId,
  })
}

export function useAddSpendRequestComment() {
  const queryClient = useQueryClient()
  const { community } = useCommunityContext()
  const communityId = community?.id ?? ''

  return useMutation({
    mutationFn: ({ spendRequestId, userId, content }: {
      spendRequestId: string
      userId: string
      content: string
    }) => spendRequestService.addSpendRequestComment(communityId, spendRequestId, userId, content),
    onSuccess: (_, { spendRequestId }) => {
      queryClient.invalidateQueries({ queryKey: ['spend-request-comments', spendRequestId] })
    },
  })
}
