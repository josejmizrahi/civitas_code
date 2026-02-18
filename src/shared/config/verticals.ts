import {
  Home,
  Church,
  Handshake,
  Factory,
  Building2,
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
    navItems: [],
  },
  religious: {
    type: 'religious',
    label: 'Religiosa',
    icon: Church,
    navItems: [],
  },
  cooperative: {
    type: 'cooperative',
    label: 'Cooperativa',
    icon: Handshake,
    navItems: [],
  },
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
  return VERTICALS[type] ?? VERTICALS.other
}
