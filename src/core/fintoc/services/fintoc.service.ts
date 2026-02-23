import { supabase } from '@/shared/lib/supabase'
import type {
  FintocEvent,
  FintocCheckoutSession,
  FintocTransfer,
  FintocReconciliationStats,
  CreateCheckoutInput,
  CreateTransferInput,
} from '../types'

// ─── Community Fintoc Config ──────────────────────────────────────
export async function getFintocStatus(communityId: string) {
  const { data, error } = await (supabase as any)
    .from('communities')
    .select('fintoc_status, fintoc_account_id, fintoc_root_clabe, fintoc_public_key')
    .eq('id', communityId)
    .single()

  if (error) throw error
  return data as {
    fintoc_status: string
    fintoc_account_id: string | null
    fintoc_root_clabe: string | null
    fintoc_public_key: string | null
  }
}

export async function activateFintoc(
  communityId: string,
  config: { account_id: string; root_clabe: string; public_key: string },
) {
  const { error } = await (supabase as any)
    .from('communities')
    .update({
      fintoc_status: 'active',
      fintoc_account_id: config.account_id,
      fintoc_root_clabe: config.root_clabe,
      fintoc_public_key: config.public_key,
    })
    .eq('id', communityId)

  if (error) throw error
}

export async function deactivateFintoc(communityId: string) {
  const { error } = await (supabase as any)
    .from('communities')
    .update({ fintoc_status: 'inactive' })
    .eq('id', communityId)

  if (error) throw error
}

// ─── Checkout Sessions (member payments) ──────────────────────────
export async function createCheckoutSession(
  communityId: string,
  memberId: string,
  input: CreateCheckoutInput,
): Promise<FintocCheckoutSession> {
  const { data: community } = await (supabase as any)
    .from('communities')
    .select('fintoc_public_key, fintoc_account_id')
    .eq('id', communityId)
    .single()

  if (!community?.fintoc_public_key) {
    throw new Error('Fintoc no está configurado para esta comunidad')
  }

  const { data, error } = await supabase.functions.invoke('fintoc-checkout', {
    body: {
      community_id: communityId,
      member_id: memberId,
      obligation_id: input.obligation_id,
      amount: input.amount,
      concept: input.concept,
      member_email: input.member_email,
    },
  })

  if (error) throw error
  return data as FintocCheckoutSession
}

export async function getCheckoutSessions(
  communityId: string,
  memberId?: string,
): Promise<FintocCheckoutSession[]> {
  let query = (supabase as any)
    .from('fintoc_checkout_sessions')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as FintocCheckoutSession[]
}

// ─── Fintoc Events (inbound transfers) ────────────────────────────
export async function getFintocEvents(
  communityId: string,
  status?: string,
): Promise<FintocEvent[]> {
  let query = (supabase as any)
    .from('fintoc_events')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('reconciliation_status', status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as FintocEvent[]
}

export async function manualReconcile(
  eventId: string,
  obligationId: string,
  communityId: string,
): Promise<void> {
  const { data: evt } = await (supabase as any)
    .from('fintoc_events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!evt) throw new Error('Evento no encontrado')

  const amount = (evt.amount || 0) / 100

  const { data: tx } = await (supabase as any)
    .from('transactions')
    .insert({
      community_id: communityId,
      type: 'income',
      amount,
      description: `SPEI Fintoc (conciliación manual): ${evt.counterparty_name || ''} (${evt.tracking_key || evt.fintoc_event_id})`,
      date: new Date().toISOString(),
      external_ref: evt.tracking_key || evt.fintoc_event_id,
      origin: 'fintoc',
    })
    .select()
    .single()

  if (tx) {
    await (supabase as any)
      .from('payment_obligations')
      .update({ status: 'paid', payment_transaction_id: tx.id })
      .eq('id', obligationId)
  }

  await (supabase as any)
    .from('fintoc_events')
    .update({
      reconciliation_status: 'manual',
      matched_obligation_id: obligationId,
      matched_transaction_id: tx?.id || null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId)
}

export async function ignoreEvent(eventId: string): Promise<void> {
  await (supabase as any)
    .from('fintoc_events')
    .update({
      reconciliation_status: 'ignored',
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId)
}

export async function getReconciliationStats(communityId: string): Promise<FintocReconciliationStats> {
  const { data } = await (supabase as any)
    .from('fintoc_events')
    .select('reconciliation_status, amount')
    .eq('community_id', communityId)

  const events = (data ?? []) as { reconciliation_status: string; amount: number | null }[]

  return {
    total: events.length,
    matched: events.filter((e) => e.reconciliation_status === 'matched').length,
    unmatched: events.filter((e) => e.reconciliation_status === 'unmatched').length,
    pending: events.filter((e) => e.reconciliation_status === 'pending').length,
    ignored: events.filter((e) => e.reconciliation_status === 'ignored').length,
    total_amount_matched: events
      .filter((e) => e.reconciliation_status === 'matched')
      .reduce((sum, e) => sum + (e.amount || 0) / 100, 0),
    total_amount_unmatched: events
      .filter((e) => e.reconciliation_status === 'unmatched')
      .reduce((sum, e) => sum + (e.amount || 0) / 100, 0),
  }
}

// ─── Outbound Transfers (pay providers) ───────────────────────────
export async function createOutboundTransfer(
  communityId: string,
  input: CreateTransferInput,
): Promise<FintocTransfer> {
  const { data, error } = await supabase.functions.invoke('fintoc-transfer', {
    body: { community_id: communityId, ...input },
  })

  if (error) throw error
  return data as FintocTransfer
}

export async function getFintocTransfers(communityId: string): Promise<FintocTransfer[]> {
  const { data, error } = await (supabase as any)
    .from('fintoc_transfers')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []) as FintocTransfer[]
}

// ─── Member CLABE management ──────────────────────────────────────
export async function getMemberClabe(memberId: string): Promise<string | null> {
  const { data } = await (supabase as any)
    .from('members')
    .select('fintoc_clabe')
    .eq('id', memberId)
    .single()

  return data?.fintoc_clabe || null
}

export async function assignMemberClabe(
  memberId: string,
  clabe: string,
  accountNumberId: string,
): Promise<void> {
  const { error } = await (supabase as any)
    .from('members')
    .update({ fintoc_clabe: clabe, fintoc_account_number_id: accountNumberId })
    .eq('id', memberId)

  if (error) throw error
}
