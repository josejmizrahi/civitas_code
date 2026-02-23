import { supabase } from '@/shared/lib/supabase'
import type { FintocApplication } from '../types'

const TABLE = 'fintoc_applications'
const BUCKET = 'fintoc-kyb'

export async function getApplication(communityId: string): Promise<FintocApplication | null> {
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .select('*')
    .eq('community_id', communityId)
    .neq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as FintocApplication | null
}

export async function createApplication(communityId: string, memberId: string): Promise<FintocApplication> {
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .insert({ community_id: communityId, submitted_by: memberId })
    .select()
    .single()

  if (error) throw error
  return data as FintocApplication
}

export async function updateApplication(
  appId: string,
  updates: Partial<Omit<FintocApplication, 'id' | 'community_id' | 'submitted_by' | 'created_at'>>,
): Promise<FintocApplication> {
  const { data, error } = await (supabase as any)
    .from(TABLE)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', appId)
    .select()
    .single()

  if (error) throw error
  return data as FintocApplication
}

export async function submitApplication(appId: string): Promise<FintocApplication> {
  const { data, error } = await (supabase as any)
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

  // Also update community status to pending
  const app = data as FintocApplication
  await (supabase as any)
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
