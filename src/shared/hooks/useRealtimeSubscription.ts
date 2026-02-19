import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'

/**
 * Generic Supabase Realtime hook.
 * Subscribes to postgres_changes on a table and invalidates the given query keys.
 */
export function useRealtimeSubscription(
  table: string,
  queryKeys: string[],
  options?: { enabled?: boolean; event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*' }
) {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()
  const enabled = options?.enabled !== false && !!communityId
  const event = options?.event ?? '*'
  const stableKeys = useMemo(() => queryKeys.join(','), [queryKeys.join(',')])

  useEffect(() => {
    if (!enabled || !communityId) return

    const keys = stableKeys.split(',')
    const channel = supabase
      .channel(`realtime-${table}-${communityId}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter: `community_id=eq.${communityId}`,
        },
        () => {
          for (const key of keys) {
            queryClient.invalidateQueries({ queryKey: [key, communityId] })
            queryClient.invalidateQueries({ queryKey: [key] })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [communityId, table, event, enabled, queryClient, stableKeys])
}

/**
 * Subscribe to notifications table changes for the current user.
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [queryClient])
}
