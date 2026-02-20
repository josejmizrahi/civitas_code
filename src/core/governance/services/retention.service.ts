import { supabase } from '@/shared/lib/supabase'
import type { RetentionRecord } from '../types'

// ---------------------------------------------------------------------------
// Document Retention — Código de Comercio Art. 38-52, NOM-151
// ---------------------------------------------------------------------------

/**
 * Register a document in the retention system.
 * Default retention is 10 years per Código de Comercio.
 */
export async function registerDocument(
  communityId: string,
  data: {
    document_type: string
    document_id: string
    integrity_hash: string
    retention_years?: number
  }
): Promise<void> {
  const retentionYears = data.retention_years ?? 10
  const now = new Date()
  const expiresAt = new Date(now)
  expiresAt.setFullYear(expiresAt.getFullYear() + retentionYears)

  const { error } = await supabase.from('document_retention')
    .insert({
      community_id: communityId,
      document_type: data.document_type,
      document_id: data.document_id,
      retention_years: retentionYears,
      integrity_hash: data.integrity_hash,
      expires_at: expiresAt.toISOString(),
      archived: false,
    })

  if (error) throw error
}

/**
 * Get all retention records for a community, ordered by expiry date.
 */
export async function getRetentionRecords(
  communityId: string
): Promise<RetentionRecord[]> {
  const { data, error } = await supabase
    .from('document_retention')
    .select('*')
    .eq('community_id', communityId)
    .order('expires_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as RetentionRecord[]
}

/**
 * Compute SHA-256 integrity hash for a document's content.
 * Uses Web Crypto API for NOM-151 compliance.
 */
export async function computeIntegrityHash(content: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get documents expiring within a given number of days.
 * Useful for alerting admins about upcoming retention expirations.
 */
export async function getExpiringDocuments(
  communityId: string,
  withinDays: number
): Promise<RetentionRecord[]> {
  const now = new Date()
  const threshold = new Date(now)
  threshold.setDate(threshold.getDate() + withinDays)

  const { data, error } = await supabase
    .from('document_retention')
    .select('*')
    .eq('community_id', communityId)
    .eq('archived', false)
    .gte('expires_at', now.toISOString())
    .lte('expires_at', threshold.toISOString())
    .order('expires_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as RetentionRecord[]
}

/**
 * Archive a document retention record.
 */
export async function archiveDocument(retentionId: string): Promise<void> {
  const { error } = await supabase.from('document_retention')
    .update({
      archived: true,
      archived_at: new Date().toISOString(),
    })
    .eq('id', retentionId)

  if (error) throw error
}
