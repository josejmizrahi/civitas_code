import { supabase } from '@/shared/lib/supabase'
import { AppError } from '@/shared/lib/errors'
import { assertCanPerformAction } from '@/shared/services/rules.service'
import type {
  SpendRequest,
  SpendRequestStatus,
  SpendRequestAttachment,
  SpendRequestComment,
} from '../types'

async function getMemberIdByUserId(communityId: string, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .single()
  if (error || !data) return null
  return (data as { id: string }).id
}

/** Lista solicitudes de gasto con filtros opcionales */
export async function listSpendRequests(
  communityId: string,
  filters?: { status?: SpendRequestStatus | SpendRequestStatus[]; category_id?: string; limit?: number }
): Promise<SpendRequest[]> {
  let query = supabase
    .from('spend_requests')
    .select(`
      *,
      categories(name)
    `)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (filters?.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
    query = query.in('status', statuses)
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query
  if (error) throw error
  const rows = (data ?? []) as (SpendRequest & { categories: { name: string } | null })[]
  return rows.map((r) => ({
    ...r,
    category_name: r.categories?.name,
    categories: undefined,
  })) as SpendRequest[]
}

/** Obtiene una solicitud por id */
export async function getSpendRequest(id: string): Promise<SpendRequest | null> {
  const { data, error } = await supabase
    .from('spend_requests')
    .select('*, categories(name)')
    .eq('id', id)
    .single()
  if (error || !data) return null
  const row = data as SpendRequest & { categories: { name: string } | null }
  let beneficiary_name: string | undefined
  if (row.beneficiary_entity_id) {
    const { data: ent } = await supabase
      .from('entities')
      .select('name')
      .eq('id', row.beneficiary_entity_id)
      .single()
    beneficiary_name = (ent as { name?: string } | null)?.name
  }
  return {
    ...row,
    category_name: row.categories?.name,
    beneficiary_name,
    categories: undefined,
  } as SpendRequest
}

/** Clasificación por BD: 1=presupuesto, 2=discrecional, 3=votación, 4=emergencia */
export async function classifySpendRequest(spendRequestId: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('classify_spend_request', {
    p_spend_request_id: spendRequestId,
  })
  if (error) throw error
  return data as number | null
}

/** Crea una solicitud en borrador */
export async function createSpendRequest(
  communityId: string,
  requestedByUserId: string,
  payload: {
    title: string
    description?: string
    amount: number
    category_id: string
    fund?: string
    beneficiary_entity_id?: string | null
    evidence_url?: string | null
    is_emergency?: boolean
  }
): Promise<SpendRequest> {
  const memberId = await getMemberIdByUserId(communityId, requestedByUserId)
  if (!memberId) {
    throw new AppError('No se encontró al miembro en la comunidad.', 'NOT_FOUND')
  }
  if (payload.is_emergency) {
    await assertCanPerformAction(communityId, memberId, 'create_emergency_spend')
  } else {
    await assertCanPerformAction(communityId, memberId, 'create_spend_request')
  }

  const { data, error } = await supabase
    .from('spend_requests')
    .insert({
      community_id: communityId,
      title: payload.title,
      description: payload.description ?? null,
      amount: payload.amount,
      category_id: payload.category_id,
      fund: payload.fund ?? 'general',
      beneficiary_entity_id: payload.beneficiary_entity_id ?? null,
      evidence_url: payload.evidence_url ?? null,
      status: 'draft',
      is_emergency: payload.is_emergency ?? false,
      requested_by: memberId,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data as SpendRequest
}

/** Envía la solicitud: clasifica y pasa a pending_approval, pending_vote, o approved (N1) */
export async function submitSpendRequest(
  communityId: string,
  spendRequestId: string,
  requestedByUserId: string
): Promise<SpendRequest> {
  const memberId = await getMemberIdByUserId(communityId, requestedByUserId)
  if (!memberId) throw new AppError('Miembro no encontrado.', 'NOT_FOUND')
  await assertCanPerformAction(communityId, memberId, 'create_spend_request')

  const { data: sr, error: fetchErr } = await supabase
    .from('spend_requests')
    .select('*')
    .eq('id', spendRequestId)
    .eq('community_id', communityId)
    .single()
  if (fetchErr || !sr) throw new AppError('Solicitud no encontrada.', 'NOT_FOUND')
  if ((sr as SpendRequest).status !== 'draft') {
    throw new AppError('Solo se pueden enviar solicitudes en borrador.', 'VALIDATION')
  }

  const level = await classifySpendRequest(spendRequestId)
  if (level == null) throw new AppError('No se pudo clasificar la solicitud.', 'VALIDATION')

  const updates: Partial<SpendRequest> = {
    authorization_level: level,
    updated_at: new Date().toISOString(),
  }

  if (level === 1) {
    updates.status = 'approved'
  } else if (level === 2) {
    updates.status = 'pending_approval'
  } else if (level === 3) {
    updates.status = 'pending_vote'
    // La creación de la propuesta se hace desde la UI o un flujo separado que llama a createProposalForSpendRequest
  } else if (level === 4) {
    updates.status = 'approved'
    // Emergencia: se puede ejecutar de inmediato; la ratificación se crea al ejecutar
  }

  const { data: updated, error: updateErr } = await supabase
    .from('spend_requests')
    .update(updates)
    .eq('id', spendRequestId)
    .select()
    .single()
  if (updateErr) throw updateErr
  return updated as SpendRequest
}

/** Aprobación por vigilancia (Nivel 2) */
export async function approveSpendRequest(
  communityId: string,
  spendRequestId: string,
  approvedByUserId: string,
  note?: string
): Promise<SpendRequest> {
  const memberId = await getMemberIdByUserId(communityId, approvedByUserId)
  if (!memberId) throw new AppError('Miembro no encontrado.', 'NOT_FOUND')
  await assertCanPerformAction(communityId, memberId, 'approve_spend_request')

  const { data: sr } = await supabase
    .from('spend_requests')
    .select('status')
    .eq('id', spendRequestId)
    .eq('community_id', communityId)
    .single()
  if (!sr || (sr as { status: string }).status !== 'pending_approval') {
    throw new AppError('La solicitud no está pendiente de aprobación.', 'VALIDATION')
  }

  const { data, error } = await supabase
    .from('spend_requests')
    .update({
      status: 'approved',
      approved_by: memberId,
      approval_note: note ?? null,
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', spendRequestId)
    .select()
    .single()
  if (error) throw error
  return data as SpendRequest
}

/** Rechazo por vigilancia o cancelación */
export async function rejectSpendRequest(
  communityId: string,
  spendRequestId: string,
  rejectedByUserId: string,
  reason: string
): Promise<SpendRequest> {
  const memberId = await getMemberIdByUserId(communityId, rejectedByUserId)
  if (!memberId) throw new AppError('Miembro no encontrado.', 'NOT_FOUND')
  await assertCanPerformAction(communityId, memberId, 'approve_spend_request')

  const { data: sr } = await supabase
    .from('spend_requests')
    .select('status')
    .eq('id', spendRequestId)
    .eq('community_id', communityId)
    .single()
  if (!sr || (sr as { status: string }).status !== 'pending_approval') {
    throw new AppError('Solo se pueden rechazar solicitudes en pending_approval.', 'VALIDATION')
  }

  const { data, error } = await supabase
    .from('spend_requests')
    .update({
      status: 'rejected',
      approved_by: null,
      approval_note: null,
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', spendRequestId)
    .select()
    .single()
  if (error) throw error
  return data as SpendRequest
}

/** Ejecuta el pago: crea la transacción y enlaza a la solicitud */
export async function executeSpendRequest(
  communityId: string,
  spendRequestId: string,
  executedByUserId: string,
  paymentReference?: string
): Promise<SpendRequest> {
  const memberId = await getMemberIdByUserId(communityId, executedByUserId)
  if (!memberId) throw new AppError('Miembro no encontrado.', 'NOT_FOUND')
  await assertCanPerformAction(communityId, memberId, 'execute_spend_request')

  const { data: sr, error: fetchErr } = await supabase
    .from('spend_requests')
    .select('*')
    .eq('id', spendRequestId)
    .eq('community_id', communityId)
    .single()
  if (fetchErr || !sr) throw new AppError('Solicitud no encontrada.', 'NOT_FOUND')
  const row = sr as SpendRequest
  if (row.status !== 'approved') {
    throw new AppError('Solo se pueden ejecutar solicitudes aprobadas.', 'VALIDATION')
  }
  if (row.transaction_id) {
    throw new AppError('Esta solicitud ya tiene una transacción asociada.', 'VALIDATION')
  }

  const fundType = row.fund === 'general' || !row.fund ? 'mantenimiento' : row.fund
  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .insert({
      community_id: communityId,
      type: 'expense',
      amount: row.amount,
      category_id: row.category_id,
      description: row.title + (row.description ? ` — ${row.description}` : ''),
      date: new Date().toISOString().split('T')[0],
      origin: 'manual',
      fund_type: fundType,
      created_by: executedByUserId,
      spend_request_id: spendRequestId,
      verification_status: 'reported',
    })
    .select()
    .single()
  if (txErr) throw txErr
  const txId = (tx as { id: string }).id

  const { data: updated, error: updateErr } = await supabase
    .from('spend_requests')
    .update({
      status: 'executed',
      transaction_id: txId,
      payment_reference: paymentReference ?? null,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', spendRequestId)
    .select()
    .single()
  if (updateErr) throw updateErr
  return updated as SpendRequest
}

/** Marca la solicitud como verificada (vigilancia) */
export async function verifySpendRequest(
  communityId: string,
  spendRequestId: string,
  verifiedByUserId: string,
  note?: string
): Promise<SpendRequest> {
  const memberId = await getMemberIdByUserId(communityId, verifiedByUserId)
  if (!memberId) throw new AppError('Miembro no encontrado.', 'NOT_FOUND')
  await assertCanPerformAction(communityId, memberId, 'verify_spend_request')

  const { data, error } = await supabase
    .from('spend_requests')
    .update({
      status: 'verified',
      verified_by: memberId,
      verification_note: note ?? null,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', spendRequestId)
    .eq('community_id', communityId)
    .select()
    .single()
  if (error) throw error
  return data as SpendRequest
}

/** Vincula una propuesta de gobernanza a una solicitud N3 (pending_vote) */
export async function linkProposalToSpendRequest(
  communityId: string,
  spendRequestId: string,
  proposalId: string
): Promise<SpendRequest> {
  const { data: sr } = await supabase
    .from('spend_requests')
    .select('status')
    .eq('id', spendRequestId)
    .eq('community_id', communityId)
    .single()
  if (!sr || (sr as { status: string }).status !== 'pending_vote') {
    throw new AppError('Solo se puede vincular una propuesta a solicitudes en pending_vote.', 'VALIDATION')
  }
  const { data, error } = await supabase
    .from('spend_requests')
    .update({
      proposal_id: proposalId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', spendRequestId)
    .select()
    .single()
  if (error) throw error
  return data as SpendRequest
}

/** Cancela una solicitud (solo draft o rechazada; admin/tesorero) */
export async function cancelSpendRequest(
  communityId: string,
  spendRequestId: string,
  cancelledByUserId: string
): Promise<SpendRequest> {
  const memberId = await getMemberIdByUserId(communityId, cancelledByUserId)
  if (!memberId) throw new AppError('Miembro no encontrado.', 'NOT_FOUND')
  await assertCanPerformAction(communityId, memberId, 'cancel_spend_request')

  const { data: sr } = await supabase
    .from('spend_requests')
    .select('status')
    .eq('id', spendRequestId)
    .eq('community_id', communityId)
    .single()
  if (!sr) throw new AppError('Solicitud no encontrada.', 'NOT_FOUND')
  const status = (sr as { status: string }).status
  if (!['draft', 'rejected'].includes(status)) {
    throw new AppError('Solo se pueden cancelar solicitudes en borrador o rechazadas.', 'VALIDATION')
  }

  const { data, error } = await supabase
    .from('spend_requests')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', spendRequestId)
    .select()
    .single()
  if (error) throw error
  return data as SpendRequest
}

/** Adjuntos */
export async function addSpendRequestAttachment(
  spendRequestId: string,
  payload: { type: string; file_url: string; description?: string; uploaded_by?: string }
): Promise<SpendRequestAttachment> {
  const { data, error } = await supabase
    .from('spend_request_attachments')
    .insert({
      spend_request_id: spendRequestId,
      type: payload.type,
      file_url: payload.file_url,
      description: payload.description ?? null,
      uploaded_by: payload.uploaded_by ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as SpendRequestAttachment
}

export async function listSpendRequestAttachments(spendRequestId: string): Promise<SpendRequestAttachment[]> {
  const { data, error } = await supabase
    .from('spend_request_attachments')
    .select('*')
    .eq('spend_request_id', spendRequestId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as SpendRequestAttachment[]
}

/** Comentarios */
export async function addSpendRequestComment(
  communityId: string,
  spendRequestId: string,
  memberUserId: string,
  content: string
): Promise<SpendRequestComment> {
  const memberId = await getMemberIdByUserId(communityId, memberUserId)
  if (!memberId) throw new AppError('Miembro no encontrado.', 'NOT_FOUND')

  const { data, error } = await supabase
    .from('spend_request_comments')
    .insert({
      spend_request_id: spendRequestId,
      member_id: memberId,
      content,
    })
    .select()
    .single()
  if (error) throw error
  return data as SpendRequestComment
}

export async function listSpendRequestComments(spendRequestId: string): Promise<SpendRequestComment[]> {
  const { data, error } = await supabase
    .from('spend_request_comments')
    .select('*')
    .eq('spend_request_id', spendRequestId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as SpendRequestComment[]
}
