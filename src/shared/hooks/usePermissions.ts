import { useCommunityContext } from '@/app/providers'
import { hasPermission, type Role } from '@/shared/types'

export function usePermissions() {
  const { currentMember } = useCommunityContext()
  const role = (currentMember?.role ?? 'observador') as Role

  return {
    canManageMembers: hasPermission(role, 'admin'),
    canManageTreasury: hasPermission(role, 'tesorero'),
    canCreateProposals: hasPermission(role, 'miembro'),
    canVote: hasPermission(role, 'miembro'),
    canImportData: hasPermission(role, 'tesorero'),
    isAdmin: role === 'admin' || role === 'platform_admin',
    isPlatformAdmin: role === 'platform_admin',
    role,
  }
}
