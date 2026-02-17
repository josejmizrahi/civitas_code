import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'
import type { Unit } from '../types'

export function useUnits() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['units', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('community_id', communityId!)
        .order('unit_number')

      if (error) throw error
      return (data ?? []) as Unit[]
    },
    enabled: !!communityId,
  })
}
