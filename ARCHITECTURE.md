# Arquitectura Civitas

## Visión general

Civitas es una plataforma multi-tenant de gobernanza comunitaria que integra Identidad, Tesorería y Gobernanza bajo un motor de reglas configurable ("Social Smart Contract"). Cumple con LPCI CDMX, LFPDPPP y Ley Fintech.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript 5.9, Vite 6, Tailwind CSS 4 |
| State | TanStack Query (React Query) |
| UI | Radix UI primitives, Recharts, lucide-react |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions + RLS) |
| Testing | Vitest, Playwright, React Testing Library |
| Deployment | Supabase hosted + static SPA |

## Estructura de módulos

```
src/
├── app/                        # Bootstrap, rutas, providers
├── core/
│   ├── governance/             # Propuestas, votaciones, asambleas, delegaciones
│   ├── treasury/               # Transacciones, categorías, presupuestos
│   │   ├── services/
│   │   │   ├── treasury.service.ts      # CRUD transacciones, obligaciones, stats
│   │   │   ├── payment-plan.service.ts  # Planes de pago para morosos
│   │   │   ├── ifpe.service.ts          # Integración IFPE/SPEI (reconciliación)
│   │   │   ├── contracts.service.ts     # Contratos con proveedores
│   │   │   └── receipt.service.ts       # Generación de recibos
│   │   ├── hooks/                       # React Query hooks
│   │   ├── components/                  # UI de tesorería
│   │   └── types.ts                     # Transaction, Category, Budget, etc.
│   ├── identity/               # Miembros, invitaciones, comunidades
│   ├── deliberation/           # Comentarios y discusión en propuestas
│   ├── accountability/         # Tareas de implementación post-aprobación
│   ├── privacy/                # ARCO, consentimientos (LFPDPPP)
│   ├── gamification/           # Sistema de puntos y badges
│   ├── entities/               # Proveedores, contratos, ratings
│   └── documents/              # Gestión de documentos
├── shared/
│   ├── components/             # UI reutilizable (ErrorBoundary, LoadingSpinner, etc.)
│   ├── hooks/                  # usePermissions, useRulesEngine
│   ├── services/
│   │   ├── audit.service.ts    # Registro de auditoría
│   │   ├── logger.service.ts   # Logging estructurado (dev + producción)
│   │   └── notification.service.ts
│   ├── lib/
│   │   ├── supabase.ts         # Cliente Supabase
│   │   ├── errors.ts           # AppError, normalizeError, handleServiceError
│   │   └── utils.ts            # formatCurrency, cn, etc.
│   └── types/                  # Tipos globales, CommunityRules, Role, etc.
├── ingestion/                  # Importación CSV/Excel con reconciliación
├── pages/                      # Páginas por ruta
├── layouts/                    # AppLayout, AuthLayout
└── test/                       # Setup Vitest, mocks, factories
```

## Flujo de datos

1. **Auth** (`app/providers`): Supabase Auth → `AuthContext` (user, signIn, signUp, signOut).
2. **Comunidad**: `CommunityProvider` carga comunidades del usuario; expone `communityId`, `community`, `currentMember`.
3. **Reglas**: `getCommunityRules(community)` fusiona con `DEFAULT_RULES`; `canPerformAction()` decide permisos según rol, standing financiero y reglas.
4. **Gobernanza**: Propuestas con ciclo de vida draft → discussion → active → closed → executed; quórum diferenciado por tipo; auto-ejecución con cool-down.
5. **Tesorería**: Transacciones con `origin` flag (`manual` | `import` | `rail` | `system`); dual fund accounting (mantenimiento/reserva); SPEI reconciliation.
6. **Identidad**: Miembros con `financial_standing`; moroso automation; payment plans.

## Transacciones: campo `origin`

Cada transacción registra su origen para trazabilidad:

| Origin | Descripción | Ejemplo |
|--------|------------|---------|
| `manual` | Captura humana en la UI | Tesorero registra un pago |
| `import` | Importación CSV/Excel | Carga de estados de cuenta |
| `rail` | Webhook IFPE/SPEI | Pago SPEI auto-reconciliado |
| `system` | Auto-generada por el sistema | Ejecución de propuesta aprobada |

## Integración IFPE (Fintech Rail)

```
Miembro → SPEI → CLABE (IFPE) → Webhook → Edge Function → Reconciliación → Transaction(origin: 'rail')
```

- **Edge Function**: `supabase/functions/ifpe-webhook/` recibe notificaciones SPEI
- **Tabla**: `ifpe_webhook_events` almacena eventos con estado de reconciliación
- **Auto-reconciliación**: Matchea por referencia numérica o monto único contra obligaciones pendientes
- **Manual**: UI en `IfpeReconciliationPanel` para conciliar eventos no matcheados
- **Modos**: Configurable por comunidad via `treasury.mode` en reglas

## Planes de Pago

Flujo para miembros morosos:
1. Miembro o admin propone plan (`status: 'proposed'`)
2. Admin/tesorero aprueba → genera parcialidades (`status: 'active'`)
3. Se registran pagos por parcialidad
4. Al completar todas → `status: 'completed'`

Accesible desde: Tesorería > Cobranza y Tesorería > Planes de Pago.

## Árbol de providers

```
BrowserRouter
└── AuthProvider
    └── CommunityProvider (requiere user)
        └── QueryClientProvider
            └── AppLayout / AuthLayout
                └── Rutas protegidas (ProtectedRoute + RoleGuard)
```

## Supabase (tablas principales)

| Tabla | Propósito |
|-------|----------|
| `communities` | Multi-tenant; campo `rules` (JSON) con Social Smart Contract |
| `members` | Relación user–comunidad; `role`, `status`, `financial_standing` |
| `transactions` | Movimientos financieros; `origin`, `verification_status`, `fund_type` |
| `categories` | Categorías por comunidad (income/expense) |
| `budgets` | Presupuestos vinculados a propuestas aprobadas |
| `payment_obligations` | Cuotas/obligaciones por miembro |
| `payment_plans` | Planes de pago estructurados para morosos |
| `payment_plan_installments` | Parcialidades de un plan |
| `ifpe_webhook_events` | Eventos SPEI recibidos; reconciliación |
| `proposals` | Propuestas de gobernanza con ciclo de vida completo |
| `votes` | Votos con peso, delegación y modelo de votación |
| `audit_log` | Trail de auditoría por comunidad |
| `rule_versions` | Historial de cambios de reglas |

## Seguridad

- **RLS**: Todas las tablas con Row Level Security habilitado; aislamiento por `community_id`
- **Roles**: `platform_admin` > `admin` > `comite_vigilancia` = `tesorero` > `miembro` > `observador`
- **Permisos**: `canPerformAction()` evalúa rol + standing financiero + reglas de comunidad
- **Webhook**: IFPE webhook verificado por HMAC-SHA256 signature

## Manejo de errores

- `AppError`: Clase centralizada con `code` (UNAUTHORIZED, FORBIDDEN, etc.) y `userMessage`
- `normalizeError()`: Convierte errores de Supabase, red, etc. a `AppError`
- `handleServiceError()`: Log + normalización para uso en servicios
- `ErrorBoundary`: Captura errores de render con logging estructurado

## Logging

- `logger.service.ts`: Logger estructurado con niveles (debug, info, warn, error)
- **Desarrollo**: Formato legible en consola
- **Producción**: JSON estructurado para log aggregators (Datadog, etc.)
- **Extensible**: `registerLogSink()` para agregar destinos (Sentry, etc.)
- `createModuleLogger('nombre')`: Logger con scope por módulo

## Compliance legal

| Ley | Artículos | Implementación |
|-----|-----------|----------------|
| LPCI CDMX | Art. 2, 31-34, 36, 42, 43, 45-46, 57-58, 59 | Moroso, quórum, asambleas, dual fund, admin terms |
| LFPDPPP | Aviso privacidad, ARCO | Módulo privacy, consentimientos |
| Ley Fintech | IFPE, SPEI | Modo `fintech_rail`, webhook, reconciliación |
| Código de Comercio / NOM-151 | Integridad | Hash de integridad en actas |

## Testing

- **Unit**: Vitest; `src/**/*.test.ts` / `*.spec.ts`; setup en `src/test/setup.ts`
- **RLS**: `src/test/rls-penetration.test.ts` — Validación explícita de políticas RLS por tabla
- **Component**: Vitest + React Testing Library; `src/core/**/__tests__/`
- **E2E**: Playwright en `e2e/`; auth con `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD`

## Migraciones

46+ migraciones SQL en `supabase/migrations/`. Recientes:
- `047_transaction_origin.sql` — Campo `origin` en transactions
- `048_ifpe_webhooks.sql` — Tabla `ifpe_webhook_events` con RLS

## Edge Functions

| Función | Propósito |
|---------|----------|
| `send-email` | Envío de emails via Resend (propuestas, morosos, convocatorias) |
| `reset-password` | Flujo de reset de contraseña |
| `ifpe-webhook` | Recepción y reconciliación de pagos SPEI |
