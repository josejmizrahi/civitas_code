import { supabase } from '@/shared/lib/supabase'
import { resolveUserNames } from '@/shared/lib/resolveNames'
import type { Entity, EntityContact, Rating, RatingSummary } from '../types'

// ==================== ENTITIES ====================

export async function getEntities(communityId: string, filters?: { type?: string; status?: string }): Promise<Entity[]> {
  let query = supabase
    .from('entities')
    .select('*')
    .eq('community_id', communityId)
    .order('name')

  if (filters?.type) query = query.eq('type', filters.type)
  if (filters?.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error

  const rows = data ?? []
  const userIds = [...new Set(rows.map((r: any) => r.created_by).filter(Boolean))]
  const nameMap = await resolveUserNames(communityId, userIds)

  return rows.map((row: any) => ({
    ...row,
    creator_name: nameMap.get(row.created_by) || undefined,
  })) as Entity[]
}

export async function getEntity(entityId: string): Promise<Entity> {
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .single()
  if (error) throw error

  const row = data as any
  const nameMap = row.created_by
    ? await resolveUserNames(row.community_id, [row.created_by])
    : new Map()

  return {
    ...row,
    creator_name: nameMap.get(row.created_by) || undefined,
  } as Entity
}

export async function createEntity(
  communityId: string,
  entity: Omit<Entity, 'id' | 'community_id' | 'created_at' | 'updated_at' | 'metadata'>
): Promise<Entity> {
  const { data, error } = await (supabase
    .from('entities') as any)
    .insert({ community_id: communityId, ...entity })
    .select()
    .single()
  if (error) throw error
  return data as Entity
}

export async function updateEntity(
  entityId: string,
  updates: Partial<Pick<Entity, 'name' | 'type' | 'rfc' | 'email' | 'phone' | 'address' | 'clabe' | 'bank_name' | 'contact_person' | 'status' | 'notes'>>
): Promise<Entity> {
  const { data, error } = await (supabase
    .from('entities') as any)
    .update(updates)
    .eq('id', entityId)
    .select()
    .single()
  if (error) throw error
  return data as Entity
}

export async function deleteEntity(entityId: string): Promise<void> {
  const { error } = await (supabase
    .from('entities') as any)
    .delete()
    .eq('id', entityId)
  if (error) throw error
}

// ==================== ENTITY CONTACTS ====================

export async function getEntityContacts(entityId: string): Promise<EntityContact[]> {
  const { data, error } = await supabase
    .from('entity_contacts')
    .select('*')
    .eq('entity_id', entityId)
    .order('is_primary', { ascending: false })
  if (error) throw error
  return (data ?? []) as EntityContact[]
}

export async function createEntityContact(
  entityId: string,
  contact: Omit<EntityContact, 'id' | 'entity_id' | 'created_at'>
): Promise<EntityContact> {
  const { data, error } = await (supabase
    .from('entity_contacts') as any)
    .insert({ entity_id: entityId, ...contact })
    .select()
    .single()
  if (error) throw error
  return data as EntityContact
}

export async function deleteEntityContact(contactId: string): Promise<void> {
  const { error } = await (supabase.from('entity_contacts') as any).delete().eq('id', contactId)
  if (error) throw error
}

// ==================== RATINGS ====================

export async function getRatings(communityId: string, targetType: string, targetId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('*')
    .eq('community_id', communityId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Rating[]
}

export async function getRatingSummary(communityId: string, targetType: string, targetId: string): Promise<RatingSummary | null> {
  const { data, error } = await supabase
    .from('entity_ratings_summary')
    .select('*')
    .eq('community_id', communityId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .maybeSingle()
  if (error) throw error
  return data as RatingSummary | null
}

export async function getAllRatingSummaries(communityId: string, targetType?: string): Promise<RatingSummary[]> {
  let query = supabase
    .from('entity_ratings_summary')
    .select('*')
    .eq('community_id', communityId)
  if (targetType) query = query.eq('target_type', targetType)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as RatingSummary[]
}

export async function createRating(
  communityId: string,
  rating: {
    target_type: string
    target_id: string
    rated_by: string
    overall_score: number
    dimensions?: Record<string, number>
    comment?: string
    contract_id?: string
  }
): Promise<Rating> {
  const { data, error } = await (supabase
    .from('ratings') as any)
    .insert({ community_id: communityId, ...rating })
    .select()
    .single()
  if (error) throw error
  return data as Rating
}

export async function updateRating(
  ratingId: string,
  updates: { overall_score?: number; dimensions?: Record<string, number>; comment?: string }
): Promise<Rating> {
  const { data, error } = await (supabase
    .from('ratings') as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', ratingId)
    .select()
    .single()
  if (error) throw error
  return data as Rating
}
