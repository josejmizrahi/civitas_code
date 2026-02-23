import { supabase } from '@/shared/lib/supabase'
import type { Unit, CommonArea, MaintenanceRequest, Reservation } from '../types'
import type { MaintenanceStatus } from '@/shared/types'

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export async function getUnitsWithMembers(communityId: string): Promise<Unit[]> {
  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('community_id', communityId)
    .order('unit_number')

  if (error) throw error

  const units = (data ?? []) as Unit[]

  // Fetch member names for assigned units
  const memberIds = units.map((u) => u.member_id).filter(Boolean) as string[]
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from('member_profiles')
      .select('id, full_name')
      .in('id', memberIds)

    const nameMap = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]))
    return units.map((u) => ({
      ...u,
      member_name: u.member_id ? nameMap.get(u.member_id) ?? null : null,
    }))
  }

  return units
}

export async function createUnit(
  communityId: string,
  unit: {
    unit_number: string
    floor?: number | null
    tower?: string | null
    area_m2?: number | null
    indiviso_pct?: number | null
    member_id?: string | null
  },
): Promise<Unit> {
  const { data, error } = await supabase.from('units')
    .insert({
      community_id: communityId,
      ...unit,
    })
    .select()
    .single()

  if (error) throw error
  return data as Unit
}

export async function updateUnit(
  unitId: string,
  updates: {
    unit_number?: string
    floor?: number | null
    tower?: string | null
    area_m2?: number | null
    indiviso_pct?: number | null
    member_id?: string | null
  },
): Promise<Unit> {
  const { data, error } = await supabase.from('units')
    .update(updates)
    .eq('id', unitId)
    .select()
    .single()

  if (error) throw error
  return data as Unit
}

export async function deleteUnit(unitId: string): Promise<void> {
  const { error } = await supabase.from('units')
    .delete()
    .eq('id', unitId)

  if (error) throw error
}

export async function assignMemberToUnit(
  unitId: string,
  memberId: string,
): Promise<Unit> {
  const { data, error } = await supabase.from('units')
    .update({ member_id: memberId })
    .eq('id', unitId)
    .select()
    .single()

  if (error) throw error
  return data as Unit
}

export async function unassignMember(unitId: string): Promise<Unit> {
  const { data, error } = await supabase.from('units')
    .update({ member_id: null })
    .eq('id', unitId)
    .select()
    .single()

  if (error) throw error
  return data as Unit
}

// ---------------------------------------------------------------------------
// Common Areas
// ---------------------------------------------------------------------------

export async function getCommonAreas(communityId: string): Promise<CommonArea[]> {
  const { data, error } = await supabase
    .from('common_areas')
    .select('*')
    .eq('community_id', communityId)
    .order('name')

  if (error) throw error
  return (data ?? []) as CommonArea[]
}

export async function createCommonArea(
  communityId: string,
  area: { name: string; rules?: string | null; reservation_enabled?: boolean },
): Promise<CommonArea> {
  const { data, error } = await supabase.from('common_areas')
    .insert({
      community_id: communityId,
      ...area,
    })
    .select()
    .single()

  if (error) throw error
  return data as CommonArea
}

export async function updateCommonArea(
  areaId: string,
  updates: { name?: string; rules?: string | null; reservation_enabled?: boolean },
): Promise<CommonArea> {
  const { data, error } = await supabase.from('common_areas')
    .update(updates)
    .eq('id', areaId)
    .select()
    .single()

  if (error) throw error
  return data as CommonArea
}

export async function deleteCommonArea(areaId: string): Promise<void> {
  const { error } = await supabase.from('common_areas')
    .delete()
    .eq('id', areaId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Maintenance Requests
// ---------------------------------------------------------------------------

export async function getMaintenanceRequests(communityId: string): Promise<MaintenanceRequest[]> {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as MaintenanceRequest[]
}

export async function createMaintenanceRequest(
  communityId: string,
  request: {
    unit_id: string
    description: string
    priority?: string
    created_by: string
  }
): Promise<MaintenanceRequest> {
  const { data, error } = await supabase.from('maintenance_requests')
    .insert({
      community_id: communityId,
      status: 'open',
      ...request,
    })
    .select()
    .single()

  if (error) throw error
  return data as MaintenanceRequest
}

export async function updateMaintenanceStatus(
  requestId: string,
  status: MaintenanceStatus,
): Promise<MaintenanceRequest> {
  const { data, error } = await supabase.from('maintenance_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data as MaintenanceRequest
}

export async function assignMaintenanceRequest(
  requestId: string,
  memberId: string | null,
): Promise<MaintenanceRequest> {
  const { data, error } = await supabase.from('maintenance_requests')
    .update({ assigned_to: memberId })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data as MaintenanceRequest
}

// ---------------------------------------------------------------------------
// Common Area Reservations
// ---------------------------------------------------------------------------

export async function getReservations(communityId: string): Promise<Reservation[]> {
  const { data, error } = await (supabase as any)
    .from('common_area_reservations')
    .select('*')
    .eq('community_id', communityId)
    .order('start_time', { ascending: true })

  if (error) throw error
  return (data ?? []) as Reservation[]
}

export async function createReservation(
  communityId: string,
  reservation: {
    common_area_id: string
    member_id: string
    title: string
    start_time: string
    end_time: string
    notes?: string | null
  },
): Promise<Reservation> {
  const { data, error } = await (supabase as any)
    .from('common_area_reservations')
    .insert({ community_id: communityId, ...reservation })
    .select()
    .single()

  if (error) throw error
  return data as Reservation
}

export async function cancelReservation(reservationId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('common_area_reservations')
    .update({ status: 'cancelled' })
    .eq('id', reservationId)

  if (error) throw error
}
