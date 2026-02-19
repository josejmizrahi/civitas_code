import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useCommunityContext } from '@/app/providers'
import type { Role } from '@/shared/types'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const roleKeys = {
  all: ['roles'] as const,
  list: (communityId: string) => [...roleKeys.all, 'list', communityId] as const,
}

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function getRoles(communityId: string): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('community_id', communityId)
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as Role[]
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRoles() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: roleKeys.list(communityId!),
    queryFn: () => getRoles(communityId!),
    enabled: !!communityId!,
  })
}
