import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const IFPE_WEBHOOK_SECRET = Deno.env.get('IFPE_WEBHOOK_SECRET') || ''

/** Max age for webhook payload (anti-replay). If payload has `ts` (Unix seconds), reject if older than this. */
const WEBHOOK_MAX_AGE_SEC = 300

interface SpeiPayload {
  event_type: 'spei_received' | 'spei_returned' | 'clabe_created'
  clabe_destino: string
  clabe_origen?: string
  monto: number
  referencia_numerica?: string
  concepto?: string
  nombre_ordenante?: string
  rfc_ordenante?: string
  fecha_operacion: string
  clave_rastreo: string
  /** Optional Unix timestamp (seconds) for anti-replay. Reject if older than WEBHOOK_MAX_AGE_SEC. */
  ts?: number
}

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!IFPE_WEBHOOK_SECRET) return false
  if (!signature) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(IFPE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const expected = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body)))

  let received: Uint8Array
  try {
    received = Uint8Array.from(atob(signature), c => c.charCodeAt(0))
  } catch {
    return false
  }

  if (expected.length !== received.length) return false
  // Timing-safe comparison
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected[i] ^ received[i]
  return diff === 0
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-webhook-signature',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature')

  if (!(await verifySignature(rawBody, signature))) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
  }

  let payload: SpeiPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  if (!payload.clabe_destino || !payload.clave_rastreo) {
    return new Response(JSON.stringify({ error: 'Missing clabe_destino or clave_rastreo' }), { status: 400 })
  }

  if (typeof payload.monto !== 'number' || payload.monto <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid monto: must be a positive number' }), { status: 400 })
  }

  // Anti-replay: if provider sends ts (Unix seconds), reject if too old
  if (typeof payload.ts === 'number') {
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - payload.ts) > WEBHOOK_MAX_AGE_SEC) {
      return new Response(JSON.stringify({ error: 'Request too old or timestamp in future' }), { status: 400 })
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    // Find the community by CLABE
    const { data: communities } = await supabase
      .from('communities')
      .select('id, rules')

    const matchedCommunity = (communities || []).find((c: { id: string; rules?: { treasury?: { clabe?: string } } }) => {
      const clabe = c.rules?.treasury?.clabe
      return clabe && clabe === payload.clabe_destino
    })

    if (!matchedCommunity) {
      return new Response(
        JSON.stringify({ error: 'No community found for CLABE', clabe: payload.clabe_destino }),
        { status: 404 }
      )
    }

    // Store the webhook event
    const { data: event, error: insertErr } = await supabase
      .from('ifpe_webhook_events')
      .insert({
        community_id: matchedCommunity.id,
        event_type: payload.event_type,
        clabe_destino: payload.clabe_destino,
        clabe_origen: payload.clabe_origen || null,
        monto: payload.monto,
        referencia_numerica: payload.referencia_numerica || null,
        concepto: payload.concepto || null,
        nombre_ordenante: payload.nombre_ordenante || null,
        rfc_ordenante: payload.rfc_ordenante || null,
        fecha_operacion: payload.fecha_operacion,
        clave_rastreo: payload.clave_rastreo,
        raw_payload: payload,
      })
      .select()
      .single()

    if (insertErr) {
      if (insertErr.code === '23505') {
        return new Response(JSON.stringify({ status: 'duplicate', clave_rastreo: payload.clave_rastreo }), { status: 200 })
      }
      throw insertErr
    }

    // Auto-reconciliation: try to match against pending obligations
    if (payload.event_type === 'spei_received' && matchedCommunity.rules?.treasury?.auto_reconciliation) {
      const reconciled = await attemptReconciliation(supabase, matchedCommunity.id, event)
      return new Response(JSON.stringify({ status: 'received', event_id: event.id, reconciled }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ status: 'received', event_id: event.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('IFPE webhook error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function attemptReconciliation(
  supabase: ReturnType<typeof createClient>,
  communityId: string,
  event: { id: string; referencia_numerica?: string | null; monto: number; concepto?: string | null; nombre_ordenante?: string | null; clave_rastreo: string; fecha_operacion: string }
): Promise<boolean> {
  // Strategy 1: Match by referencia_numerica against payment_reference
  if (event.referencia_numerica) {
    const { data: obligations } = await supabase
      .from('payment_obligations')
      .select('id, amount, member_id, concept')
      .eq('community_id', communityId)
      .in('status', ['pending', 'overdue'])
      .limit(100)

    for (const ob of obligations || []) {
      // Check if the reference contains the obligation short-id
      const shortId = ob.id.replace(/-/g, '').substring(0, 8).toUpperCase()
      if (event.referencia_numerica.includes(shortId) && Math.abs(Number(ob.amount) - Number(event.monto)) < 0.01) {
        // Create the income transaction
        const { data: tx } = await supabase
          .from('transactions')
          .insert({
            community_id: communityId,
            type: 'income',
            amount: event.monto,
            description: `SPEI: ${event.concepto || event.nombre_ordenante || 'Pago recibido'} (${event.clave_rastreo})`,
            date: event.fecha_operacion,
            external_ref: event.clave_rastreo,
            origin: 'rail',
          })
          .select()
          .single()

        if (tx) {
          // Mark obligation as paid
          await supabase
            .from('payment_obligations')
            .update({ status: 'paid', payment_transaction_id: tx.id })
            .eq('id', ob.id)

          // Update the webhook event
          await supabase
            .from('ifpe_webhook_events')
            .update({
              reconciliation_status: 'matched',
              matched_obligation_id: ob.id,
              matched_transaction_id: tx.id,
              processed_at: new Date().toISOString(),
            })
            .eq('id', event.id)

          return true
        }
      }
    }
  }

  // Strategy 2: Match by exact amount against pending obligations (if only one matches)
  const { data: amountMatches } = await supabase
    .from('payment_obligations')
    .select('id, amount, member_id')
    .eq('community_id', communityId)
    .eq('amount', event.monto)
    .in('status', ['pending', 'overdue'])

  if (amountMatches?.length === 1) {
    const ob = amountMatches[0]
    const { data: tx } = await supabase
      .from('transactions')
      .insert({
        community_id: communityId,
        type: 'income',
        amount: event.monto,
        description: `SPEI: ${event.concepto || event.nombre_ordenante || 'Pago recibido'} (${event.clave_rastreo})`,
        date: event.fecha_operacion,
        external_ref: event.clave_rastreo,
        origin: 'rail',
      })
      .select()
      .single()

    if (tx) {
      await supabase
        .from('payment_obligations')
        .update({ status: 'paid', payment_transaction_id: tx.id })
        .eq('id', ob.id)

      await supabase
        .from('ifpe_webhook_events')
        .update({
          reconciliation_status: 'matched',
          matched_obligation_id: ob.id,
          matched_transaction_id: tx.id,
          processed_at: new Date().toISOString(),
        })
        .eq('id', event.id)

      return true
    }
  }

  // No match — mark as unmatched, create transaction anyway
  const { data: tx } = await supabase
    .from('transactions')
    .insert({
      community_id: communityId,
      type: 'income',
      amount: event.monto,
      description: `SPEI (sin conciliar): ${event.concepto || event.nombre_ordenante || ''} (${event.clave_rastreo})`,
      date: event.fecha_operacion,
      external_ref: event.clave_rastreo,
      origin: 'rail',
    })
    .select()
    .single()

  await supabase
    .from('ifpe_webhook_events')
    .update({
      reconciliation_status: 'unmatched',
      matched_transaction_id: tx?.id || null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', event.id)

  return false
}
