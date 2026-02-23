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
  member_name?: string
}

export interface CommonArea {
  id: string
  community_id: string
  name: string
  rules: string | null
  reservation_enabled: boolean
}

export interface Reservation {
  id: string
  community_id: string
  common_area_id: string
  member_id: string
  title: string
  start_time: string
  end_time: string
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled'
  created_at: string
  area_name?: string
  member_name?: string
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
  unit_number?: string
}
