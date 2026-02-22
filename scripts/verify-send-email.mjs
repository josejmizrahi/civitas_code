/**
 * Verifica la Edge Function send-email.
 *
 * Requiere:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (recomendado) o VITE_SUPABASE_ANON_KEY
 * - SEND_EMAIL_TEST_TO
 *
 * Opcionales:
 * - SEND_EMAIL_TEST_TYPE (default: monthly_statement_ready)
 * - SEND_EMAIL_TEST_APP_URL (default: http://localhost:5173)
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')

try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue
    const key = trimmed.slice(0, eqIndex).trim()
    const value = trimmed.slice(eqIndex + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
} catch {
  // .env opcional
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apiKey = serviceRoleKey || anonKey
const to = process.env.SEND_EMAIL_TEST_TO
const type = process.env.SEND_EMAIL_TEST_TYPE || 'monthly_statement_ready'
const appUrl = process.env.SEND_EMAIL_TEST_APP_URL || 'http://localhost:5173'

if (!supabaseUrl || !apiKey) {
  console.error('Faltan variables: VITE_SUPABASE_URL y (SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_ANON_KEY).')
  process.exit(1)
}

if (!to) {
  console.error('Falta SEND_EMAIL_TEST_TO.')
  process.exit(1)
}

const payloadByType = {
  monthly_statement_ready: {
    period: '2026-02',
    fund_type: 'mantenimiento',
    app_url: appUrl,
    community_name: 'CIVITAS Demo',
  },
  discretionary_request: {
    amount: 12500,
    description: 'Prueba automatizada de solicitud discrecional',
    app_url: appUrl,
    community_name: 'CIVITAS Demo',
  },
  discretionary_decision: {
    amount: 12500,
    description: 'Prueba automatizada de resolución discrecional',
    decision: 'approved',
    app_url: appUrl,
    community_name: 'CIVITAS Demo',
  },
  proposal_closed: {
    title: 'Prueba cierre de propuesta',
    proposal_id: 'demo-proposal-id',
    result_text: 'Aprobada por mayoría',
    app_url: appUrl,
    community_name: 'CIVITAS Demo',
  },
}

const data = payloadByType[type] || payloadByType.monthly_statement_ready

const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    to,
    type,
    data,
  }),
})

const text = await res.text()
let json = null
try {
  json = JSON.parse(text)
} catch {
  // no-op
}

console.log('Status:', res.status)
console.log('Type:', type)
console.log('Response:', json ?? text)

if (!res.ok) process.exit(1)
