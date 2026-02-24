/**
 * TenantProvider — The unified context for "which community am I in?"
 *
 * Wraps the existing CommunityProvider and adds:
 * - Dynamic labels based on community type (member → "Vecino" | "Socio" | "Feligrés")
 * - Legal framework reference
 * - Role convenience flags (isAdmin, isTreasurer, isVigilance)
 * - EventBus initialization per community
 *
 * Usage:
 *   const { labels, isAdmin, community } = useTenant()
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { useCommunityContext } from '@/app/providers'
import { getPreset, type CommunityLabels, type CommunityType } from '@/engine/rules'
import { getLegalFramework, type LegalFramework } from '@/engine/compliance'
import type { Community, Member } from '@/core/identity/types'
import type { Role } from '@/shared/types'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface TenantContextType {
  // From CommunityProvider (pass-through)
  communityId: string | null
  community: Community | null
  currentMember: Member | null
  communityLoading: boolean

  // New: dynamic labels
  labels: CommunityLabels

  // New: legal framework
  legalFramework: LegalFramework | null

  // New: role convenience flags
  role: Role
  isAdmin: boolean
  isTreasurer: boolean
  isVigilance: boolean
  isObserver: boolean

  // New: community type (typed)
  communityType: CommunityType
}

const TenantContext = createContext<TenantContextType | null>(null)

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const DEFAULT_LABELS: CommunityLabels = {
  member: 'Miembro',
  memberPlural: 'Miembros',
  contribution: 'Contribución',
  leader: 'Administrador',
  entity: 'Entidad externa',
  community: 'Comunidad',
  assembly: 'Asamblea',
  oversight: 'Comité de revisión',
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const {
    communityId,
    community,
    currentMember,
    communityLoading,
  } = useCommunityContext()

  const value = useMemo<TenantContextType>(() => {
    const type = (community?.type ?? 'custom') as CommunityType
    const preset = getPreset(type)
    const role = (currentMember?.role ?? 'observador') as Role
    const legalFrameworkKey = preset.legalFrameworkKey

    return {
      communityId,
      community,
      currentMember,
      communityLoading,

      labels: preset.labels ?? DEFAULT_LABELS,
      legalFramework: getLegalFramework(legalFrameworkKey),

      role,
      isAdmin: role === 'admin' || role === 'platform_admin',
      isTreasurer: role === 'tesorero',
      isVigilance: role === 'comite_vigilancia',
      isObserver: role === 'observador',

      communityType: type,
    }
  }, [communityId, community, currentMember, communityLoading])

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}
