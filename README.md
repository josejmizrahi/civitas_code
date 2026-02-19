# Civitas

Aplicación de gestión de comunidades (gobierno, tesorería e identidad) con soporte para reglas configurables, votaciones y cumplimiento normativo (LPCI CDMX, LFPDPPP).

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

## Arquitectura

Véase [ARCHITECTURE.md](./ARCHITECTURE.md) para la estructura de módulos, flujo de datos y esquema de Supabase.

## Tests E2E

Los escenarios E2E requieren credenciales de prueba. Definir en el entorno:

- `E2E_LOGIN_EMAIL`
- `E2E_LOGIN_PASSWORD`

Si no están definidas, los tests E2E se omiten. Ejecutar con:

```bash
npm run test:e2e
```
