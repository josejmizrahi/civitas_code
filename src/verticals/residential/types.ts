import type { MaintenanceStatus, MaintenancePriority } from '@/shared/types'

export interface Unit {
  id: string
  community_id: string
  member_id: string | null
  unit_number: string
  floor: number | null
  tower: string | null
  indiviso_pct: number | null
  area_m2: number | null
  // Joined
  member_name?: string
}

export interface CommonArea {
  id: string
  community_id: string
  name: string
  rules: string | null
  reservation_enabled: boolean
}

export interface MaintenanceRequest {
  id: string
  community_id: string
  unit_id: string
  description: string
  status: MaintenanceStatus
  priority: MaintenancePriority
  assigned_to: string | null
  created_at: string
  // Joined
  unit_number?: string
}
