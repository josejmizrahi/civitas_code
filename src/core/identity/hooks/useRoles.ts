import { useQuery } from '@tanstack/react-query'
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
  return useQuery({
    queryKey: ['roles', 'static'],
    queryFn: () => STATIC_ROLES,
    staleTime: Infinity,
  })
}
