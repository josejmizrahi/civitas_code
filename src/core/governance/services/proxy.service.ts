import { supabase } from '@/shared/lib/supabase'
import { logger } from '@/shared/lib/logger'
import type { AssemblyProxy } from '../types'

// ---------------------------------------------------------------------------
// Assembly Proxies — LPCI CDMX Art. 36
// ---------------------------------------------------------------------------

/**
 * Get all active proxies for a given assembly.
 * Joins grantor and representative names via member_profiles.
 */
export async function getAssemblyProxies(
  assemblyId: string
): Promise<AssemblyProxy[]> {
  const { data, error } = await supabase
    .from('assembly_proxies')
    .select('*')
    .eq('assembly_id', assemblyId)
    .eq('is_active', true)
    .order('granted_at', { ascending: false })

  if (error) throw error

  const proxies = (data ?? []) as AssemblyProxy[]

  // Enrich with member names
  const memberIds = new Set<string>()
  proxies.forEach((p) => {
    memberIds.add(p.grantor_id)
    memberIds.add(p.representative_id)
  })

  if (memberIds.size > 0) {
    const { data: profiles } = await supabase
      .from('member_profiles')
      .select('id, full_name')
      .in('id', Array.from(memberIds))

    const nameMap = new Map<string, string>()
    ;(profiles ?? []).forEach((p: any) => {
      nameMap.set(p.id, p.full_name || p.id.slice(0, 8))
    })

    proxies.forEach((p) => {
      p.grantor_name = nameMap.get(p.grantor_id) || p.grantor_id.slice(0, 8)
      p.representative_name = nameMap.get(p.representative_id) || p.representative_id.slice(0, 8)
    })
  }

  return proxies
}

/**
 * Grant a proxy (representación) for an assembly.
 * Validates Art. 36 limits before inserting.
 */
export async function grantProxy(
  communityId: string,
  data: {
    assembly_id: string
    grantor_id: string
    representative_id: string
  }
): Promise<AssemblyProxy> {
  // Validate limits via server-side function
  const validation = await canRepresent(
    communityId,
    data.assembly_id,
    data.representative_id
  )
  if (!validation.allowed) {
    throw new Error(validation.reason || 'No se puede otorgar la representación')
  }

  // Check that grantor doesn't already have an active proxy for this assembly
  const { data: existing, error: existErr } = await supabase
    .from('assembly_proxies')
    .select('id')
    .eq('assembly_id', data.assembly_id)
    .eq('grantor_id', data.grantor_id)
    .eq('is_active', true)
    .maybeSingle()

  if (existErr) throw existErr
  if (existing) {
    throw new Error('Este condómino ya tiene una representación activa para esta asamblea')
  }

  const { data: proxy, error } = await supabase.from('assembly_proxies')
    .insert({
      community_id: communityId,
      assembly_id: data.assembly_id,
      grantor_id: data.grantor_id,
      representative_id: data.representative_id,
      is_active: true,
    })
    .select()
    .single()

  if (error) throw error
  return proxy as AssemblyProxy
}

/**
 * Revoke a proxy by setting is_active = false and revoked_at timestamp.
 */
export async function revokeProxy(proxyId: string): Promise<void> {
  const { error } = await supabase.from('assembly_proxies')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString(),
    })
    .eq('id', proxyId)

  if (error) throw error
}

/**
 * Count how many active proxies a representative has for a given assembly.
 */
export async function getProxyCount(
  assemblyId: string,
  representativeId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('assembly_proxies')
    .select('*', { count: 'exact', head: true })
    .eq('assembly_id', assemblyId)
    .eq('representative_id', representativeId)
    .eq('is_active', true)

  if (error) throw error
  return count ?? 0
}

/**
 * Check if a member can represent others in a given assembly.
 * Uses the server-side validate_proxy_limits function for authoritative checks.
 * Falls back to client-side validation if the RPC is unavailable.
 */
export async function canRepresent(
  communityId: string,
  assemblyId: string,
  representativeId: string
): Promise<{ allowed: boolean; reason?: string }> {
  // Try server-side validation first
  const { data, error } = await supabase.rpc('validate_proxy_limits', {
    p_community_id: communityId,
    p_assembly_id: assemblyId,
    p_representative_id: representativeId,
  })

  if (!error && data) {
    return {
      allowed: (data as any).allowed,
      reason: (data as any).reason,
    }
  }

  // Fallback: client-side validation
  logger.warn('validate_proxy_limits RPC not available, using client-side validation', error?.message)

  // Check admin role
  const { data: member } = await supabase
    .from('members')
    .select('role')
    .eq('id', representativeId)
    .eq('community_id', communityId)
    .eq('status', 'active')
    .maybeSingle()

  if ((member as any)?.role === 'admin') {
    return {
      allowed: false,
      reason: 'El administrador no puede representar a otros condóminos (Art. 36 LPCI)',
    }
  }

  // Check proxy count
  const count = await getProxyCount(assemblyId, representativeId)
  if (count >= 2) {
    return {
      allowed: false,
      reason: 'Un condómino no puede representar a más de 2 personas (Art. 36 LPCI)',
    }
  }

  return { allowed: true }
}
