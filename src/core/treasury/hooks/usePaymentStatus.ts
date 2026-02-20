import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import {
  getPaymentObligations,
  createPaymentObligation,
  createBulkObligations,
  updateObligationStatus,
  refreshOverdueObligations,
  markObligationAsPaid,
  getCollectionStats,
} from '../services/treasury.service'
import { refreshFinancialStandings } from '@/shared/services/rules.service'
import type { PaymentObligation } from '../types'

const obligationKeys = {
  all: ['payment_obligations'] as const,
  list: (communityId: string, memberId?: string) => [...obligationKeys.all, communityId, memberId] as const,
  stats: (communityId: string) => [...obligationKeys.all, 'stats', communityId] as const,
}

export function usePaymentObligations(memberId?: string) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: obligationKeys.list(communityId!, memberId),
    queryFn: () => getPaymentObligations(communityId!, memberId),
    enabled: !!communityId,
  })
}

export function useCollectionStats() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: obligationKeys.stats(communityId!),
    queryFn: () => getCollectionStats(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateObligation() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (obligation: { member_id: string; amount: number; due_date: string; concept: string }) =>
      createPaymentObligation(communityId!, obligation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.all })
    },
  })
}

export function useCreateBulkObligations() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({ memberIds, obligation }: { memberIds: string[]; obligation: { amount: number; due_date: string; concept: string } }) =>
      createBulkObligations(communityId!, memberIds, obligation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.all })
    },
  })
}

export function useUpdateObligationStatus() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateObligationStatus(id, status),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.all })
      if (communityId) {
        try {
          await refreshFinancialStandings(communityId)
          queryClient.invalidateQueries({ queryKey: ['members'] })
        } catch { /* standings refresh is best-effort */ }
      }
    },
  })
}

/**
 * Mark an obligation as paid, creating the linked income transaction automatically.
 */
export function useMarkObligationAsPaid() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({
      obligation,
      method,
      reference,
      date,
      notes,
    }: {
      obligation: PaymentObligation
      method: 'spei' | 'efectivo' | 'transferencia' | 'otro'
      reference?: string
      date?: string
      notes?: string
    }) =>
      markObligationAsPaid(obligation, {
        method,
        reference,
        date,
        notes,
        created_by: user!.id,
      }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.all })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      if (communityId) {
        try {
          await refreshFinancialStandings(communityId)
          queryClient.invalidateQueries({ queryKey: ['members'] })
        } catch { /* best-effort */ }
      }
    },
  })
}

/**
 * Hook that refreshes overdue obligations and financial standings.
 * Call on app load or treasury page mount.
 */
export function useRefreshOverdueObligations() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: async () => {
      if (!communityId) return 0
      const updated = await refreshOverdueObligations(communityId)
      if (updated > 0) {
        await refreshFinancialStandings(communityId)
      }
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: obligationKeys.all })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}
