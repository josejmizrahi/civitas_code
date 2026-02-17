import { supabase } from '@/shared/lib/supabase'

export interface AuditEntry {
  id: string
  community_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  details: Record<string, unknown>
  created_at: string
}

export async function logAuditAction(
  communityId: string,
  action: string,
  entityType: string,
  entityId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  await (supabase.from('audit_log') as any).insert({
    community_id: communityId,
    user_id: user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    details: details ?? {},
  })
}

export async function getAuditLog(
  communityId: string,
  options?: { limit?: number; offset?: number; entityType?: string }
): Promise<AuditEntry[]> {
  let query = supabase
    .from('audit_log')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (options?.entityType) query = query.eq('entity_type', options.entityType)
  if (options?.limit) query = query.limit(options.limit)
  if (options?.offset) query = query.range(options.offset, options.offset + (options?.limit ?? 50) - 1)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as AuditEntry[]
}
