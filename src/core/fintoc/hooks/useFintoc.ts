import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getFintocStatus,
  activateFintoc,
  deactivateFintoc,
  getFintocEvents,
  getReconciliationStats,
  manualReconcile,
  ignoreEvent,
  getCheckoutSessions,
  createCheckoutSession,
  getFintocTransfers,
  createOutboundTransfer,
  getMemberClabe,
} from '../services/fintoc.service'
import type { CreateCheckoutInput, CreateTransferInput } from '../types'

const keys = {
  status: (communityId: string) => ['fintoc', 'status', communityId] as const,
  events: (communityId: string, status?: string) => ['fintoc', 'events', communityId, status] as const,
  stats: (communityId: string) => ['fintoc', 'stats', communityId] as const,
  sessions: (communityId: string) => ['fintoc', 'sessions', communityId] as const,
  transfers: (communityId: string) => ['fintoc', 'transfers', communityId] as const,
  memberClabe: (memberId: string) => ['fintoc', 'clabe', memberId] as const,
}

export function useFintocStatus() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: keys.status(communityId!),
    queryFn: () => getFintocStatus(communityId!),
    enabled: !!communityId,
    staleTime: 120_000,
  })
}

export function useActivateFintoc() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (config: { account_id: string; root_clabe: string; public_key: string }) =>
      activateFintoc(communityId!, config),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.status(communityId!) }),
  })
}

export function useDeactivateFintoc() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => deactivateFintoc(communityId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.status(communityId!) }),
  })
}

export function useFintocEvents(status?: string) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: keys.events(communityId!, status),
    queryFn: () => getFintocEvents(communityId!, status),
    enabled: !!communityId,
    staleTime: 30_000,
  })
}

export function useFintocReconciliationStats() {
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

export function useFintocCheckoutSessions(memberId?: string) {
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

export function useFintocTransfers() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: keys.transfers(communityId!),
    queryFn: () => getFintocTransfers(communityId!),
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
