import { useCommunityContext } from '@/app/providers'
import { hasPermission, type Role } from '@/shared/types'
import { useRoles } from '@/core/identity/hooks/useRoles'

export function usePermissions() {
  const { currentMember } = useCommunityContext()
  const role = (currentMember?.role ?? 'observador')
  const { data: roles } = useRoles()
  const dynamic = roles?.find((r) => r.id === role)
  const hasDynamic = (permission: string) => Boolean(dynamic?.permissions?.[permission])
  const staticRole = role as Role

  return {
    canManageMembers: hasDynamic('manage_members') || hasPermission(staticRole, 'admin'),
    canManageTreasury: hasDynamic('manage_treasury') || hasPermission(staticRole, 'tesorero'),
    canCreateProposals: hasDynamic('create_proposals') || hasPermission(staticRole, 'miembro'),
    canVote: hasDynamic('vote') || hasPermission(staticRole, 'miembro'),
    canImportData: hasDynamic('import_data') || hasDynamic('manage_treasury') || hasPermission(staticRole, 'tesorero'),
    isAdmin: hasDynamic('manage_community') || role === 'admin' || role === 'platform_admin',
    isPlatformAdmin: role === 'platform_admin' || hasDynamic('manage_platform'),
    role,
  }
}
