import type { EntityType, EntityStatus, RatingTargetType } from '@/shared/types'

export interface Entity {
  id: string
  community_id: string
  name: string
  type: EntityType
  rfc: string | null
  email: string | null
  phone: string | null
  address: string | null
  clabe: string | null
  bank_name: string | null
  contact_person: string | null
  status: EntityStatus
  notes: string | null
  metadata: Record<string, unknown>
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  creator_name?: string
}

export interface EntityContact {
  id: string
  entity_id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
  created_at: string
}

export interface RatingDimensions {
  punctuality?: number
  quality?: number
  communication?: number
  compliance?: number
  value?: number
}

export interface Rating {
  id: string
  community_id: string
  target_type: RatingTargetType
  target_id: string
  rated_by: string
  overall_score: number
  dimensions: RatingDimensions
  comment: string | null
  contract_id: string | null
  created_at: string
  updated_at: string
  // Joined
  rater_name?: string
}

export interface RatingSummary {
  community_id: string
  target_type: string
  target_id: string
  total_ratings: number
  avg_score: number
  avg_punctuality: number | null
  avg_quality: number | null
  avg_communication: number | null
  avg_compliance: number | null
  avg_value: number | null
}

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  proveedor: 'Proveedor',
  socio_comercial: 'Socio Comercial',
  contratista: 'Contratista',
  arrendador: 'Arrendador',
  gobierno: 'Gobierno',
  institucion: 'Institucion',
  otro: 'Otro',
}

export const ENTITY_STATUS_LABELS: Record<EntityStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  blacklisted: 'Lista Negra',
}

export const RATING_DIMENSION_LABELS: Record<string, string> = {
  punctuality: 'Puntualidad',
  quality: 'Calidad',
  communication: 'Comunicacion',
  compliance: 'Cumplimiento',
  value: 'Valor',
}
