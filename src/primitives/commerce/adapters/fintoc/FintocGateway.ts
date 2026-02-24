/**
 * Fintoc Adapter — Implements PaymentGateway port using Fintoc
 *
 * This is the ONLY file that knows about Fintoc-specific details.
 * If you switch providers, create a new adapter — don't modify this one.
 */

import { supabase } from '@/shared/lib/supabase'
import type {
  PaymentGateway,
  CheckoutParams,
  CheckoutSession,
  PaymentEvent,
  WebhookResult,
  ReconciliationResult,
  ReconciliationStats,
} from '../../ports/PaymentGateway'

export class FintocGateway implements PaymentGateway {
  readonly providerId = 'fintoc'

  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    const { data: community } = await supabase
      .from('communities')
      .select('fintoc_public_key, fintoc_account_id')
      .eq('id', params.communityId)
      .single()

    if (!community?.fintoc_public_key) {
      throw new Error('El proveedor de pagos no está configurado para esta comunidad')
    }

    const { data, error } = await supabase.functions.invoke('fintoc-checkout', {
      body: {
        community_id: params.communityId,
        member_id: params.memberId,
        obligation_id: params.obligationId,
        amount: params.amount,
        concept: params.concept,
        metadata: params.metadata,
      },
    })

    if (error) throw error

    const raw = data as Record<string, unknown>
    return {
      id: raw.id as string,
      status: (raw.status as CheckoutSession['status']) ?? 'pending',
      amount: params.amount,
      currency: params.currency,
      redirectUrl: raw.redirect_url as string | undefined,
      widgetToken: raw.widget_token as string | undefined,
      providerData: raw,
    }
  }

  async getCheckoutStatus(sessionId: string): Promise<CheckoutSession> {
    const { data, error } = await supabase
      .from('fintoc_checkout_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) throw error

    return {
      id: data.id,
      status: (data.status as CheckoutSession['status']) ?? 'pending',
      amount: data.amount / 100,
      currency: data.currency ?? 'MXN',
      providerData: data as unknown as Record<string, unknown>,
    }
  }

  async processWebhook(payload: unknown, signature: string): Promise<WebhookResult> {
    // Webhook processing happens in the Edge Function (fintoc-webhook)
    // This method is for client-side status checks
    void payload
    void signature
    return {
      accepted: true,
      eventId: null,
      paymentEvent: null,
    }
  }

  async reconcile(eventId: string, obligationId: string): Promise<ReconciliationResult> {
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
        community_id: evt.community_id,
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

    return {
      success: true,
      transactionId: tx?.id ?? null,
      obligationId,
      memberId: null,
    }
  }

  async getReconciliationStats(communityId: string): Promise<ReconciliationStats> {
    const { data } = await supabase
      .from('fintoc_events')
      .select('reconciliation_status, amount')
      .eq('community_id', communityId)

    const events = (data ?? []) as { reconciliation_status: string; amount: number | null }[]

    return {
      matched: events.filter((e) => e.reconciliation_status === 'matched').length,
      unmatched: events.filter((e) => e.reconciliation_status === 'unmatched').length,
      pending: events.filter((e) => e.reconciliation_status === 'pending').length,
      ignored: events.filter((e) => e.reconciliation_status === 'ignored').length,
      totalAmount: events.reduce((sum, e) => sum + (e.amount || 0) / 100, 0),
      matchedAmount: events
        .filter((e) => e.reconciliation_status === 'matched')
        .reduce((sum, e) => sum + (e.amount || 0) / 100, 0),
    }
  }

  async getUnreconciledEvents(communityId: string): Promise<PaymentEvent[]> {
    const { data, error } = await supabase
      .from('fintoc_events')
      .select('*')
      .eq('community_id', communityId)
      .in('reconciliation_status', ['pending', 'unmatched'])
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return (data ?? []).map((evt) => ({
      id: evt.id,
      externalId: evt.fintoc_event_id,
      amount: (evt.amount || 0) / 100,
      currency: 'MXN',
      reference: evt.tracking_key || '',
      counterpartyName: evt.counterparty_name || null,
      counterpartyClabe: evt.counterparty_clabe || null,
      receivedAt: evt.created_at,
      raw: evt,
    }))
  }
}
