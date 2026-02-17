import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import {
  getRecurringSchedules,
  createRecurringSchedule,
  updateRecurringSchedule,
  deleteRecurringSchedule,
  processRecurringSchedules,
} from '../services/recurring.service'

const recurringKeys = {
  all: ['recurring_schedules'] as const,
  list: (communityId: string) => [...recurringKeys.all, communityId] as const,
}

export function useRecurringSchedules() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: recurringKeys.list(communityId!),
    queryFn: () => getRecurringSchedules(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateRecurringSchedule() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (schedule: Parameters<typeof createRecurringSchedule>[1]) =>
      createRecurringSchedule(communityId!, { ...schedule, created_by: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all })
    },
  })
}

export function useUpdateRecurringSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateRecurringSchedule>[1] }) =>
      updateRecurringSchedule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all })
    },
  })
}

export function useDeleteRecurringSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRecurringSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all })
    },
  })
}

export function useProcessRecurringSchedules() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: () => processRecurringSchedules(communityId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringKeys.all })
      queryClient.invalidateQueries({ queryKey: ['payment_obligations'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
