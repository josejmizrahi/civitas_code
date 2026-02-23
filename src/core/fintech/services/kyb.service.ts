import { supabase } from '@/shared/lib/supabase'
import type { Json } from '@/shared/types/database'
import type { KybApplication } from '../types'

const TABLE = 'fintoc_applications'
const BUCKET = 'fintoc-kyb'

export async function getApplication(communityId: string): Promise<KybApplication | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('community_id', communityId)
    .neq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as unknown as KybApplication | null
}

export async function createApplication(communityId: string, memberId: string): Promise<KybApplication> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ community_id: communityId, submitted_by: memberId })
    .select()
    .single()

  if (error) throw error
  return data as unknown as KybApplication
}

export async function updateApplication(
  appId: string,
  updates: Partial<Omit<KybApplication, 'id' | 'community_id' | 'submitted_by' | 'created_at'>>,
): Promise<KybApplication> {
  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
  if (updates.annex_a_escalation) payload.annex_a_escalation = updates.annex_a_escalation as unknown as Json
  if (updates.annex_b_users) payload.annex_b_users = updates.annex_b_users as unknown as Json
  if (updates.shareholders) payload.shareholders = updates.shareholders as unknown as Json
  if (updates.documents) payload.documents = updates.documents as unknown as Json

  const { data, error } = await supabase
    .from(TABLE)
    .update(payload as never)
    .eq('id', appId)
    .select()
    .single()

  if (error) throw error
  return data as unknown as KybApplication
}

export async function submitApplication(appId: string): Promise<KybApplication> {
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', appId)
    .select()
    .single()

  if (error) throw error

  const app = data as unknown as KybApplication
  await supabase
    .from('communities')
    .update({ fintoc_status: 'pending' })
    .eq('id', app.community_id)

  return app
}

export async function uploadKybDocument(
  communityId: string,
  file: File,
  docType: string,
): Promise<string> {
  const ext = file.name.split('.').pop() || 'pdf'
  const path = `${communityId}/${docType}_${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true })

  if (error) throw error
  return path
}

export async function getDocumentUrl(path: string): Promise<string> {
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)

  return data?.signedUrl || ''
}
