import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { supabase } from '@/shared/lib/supabase'
// ---------------------------------------------------------------------------
// Static role definitions — Role is a string union, not a DB entity
// ---------------------------------------------------------------------------

interface RoleEntry {
  id: string
  name: string
  permissions: Record<string, boolean>
}

const STATIC_ROLES: RoleEntry[] = [
  { id: 'platform_admin', name: 'Admin Plataforma', permissions: { manage_platform: true, manage_community: true, manage_members: true, manage_treasury: true, vote: true } },
  { id: 'admin', name: 'Administrador', permissions: { manage_community: true, manage_members: true, manage_treasury: true, vote: true } },
  { id: 'tesorero', name: 'Tesorero', permissions: { manage_treasury: true, vote: true } },
  { id: 'comite_vigilancia', name: 'Comité de Vigilancia', permissions: { view_treasury: true, audit: true, vote: true } },
  { id: 'miembro', name: 'Miembro', permissions: { vote: true } },
  { id: 'observador', name: 'Observador', permissions: {} },
]

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useRoles() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ['roles', communityId ?? 'static'],
    queryFn: async () => {
      if (!communityId) return STATIC_ROLES
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, permissions')
        .eq('community_id', communityId)
        .order('name', { ascending: true })
      if (error || !data || data.length === 0) return STATIC_ROLES
      return data.map((r) => ({
        // members.role stores role key/name, so we use name as canonical id
        id: r.name,
        name: r.name,
        permissions: (r.permissions as Record<string, boolean> | null) ?? {},
      }))
    },
    staleTime: 60_000,
  })
}
