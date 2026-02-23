import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FINTOC_SECRET_KEY = Deno.env.get('FINTOC_SECRET_KEY')!
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

    // Verify the caller is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No auth' }), { status: 401, headers: CORS })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: CORS })

    const body = await req.json()
    const { community_id, member_id, obligation_id, amount, concept, member_email } = body

    if (!community_id || !amount) {
      return new Response(JSON.stringify({ error: 'Missing community_id or amount' }), { status: 400, headers: CORS })
    }

    // Get community config for success/cancel URLs
    const { data: community } = await supabase
      .from('communities')
      .select('slug, fintoc_status')
      .eq('id', community_id)
      .single()

    if (!community || community.fintoc_status !== 'active') {
      return new Response(JSON.stringify({ error: 'Fintoc not active for this community' }), { status: 400, headers: CORS })
    }

    const baseUrl = req.headers.get('origin') || 'https://app.civitas.community'
    const successUrl = `${baseUrl}/c/${community.slug}/my-payments?payment=success`
    const cancelUrl = `${baseUrl}/c/${community.slug}/my-payments?payment=cancelled`

    // Create Fintoc Checkout Session
    const fintocPayload: Record<string, unknown> = {
      amount,
      currency: 'mxn',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        community_id,
        member_id: member_id || null,
        obligation_id: obligation_id || null,
        concept: concept || '',
      },
    }

    if (member_email) {
      fintocPayload.customer = { email: member_email }
    }

    const fintocRes = await fetch(`${FINTOC_API}/checkout_sessions`, {
      method: 'POST',
      headers: {
        'Authorization': FINTOC_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fintocPayload),
    })

    if (!fintocRes.ok) {
      const errBody = await fintocRes.text()
      console.error('Fintoc API error:', fintocRes.status, errBody)
      return new Response(JSON.stringify({ error: 'Fintoc API error', details: errBody }), { status: 502, headers: CORS })
    }

    const session = await fintocRes.json()

    // Store in our database
    const { data: record, error: insertErr } = await supabase
      .from('fintoc_checkout_sessions')
      .insert({
        community_id,
        member_id: member_id || user.id,
        obligation_id: obligation_id || null,
        fintoc_session_id: session.id,
        amount,
        currency: 'MXN',
        status: 'created',
        redirect_url: session.redirect_url,
        metadata: { concept, fintoc_mode: session.mode },
      })
      .select()
      .single()

    if (insertErr) {
      console.error('DB insert error:', insertErr)
    }

    return new Response(JSON.stringify({
      ...record,
      redirect_url: session.redirect_url,
      fintoc_session_id: session.id,
    }), { status: 200, headers: CORS })

  } catch (err) {
    console.error('fintoc-checkout error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: CORS })
  }
})
