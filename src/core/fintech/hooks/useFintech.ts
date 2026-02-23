import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getFintechStatus,
  activateProvider,
  deactivateProvider,
  getPaymentEvents,
  getReconciliationStats,
  manualReconcile,
  ignoreEvent,
  getCheckoutSessions,
  createCheckoutSession,
  getTransfers,
  createOutboundTransfer,
  getMemberClabe,
} from '../services/fintech.service'
import type { CreateCheckoutInput, CreateTransferInput } from '../types'

const keys = {
  status: (communityId: string) => ['fintech', 'status', communityId] as const,
  events: (communityId: string, status?: string) => ['fintech', 'events', communityId, status] as const,
  stats: (communityId: string) => ['fintech', 'stats', communityId] as const,
  sessions: (communityId: string) => ['fintech', 'sessions', communityId] as const,
  transfers: (communityId: string) => ['fintech', 'transfers', communityId] as const,
  memberClabe: (memberId: string) => ['fintech', 'clabe', memberId] as const,
}

export function useFintechStatus() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: keys.status(communityId!),
    queryFn: () => getFintechStatus(communityId!),
    enabled: !!communityId,
    staleTime: 120_000,
  })
}

export function useActivateProvider() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (config: { account_id: string; root_clabe: string; public_key: string }) =>
      activateProvider(communityId!, config),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.status(communityId!) }),
  })
}

export function useDeactivateProvider() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deactivateProvider(communityId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.status(communityId!) }),
  })
}

export function usePaymentEvents(status?: string) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: keys.events(communityId!, status),
    queryFn: () => getPaymentEvents(communityId!, status),
    enabled: !!communityId,
    staleTime: 30_000,
  })
}

export function useReconciliationStats() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: keys.stats(communityId!),
    queryFn: () => getReconciliationStats(communityId!),
    enabled: !!communityId,
    staleTime: 60_000,
  })
}

export function useManualReconcile() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, obligationId }: { eventId: string; obligationId: string }) =>
      manualReconcile(eventId, obligationId, communityId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.events(communityId!) })
      qc.invalidateQueries({ queryKey: keys.stats(communityId!) })
      qc.invalidateQueries({ queryKey: ['obligations'] })
    },
  })
}

export function useIgnoreEvent() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => ignoreEvent(eventId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.events(communityId!) })
      qc.invalidateQueries({ queryKey: keys.stats(communityId!) })
    },
  })
}

export function useCheckoutSessions(memberId?: string) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: [...keys.sessions(communityId!), memberId],
    queryFn: () => getCheckoutSessions(communityId!, memberId),
    enabled: !!communityId,
    staleTime: 30_000,
  })
}

export function useCreateCheckout() {
  const { communityId, currentMember } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCheckoutInput) =>
      createCheckoutSession(communityId!, currentMember!.id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.sessions(communityId!) })
    },
  })
}

export function useTransfers() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: keys.transfers(communityId!),
    queryFn: () => getTransfers(communityId!),
    enabled: !!communityId,
    staleTime: 30_000,
  })
}

export function useCreateTransfer() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransferInput) => createOutboundTransfer(communityId!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.transfers(communityId!) })
    },
  })
}

export function useMemberClabe(memberId?: string) {
  return useQuery({
    queryKey: keys.memberClabe(memberId!),
    queryFn: () => getMemberClabe(memberId!),
    enabled: !!memberId,
    staleTime: 300_000,
  })
}
