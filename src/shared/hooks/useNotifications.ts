import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  type Notification,
} from '@/shared/services/notification.service'

export type { Notification }

export function useNotifications() {
  const { currentMember } = useCommunityContext()
  const memberId = currentMember?.id

  return useQuery<Notification[]>({
    queryKey: ['notifications', memberId],
    queryFn: () => getNotifications(memberId!),
    enabled: !!memberId,
    refetchInterval: 30_000,
  })
}

export function useUnreadCount() {
  const { currentMember } = useCommunityContext()
  const memberId = currentMember?.id

  return useQuery<number>({
    queryKey: ['notifications-unread', memberId],
    queryFn: () => getUnreadCount(memberId!),
    enabled: !!memberId,
    refetchInterval: 30_000,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()
  const { currentMember } = useCommunityContext()

  return useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentMember?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', currentMember?.id] })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const { currentMember } = useCommunityContext()

  return useMutation({
    mutationFn: () => markAllAsRead(currentMember!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', currentMember?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', currentMember?.id] })
    },
  })
}
