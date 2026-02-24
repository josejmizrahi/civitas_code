import type { CommunityPreset, CommunityType } from '../types'
import { residentialPreset } from './residential'
import { associationPreset } from './association'
import { clubPreset } from './club'
import { schoolPreset } from './school'
import { religiousPreset } from './religious'
import { ngoPreset } from './ngo'
import { cooperativePreset } from './cooperative'
import { customPreset } from './custom'

/** All community presets keyed by type */
export const COMMUNITY_PRESETS: Record<CommunityType, CommunityPreset> = {
  residential: residentialPreset,
  association: associationPreset,
  club: clubPreset,
  school: schoolPreset,
  religious: religiousPreset,
  ngo: ngoPreset,
  cooperative: cooperativePreset,
  custom: customPreset,
}

/** Get preset by community type. Falls back to custom. */
export function getPreset(type: CommunityType): CommunityPreset {
  return COMMUNITY_PRESETS[type] ?? COMMUNITY_PRESETS.custom
}

/** Get labels for a community type */
export function getLabels(type: CommunityType) {
  return getPreset(type).labels
}

/** All available community types for onboarding selection */
export const COMMUNITY_TYPE_OPTIONS = Object.values(COMMUNITY_PRESETS).map((p) => ({
  type: p.type,
  displayName: p.displayName,
  description: p.description,
  icon: p.icon,
}))

/** Display name for any community type string, including legacy types */
const LEGACY_TYPE_NAMES: Record<string, string> = {
  manufacturing: 'Manufacturera',
  other: 'General',
}

export function getDisplayName(type: string): string {
  const preset = COMMUNITY_PRESETS[type as CommunityType]
  if (preset) return preset.displayName
  return LEGACY_TYPE_NAMES[type] ?? type
}

export {
  residentialPreset,
  associationPreset,
  clubPreset,
  schoolPreset,
  religiousPreset,
  ngoPreset,
  cooperativePreset,
  customPreset,
}
