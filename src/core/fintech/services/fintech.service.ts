import { supabase } from '@/shared/lib/supabase'
import { emitPaymentReceived, emitTransferCompleted, emitCheckoutCompleted } from '@/primitives/commerce/events'
import { emitObligationPaid } from '@/primitives/treasury/events'
import type {
  PaymentEvent,
  CheckoutSession,
  PaymentTransfer,
  ReconciliationStats,
  CreateCheckoutInput,
  CreateTransferInput,
} from '../types'

// ─── Community Fintech Config ────────────────────────────────────
export async function getFintechStatus(communityId: string) {
  const { data, error } = await supabase
    .from('communities')
    .select('fintoc_status, fintoc_account_id, fintoc_root_clabe, fintoc_public_key')
    .eq('id', communityId)
    .single()

  if (error) throw error
  return {
    fintech_status: data.fintoc_status as string,
    fintech_account_id: data.fintoc_account_id as string | null,
    fintech_root_clabe: data.fintoc_root_clabe as string | null,
    fintech_public_key: data.fintoc_public_key as string | null,
  }
}

export async function activateProvider(
  communityId: string,
  config: { account_id: string; root_clabe: string; public_key: string },
) {
  const { error } = await supabase
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

export async function deactivateProvider(communityId: string) {
  const { error } = await supabase
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
): Promise<CheckoutSession> {
  const { data: community } = await supabase
    .from('communities')
    .select('fintoc_public_key, fintoc_account_id')
    .eq('id', communityId)
    .single()

  if (!community?.fintoc_public_key) {
    throw new Error('El proveedor de pagos no está configurado para esta comunidad')
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
  const session = data as CheckoutSession

  void emitCheckoutCompleted(communityId, memberId, {
    sessionId: session.id,
    memberId,
    amount: input.amount,
    obligationId: input.obligation_id ?? null,
  })

  return session
}

export async function getCheckoutSessions(
  communityId: string,
  memberId?: string,
): Promise<CheckoutSession[]> {
  let query = supabase
    .from('fintoc_checkout_sessions')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (memberId) query = query.eq('member_id', memberId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as CheckoutSession[]
}

// ─── Payment Events (inbound transfers) ──────────────────────────
export async function getPaymentEvents(
  communityId: string,
  status?: string,
): Promise<PaymentEvent[]> {
  let query = supabase
    .from('fintoc_events')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('reconciliation_status', status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as PaymentEvent[]
}

export async function manualReconcile(
  eventId: string,
  obligationId: string,
  communityId: string,
): Promise<void> {
  const { data: evt } = await supabase
    .from('fintoc_events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (!evt) throw new Error('Evento no encontrado')

  const amount = (evt.amount || 0) / 100

  const { data: tx } = await supabase
    .from('transactions')
    .insert({
      community_id: communityId,
      type: 'income',
      amount,
      description: `SPEI (conciliación manual): ${evt.counterparty_name || ''} (${evt.tracking_key || evt.fintoc_event_id})`,
      date: new Date().toISOString(),
      external_ref: evt.tracking_key || evt.fintoc_event_id,
      origin: 'fintoc',
    })
    .select()
    .single()

  if (tx) {
    await supabase
      .from('payment_obligations')
      .update({ status: 'paid', payment_transaction_id: tx.id })
      .eq('id', obligationId)
  }

  await supabase
    .from('fintoc_events')
    .update({
      reconciliation_status: 'manual',
      matched_obligation_id: obligationId,
      matched_transaction_id: tx?.id || null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId)

  // Emit domain events so other primitives react
  void emitPaymentReceived(communityId, null, {
    externalId: evt.fintoc_event_id || eventId,
    provider: 'fintoc',
    amount,
    currency: 'MXN',
    reference: evt.tracking_key || '',
    counterpartyClabe: evt.counterparty_clabe || null,
    matchedObligationId: obligationId,
    matchedMemberId: null,
  })

  if (tx) {
    void emitObligationPaid(communityId, null, {
      obligationId,
      memberId: '',
      amount,
      transactionId: tx.id,
    })
  }
}

export async function ignoreEvent(eventId: string): Promise<void> {
  await supabase
    .from('fintoc_events')
    .update({
      reconciliation_status: 'ignored',
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId)
}

export async function getReconciliationStats(communityId: string): Promise<ReconciliationStats> {
  const { data } = await supabase
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
): Promise<PaymentTransfer> {
  const { data, error } = await supabase.functions.invoke('fintoc-transfer', {
    body: { community_id: communityId, ...input },
  })

  if (error) throw error
  const transfer = data as PaymentTransfer

  void emitTransferCompleted(communityId, null, {
    transferId: transfer.id,
    provider: 'fintoc',
    amount: input.amount,
    destinationClabe: input.counterparty_clabe,
    status: transfer.status ?? 'pending',
  })

  return transfer
}

export async function getTransfers(communityId: string): Promise<PaymentTransfer[]> {
  const { data, error } = await supabase
    .from('fintoc_transfers')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []) as PaymentTransfer[]
}

// ─── Member CLABE management ──────────────────────────────────────
export async function getMemberClabe(memberId: string): Promise<string | null> {
  const { data } = await supabase
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
  const { error } = await supabase
    .from('members')
    .update({ fintoc_clabe: clabe, fintoc_account_number_id: accountNumberId })
    .eq('id', memberId)

  if (error) throw error
}
