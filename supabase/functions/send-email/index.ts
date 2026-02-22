import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Required in Supabase: Edge Functions → send-email → Secrets
// - RESEND_API_KEY: API key from https://resend.com (re_...)
// - FROM_EMAIL (optional): si no tienes dominio verificado en Resend, no lo pongas;
//   se usa onboarding@resend.dev (solo llega al email de tu cuenta Resend en sandbox).
//   Cuando verifiques un dominio, pon ej. notificaciones@tudominio.com
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'onboarding@resend.dev'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** Types that require community_id and admin/tesorero/comite authz. */
const COMMUNITY_SCOPED_TYPES = new Set([
  'proposal_new', 'proposal_approved', 'payment_overdue', 'pre_execution', 'moroso_notice',
  'convocatoria', 'voting_opened', 'voting_closing_soon', 'payment_reminder', 'invitation',
])

/** Max emails per user per minute (rate limit). */
const RATE_LIMIT_PER_MIN = 30
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

interface EmailRequest {
  to: string
  type: string
  data: Record<string, unknown>
}

const TEMPLATES: Record<string, { subject: string; body: (data: Record<string, unknown>) => string }> = {
  proposal_new: {
    subject: 'Nueva propuesta: {title}',
    body: (d) => `
      <h2>Nueva Propuesta en ${d.community_name || 'tu comunidad'}</h2>
      <p><strong>${d.title}</strong></p>
      <p>${d.description || 'Sin descripción'}</p>
      <p>Tipo: ${d.proposal_type} | Creada por: ${d.author_name}</p>
      <a href="${d.app_url}/governance/${d.proposal_id}">Ver Propuesta</a>
    `,
  },
  proposal_approved: {
    subject: 'Propuesta aprobada: {title}',
    body: (d) => `
      <h2>Propuesta Aprobada</h2>
      <p><strong>${d.title}</strong> ha sido aprobada por la comunidad.</p>
      <p>Votos a favor: ${d.votes_for} | En contra: ${d.votes_against}</p>
      <a href="${d.app_url}/governance/${d.proposal_id}">Ver Resultado</a>
    `,
  },
  payment_overdue: {
    subject: 'Pago vencido - {concept}',
    body: (d) => `
      <h2>Tienes un pago vencido</h2>
      <p>Concepto: ${d.concept}</p>
      <p>Monto: $${d.amount} ${d.currency || 'MXN'}</p>
      <p>Fecha de vencimiento: ${d.due_date}</p>
      <a href="${d.app_url}/treasury">Ver Mis Pagos</a>
    `,
  },
  pre_execution: {
    subject: 'Ejecucion pendiente: {title}',
    body: (d) => `
      <h2>Ejecución Próxima</h2>
      <p>La propuesta <strong>${d.title}</strong> será ejecutada pronto.</p>
      <p>Si deseas apelar, tienes hasta ${d.grace_period_end}.</p>
      <a href="${d.app_url}/governance/${d.proposal_id}">Ver Propuesta</a>
    `,
  },
  moroso_notice: {
    subject: 'Aviso de morosidad - Art. 36 LPCI',
    body: (d) => `
      <h2>Aviso de Morosidad</h2>
      <p>De acuerdo con el Art. 36 de la LPCI CDMX, le notificamos que tiene
      ${d.overdue_count} pagos vencidos por un total de $${d.total_debt} ${d.currency || 'MXN'}.</p>
      <p>Regularice su situación para mantener sus derechos de voto y participación.</p>
      <a href="${d.app_url}/treasury">Ver Mis Pagos</a>
    `,
  },
  convocatoria: {
    subject: 'Convocatoria a Asamblea - {title}',
    body: (d) => `
      <h2>Convocatoria a Asamblea</h2>
      <p><strong>${d.title}</strong></p>
      <p>Fecha: ${d.date} | Lugar: ${d.location || 'Por confirmar'}</p>
      <p>${d.description || ''}</p>
      <a href="${d.app_url}/governance/assemblies/${d.assembly_id}">Ver Detalles</a>
    `,
  },
  password_reset: {
    subject: 'Restablecer tu contraseña - CIVITAS',
    body: (d) => `
      <h2>Solicitud de restablecimiento de contraseña</h2>
      <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a <strong>${d.email}</strong>.</p>
      <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${d.reset_link}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Restablecer Contraseña
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
      <p style="font-size: 13px; color: #666;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p style="font-size: 12px; color: #999; word-break: break-all;">${d.reset_link}</p>
    `,
  },
  voting_opened: {
    subject: 'Votación abierta: {title}',
    body: (d) => `
      <h2>Se abrió la votación</h2>
      <p>La propuesta <strong>${d.title}</strong> está en periodo de votación.</p>
      ${d.voting_end ? `<p>La votación cierra el ${d.voting_end}.</p>` : ''}
      <p style="text-align: center; margin: 24px 0;">
        <a href="${d.app_url}/governance/${d.proposal_id}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Ir a votar
        </a>
      </p>
    `,
  },
  voting_closing_soon: {
    subject: 'La votación para "{title}" cierra en 24h',
    body: (d) => `
      <h2>Últimas horas para votar</h2>
      <p>La votación para <strong>${d.title}</strong> cierra en 24 horas.</p>
      <p><a href="${d.app_url}/governance/${d.proposal_id}">Ir a votar</a></p>
    `,
  },
  payment_reminder: {
    subject: 'Recordatorio: pago próximo - {concept}',
    body: (d) => `
      <h2>Pago próximo</h2>
      <p>Tu obligación <strong>${d.concept}</strong> por $${d.amount} ${d.currency || 'MXN'} vence en ${d.days} día(s).</p>
      <p>Fecha de vencimiento: ${d.due_date}</p>
      <a href="${d.app_url}/treasury">Ver Mis Pagos</a>
    `,
  },
  invitation: {
    subject: 'Te han invitado a {community_name} en CIVITAS',
    body: (d) => `
      <h2>Invitación a ${d.community_name || 'una comunidad'}</h2>
      <p>Has sido invitado/a a unirte a <strong>${d.community_name}</strong> con el rol de <strong>${d.role_label || d.role || 'miembro'}</strong>.</p>
      <p>${d.inviter_name ? `<strong>${d.inviter_name}</strong> te envió esta invitación.` : ''}</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${d.invite_link}"
           style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Aceptar Invitación
        </a>
      </p>
      <p style="font-size: 13px; color: #666;">Si no esperabas esta invitación, puedes ignorar este correo.</p>
      <p style="font-size: 13px; color: #666;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
      <p style="font-size: 12px; color: #999; word-break: break-all;">${d.invite_link}</p>
    `,
  },
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderTemplate(type: string, data: Record<string, unknown>): { subject: string; html: string } | null {
  const template = TEMPLATES[type]
  if (!template) return null

  let subject = template.subject
  for (const [key, val] of Object.entries(data)) {
    subject = subject.replace(`{${key}}`, escapeHtml(String(val ?? '')))
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      ${template.body(data)}
      <hr style="margin-top: 32px; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #999;">
        Este correo fue enviado por CIVITAS en nombre de ${data.community_name || 'tu comunidad'}.
        <br>No responder a este correo.
      </p>
    </body>
    </html>
  `

  return { subject, html }
}

function getUserIdFromJwt(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload.sub ?? null
  } catch {
    return null
  }
}

async function assertSendEmailAuthz(
  userId: string | null,
  type: string,
  data: Record<string, unknown>,
): Promise<{ ok: true } | { ok: false; status: number; body: string }> {
  if (type === 'password_reset') {
    return { ok: true }
  }
  if (!userId) {
    return { ok: false, status: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }
  if (!COMMUNITY_SCOPED_TYPES.has(type)) {
    return { ok: true }
  }
  const communityId = data?.community_id as string | undefined
  if (!communityId) {
    return { ok: false, status: 400, body: JSON.stringify({ error: 'community_id required for this email type' }) }
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: member, error } = await supabase
    .from('members')
    .select('role')
    .eq('community_id', communityId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error || !member) {
    return { ok: false, status: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }
  const role = (member as { role: string }).role
  if (!['admin', 'tesorero', 'comite_vigilancia'].includes(role)) {
    return { ok: false, status: 403, body: JSON.stringify({ error: 'Forbidden' }) }
  }
  return { ok: true }
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const windowMs = 60_000
  let entry = rateLimitMap.get(userId)
  if (!entry) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (now >= entry.resetAt) {
    entry.count = 1
    entry.resetAt = now + windowMs
    return true
  }
  entry.count += 1
  return entry.count <= RATE_LIMIT_PER_MIN
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info, apikey',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    const userId = getUserIdFromJwt(authHeader)

    const { to, type, data } = (await req.json()) as EmailRequest

    if (!to || !type) {
      return new Response(JSON.stringify({ error: 'Missing to or type' }), { status: 400 })
    }

    const authz = await assertSendEmailAuthz(userId, type, data || {})
    if (!authz.ok) {
      return new Response(authz.body, { status: authz.status, headers: { 'Content-Type': 'application/json' } })
    }

    if (userId && !checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const rendered = renderTemplate(type, data || {})
    if (!rendered) {
      return new Response(JSON.stringify({ error: `Unknown template: ${type}` }), { status: 400 })
    }

    if (!RESEND_API_KEY) {
      const msg = '[send-email] RESEND_API_KEY not set — add it in Supabase: Edge Functions → send-email → Secrets'
      console.error(msg)
      return new Response(
        JSON.stringify({ success: false, dry_run: true, error: msg }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject: rendered.subject,
        html: rendered.html,
      }),
    })

    const result = (await res.json()) as Record<string, unknown>
    if (!res.ok) {
      console.error('[send-email] Resend API error:', res.status, result)
      return new Response(
        JSON.stringify({ success: false, error: result?.message ?? result, status: res.status }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ success: true, ...result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
