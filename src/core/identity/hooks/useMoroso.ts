import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  computeMorosoStatus,
  getMorosoMembers,
  getMemberDebtSummary,
  notifyMorosos,
} from '../services/moroso.service'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const morosoKeys = {
  all: ['moroso'] as const,
  members: (communityId: string) => [...morosoKeys.all, 'members', communityId] as const,
  debt: (memberId: string) => [...morosoKeys.all, 'debt', memberId] as const,
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
