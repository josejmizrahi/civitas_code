import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, content-type, fintoc-signature',
  'Content-Type': 'application/json',
}

function log(level: 'info' | 'warn' | 'error', message: string, meta: Record<string, unknown> = {}) {
  console[level](JSON.stringify({ ts: new Date().toISOString(), level, message, ...meta }))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: CORS_HEADERS })
  }

  const rawBody = await req.text()
  let event: {
    id: string
    type: string
    object: string
    data: Record<string, unknown>
    created_at: string
    mode: string
  }

  try {
    event = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: CORS_HEADERS })
  }

  if (!event.id || !event.type) {
    return new Response(JSON.stringify({ error: 'Missing event id or type' }), { status: 400, headers: CORS_HEADERS })
  }

  log('info', 'fintoc_event_received', { event_id: event.id, type: event.type, mode: event.mode })

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Handle different event types
    switch (event.type) {
      case 'transfer.inbound.succeeded':
        await handleInboundTransfer(supabase, event)
        break

      case 'checkout_session.finished':
        await handleCheckoutFinished(supabase, event)
        break

      case 'checkout_session.expired':
        await handleCheckoutExpired(supabase, event)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(supabase, event)
        break

      case 'payment_intent.failed':
        await handlePaymentFailed(supabase, event)
        break

      case 'transfer.outbound.succeeded':
        await handleOutboundSucceeded(supabase, event)
        break

      case 'transfer.outbound.rejected':
      case 'transfer.outbound.failed':
        await handleOutboundFailed(supabase, event)
        break

      default:
        log('info', 'unhandled_event_type', { type: event.type })
    }

    return new Response(JSON.stringify({ status: 'ok', event_id: event.id }), { status: 200, headers: CORS_HEADERS })
  } catch (err) {
    log('error', 'fintoc_webhook_error', { error: String(err), event_id: event.id })
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS_HEADERS })
  }
})

// ─── Inbound transfer (SPEI received to community CLABE) ──────────
async function handleInboundTransfer(
  supabase: ReturnType<typeof createClient>,
  event: { id: string; type: string; data: Record<string, unknown> },
) {
  const d = event.data as {
    id: string
    amount: number
    currency: string
    status: string
    comment?: string
    reference_id?: string
    tracking_key?: string
    account_number?: { id: string; number: string; metadata?: Record<string, string> }
    counterparty?: { holder_name?: string; account_number?: string; holder_id?: string }
    transaction_date?: string
  }

  const clabe = d.account_number?.number
  if (!clabe) {
    log('warn', 'inbound_no_clabe', { transfer_id: d.id })
    return
  }

  // Find community by root CLABE or member by their CLABE
  let communityId: string | null = null
  let memberId: string | null = null

  // Check member-level CLABE first (most specific)
  const { data: memberMatch } = await supabase
    .from('members')
    .select('id, community_id')
    .eq('fintoc_clabe', clabe)
    .single()

  if (memberMatch) {
    communityId = memberMatch.community_id
    memberId = memberMatch.id
  } else {
    // Try community root CLABE
    const { data: communityMatch } = await supabase
      .from('communities')
      .select('id')
      .eq('fintoc_root_clabe', clabe)
      .single()

    if (communityMatch) communityId = communityMatch.id
  }

  if (!communityId) {
    log('warn', 'no_community_for_clabe', { clabe })
    return
  }

  // Store the fintoc event (idempotent)
  const { error: dupErr } = await supabase.from('fintoc_events').insert({
    community_id: communityId,
    fintoc_event_id: event.id,
    event_type: event.type,
    event_data: event.data,
    amount: d.amount,
    currency: d.currency || 'MXN',
    counterparty_name: d.counterparty?.holder_name || null,
    counterparty_clabe: d.counterparty?.account_number || null,
    tracking_key: d.tracking_key || null,
    account_number_id: d.account_number?.id || null,
    reconciliation_status: 'pending',
  })

  if (dupErr?.code === '23505') {
    log('info', 'duplicate_fintoc_event', { event_id: event.id })
    return
  }
  if (dupErr) throw dupErr

  // Auto-reconciliation
  const amountCents = d.amount
  const amountDecimal = amountCents / 100

  // Strategy 1: Member CLABE → find their pending obligation
  if (memberId) {
    const { data: obligations } = await supabase
      .from('payment_obligations')
      .select('id, amount')
      .eq('community_id', communityId)
      .eq('member_id', memberId)
      .in('status', ['pending', 'overdue'])
      .order('due_date', { ascending: true })
      .limit(10)

    const match = (obligations || []).find(
      (o: { amount: number }) => Math.abs(Number(o.amount) - amountDecimal) < 0.01,
    )

    if (match) {
      await reconcile(supabase, communityId, event.id, match.id, amountDecimal, d, 'matched')
      return
    }
  }

  // Strategy 2: Reference-based matching
  const customerMeta = d.account_number?.metadata
  if (customerMeta) {
    const clientId = customerMeta.member_id || customerMeta.obligation_id
    if (clientId) {
      const { data: ob } = await supabase
        .from('payment_obligations')
        .select('id, amount')
        .eq('id', clientId)
        .in('status', ['pending', 'overdue'])
        .single()

      if (ob && Math.abs(Number(ob.amount) - amountDecimal) < 0.01) {
        await reconcile(supabase, communityId, event.id, ob.id, amountDecimal, d, 'matched')
        return
      }
    }
  }

  // Strategy 3: Exact amount match (only if exactly one pending obligation for community)
  const { data: amountMatches } = await supabase
    .from('payment_obligations')
    .select('id, amount')
    .eq('community_id', communityId)
    .in('status', ['pending', 'overdue'])

  const exactMatches = (amountMatches || []).filter(
    (o: { amount: number }) => Math.abs(Number(o.amount) - amountDecimal) < 0.01,
  )

  if (exactMatches.length === 1) {
    await reconcile(supabase, communityId, event.id, exactMatches[0].id, amountDecimal, d, 'matched')
    return
  }

  // No match — create unmatched transaction
  const { data: tx } = await supabase
    .from('transactions')
    .insert({
      community_id: communityId,
      type: 'income',
      amount: amountDecimal,
      description: `SPEI: ${d.counterparty?.holder_name || d.comment || 'Transferencia recibida'} (${d.tracking_key || d.id})`,
      date: d.transaction_date || new Date().toISOString(),
      external_ref: d.tracking_key || d.id,
      origin: 'fintoc',
    })
    .select()
    .single()

  await supabase
    .from('fintoc_events')
    .update({
      reconciliation_status: 'unmatched',
      matched_transaction_id: tx?.id || null,
      processed_at: new Date().toISOString(),
    })
    .eq('fintoc_event_id', event.id)

  log('info', 'inbound_unmatched', { event_id: event.id, amount: amountDecimal })
}

async function reconcile(
  supabase: ReturnType<typeof createClient>,
  communityId: string,
  fintocEventId: string,
  obligationId: string,
  amount: number,
  transferData: { tracking_key?: string; counterparty?: { holder_name?: string }; comment?: string; transaction_date?: string; id: string },
  status: string,
) {
  const { data: tx } = await supabase
    .from('transactions')
    .insert({
      community_id: communityId,
      type: 'income',
      amount,
      description: `SPEI Fintoc: ${transferData.counterparty?.holder_name || transferData.comment || 'Pago recibido'} (${transferData.tracking_key || transferData.id})`,
      date: transferData.transaction_date || new Date().toISOString(),
      external_ref: transferData.tracking_key || transferData.id,
      origin: 'fintoc',
    })
    .select()
    .single()

  if (tx) {
    await supabase
      .from('payment_obligations')
      .update({ status: 'paid', payment_transaction_id: tx.id })
      .eq('id', obligationId)

    await supabase
      .from('fintoc_events')
      .update({
        reconciliation_status: status,
        matched_obligation_id: obligationId,
        matched_transaction_id: tx.id,
        processed_at: new Date().toISOString(),
      })
      .eq('fintoc_event_id', fintocEventId)
  }

  log('info', 'reconciled', { event_id: fintocEventId, obligation_id: obligationId })
}

// ─── Checkout Session Finished ────────────────────────────────────
async function handleCheckoutFinished(
  supabase: ReturnType<typeof createClient>,
  event: { id: string; data: Record<string, unknown> },
) {
  const d = event.data as { id: string; status: string; payment_resource?: { payment_intent?: { id: string; status: string } } }

  await supabase
    .from('fintoc_checkout_sessions')
    .update({
      status: 'finished',
      payment_intent_id: d.payment_resource?.payment_intent?.id || null,
      payment_status: d.payment_resource?.payment_intent?.status || null,
      updated_at: new Date().toISOString(),
    })
    .eq('fintoc_session_id', d.id)

  // If payment succeeded, reconcile with obligation
  if (d.payment_resource?.payment_intent?.status === 'succeeded') {
    const { data: session } = await supabase
      .from('fintoc_checkout_sessions')
      .select('*')
      .eq('fintoc_session_id', d.id)
      .single()

    if (session?.obligation_id) {
      const { data: tx } = await supabase
        .from('transactions')
        .insert({
          community_id: session.community_id,
          type: 'income',
          amount: session.amount / 100,
          description: `Pago Fintoc Checkout (${d.id})`,
          date: new Date().toISOString(),
          external_ref: d.payment_resource.payment_intent.id,
          origin: 'fintoc',
        })
        .select()
        .single()

      if (tx) {
        await supabase
          .from('payment_obligations')
          .update({ status: 'paid', payment_transaction_id: tx.id })
          .eq('id', session.obligation_id)
      }
    }
  }

  log('info', 'checkout_finished', { session_id: d.id })
}

async function handleCheckoutExpired(
  supabase: ReturnType<typeof createClient>,
  event: { id: string; data: Record<string, unknown> },
) {
  const d = event.data as { id: string }
  await supabase
    .from('fintoc_checkout_sessions')
    .update({ status: 'expired', updated_at: new Date().toISOString() })
    .eq('fintoc_session_id', d.id)

  log('info', 'checkout_expired', { session_id: d.id })
}

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createClient>,
  event: { id: string; data: Record<string, unknown> },
) {
  const d = event.data as { id: string; status: string }
  await supabase
    .from('fintoc_checkout_sessions')
    .update({ payment_status: 'succeeded', updated_at: new Date().toISOString() })
    .eq('payment_intent_id', d.id)

  log('info', 'payment_succeeded', { payment_intent_id: d.id })
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  event: { id: string; data: Record<string, unknown> },
) {
  const d = event.data as { id: string }
  await supabase
    .from('fintoc_checkout_sessions')
    .update({ payment_status: 'failed', status: 'failed', updated_at: new Date().toISOString() })
    .eq('payment_intent_id', d.id)

  log('info', 'payment_failed', { payment_intent_id: d.id })
}

// ─── Outbound Transfer events ─────────────────────────────────────
async function handleOutboundSucceeded(
  supabase: ReturnType<typeof createClient>,
  event: { id: string; data: Record<string, unknown> },
) {
  const d = event.data as { id: string; tracking_key?: string; amount?: number }

  await supabase
    .from('fintoc_transfers')
    .update({ status: 'succeeded', tracking_key: d.tracking_key || null, updated_at: new Date().toISOString() })
    .eq('fintoc_transfer_id', d.id)

  log('info', 'outbound_succeeded', { transfer_id: d.id })
}

async function handleOutboundFailed(
  supabase: ReturnType<typeof createClient>,
  event: { id: string; type: string; data: Record<string, unknown> },
) {
  const d = event.data as { id: string; return_reason?: string }
  const status = event.type.includes('rejected') ? 'rejected' : 'failed'

  await supabase
    .from('fintoc_transfers')
    .update({ status, error_reason: d.return_reason || null, updated_at: new Date().toISOString() })
    .eq('fintoc_transfer_id', d.id)

  log('info', 'outbound_failed', { transfer_id: d.id, status })
}
