import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'notificaciones@civitas.app'

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
    const { to, type, data } = (await req.json()) as EmailRequest

    if (!to || !type) {
      return new Response(JSON.stringify({ error: 'Missing to or type' }), { status: 400 })
    }

    const rendered = renderTemplate(type, data || {})
    if (!rendered) {
      return new Response(JSON.stringify({ error: `Unknown template: ${type}` }), { status: 400 })
    }

    if (!RESEND_API_KEY) {
      console.log(`[send-email] Would send "${rendered.subject}" to ${to} (no API key configured)`)
      return new Response(JSON.stringify({ success: true, dry_run: true }), {
        headers: { 'Content-Type': 'application/json' },
      })
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

    const result = await res.json()

    return new Response(JSON.stringify({ success: res.ok, ...result }), {
      status: res.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
