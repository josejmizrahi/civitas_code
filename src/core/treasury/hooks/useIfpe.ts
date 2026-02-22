import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import {
  getWebhookEvents,
  manualReconcile,
  ignoreEvent,
  getReconciliationStats,
} from '../services/ifpe.service'

export function useIfpeEvents(status?: string) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['ifpe-events', communityId, status],
    queryFn: () => getWebhookEvents(communityId!, status),
    enabled: !!communityId,
  })
}

export function useReconciliationStats() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['ifpe-stats', communityId],
    queryFn: () => getReconciliationStats(communityId!),
    enabled: !!communityId,
  })
}

export function useManualReconcile() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ eventId, obligationId }: { eventId: string; obligationId: string }) =>
      manualReconcile(eventId, obligationId, communityId!, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ifpe-events'] })
      queryClient.invalidateQueries({ queryKey: ['ifpe-stats'] })
      queryClient.invalidateQueries({ queryKey: ['payment-obligations'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useIgnoreEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (eventId: string) => ignoreEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ifpe-events'] })
      queryClient.invalidateQueries({ queryKey: ['ifpe-stats'] })
    },
  })
}
