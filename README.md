# Civitas

Aplicación de gestión de comunidades (gobierno, tesorería e identidad) con soporte para reglas configurables, votaciones y cumplimiento normativo (LPCI CDMX, LFPDPPP).

## CI/CD

En cada push y PR a `main` o `develop` se ejecuta el pipeline (`.github/workflows/ci.yml`):

- **Lint** — ESLint (debe pasar sin errores).
- **Build** — `tsc -b` y `vite build`.
- **Tests** — Vitest (unitarios) y cobertura con umbrales mínimos.
- **E2E** — Playwright (smoke) solo en push a `main` si existen `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD` en secrets.
- **Security** — `npm audit --audit-level=high` (informativo).

Para publicar una release, asegurar que el pipeline esté en verde y seguir la documentación en [docs/README.md](./docs/README.md).

## Requisitos

- Node.js 18+
- npm o pnpm

## Configuración

```bash
npm install
```

Variables de entorno (crear `.env` a partir de `.env.example` si existe):

- `VITE_SUPABASE_URL` — URL del proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` — Clave anónima de Supabase
- `VITE_VAPID_PUBLIC_KEY` — (opcional) Clave pública VAPID para notificaciones push
- `SUPABASE_SERVICE_ROLE_KEY` — (scripts/verificación) clave service role para pruebas de Edge Functions
- `SEND_PUSH_TEST_MEMBER_IDS` — (opcional para script) CSV de `member_id` para prueba push
- `SEND_EMAIL_TEST_TO` — (opcional para script) correo destino para prueba de email

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Compilación para producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | ESLint |
| `npm run test` | Tests unitarios (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npm run test:coverage` | Cobertura de tests |
| `npm run test:e2e` | Tests E2E (Playwright) |
| `npm run verify:send-push` | Verifica Edge Function `send-push` |
| `npm run verify:send-email` | Verifica Edge Function `send-email` |

## Arquitectura

Véase [ARCHITECTURE.md](./ARCHITECTURE.md) para la estructura de módulos, flujo de datos y esquema de Supabase.

## Tests E2E

Los escenarios E2E requieren credenciales de prueba. Definir en el entorno:

- `E2E_LOGIN_EMAIL`
- `E2E_LOGIN_PASSWORD`

Si no están definidas, los tests E2E se omiten. En CI el servidor de desarrollo se arranca automáticamente (`reuseExistingServer: false`). La configuración en `playwright.config.ts` (raíz) limita la ejecución a `e2e/specs` para evitar conflicto con Vitest.

```bash
npm run test:e2e
```
