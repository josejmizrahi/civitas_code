# Arquitectura Civitas

## Estructura de módulos

```
src/
├── app/                    # Bootstrap, rutas, providers
├── core/
│   ├── governance/         # Propuestas, votaciones, asambleas
│   ├── treasury/           # Transacciones, categorías, presupuestos, planes de pago
│   └── identity/           # Miembros, invitaciones, comunidades
├── shared/
│   ├── components/         # UI reutilizable
│   ├── hooks/              # usePermissions, useRulesEngine
│   ├── services/           # rules.service, audit.service, push-notification
│   └── types/              # Tipos globales y reglas (CommunityRules, Role, etc.)
├── pages/                  # Páginas por ruta (dashboard, treasury, governance, members, settings, auth)
├── layouts/                # AppLayout, AuthLayout
└── test/                   # Setup Vitest, mocks (supabase, providers, factories)
```

## Flujo de datos

1. **Auth** (`app/providers`): Supabase Auth → `AuthContext` (user, signIn, signUp, signOut).
2. **Comunidad**: Tras login, `CommunityProvider` carga comunidades del usuario y comunidad actual; expone `communityId`, `community`, `currentMember`.
3. **Reglas**: `getCommunityRules(community)` devuelve reglas fusionadas con `DEFAULT_RULES`; `canPerformAction(action, role, financialStanding, rules)` decide si un miembro puede votar, proponer, delegar, etc.
4. **Gobernanza**: Propuestas y votos en Supabase; `getVoteSummary` / `computeVoteSummary` calculan quórum y mayoría.
5. **Tesorería**: Transacciones, categorías y presupuestos por `community_id` (y opcionalmente `fund_type`); hooks `useTransactions`, `useDashboard`, etc.
6. **Identidad**: Miembros e invitaciones vía `identity.service`; `MemberDirectory` y `MemberDetailPage` usan React Query.

## Árbol de providers

```
BrowserRouter
└── AuthProvider
    └── CommunityProvider (requiere user)
        └── QueryClientProvider
            └── AppLayout / AuthLayout
                └── Rutas (Dashboard, Treasury, Governance, Members, Settings, etc.)
```

Las rutas protegidas usan `ProtectedRoute` (requiere user) y `RoleGuard` (requiere rol, p. ej. admin para `/settings`).

## Supabase (resumen)

- **auth.users** — Autenticación.
- **communities** — Comunidades; campo `rules` (JSON) con reglas de gobernanza, tesorería e identidad.
- **members** — Relación user–comunidad; `role`, `status`, `financial_standing`.
- **member_profiles** — Vista/join de members con datos de perfil (email, full_name).
- **proposals** — Propuestas; estados draft → discussion → active → closed/approved/rejected/executed.
- **votes** — Votos por propuesta; peso y valor (yes/no/abstain o consensus/multiple_choice).
- **transactions** — Movimientos de tesorería; tipo, monto, categoría, fecha.
- **categories** — Categorías por comunidad y tipo (income/expense).
- **payment_obligations** — Obligaciones de pago por miembro.
- **invitations** — Invitaciones pendientes; token y expiración.
- **audit_log** — Registro de acciones por comunidad y usuario.
- **rule_versions** — Historial de cambios de reglas.

RPCs relevantes: `compute_financial_standing`, `refresh_financial_standings`, `get_next_rule_version`, etc.

## Testing

- **Unit**: Vitest; `src/**/*.test.ts` / `*.spec.ts`; setup en `src/test/setup.ts`; mocks en `src/test/mocks/`.
- **Component**: Vitest + React Testing Library; componentes en `src/core/**/__tests__/`.
- **E2E**: Playwright en `e2e/`; config en `e2e/playwright.config.ts`; escenarios en `e2e/specs/`; auth con `E2E_LOGIN_EMAIL` / `E2E_LOGIN_PASSWORD`.
