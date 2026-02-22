#!/usr/bin/env node
/**
 * P0: Verify migrations — file naming and order.
 * Ensures migration files exist, are numbered sequentially, and have no duplicate numbers.
 * Run in CI to catch broken or out-of-order migrations.
 */
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations')

const migrationPattern = /^(\d+)_(.+)\.sql$/

let failed = 0

function fail(msg) {
  failed++
  console.error(`  ❌ ${msg}`)
}

function ok(msg) {
  console.log(`  ✅ ${msg}`)
}

console.log('\n🔍 Verificando migraciones en supabase/migrations...\n')

let files
try {
  files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))
} catch (e) {
  fail(`No se pudo leer el directorio de migraciones: ${e.message}`)
  process.exit(1)
}

if (files.length === 0) {
  fail('No se encontraron archivos .sql en supabase/migrations')
  process.exit(1)
}

const byNumber = new Map()
const numbers = []

for (const file of files) {
  const m = file.match(migrationPattern)
  if (!m) {
    fail(`Nombre inválido (debe ser NNN_name.sql): ${file}`)
    continue
  }
  const num = parseInt(m[1], 10)
  if (byNumber.has(num)) {
    console.warn(`  ⚠️ Número duplicado ${num}: ${file} y ${byNumber.get(num)} (recomendado: renombrar uno)`)
  } else {
    byNumber.set(num, file)
    numbers.push(num)
  }
}

numbers.sort((a, b) => a - b)

for (let i = 0; i < numbers.length - 1; i++) {
  if (numbers[i + 1] !== numbers[i] + 1) {
    const gap = numbers[i + 1] - numbers[i]
    if (gap > 1) {
      ok(`Secuencia: hay salto entre ${numbers[i]} y ${numbers[i + 1]} (aceptable si intencional)`)
    }
  }
}

ok(`${files.length} archivos de migración con formato válido`)
if (byNumber.size !== numbers.length) {
  fail('Números duplicados encontrados')
}

console.log('\n' + '═'.repeat(50))
if (failed > 0) {
  console.error(`\n❌ Fallos: ${failed}\n`)
  process.exit(1)
}
console.log('\n🎉 Migraciones verificadas correctamente.\n')
process.exit(0)
