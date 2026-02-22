import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:soporte@civitas.app'

interface PushRequest {
  member_ids: string[]
  title: string
  body: string
  data?: Record<string, unknown>
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }

  try {
    const payload = (await req.json()) as PushRequest
    if (!payload?.member_ids?.length || !payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: 'Missing member_ids, title or body' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ success: false, dry_run: true, reason: 'missing_supabase_secrets' }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, keys')
      .in('member_id', payload.member_ids)

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ success: true, sent: 0, skipped: 0, reason: 'no_subscriptions' }), {
        status: 200,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      })
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({
          success: false,
          dry_run: true,
          reason: 'missing_vapid_secrets',
          subscriptions_found: subscriptions.length,
        }),
        {
          status: 200,
          headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
        },
      )
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

    let sent = 0
    let skipped = 0

    for (const sub of subscriptions as Array<{ id: string; endpoint: string; keys: { p256dh?: string; auth?: string } }>) {
      if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
        skipped += 1
        continue
      }

      const message = JSON.stringify({
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      })

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          message,
        )
        sent += 1
      } catch (sendErr) {
        console.warn('[send-push] failed subscription', sub.id, String(sendErr))
        skipped += 1
      }
    }

    return new Response(JSON.stringify({ success: true, sent, skipped }), {
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    })
  }
})
