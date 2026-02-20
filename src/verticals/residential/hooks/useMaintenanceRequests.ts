import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'
import type { MaintenanceRequest } from '../types'

export function useMaintenanceRequests() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['maintenance-requests', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*, units(unit_number)')
        .eq('community_id', communityId!)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map((row: any) => ({
        ...row,
        unit_number: row.units?.unit_number,
        units: undefined,
      })) as MaintenanceRequest[]
    },
    enabled: !!communityId,
  })
}

export function useCreateMaintenanceRequest() {
  const { communityId } = useCommunityContext()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (request: {
      unit_id: string
      description: string
      priority: string
    }) => {
      const { data, error } = await supabase.from('maintenance_requests')
        .insert({
          community_id: communityId,
          ...request,
          status: 'open',
          created_by: user!.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as MaintenanceRequest
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests', communityId] })
    },
  })
}
