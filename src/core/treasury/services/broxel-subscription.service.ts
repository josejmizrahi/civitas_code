import { supabase } from '@/shared/lib/supabase'

const IFPE_DOCS_BUCKET = 'documents'

/** Subir documento para solicitud BROXEL (guarda en bucket documents/ifpe/{communityId}/) */
export async function uploadBroxelDocument(
  communityId: string,
  file: File,
  docType: 'id' | 'address' | 'legal_rep'
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'pdf'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
  const path = `ifpe/${communityId}/${docType}_${Date.now()}_${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(IFPE_DOCS_BUCKET)
    .upload(path, file, {
      contentType: file.type || `application/${ext}`,
      upsert: false,
    })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from(IFPE_DOCS_BUCKET).getPublicUrl(path)
  return urlData.publicUrl
}

export type IfpeApplicationStatus = 'draft' | 'submitted' | 'pending_kyb' | 'approved' | 'rejected'

export interface IfpeApplication {
  id: string
  community_id: string
  status: IfpeApplicationStatus
  legal_name: string | null
  rfc: string | null
  representative_name: string | null
  representative_role: string | null
  fiscal_address: string | null
  contact_email: string | null
  contact_phone: string | null
  id_document_path: string | null
  address_document_path: string | null
  legal_rep_document_path: string | null
  ifpe_account_id: string | null
  ifpe_clabe: string | null
  submitted_at: string | null
  reviewed_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export interface IfpeApplicationPayload {
  legal_name: string
  rfc: string
  representative_name: string
  representative_role: string
  fiscal_address: string
  contact_email: string
  contact_phone?: string
  id_document_path?: string
  address_document_path?: string
  legal_rep_document_path?: string
}

/** Estado IFPE de la comunidad (desde communities) */
export async function getCommunityIfpeStatus(communityId: string): Promise<{
  ifpe_status: 'inactive' | 'pending_kyb' | 'active' | 'suspended' | null
  ifpe_clabe: string | null
  ifpe_account_id: string | null
}> {
  const { data, error } = await (supabase as any)
    .from('communities')
    .select('ifpe_status, ifpe_clabe, ifpe_account_id')
    .eq('id', communityId)
    .single()
  if (error) throw error
  const row = data as { ifpe_status?: string; ifpe_clabe?: string; ifpe_account_id?: string } | null
  return {
    ifpe_status: (row?.ifpe_status ?? 'inactive') as 'inactive' | 'pending_kyb' | 'active' | 'suspended',
    ifpe_clabe: row?.ifpe_clabe ?? null,
    ifpe_account_id: row?.ifpe_account_id ?? null,
  }
}

/** Última solicitud BROXEL de la comunidad (submitted/pending_kyb o la más reciente) */
export async function getBroxelApplication(communityId: string): Promise<IfpeApplication | null> {
  const { data, error } = await (supabase as any)
    .from('ifpe_applications')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as IfpeApplication | null
}

/** Crear o actualizar borrador de solicitud */
export async function upsertBroxelApplicationDraft(
  communityId: string,
  payload: Partial<IfpeApplicationPayload>
): Promise<IfpeApplication> {
  const existing = await getBroxelApplication(communityId)
  const row = {
    community_id: communityId,
    status: 'draft',
    legal_name: payload.legal_name ?? existing?.legal_name ?? null,
    rfc: payload.rfc ?? existing?.rfc ?? null,
    representative_name: payload.representative_name ?? existing?.representative_name ?? null,
    representative_role: payload.representative_role ?? existing?.representative_role ?? null,
    fiscal_address: payload.fiscal_address ?? existing?.fiscal_address ?? null,
    contact_email: payload.contact_email ?? existing?.contact_email ?? null,
    contact_phone: payload.contact_phone ?? existing?.contact_phone ?? null,
    id_document_path: payload.id_document_path ?? existing?.id_document_path ?? null,
    address_document_path: payload.address_document_path ?? existing?.address_document_path ?? null,
    legal_rep_document_path: payload.legal_rep_document_path ?? existing?.legal_rep_document_path ?? null,
    updated_at: new Date().toISOString(),
  }
  if (existing?.status === 'draft') {
    const { data, error } = await (supabase as any)
      .from('ifpe_applications')
      .update(row)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data as IfpeApplication
  }
  const { data, error } = await (supabase as any)
    .from('ifpe_applications')
    .insert({ ...row, status: 'draft' })
    .select()
    .single()
  if (error) throw error
  return data as IfpeApplication
}

/** Enviar solicitud (pasa a submitted y community.ifpe_status → pending_kyb) */
export async function submitBroxelApplication(communityId: string): Promise<IfpeApplication> {
  const app = await getBroxelApplication(communityId)
  if (!app || app.status !== 'draft') {
    throw new Error('No hay una solicitud en borrador para enviar.')
  }
  if (!app.legal_name?.trim() || !app.rfc?.trim() || !app.representative_name?.trim() || !app.fiscal_address?.trim() || !app.contact_email?.trim()) {
    throw new Error('Completa todos los campos obligatorios antes de enviar.')
  }

  const { data: updatedApp, error: appErr } = await (supabase as any)
    .from('ifpe_applications')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', app.id)
    .select()
    .single()
  if (appErr) throw appErr

  const { error: comErr } = await (supabase as any)
    .from('communities')
    .update({
      ifpe_status: 'pending_kyb',
      updated_at: new Date().toISOString(),
    })
    .eq('id', communityId)
  if (comErr) throw comErr

  return updatedApp as IfpeApplication
}
