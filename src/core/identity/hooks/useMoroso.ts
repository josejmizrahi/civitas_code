import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  computeMorosoStatus,
  getMorosoMembers,
  getMemberDebtSummary,
  notifyMorosos,
  getMorosoNotices,
  getMemberNotices,
  createMorosoNotice,
  acknowledgeMorosoNotice,
  resolveMorosoNotice,
} from '../services/moroso.service'
import type { MorosoNoticeType } from '../types'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const morosoKeys = {
  all: ['moroso'] as const,
  members: (communityId: string) => [...morosoKeys.all, 'members', communityId] as const,
  debt: (memberId: string) => [...morosoKeys.all, 'debt', memberId] as const,
  notices: (communityId: string) => [...morosoKeys.all, 'notices', communityId] as const,
  memberNotices: (communityId: string, memberId: string) => [...morosoKeys.all, 'notices', communityId, memberId] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/**
 * Fetches all moroso members for the current community.
 */
export function useMorosoMembers() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: morosoKeys.members(communityId!),
    queryFn: () => getMorosoMembers(communityId!),
    enabled: !!communityId,
  })
}

/**
 * Fetches the debt summary for a specific member.
 */
export function useMemberDebt(memberId: string) {
  return useQuery({
    queryKey: morosoKeys.debt(memberId),
    queryFn: () => getMemberDebtSummary(memberId),
    enabled: !!memberId,
  })
}

/**
 * Fetches all moroso notices for the current community.
 */
export function useMorosoNotices() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: morosoKeys.notices(communityId!),
    queryFn: () => getMorosoNotices(communityId!),
    enabled: !!communityId,
  })
}

/**
 * Fetches moroso notices for a specific member.
 */
export function useMemberNotices(memberId: string | null) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: morosoKeys.memberNotices(communityId!, memberId!),
    queryFn: () => getMemberNotices(communityId!, memberId!),
    enabled: !!communityId && !!memberId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Triggers a batch recomputation of moroso status for all active members.
 * Invalidates both moroso and member queries on success.
 */
export function useComputeMorosoStatus() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: () => {
      if (!communityId) throw new Error('No community selected')
      return computeMorosoStatus(communityId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: morosoKeys.all })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

/**
 * Sends moroso notifications (updates moroso_notified_at).
 * Invalidates moroso members list on success.
 */
export function useNotifyMorosos() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: () => {
      if (!communityId) throw new Error('No community selected')
      return notifyMorosos(communityId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: morosoKeys.all })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

/**
 * Creates a formal moroso notice for a member (Art. 59 LPCI).
 */
export function useCreateMorosoNotice() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({
      memberId,
      noticeType,
      outstandingAmount,
      opts,
    }: {
      memberId: string
      noticeType: MorosoNoticeType
      outstandingAmount: number
      opts?: { assemblyId?: string; deadline?: string; obligations?: Record<string, unknown>[] }
    }) => {
      if (!communityId) throw new Error('No community selected')
      return createMorosoNotice(communityId, memberId, noticeType, outstandingAmount, opts)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: morosoKeys.all })
    },
  })
}

/**
 * Marks a moroso notice as acknowledged by the member.
 */
export function useAcknowledgeMorosoNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noticeId: string) => acknowledgeMorosoNotice(noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: morosoKeys.all })
    },
  })
}

/**
 * Marks a moroso notice as resolved.
 */
export function useResolveMorosoNotice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (noticeId: string) => resolveMorosoNotice(noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: morosoKeys.all })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
