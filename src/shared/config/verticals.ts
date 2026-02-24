import {
  Home,
  Church,
  Handshake,
  Factory,
  Building2,
  Trophy,
  GraduationCap,
  HeartHandshake,
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { CommunityType } from '@/shared/types'

export interface VerticalNavItem {
  name: string
  href: string
  icon: LucideIcon
}

export interface VerticalConfig {
  type: CommunityType
  label: string
  icon: LucideIcon
  navItems: VerticalNavItem[]
}

export const VERTICALS: Record<CommunityType, VerticalConfig> = {
  residential: {
    type: 'residential',
    label: 'Residencial',
    icon: Home,
    navItems: [{ name: 'Residencial', href: '/residential', icon: Home }],
  },
  association: {
    type: 'association',
    label: 'Asociación',
    icon: Users,
    navItems: [],
  },
  club: {
    type: 'club',
    label: 'Club',
    icon: Trophy,
    navItems: [],
  },
  school: {
    type: 'school',
    label: 'Escuela',
    icon: GraduationCap,
    navItems: [],
  },
  religious: {
    type: 'religious',
    label: 'Comunidad religiosa',
    icon: Church,
    navItems: [],
  },
  ngo: {
    type: 'ngo',
    label: 'ONG / Fundación',
    icon: HeartHandshake,
    navItems: [],
  },
  cooperative: {
    type: 'cooperative',
    label: 'Cooperativa',
    icon: Handshake,
    navItems: [],
  },
  custom: {
    type: 'custom',
    label: 'Personalizado',
    icon: Settings,
    navItems: [],
  },
  // Legacy types (mapped to new equivalents)
  manufacturing: {
    type: 'manufacturing',
    label: 'Manufacturera',
    icon: Factory,
    navItems: [],
  },
  other: {
    type: 'other',
    label: 'General',
    icon: Building2,
    navItems: [],
  },
}

export function getVerticalConfig(type: CommunityType): VerticalConfig {
  return VERTICALS[type] ?? VERTICALS.custom
}
