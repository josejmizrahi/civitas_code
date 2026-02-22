/**
 * Verifica la Edge Function send-push.
 *
 * Requiere:
 * - VITE_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (recomendado) o VITE_SUPABASE_ANON_KEY
 * - SEND_PUSH_TEST_MEMBER_IDS (csv)
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
const memberIdsRaw = process.env.SEND_PUSH_TEST_MEMBER_IDS || ''
const memberIds = memberIdsRaw
  .split(',')
  .map((v) => v.trim())
  .filter(Boolean)

if (!supabaseUrl || !apiKey) {
  console.error('Faltan variables: VITE_SUPABASE_URL y (SUPABASE_SERVICE_ROLE_KEY o VITE_SUPABASE_ANON_KEY).')
  process.exit(1)
}
if (memberIds.length === 0) {
  console.error('Falta SEND_PUSH_TEST_MEMBER_IDS (csv de member_ids).')
  process.exit(1)
}

const title = process.env.SEND_PUSH_TEST_TITLE || 'Prueba send-push'
const body = process.env.SEND_PUSH_TEST_BODY || 'Mensaje de prueba desde scripts/verify-send-push.mjs'
const url = `${supabaseUrl}/functions/v1/send-push`

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    member_ids: memberIds,
    title,
    body,
    data: {
      source: 'verify-send-push-script',
      sent_at: new Date().toISOString(),
    },
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
console.log('Response:', json ?? text)

if (!res.ok) process.exit(1)
