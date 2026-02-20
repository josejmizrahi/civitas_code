import { supabase } from '@/shared/lib/supabase'

export interface IfpeWebhookEvent {
  id: string
  community_id: string
  event_type: 'spei_received' | 'spei_returned' | 'clabe_created'
  clabe_destino: string | null
  clabe_origen: string | null
  monto: number | null
  referencia_numerica: string | null
  concepto: string | null
  nombre_ordenante: string | null
  fecha_operacion: string | null
  clave_rastreo: string | null
  reconciliation_status: 'pending' | 'matched' | 'unmatched' | 'manual' | 'ignored'
  matched_obligation_id: string | null
  matched_transaction_id: string | null
  processed_at: string | null
  created_at: string
}

export async function getWebhookEvents(
  communityId: string,
  status?: string
): Promise<IfpeWebhookEvent[]> {
  let query = (supabase as any).from('ifpe_webhook_events')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('reconciliation_status', status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as IfpeWebhookEvent[]
}

export async function manualReconcile(
  eventId: string,
  obligationId: string,
  communityId: string
): Promise<void> {
  const { data: event, error: eventErr } = await (supabase as any).from('ifpe_webhook_events')
    .select('*')
    .eq('id', eventId)
    .single()
  if (eventErr) throw eventErr

  const evt = event as IfpeWebhookEvent

  const { data: tx, error: txErr } = await (supabase.from('transactions') as any)
    .insert({
      community_id: communityId,
      type: 'income',
      amount: evt.monto,
      description: `SPEI (conciliación manual): ${evt.concepto || evt.nombre_ordenante || ''} (${evt.clave_rastreo})`,
      date: evt.fecha_operacion || new Date().toISOString().split('T')[0],
      external_ref: evt.clave_rastreo,
      origin: 'rail',
    })
    .select()
    .single()
  if (txErr) throw txErr

  const { error: obErr } = await (supabase.from('payment_obligations') as any)
    .update({ status: 'paid', payment_transaction_id: tx.id })
    .eq('id', obligationId)
  if (obErr) throw obErr

  const { error: evtErr } = await (supabase as any).from('ifpe_webhook_events')
    .update({
      reconciliation_status: 'manual',
      matched_obligation_id: obligationId,
      matched_transaction_id: tx.id,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId)
  if (evtErr) throw evtErr
}

export async function ignoreEvent(eventId: string): Promise<void> {
  const { error } = await (supabase as any).from('ifpe_webhook_events')
    .update({
      reconciliation_status: 'ignored',
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId)
  if (error) throw error
}

export async function getReconciliationStats(communityId: string): Promise<{
  total: number
  matched: number
  unmatched: number
  pending: number
  totalAmount: number
  matchedAmount: number
}> {
  const { data, error } = await (supabase as any).from('ifpe_webhook_events')
    .select('reconciliation_status, monto')
    .eq('community_id', communityId)
    .eq('event_type', 'spei_received')

  if (error) throw error
  const rows = data ?? []

  let matched = 0, unmatched = 0, pending = 0, totalAmount = 0, matchedAmount = 0
  for (const row of rows as any[]) {
    const amount = Number(row.monto) || 0
    totalAmount += amount
    switch (row.reconciliation_status) {
      case 'matched':
      case 'manual':
        matched++
        matchedAmount += amount
        break
      case 'unmatched':
        unmatched++
        break
      case 'pending':
        pending++
        break
    }
  }

  return { total: rows.length, matched, unmatched, pending, totalAmount, matchedAmount }
}
