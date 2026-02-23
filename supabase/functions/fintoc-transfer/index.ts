import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FINTOC_SECRET_KEY = Deno.env.get('FINTOC_SECRET_KEY')!
const FINTOC_JWS_SIGNATURE = Deno.env.get('FINTOC_JWS_SIGNATURE') || ''
const FINTOC_API = 'https://api.fintoc.com/v2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: CORS })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })

    const body = await req.json()
    const { community_id, amount, counterparty_clabe, counterparty_name, comment, reference_id, spend_request_id } = body

    if (!community_id || !amount || !counterparty_clabe) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: CORS })
    }

    // Verify caller is admin/tesorero
    const { data: member } = await supabase
      .from('members')
      .select('id, role')
      .eq('community_id', community_id)
      .eq('user_id', user.id)
      .single()

    if (!member || !['admin', 'tesorero'].includes(member.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: CORS })
    }

    // Get community Fintoc account
    const { data: community } = await supabase
      .from('communities')
      .select('fintoc_status, fintoc_account_id')
      .eq('id', community_id)
      .single()

    if (!community || community.fintoc_status !== 'active' || !community.fintoc_account_id) {
      return new Response(JSON.stringify({ error: 'Fintoc not active' }), { status: 400, headers: CORS })
    }

    const idempotencyKey = crypto.randomUUID()

    // Create Fintoc Transfer
    const fintocHeaders: Record<string, string> = {
      'Authorization': FINTOC_SECRET_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    }

    if (FINTOC_JWS_SIGNATURE) {
      fintocHeaders['Fintoc-JWS-Signature'] = FINTOC_JWS_SIGNATURE
    }

    const fintocPayload = {
      amount,
      currency: 'mxn',
      account_id: community.fintoc_account_id,
      comment: comment || 'Pago Civitas',
      reference_id: reference_id || undefined,
      counterparty: {
        account_number: counterparty_clabe,
      },
      metadata: {
        community_id,
        spend_request_id: spend_request_id || null,
        initiated_by: user.id,
      },
    }

    const fintocRes = await fetch(`${FINTOC_API}/transfers`, {
      method: 'POST',
      headers: fintocHeaders,
      body: JSON.stringify(fintocPayload),
    })

    if (!fintocRes.ok) {
      const errBody = await fintocRes.text()
      console.error('Fintoc transfer error:', fintocRes.status, errBody)
      return new Response(JSON.stringify({ error: 'Fintoc API error', details: errBody }), { status: 502, headers: CORS })
    }

    const transfer = await fintocRes.json()

    // Create expense transaction
    const amountDecimal = amount / 100
    const { data: tx } = await supabase
      .from('transactions')
      .insert({
        community_id,
        type: 'expense',
        amount: amountDecimal,
        description: `SPEI Fintoc: ${comment || ''} → ${counterparty_name || counterparty_clabe}`,
        date: new Date().toISOString(),
        external_ref: transfer.tracking_key || transfer.id,
        origin: 'fintoc',
      })
      .select()
      .single()

    // Store transfer record
    const { data: record } = await supabase
      .from('fintoc_transfers')
      .insert({
        community_id,
        fintoc_transfer_id: transfer.id,
        direction: 'outbound',
        amount,
        currency: 'MXN',
        status: transfer.status || 'pending',
        counterparty_clabe,
        counterparty_name: counterparty_name || transfer.counterparty?.holder_name || null,
        comment,
        reference_id,
        tracking_key: transfer.tracking_key || null,
        spend_request_id: spend_request_id || null,
        linked_transaction_id: tx?.id || null,
        metadata: { fintoc_mode: transfer.mode, idempotency_key: idempotencyKey },
      })
      .select()
      .single()

    return new Response(JSON.stringify(record), { status: 200, headers: CORS })

  } catch (err) {
    console.error('fintoc-transfer error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
