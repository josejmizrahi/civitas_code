# Arquitectura de Civitas

Documento de referencia técnica que describe cómo se conectan todos los componentes de la aplicación Civitas.

---

## 1. Visión General

**Civitas** es una plataforma multi-tenant de gestión de comunidades que integra tres primitivas fundamentales:

| Primitive | Descripción |
|-----------|-------------|
| **Identity** | Miembros, roles, invitaciones y estado financiero |
| **Treasury** | Transacciones, presupuestos, obligaciones de pago, contratos y programación recurrente |
| **Governance** | Propuestas, votaciones ponderadas, delegaciones y actas |

**Stack tecnológico:**
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Estado y datos:** TanStack React Query (v5)
- **UI:** shadcn/ui, Lucide React, Recharts

---

## 2. Arquitectura del Frontend

```
src/
├── app/              → Providers (Auth + Community), Router, entrada de App
│   ├── App.tsx       → QueryClientProvider, AuthProvider, CommunityProvider
│   ├── providers.tsx → AuthProvider, CommunityProvider, useAuth(), useCommunityContext()
│   └── routes.tsx    → AppRouter con rutas protegidas, RoleGuard
├── layouts/         → Layouts de aplicación
│   ├── AppLayout.tsx → Sidebar + main, selector de comunidad, navegación
│   └── AuthLayout.tsx→ Layout para login/registro
├── pages/           → Componentes de ruta
│   ├── auth/        → Login, Register, ForgotPassword, ResetPassword, InviteAccept
│   ├── profile/     → Mi Perfil (editar nombre, contraseña, ver comunidades)
│   ├── dashboard/   → Dashboard principal
│   ├── members/     → Directorio de miembros
│   ├── treasury/    → Tesorería (transacciones, presupuestos, cobranza)
│   ├── governance/  → Propuestas y detalle
│   ├── entities/    → Partes relacionadas
│   ├── documents/   → Gestión documental
│   ├── ingestion/   → Importación CSV/Excel
│   ├── census/      → Censo comunitario y plataforma
│   ├── residential/ → Vertical residencial
│   └── settings/    → Configuración (admin)
├── core/            → Módulos de lógica de negocio
│   ├── identity/    → Members, roles, invitations
│   ├── treasury/    → Transactions, budgets, obligations, contracts, recurring
│   ├── governance/  → Proposals, votes, delegations, minutes
│   ├── entities/    → Vendors, contractors, ratings
│   └── documents/   → Gestión de documentos
├── verticals/       → Features específicas por tipo de comunidad (residential)
├── ingestion/       → Pipeline de importación CSV/Excel
├── census/          → Analytics comunitario y de plataforma
├── shared/          → Componentes UI (shadcn), hooks, utils, types, config
└── test/            → Setup de tests y mocks
```

**Patrón por módulo:** Cada módulo en `core/` sigue la estructura:
- `components/` — Componentes React
- `hooks/` — Hooks con React Query (useQuery, useMutation)
- `services/` — Capa de acceso a Supabase
- `types.ts` — Tipos TypeScript

---

## 3. Arquitectura del Backend (Supabase)

### Tablas (~27)

| Dominio | Tablas |
|---------|--------|
| **Identity** | `communities`, `members`, `invitations` |
| **Treasury** | `categories`, `transactions`, `budgets`, `payment_obligations` |
| **Governance** | `proposals`, `votes`, `delegations`, `minutes` |
| **Entities** | `entities`, `entity_contacts`, `contracts`, `contract_installments`, `ratings` |
| **Recurring** | `recurring_schedules` |
| **Documents** | `documents` |
| **Ingestion** | `data_sources`, `import_jobs`, `category_mappings`, `column_mappings` |
| **Vertical Residential** | `units`, `common_areas`, `maintenance_requests` |
| **Census & Audit** | `census_snapshots`, `audit_log` |

### Vistas (2)

| Vista | Descripción |
|-------|-------------|
| `member_profiles` | `members` + `auth.users` (email, full_name) para perfiles completos |
| `entity_ratings_summary` | Agregado de ratings por entidad (avg_score, avg_punctuality, avg_quality, etc.) |

### Funciones RPC (~12)

| Función | Propósito |
|---------|-----------|
| `get_user_community_ids()` | Devuelve IDs de comunidades donde el usuario es miembro (base de RLS) |
| `get_user_role(community_id)` | Rol del usuario en una comunidad |
| `accept_invitation(token, user_id)` | Aceptar invitación y crear miembro |
| `compute_financial_standing(member_id, community_id)` | Calcula `good_standing` / `grace_period` / `delinquent` según obligaciones |
| `refresh_financial_standings(community_id)` | Actualiza `financial_standing` de todos los miembros |
| `take_census_snapshot(community_id)` | Crea snapshot de censo comunitario |
| `get_platform_census()` | Retorna agregados de toda la plataforma (solo números) |
| `generate_recurring_obligations(schedule_id)` | Genera obligaciones/pagos de un schedule |
| `process_recurring_schedules(community_id)` | Procesa todos los schedules vencidos |
| `update_contract_compliance(contract_id)` | Calcula compliance_score del contrato |

### Storage

| Bucket | Uso |
|--------|-----|
| `documents` | PDF, Word, Excel, imágenes, ZIP (hasta 50MB) |

Todas las tablas tienen **RLS habilitado**. Las políticas usan `community_id IN (SELECT get_user_community_ids())` para aislar datos por comunidad.

---

## 4. Flujo de Datos

### Autenticación
```
Supabase Auth → getSession() / onAuthStateChange
    → AuthProvider (user, session, loading)
    → useAuth() en componentes
    → ProtectedRoute: si !user → redirect /login
```

### Comunidad
```
CommunityProvider (depende de user)
    → getUserCommunities(user.id) para lista
    → getCommunity(communityId) + getCurrentMember(communityId, user.id)
    → useCommunityContext() → communityId, community, currentMember, userCommunities
    → Todas las páginas scoped por communityId
```

### Lectura de datos
```
Componente → useQuery(['key', communityId], () => service.getX(communityId))
    → Service → supabase.from('table').select().eq('community_id', communityId)
    → RLS filtra por get_user_community_ids()
    → Datos en caché (React Query, staleTime ~2min)
```

### Mutaciones
```
Componente → hook.mutate(data)
    → mutationFn → service.create/update/delete
    → Supabase insert/update/delete
    → queryClient.invalidateQueries(['key']) para refetch
```

---

## 5. Las 3 Primitivas Integradas

### Identity

- **Tabla `members`:** `user_id`, `community_id`, `role`, `status`, `voting_weight`, `financial_standing`, `custom_attributes`
- **Roles:** `admin` > `tesorero` > `miembro` > `observador`
- **financial_standing:** `good_standing` | `grace_period` | `delinquent`, calculado por `compute_financial_standing()` RPC según `payment_obligations`
- **payment-to-vote:** Miembros morosos pierden derechos de voto (configurable en `communities.rules`)
- **Perfiles:** Vista `member_profiles` une `members` + `auth.users` (email, full_name)
- **Invitations:** `invitations` con token, expiración y rol asignado; `accept_invitation` crea el miembro

### Treasury

- **Transacciones:** `income`/`expense` con `category_id`, `budget_id` opcional
- **Presupuestos:** `budgets` por categoría y periodo
- **Obligaciones de pago:** `payment_obligations` por miembro con `status`: pending, paid, overdue
- **Programación recurrente:** `recurring_schedules` — type `collection` (obligaciones) o `payment` (gastos); genera obligaciones o transacciones vía RPC
- **Contratos:** `contracts` con `entity_id`, `contract_installments`, `compliance_score`
- **Vista de cobranza:** Seguimiento de quién ha pagado (basado en payment_obligations)
- **Importación:** CSV/Excel → normalizar → categorizar → detectar duplicados → importar → reconciliar

### Governance

- **Propuestas:** Estados `draft` → `active` → `approved` / `rejected`
- **Votación ponderada:** Quórum y mayoría configurables en `rules.governance`
- **Delegación:** `delegations` (from_member_id, to_member_id, scope)
- **Instrucciones financieras:** `financial_instruction` JSONB en propuestas; ejecución automática de desembolsos tras aprobación
- **Actas:** `minutes` con contenido y `signatures` JSONB (firmas digitales)
- **Cool-down:** `cool_down_hours` antes de ejecutar instrucciones financieras

---

## 6. Entidades y Ratings

- **Entidades:** Proveedores, contratistas, gobierno, etc. (`entities` con `type`, `rfc`, `clabe`, etc.)
- **Contactos:** `entity_contacts` por entidad
- **Ratings:** `ratings` con `dimensions` JSONB (punctuality, quality, communication, compliance, value)
- **Vista:** `entity_ratings_summary` — promedios por dimensión
- **Contratos:** Vinculados a entidades con `compliance_score`

---

## 7. Census

- **Nivel comunidad:** `take_census_snapshot(community_id)` — inserta en `census_snapshots` (total_members, active, good_standing, delinquent, income, expenses, active_proposals)
- **Nivel plataforma:** `get_platform_census()` — devuelve JSON con agregados globales (total_communities, total_members, etc.)
- **Privacidad:** El censo de plataforma solo expone agregados, no datos personales

---

## 8. Multi-tenancy

- Todas las tablas tienen `community_id`
- RLS: `community_id IN (SELECT get_user_community_ids())`
- `get_user_community_ids()` devuelve los `community_id` donde el usuario es miembro activo
- Selector de comunidad en el sidebar (`setCommunityId`) y persistencia en `localStorage` (`civitas_community_id`)
- **Motor de reglas:** `communities.rules` JSONB: governance, treasury, identity (quorum, majority, payment_to_vote, grace_period, delinquent_restrictions, etc.)

---

## 9. Vertical System

**Tipos de comunidad:** `residential`, `cooperative`, `religious`, `manufacturing`, `other`

Cada tipo puede tener páginas y navegación propias en `VERTICALS` (shared/config/verticals.ts):

| Tipo | Features implementadas |
|------|------------------------|
| **Residential** | `units`, `common_areas`, `maintenance_requests`; ruta /residential |
| Otros | Config básica, sin páginas específicas aún |

---

## 10. Data Import (Ingestion)

**Pipeline:**
1. **Seleccionar fuente** — Crear/selector `data_sources` (CSV, Excel)
2. **Subir archivo** — Parse con adapters (CSV, XLSX)
3. **Mapear columnas** — `column_mappings` (external_column → internal_field)
4. **Mapear categorías** — `category_mappings` (external_name → category_id)
5. **Vista previa** — Normalizar transacciones y marcar duplicados
6. **Importar** — Insertar transacciones, asociar `import_job_id` para rollback

**Detección de duplicados:** `external_ref` + `date` + `amount` (service `markDuplicates`)

**Adapters:** CSV y Excel (xlsx)

---

## 11. Seguridad

- **RLS:** Todas las tablas con políticas basadas en `get_user_community_ids()`
- **Funciones SECURITY DEFINER:** Para operaciones que cruzan tablas o requieren lógica especial (accept_invitation, compute_financial_standing, etc.)
- **RoleGuard:** Componente que envuelve rutas; redirige a `/` si el rol no cumple (ej. `/settings` requiere admin, `/ingestion` requiere tesorero)
- **usePermissions():** `canManageMembers`, `canManageTreasury`, `canCreateProposals`, `canVote`, `canImportData`, `isAdmin`

---

## 12. Usuarios de Demo

Contraseña para todos: **Test1234!**

| Email | Rol (Las Palmas) | Rol (Solar del Valle) | User ID |
|-------|------------------|------------------------|---------|
| admin@civitas.demo | admin | — | 01f81e79-7774-4ee2-83c6-bd1778c542b4 |
| tesorero@civitas.demo | tesorero | — | 957a636c-b0ce-4574-92cf-2e356804e73b |
| miembro1@civitas.demo | miembro | miembro | 9326f0f3-cfeb-48e2-b71d-8442feaad5b5 |
| miembro2@civitas.demo | miembro | miembro | 7fb17927-1235-409a-9ad7-117c6900f469 |
| miembro3@civitas.demo | miembro | — | 0b26268c-20a5-4b7f-8983-44ef541e698f |
| observador@civitas.demo | observador | — | d69dcd68-8baa-4af4-8c2f-74e7453753a2 |
| admin2@civitas.demo | — | admin | 9ed9c917-402f-4b34-98e2-31ba2d769bf3 |

**Comunidades demo:**
- **Residencial Las Palmas** (residential)
- **Cooperativa Solar del Valle** (cooperative)
