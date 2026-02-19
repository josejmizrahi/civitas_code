import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getDashboardStats } from '../services/treasury.service'
import { supabase } from '@/shared/lib/supabase'

export function useDashboard(fundType?: string) {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  // Realtime: invalidate dashboard when transactions or obligations change
  useEffect(() => {
    if (!communityId) return

    const channel = supabase
      .channel(`dashboard-${communityId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `community_id=eq.${communityId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['dashboard', communityId] }) }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_obligations', filter: `community_id=eq.${communityId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['dashboard', communityId] }) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [communityId, queryClient])

  return useQuery({
    queryKey: ['dashboard', communityId, fundType],
    queryFn: () => getDashboardStats(communityId!, fundType),
    enabled: !!communityId,
  })
}
