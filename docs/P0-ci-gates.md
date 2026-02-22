# P0 Gates de CI bloqueantes

Diseño de los gates de CI para release P0. Todos los que se ejecutan deben ser **bloqueantes** (no `continue-on-error` en flujos críticos).

## Gates implementados

| Gate | Comando / Job | Bloqueante | Notas |
|------|----------------|------------|--------|
| **Lint** | `npm run lint` | Sí | quality job |
| **Typecheck & build** | `npm run build` | Sí | quality job |
| **Unit tests** | `npm run test -- --run` | Sí | Incluye RLS penetration cuando `TEST_SUPABASE_ANON_KEY` está definido |
| **Coverage** | `npm run test:coverage` | Sí | Umbrales en `vite.config.ts` (lines/functions/branches/statements) |
| **Verify migrations** | `node scripts/verify-migrations.mjs` | Sí | Formato y nombres de archivos en `supabase/migrations` |
| **E2E smoke** | `npm run test:e2e` | Sí | Solo se ejecuta en push a main cuando hay secrets; si corre, falla el pipeline si falla |
| **Security audit** | `npm audit --audit-level=high` | No (continue-on-error) | Recomendado activar como bloqueante cuando no haya vulnerabilidades abiertas |

## Flujo del pipeline

1. **quality**: install → lint → build → unit tests → coverage → verify-migrations.
2. **e2e**: solo si `push` a `main`; necesita `E2E_LOGIN_EMAIL` y `E2E_LOGIN_PASSWORD`; si se ejecuta, es bloqueante.
3. **security**: audit en paralelo; actualmente no bloqueante.

## Verificación de migraciones

- **Script:** `scripts/verify-migrations.mjs`
- **Comprueba:** nombres `NNN_name.sql`, sin nombres inválidos; advierte si hay números duplicados.
- **Opcional (fuera de CI estándar):** `scripts/verify-supabase.mjs` contra una instancia con schema aplicado (requiere `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`).

## RLS tests en CI

- Los tests de RLS están en `src/test/rls-penetration.test.ts`.
- Se ejecutan con `npm run test`; si `TEST_SUPABASE_ANON_KEY` no está definido, la suite se salta (`describe.skip`).
- Para que RLS sea bloqueante en CI: configurar en el repo (o en un job con secrets) `TEST_SUPABASE_URL` y `TEST_SUPABASE_ANON_KEY` de un proyecto de pruebas.

## Cobertura P0

- Umbrales actuales en `vite.config.ts` (vitest.coverage.thresholds); se pueden subir de forma progresiva por dominio según DoD.
- Objetivo P0: mantener umbrales que no bloqueen por ruido pero que exijan cobertura mínima en rutas críticas.

## Resumen

- **Bloqueantes:** lint, typecheck/build, unit tests, coverage, verify-migrations.
- **Bloqueante cuando corre:** E2E smoke (solo en push a main con secrets).
- **Opcional / recomendado:** security audit bloqueante; RLS tests con Supabase de prueba.

Referencia: [P0-dod-by-flow.md](./P0-dod-by-flow.md) DoD-QA Release.
