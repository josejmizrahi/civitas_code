# Paso 1: Migración de rutas a `/c/:slug/` — Especificación para implementación

Este documento es el **prompt detallado** para ejecutar el Paso 1 de la reestructuración de navegación: que la comunidad venga del **slug en la URL** y todas las rutas internas sean bajo `/c/:slug/...`.

---

## Objetivo

- **Antes:** Comunidad seleccionada por contexto (localStorage + selector en sidebar). Rutas planas: `/dashboard`, `/treasury`, `/members`, etc.
- **Después:** Comunidad determinada por el **slug en la URL**. Rutas bajo `/c/:slug/dashboard`, `/c/:slug/treasury`, etc. Las rutas **sin** slug (`/profile`, `/onboarding`, `/invite/:token`, etc.) siguen igual y no dependen de comunidad.

Beneficios: links compartibles, deep links desde emails/notificaciones, multi-tenant correcto (cada pestaña/URL es una comunidad concreta).

---

## 1. Rutas que NO llevan slug (fuera del layout de comunidad)

Estas rutas se mantienen como están. No van bajo `AppLayout` con comunidad, o van con layout sin necesidad de slug.

| Ruta | Descripción |
|------|-------------|
| `/` | Landing o redirect a login/dashboard |
| `/whitepaper` | Pública |
| `/login`, `/register`, `/forgot-password` | Auth |
| `/reset-password` | Auth (sesión desde email) |
| `/invite/:token` | Aceptar invitación |
| `/onboarding` | Crear comunidad (aún no hay comunidad) |
| `/profile` | Perfil del usuario (global, no por comunidad) |
| `/communities` | **Nueva o existente:** selector de comunidad; al elegir una, redirigir a `/c/:slug/dashboard` |

Tras login, si el usuario tiene al menos una comunidad, el redirect por defecto debe ir a una ruta **con** slug (ver sección 5).

---

## 2. Rutas que SÍ llevan slug (dentro del layout de comunidad)

Todas las que hoy son “protegidas + AppLayout” y dependen de `communityId` pasan a ser hijas de `/c/:slug/`.

| Ruta actual | Ruta nueva |
|-------------|------------|
| `/dashboard` | `/c/:slug/dashboard` |
| `/members` | `/c/:slug/members` |
| `/members/:memberId` | `/c/:slug/members/:memberId` |
| `/treasury` | `/c/:slug/treasury` |
| `/ingestion` | `/c/:slug/ingestion` |
| `/governance` | `/c/:slug/governance` |
| `/governance/assemblies/:assemblyId` | `/c/:slug/governance/assemblies/:assemblyId` |
| `/governance/vigilancia` | `/c/:slug/governance/vigilancia` |
| `/governance/archive` | `/c/:slug/governance/archive` |
| `/governance/:proposalId` | `/c/:slug/governance/:proposalId` |
| `/rules` | `/c/:slug/rules` |
| `/census` | `/c/:slug/census` |
| `/documents` | `/c/:slug/documents` |
| `/entities` | `/c/:slug/entities` |
| `/entities/:entityId` | `/c/:slug/entities/:entityId` |
| `/settings` | `/c/:slug/settings` |
| `/settings/audit` | `/c/:slug/settings/audit` |
| `/residential` | `/c/:slug/residential` |

No se elimina ninguna funcionalidad; solo se añade el prefijo `/c/:slug` y se hace que el layout que envuelve estas rutas **resuelva el tenant desde el slug**.

---

## 3. Resolver slug → communityId y poblar contexto

### 3.1 Servicio: obtener comunidad por slug

En `src/core/identity/services/identity.service.ts`:

- Añadir (o reutilizar si existe) **`getCommunityBySlug(slug: string): Promise<Community | null>`**.
  - Query: `communities` donde `slug = :slug`, `.single()`.
  - Si no hay fila, devolver `null`.
  - Si hay fila, devolver el mismo formato que `getCommunity(id)` (o reutilizar lógica para enriquecer).

- Opcional pero útil: **`getCommunityIdBySlug(slug: string): Promise<string | null>`** que solo devuelve el `id` (para comprobaciones rápidas de “¿existe esta comunidad?”).

### 3.2 Dónde se resuelve slug → communityId

- **CommunityProvider** hoy inicializa `communityId` desde `localStorage.getItem('civitas_community_id')` y no conoce la URL.
- Para el Paso 1, hay dos enfoques posibles; se recomienda **(A)**:

  **Enfoque A (recomendado):** Crear un **wrapper de rutas** que solo se monta cuando la ruta coincide con `/c/:slug/*`. Ese wrapper:
  1. Lee `slug` de `useParams()`.
  2. Si no hay `slug`, redirige (p. ej. a `/communities` o a `/onboarding` si no tiene comunidades).
  3. Llama a `getCommunityBySlug(slug)` (o primero `getCommunityIdBySlug` y luego `getCommunity(id)`).
  4. Si la comunidad no existe → 404 o pantalla “Comunidad no encontrada”.
  5. Si existe pero el usuario **no es miembro** (comprobar con `getCurrentMember(communityId, userId)` o equivalente) → 403 o “No tienes acceso a esta comunidad”.
  6. Si todo es válido, **inyecta en contexto** el `communityId` (y opcionalmente `community`) para esa subárbol de rutas. Es decir: el **CommunityProvider** (o un “SlugCommunityBridge”) debe recibir el `communityId` derivado del slug cuando estamos en `/c/:slug/*`, y usarlo en lugar de (o con prioridad sobre) `localStorage`.

  **Enfoque B:** Hacer que `CommunityProvider` lea la URL (p. ej. `useLocation()` + `useParams()` dentro de un `<Routes>` que ya tenga el `:slug`). Es posible pero acopla el provider al router; el wrapper suele ser más claro.

- **Persistencia:** Cuando el usuario entra por primera vez por `/c/:slug/dashboard`, se puede seguir guardando `communityId` en `localStorage` para:
  - Redirect posterior si entra en `/` o `/dashboard` sin slug (ver sección 5).
  - No es obligatorio; el comportamiento “fuente de verdad” debe ser la URL cuando está en `/c/:slug/*`.

---

## 4. Cambios en el router (`src/app/routes.tsx`)

### 4.1 Estructura propuesta

```
<BrowserRouter>
  <Routes>
    {/* Públicas / sin comunidad */}
    <Route path="/" element={<LandingRedirect />} />
    <Route path="/whitepaper" ... />
    <Route path="/login" ... />
    ...
    <Route path="/invite/:token" ... />
    <Route path="/onboarding" ... />
    <Route path="/profile" element={<ProtectedRoute><AppLayout ??? /></ProtectedRoute>} />  <!-- Profile puede estar en AppLayout sin comunidad, o en layout mínimo -->

    {/* Selector de comunidad: ver 5.2 */}
    <Route path="/communities" element={<ProtectedRoute><CommunitiesSelectorLayout />...</ProtectedRoute>} />

    {/* Rutas con comunidad: layout que resuelve slug y provee communityId */}
    <Route path="/c/:slug" element={<ProtectedRouteWithReturnUrl><CommunitySlugLayout /></ProtectedRouteWithReturnUrl>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<LazyPage><DashboardPage /></LazyPage>} />
      <Route path="members" element={<LazyPage><MembersPage /></LazyPage>} />
      <Route path="members/:memberId" element={<LazyPage><MemberDetailPage /></LazyPage>} />
      <Route path="treasury" ... />
      <Route path="ingestion" element={<RoleGuard ...><IngestionPage /></RoleGuard>} />
      <Route path="governance" ... />
      <Route path="governance/assemblies/:assemblyId" ... />
      <Route path="governance/vigilancia" ... />
      <Route path="governance/archive" ... />
      <Route path="governance/:proposalId" ... />
      <Route path="rules" ... />
      <Route path="census" ... />
      <Route path="documents" ... />
      <Route path="entities" ... />
      <Route path="entities/:entityId" ... />
      <Route path="settings" ... />
      <Route path="settings/audit" ... />
      <Route path="residential" ... />
      <Route path="*" element={<ProtectedCatchAll />} />
    </Route>

    {/* Catch-all no autenticado */}
    <Route path="*" element={<UnauthenticatedCatchAll />} />
  </Routes>
</BrowserRouter>
```

- **CommunitySlugLayout:** Componente que:
  - Usa `useParams().slug`.
  - Resuelve slug → comunidad y membresía; si falla, muestra 404 o “sin acceso”.
  - Renderiza `<CommunityProvider communityId={resolvedId}>` (o un provider que acepte `initialCommunityId` desde slug) + `<AppLayout><Outlet /></AppLayout>`.
- **AppLayout** sigue siendo el sidebar + header; los `NavLink` que hoy apuntan a `/dashboard`, `/treasury`, etc. deben apuntar a `/c/${slug}/dashboard`, `/c/${slug}/treasury`, etc. Para eso, el layout debe conocer el `slug` (desde `useParams()` o desde `community.slug` del contexto).

---

## 5. Comportamiento de redirects

### 5.1 Tras login exitoso

- Si el usuario **no tiene** comunidades → redirigir a `/onboarding`.
- Si tiene **una** comunidad → redirigir a `/c/{slug}/dashboard` (slug de esa comunidad).
- Si tiene **varias** → redirigir a `/communities` (selector); al elegir una, ir a `/c/{slug}/dashboard`.

Desde `LoginPage` / `RegisterPage` / lugar donde se hace el redirect post-login, usar la lista de comunidades del usuario para obtener el slug (ya está en `CommunityProvider` vía `userCommunities`) y construir la URL.

### 5.2 Ruta `/dashboard` o `/` (autenticado) sin slug

- Si la ruta es exactamente `/dashboard` (o `/` después de login) y no hay `:slug`:
  - Opción recomendada: **redirect** a `/c/:slug/dashboard` donde `slug` es el de la comunidad “actual”.
  - La comunidad “actual” puede ser: la última usada (localStorage `communityId` → buscar su `slug` en `userCommunities`) o la primera de la lista.
  - Si no hay comunidad (lista vacía), redirect a `/onboarding`.
  - Si hay varias y quieres forzar selector, redirect a `/communities`.

Así no hace falta mantener dos conjuntos de rutas (con y sin slug); una sola “fuente de verdad” con slug.

### 5.3 Invitación aceptada

- Tras aceptar invitación, hoy se redirige a `/dashboard`. Debe redirigir a `/c/:slug/dashboard` de la comunidad a la que se unió (el token de invitación tiene `community_id`; resolver su `slug` y construir la URL).

---

## 6. Helper de rutas con slug

Para no repetir `/c/${slug}/...` en todo el código:

- Crear **`src/shared/lib/communityRoutes.ts`** (o similar) con una función:
  - **`communityPath(slug: string, path?: string): string`**
  - Ejemplos: `communityPath('torre-norte')` → `'/c/torre-norte/dashboard'` (default); `communityPath('torre-norte', 'governance/abc-123')` → `'/c/torre-norte/governance/abc-123'`.
- Opcional: hook **`useCommunityPath(path?: string): string`** que use `community?.slug` del contexto y devuelva la ruta completa. Así en los componentes no hace falta pasar el slug a mano.

Uso:
- En **AppLayout**, los `NavLink` deben usar `to={communityPath(slug, 'dashboard')}`, etc. El `slug` lo obtiene el layout de `useParams()` o de `community.slug`.
- En **NotificationBell**, al construir la ruta para una notificación, si la notificación tiene `community_id`, resolver el slug de esa comunidad (o guardar slug en metadata) y construir `/c/:slug/governance/:proposalId`, etc.
- En **navigate()** y **&lt;Link to="..."&gt;** que apunten a páginas de la comunidad, usar siempre el helper (o el hook) para que lleven el slug.

---

## 7. Lista de archivos a tocar (checklist)

- **Router y layout**
  - `src/app/routes.tsx`: rutas anidadas bajo `/c/:slug`, nuevo `CommunitySlugLayout`, redirects sin slug.
  - Nuevo componente: `src/app/CommunitySlugLayout.tsx` (o en `layouts/`) que resuelve slug, verifica membresía, provee contexto, renderiza `AppLayout` + `Outlet`.
  - `src/layouts/AppLayout.tsx`: reemplazar todos los `href`/`to` de navegación por rutas con slug (usando `useParams().slug` o `community?.slug` y `communityPath()`).

- **Provider**
  - `src/app/providers.tsx`: permitir que `CommunityProvider` reciba un `communityId` (o `slug`) “inicial” desde el layout de slug, y que cuando estamos en `/c/:slug/*` ese valor tenga prioridad sobre `localStorage`. No hace falta eliminar la lectura de localStorage para el caso “entró por /dashboard sin slug y redirigimos”; puede quedar como fallback.

- **Servicio**
  - `src/core/identity/services/identity.service.ts`: añadir `getCommunityBySlug(slug)` (y opcionalmente `getCommunityIdBySlug`).

- **Redirects y links**
  - `src/pages/auth/LoginPage.tsx`: después de login, redirect a `/c/:slug/dashboard` o `/communities`.
  - `src/pages/auth/RegisterPage.tsx`: igual.
  - `src/pages/auth/InviteAcceptPage.tsx`: después de aceptar, redirect a `/c/:slug/dashboard`.
  - `src/pages/auth/ResetPasswordPage.tsx`: redirect a `/c/:slug/dashboard` o `/communities`.
  - `src/pages/onboarding/OnboardingWizard.tsx`: al terminar creación, redirect a `/c/:slug/dashboard` (slug de la comunidad recién creada).
  - `src/core/identity/components/NoCommunityView.tsx`: si no hay comunidad, botón a `/onboarding`; si hay que elegir, link a `/communities`.

- **Navegación interna**
  - `src/pages/settings/SettingsPage.tsx`: `navigate('/dashboard')` → `navigate(communityPath(slug, 'dashboard'))`; lo mismo para `/governance`, `/rules`. Ya hay un `navigate(\`/c/${community?.slug}/settings?tab=...\`)` que debe seguir siendo con slug.
  - `src/pages/treasury/AdminTreasuryView.tsx`: `navigate('/ingestion')`, `navigate('/governance')`, y el link a settings ya con slug.
  - `src/pages/members/MemberDetailPage.tsx`: `navigate('/members')`, `navigate('/treasury')`, `navigate('/governance/...')` → con slug.
  - `src/pages/governance/ProposalDetailPage.tsx`: `Link to="/governance"` → con slug.
  - `src/pages/governance/AssemblyDetailPage.tsx`: `navigate('/governance')` → con slug.
  - `src/pages/rules/RulesPage.tsx`: `navigate('/governance')`, `navigate('/settings')` → con slug.
  - `src/pages/entities/EntityDetailPage.tsx`: `navigate('/entities')` → con slug.
  - `src/core/identity/components/MemberDirectory.tsx`: `navigate(\`/members/${member.id}\`)` → con slug.
  - `src/pages/dashboard/DashboardPage.tsx`: links a `/settings`, `/census` → con slug.
  - `src/pages/dashboard/components/FirstStepsChecklist.tsx`: `href` de cada step → con slug.
  - `src/pages/dashboard/components/QuickActions.tsx`: `href` de acciones → con slug.
  - `src/shared/components/NotificationBell.tsx`: `getNotificationRoute()` debe devolver ruta con slug; el componente tiene que tener acceso al slug (contexto o parámetro). Si la notificación tiene `community_id`, resolver slug y construir `/c/:slug/...`.

- **Guards**
  - `RoleGuard` y `CommunityTypeGuard`: al redirigir “sin permiso”, usar `navigate(communityPath(slug, 'dashboard'))` en lugar de `navigate('/dashboard')`.

- **Ruta `/communities`**
  - Si no existe una página selector de comunidad, crear una vista mínima: lista de `userCommunities` con cards; click → `navigate(\`/c/${c.slug}/dashboard\`)`. Puede reutilizar la lógica del dropdown del sidebar (lista de comunidades del usuario).

- **Tests**
  - Actualizar tests que naveguen a `/dashboard` o asuman rutas sin slug (p. ej. `src/app/routes.test.tsx`) para usar rutas con slug donde corresponda.
  - Ajustar tests de componentes que usen `navigate()` o `<Link>` a rutas de comunidad.

---

## 8. Orden sugerido de implementación

1. Añadir `getCommunityBySlug` (y opcional `getCommunityIdBySlug`) en identity.service.
2. Crear helper `communityPath(slug, path?)` y hook `useCommunityPath`.
3. Crear `CommunitySlugLayout`: leer `slug`, resolver comunidad y membresía, mostrar 404/403 si aplica, luego renderizar provider + AppLayout + Outlet.
4. En `routes.tsx`, mover todas las rutas “con comunidad” bajo `<Route path="/c/:slug" element={<CommunitySlugLayout />}>` con rutas relativas (`dashboard`, `members`, etc.).
5. En `AppLayout`, leer slug (params o context) y cambiar todos los `to` de NavLink a `communityPath(slug, ...)`.
6. Ajustar redirects post-login, post-register, post-invite, post-onboarding y “entrada a /dashboard sin slug” como se indicó arriba.
7. Sustituir en el resto de la app cada `navigate('/...')` y `to="..."` que apunten a páginas de comunidad por la versión con slug (helper o hook).
8. Implementar o ajustar `/communities` y enlaces desde el sidebar (selector de comunidad) para que naveguen a `/c/:slug/dashboard`.
9. Actualizar `getNotificationRoute` y el uso en NotificationBell para incluir slug.
10. Revisar RoleGuard/CommunityTypeGuard y tests.

---

## 9. Criterios de aceptación (Definition of Done)

- [ ] No existen rutas planas para contenido de comunidad (todas bajo `/c/:slug/...`).
- [ ] Al abrir `/c/torre-norte/dashboard`, el contexto de comunidad corresponde a la comunidad con slug `torre-norte` y el usuario es miembro.
- [ ] Al abrir `/c/slug-inexistente/dashboard`, se muestra 404 o “Comunidad no encontrada”.
- [ ] Al abrir `/c/slug-de-otra-comunidad/dashboard` (usuario no es miembro), se muestra 403 o mensaje de sin acceso.
- [ ] Tras login con una comunidad, el usuario termina en `/c/:slug/dashboard`.
- [ ] Tras aceptar invitación, el usuario termina en `/c/:slug/dashboard` de esa comunidad.
- [ ] El selector de comunidad en el sidebar (o en `/communities`) lleva a `/c/:slug/dashboard`.
- [ ] Links internos (sidebar, botones “Volver”, notificaciones) usan rutas con slug y funcionan.
- [ ] `/profile` y `/onboarding` siguen accesibles sin slug.
- [ ] Si el usuario autenticado entra en `/dashboard` (sin slug), es redirigido a `/c/:slug/dashboard` (o `/communities`/`/onboarding` según el caso).

---

## 10. Notas para el Paso 2

Después del Paso 1, el sidebar seguirá teniendo los mismos ítems (Dashboard, Tesorería, Miembros, etc.); solo cambian las URLs. En el **Paso 2** se colapsarán los ítems en los 5 bloques del doc (Comunidad, Finanzas, Gobernanza, Vigilancia, Configuración) y se reorganizarán tabs; eso será solo cambio de UI y de rutas hijas, sin volver a tocar la lógica de slug → communityId.
