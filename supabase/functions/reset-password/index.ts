// Supabase Edge Function: reset-password
// Handles password reset requests server-side using Supabase Admin API.
// Sends a branded password reset email via the send-email Edge Function.
// Invoke via: supabase.functions.invoke('reset-password', { body: { email } })

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const SITE_URL = Deno.env.get('SITE_URL') || 'https://civitas.app'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
}

interface ResetPasswordRequest {
  email: string
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Formato de correo electrónico inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Generate password reset link via Supabase Admin API
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: `${SITE_URL}/reset-password`,
      },
    })

    if (error) {
      console.error('[reset-password] Error generating reset link:', error.message)
      // Return a generic success to avoid user enumeration
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Send branded email via the send-email Edge Function
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
            },
          },
        })
      } catch (emailErr) {
        console.warn('[reset-password] Failed to send branded email, falling back to Supabase default:', emailErr)
        // If the branded email fails, Supabase's default email is still sent
      }
    }

    // Always return success to prevent email enumeration
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
