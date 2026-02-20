import { supabase } from '@/shared/lib/supabase'
import { resolveUserNames, resolveMemberNames } from '@/shared/lib/resolveNames'
import type { RecurringSchedule } from '../types'

export async function getRecurringSchedules(communityId: string): Promise<RecurringSchedule[]> {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .select('*, categories(name), entities(name)')
    .eq('community_id', communityId)
    .order('next_run_date', { ascending: true })

  if (error) throw error
  const rows = data ?? []

  // Resolve creator names
  const userIds = [...new Set(rows.map((r: any) => r.created_by).filter(Boolean))]
  const nameMap = await resolveUserNames(communityId, userIds)

  // Resolve target member names for 'specific_members' schedules
  const allMemberIds = rows
    .filter((r: any) => r.target_type === 'specific_members' && Array.isArray(r.target_member_ids))
    .flatMap((r: any) => r.target_member_ids)
  const uniqueMemberIds = [...new Set(allMemberIds)].filter(Boolean)
  const memberNameMap = await resolveMemberNames(communityId, uniqueMemberIds)

  return rows.map((row: any) => ({
    ...row,
    category_name: row.categories?.name,
    entity_name: row.entities?.name,
    creator_name: nameMap.get(row.created_by) || undefined,
    target_member_names: row.target_type === 'specific_members' && Array.isArray(row.target_member_ids)
      ? row.target_member_ids.map((id: string) => memberNameMap.get(id) || id).filter(Boolean)
      : undefined,
    categories: undefined,
    entities: undefined,
  }))
}

export async function createRecurringSchedule(
  communityId: string,
  schedule: {
    name: string
    description?: string
    type: string
    frequency: string
    custom_interval_days?: number
    amount: number
    category_id?: string
    target_type: string
    target_entity_id?: string
    target_member_ids?: string[]
    day_of_month?: number
    start_date: string
    end_date?: string
    next_run_date: string
    created_by: string
  }
): Promise<RecurringSchedule> {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .insert({ community_id: communityId, ...schedule })
    .select()
    .single()
  if (error) throw error
  return data as RecurringSchedule
}

export async function updateRecurringSchedule(
  scheduleId: string,
  updates: Partial<Pick<RecurringSchedule, 'name' | 'description' | 'amount' | 'frequency' | 'is_active' | 'end_date' | 'day_of_month' | 'target_type' | 'target_entity_id' | 'category_id'>>
): Promise<RecurringSchedule> {
  const { data, error } = await supabase
    .from('recurring_schedules')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', scheduleId)
    .select()
    .single()
  if (error) throw error
  return data as RecurringSchedule
}

export async function deleteRecurringSchedule(scheduleId: string): Promise<void> {
  const { error } = await supabase
    .from('recurring_schedules')
    .delete()
    .eq('id', scheduleId)
  if (error) throw error
}

export async function processRecurringSchedules(communityId: string): Promise<number> {
  const { data, error } = await (supabase as any).rpc('process_recurring_schedules', {
    p_community_id: communityId,
  })
  if (error) throw error
  return data as number
}

export async function generateSingleSchedule(scheduleId: string): Promise<number> {
  const { data, error } = await (supabase as any).rpc('generate_recurring_obligations', {
    p_schedule_id: scheduleId,
  })
  if (error) throw error
  return data as number
}
