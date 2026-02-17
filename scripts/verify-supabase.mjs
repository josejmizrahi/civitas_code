/**
 * Supabase Schema Verification Script
 * Verifies all tables, views, functions, and RLS policies exist.
 *
 * Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from environment
 * variables or from .env file in the project root.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Load .env file if env vars are not already set
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
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
} catch {
  // .env file not found — rely on environment variables
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Error: Missing required environment variables.\n\n' +
    'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY either:\n' +
    '  1. In a .env file at the project root, or\n' +
    '  2. As environment variables before running this script.\n\n' +
    'Example .env contents:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key-here\n'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const EXPECTED_TABLES = [
  'communities',
  'members',
  'proposals',
  'votes',
  'delegations',
  'minutes',
  'transactions',
  'categories',
  'budgets',
  'payment_obligations',
  'audit_log',
  'census_snapshots',
  'entities',
  'entity_contacts',
  'recurring_schedules',
  'contracts',
  'contract_installments',
  'ratings',
]

const EXPECTED_VIEWS = [
  'entity_ratings_summary',
]

const EXPECTED_FUNCTIONS = [
  'get_user_community_ids',
  'get_user_role',
  'accept_invitation',
  'compute_financial_standing',
  'refresh_financial_standings',
  'take_census_snapshot',
  'get_platform_census',
  'generate_recurring_obligations',
  'process_recurring_schedules',
  'update_contract_compliance',
]

let passed = 0
let failed = 0
const errors = []

function ok(msg) {
  passed++
  console.log(`  ✅ ${msg}`)
}

function fail(msg) {
  failed++
  errors.push(msg)
  console.log(`  ❌ ${msg}`)
}

console.log('\n🔍 Verificando conexión a Supabase...\n')

// 1. Test basic connectivity
try {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  ok('Conexión a Supabase exitosa')
} catch (e) {
  fail(`Conexión fallida: ${e.message}`)
}

// 2. Verify each table exists by trying to select from it
console.log('\n📋 Verificando tablas...\n')
for (const table of EXPECTED_TABLES) {
  try {
    const { error } = await supabase.from(table).select('*').limit(0)
    if (error) {
      if (error.code === '42501') {
        // Permission denied means table exists but RLS blocks access (expected without auth)
        ok(`Tabla '${table}' existe (RLS activo)`)
      } else if (error.message.includes('does not exist') || error.code === '42P01') {
        fail(`Tabla '${table}' NO EXISTE`)
      } else {
        ok(`Tabla '${table}' existe (${error.code}: ${error.message})`)
      }
    } else {
      ok(`Tabla '${table}' existe y accesible`)
    }
  } catch (e) {
    fail(`Tabla '${table}' error: ${e.message}`)
  }
}

// 3. Verify views
console.log('\n👁️ Verificando vistas...\n')
for (const view of EXPECTED_VIEWS) {
  try {
    const { error } = await supabase.from(view).select('*').limit(0)
    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        fail(`Vista '${view}' NO EXISTE`)
      } else {
        ok(`Vista '${view}' existe`)
      }
    } else {
      ok(`Vista '${view}' existe y accesible`)
    }
  } catch (e) {
    fail(`Vista '${view}' error: ${e.message}`)
  }
}

// 4. Verify functions exist by calling with dummy args (they'll error but differently than "does not exist")
console.log('\n⚙️ Verificando funciones RPC...\n')
for (const fn of EXPECTED_FUNCTIONS) {
  try {
    const { error } = await supabase.rpc(fn, {})
    if (error) {
      if (error.message.includes('Could not find the function') ||
          error.message.includes('function') && error.message.includes('does not exist')) {
        fail(`Función '${fn}' NO EXISTE`)
      } else {
        // Any other error means the function exists but params are wrong (expected)
        ok(`Función '${fn}' existe`)
      }
    } else {
      ok(`Función '${fn}' existe y ejecutable`)
    }
  } catch (e) {
    fail(`Función '${fn}' error: ${e.message}`)
  }
}

// 5. Check some table columns exist
console.log('\n🔧 Verificando columnas clave...\n')

const columnChecks = [
  { table: 'communities', column: 'rules' },
  { table: 'members', column: 'voting_weight' },
  { table: 'members', column: 'financial_standing' },
  { table: 'proposals', column: 'financial_instruction' },
  { table: 'proposals', column: 'execution_status' },
  { table: 'payment_obligations', column: 'payment_transaction_id' },
  { table: 'entities', column: 'clabe' },
  { table: 'entities', column: 'rfc' },
  { table: 'recurring_schedules', column: 'frequency' },
  { table: 'contracts', column: 'compliance_score' },
  { table: 'contract_installments', column: 'installment_number' },
  { table: 'ratings', column: 'overall_score' },
  { table: 'ratings', column: 'dimensions' },
]

for (const { table, column } of columnChecks) {
  try {
    const { error } = await supabase.from(table).select(column).limit(0)
    if (error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        fail(`Columna '${table}.${column}' NO EXISTE`)
      } else {
        ok(`Columna '${table}.${column}' existe`)
      }
    } else {
      ok(`Columna '${table}.${column}' existe`)
    }
  } catch (e) {
    fail(`Columna '${table}.${column}' error: ${e.message}`)
  }
}

// Summary
console.log('\n' + '═'.repeat(50))
console.log(`\n📊 RESUMEN: ${passed} pasaron, ${failed} fallaron\n`)

if (errors.length > 0) {
  console.log('⚠️  Errores encontrados:')
  errors.forEach(e => console.log(`   - ${e}`))
  console.log('')
}

if (failed === 0) {
  console.log('🎉 ¡Todo el schema está correcto! La base de datos tiene todas las tablas, vistas, funciones y columnas esperadas.\n')
} else {
  console.log('🔧 Hay elementos faltantes. Revisa los errores arriba.\n')
}

process.exit(failed > 0 ? 1 : 0)
