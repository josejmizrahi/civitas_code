/**
 * Community Presets — Verticals as configuration, not code
 *
 * The difference between a condo and a sports club is NOT different code paths.
 * It's different default labels, categories, rules, and legal frameworks.
 */

import type { CommunityRules } from '@/shared/types/rules'

// ---------------------------------------------------------------------------
// Community types — expanded from the original 5 to 8+
// ---------------------------------------------------------------------------

export type CommunityType =
  | 'residential'   // Condominios, fraccionamientos, colonias
  | 'association'   // Asociaciones civiles (A.C.)
  | 'club'          // Clubes deportivos, sociales, culturales
  | 'school'        // Escuelas, universidades, sociedades de padres
  | 'religious'     // Iglesias, templos, comunidades de fe
  | 'ngo'           // ONGs, fundaciones, donatarias
  | 'cooperative'   // Cooperativas (producción, consumo, ahorro)
  | 'custom'        // Cualquier otra comunidad

// ---------------------------------------------------------------------------
// Labels — what things are called in each community type
// ---------------------------------------------------------------------------

export interface CommunityLabels {
  /** What members are called: "Vecino", "Socio", "Feligrés", "Padre de familia" */
  member: string
  /** Plural: "Vecinos", "Socios", "Feligreses" */
  memberPlural: string
  /** What contributions are called: "Cuota", "Membresía", "Diezmo" */
  contribution: string
  /** What the leader is called: "Administrador", "Presidente", "Pastor" */
  leader: string
  /** What external entities are called: "Proveedor", "Colaborador" */
  entity: string
  /** What the community itself is called: "Condominio", "Club", "Iglesia" */
  community: string
  /** What the governing body is called: "Asamblea", "Junta", "Consejo" */
  assembly: string
  /** What the oversight role is called: "Comité de vigilancia", "Revisor", "Auditor" */
  oversight: string
}

// ---------------------------------------------------------------------------
// Category presets
// ---------------------------------------------------------------------------

export interface CategoryPreset {
  name: string
  type: 'income' | 'expense'
  isSystem: boolean
  children?: CategoryPreset[]
}

// ---------------------------------------------------------------------------
// Module IDs — which modules are enabled per type
// ---------------------------------------------------------------------------

export type ModuleId =
  | 'documents'
  | 'announcements'
  | 'calendar'
  | 'census'
  | 'gamification'
  | 'residential_units'
  | 'residential_areas'
  | 'residential_maintenance'
  | 'commerce_fintech'

// ---------------------------------------------------------------------------
// The full preset definition
// ---------------------------------------------------------------------------

export interface CommunityPreset {
  type: CommunityType
  /** Display name for the onboarding UI */
  displayName: string
  /** Short description */
  description: string
  /** Icon key (for the UI) */
  icon: string
  /** Labels for this community type */
  labels: CommunityLabels
  /** Default rules (merged with global defaults) */
  defaultRules: Partial<CommunityRules>
  /** Default financial categories */
  defaultCategories: CategoryPreset[]
  /** Which modules are enabled by default */
  enabledModules: ModuleId[]
  /** Legal framework key (used by compliance engine) */
  legalFrameworkKey: string | null
}
