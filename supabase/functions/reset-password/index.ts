import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SITE_URL = Deno.env.get('SITE_URL') || 'https://civitas-code.vercel.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
}

interface ResetPasswordRequest {
  email: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const { email } = (await req.json()) as ResetPasswordRequest

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Se requiere un correo electrónico válido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Formato de correo electrónico inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${SITE_URL}/reset-password`,
      },
    })

    if (error) {
      console.error('[reset-password] Error generating reset link:', error.message)
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const resetLink = data?.properties?.action_link
    if (resetLink) {
      try {
        await supabaseAdmin.functions.invoke('send-email', {
          body: {
            to: normalizedEmail,
            type: 'password_reset',
            data: {
              reset_link: resetLink,
              app_url: SITE_URL,
              email: normalizedEmail,
              community_name: 'CIVITAS',
            },
          },
        })
      } catch (emailErr) {
        console.error('[reset-password] Failed to send branded email:', emailErr)
        // generateLink does NOT send an email by itself — if send-email fails,
        // we must fall back to resetPasswordForEmail which sends its own email.
        try {
          await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: `${SITE_URL}/reset-password`,
          })
        } catch (fallbackErr) {
          console.error('[reset-password] Fallback email also failed:', fallbackErr)
        }
      }
    } else {
      // No action_link means generateLink didn't produce a link — use the standard method
      await supabaseAdmin.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: `${SITE_URL}/reset-password`,
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[reset-password] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
