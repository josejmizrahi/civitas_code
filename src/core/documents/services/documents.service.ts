import { supabase } from '@/shared/lib/supabase'

export interface Document {
  id: string
  community_id: string
  title: string
  file_url: string
  category: string
  uploaded_by: string
  created_at: string
}

export async function getDocuments(communityId: string): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Document[]
}

export async function uploadFile(
  communityId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${communityId}/${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      contentType: file.type || `application/${ext}`,
      upsert: false,
    })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(path)

  return urlData.publicUrl
}

export async function createDocument(
  communityId: string,
  doc: { title: string; file_url: string; category: string; uploaded_by: string }
): Promise<Document> {
  const { data, error } = await (supabase.from('documents') as any)
    .insert({ community_id: communityId, ...doc })
    .select()
    .single()
  if (error) throw error
  return data as Document
}

export async function updateDocument(
  documentId: string,
  updates: { title?: string; category?: string }
): Promise<Document> {
  const { data, error } = await (supabase.from('documents') as any)
    .update(updates)
    .eq('id', documentId)
    .select()
    .single()
  if (error) throw error
  return data as Document
}

export async function deleteDocument(documentId: string): Promise<void> {
  const { error } = await (supabase.from('documents') as any)
    .delete()
    .eq('id', documentId)
  if (error) throw error
}
