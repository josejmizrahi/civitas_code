# Revisión del flujo de navegación

## 1. Estructura de rutas (resumen)

| Ruta | Layout | Acceso | Notas |
|------|--------|--------|--------|
| `/` | Ninguno | Público | LandingRedirect: si user → /dashboard, si no → LandingPage |
| `/whitepaper` | Ninguno | Público | Página estática |
| `/login`, `/register`, `/forgot-password` | AuthLayout | Público (si ya logueado → redirect) | PublicRoute envuelve AuthLayout |
| `/reset-password` | AuthLayout | Cualquiera | Sin PublicRoute (sesión desde email) |
| `/invite/:token` | Ninguno | Público | InviteAcceptPage standalone |
| `/onboarding` | Ninguno | Protegido | Sin AppLayout (wizard a pantalla completa) |
| `/dashboard`, `/members`, `/treasury`, … | AppLayout | Protegido | ProtectedRouteWithReturnUrl; sidebar + contenido |
| `*` (dentro de protegido) | AppLayout | Protegido | NotFoundPage (404 con sidebar) |
| `*` (última ruta) | AuthLayout | Nunca alcanzada | Ver punto 3 |

## 2. Flujos que funcionan bien

- **Landing → Login/Register**: enlaces claros en LandingPage (header, CTA, footer).
- **Login con invitación**: `?invite=TOKEN` muestra mensaje y tras aceptar navega a /dashboard.
- **Protegido sin sesión**: redirect a `/login` con `state.from` (ej. `/members/123`).
- **Sidebar**: filtrado por rol (observador, tesorero, admin, comite_vigilancia); sección “Administración” para admin y vigilancia.
- **Bottom nav (móvil)**: Dashboard, Tesorería, Gobernanza, Miembros + “Más” que abre el sidebar completo.
- **Selector de comunidad**: en sidebar; “Nueva comunidad” → /onboarding.
- **Sin comunidad seleccionada**: NoCommunityView (elegir o crear comunidad) dentro de AppLayout.
- **RoleGuard**: Ingestion (tesorero), Settings/Audit (admin), Vigilancia (admin o comite_vigilancia); si no hay permiso → redirect a /dashboard.
- **Redirect /governance/assemblies** → /governance.

## 3. Problemas detectados

### 3.1 Redirect tras login no usa `state.from`

- **Comportamiento actual**: al entrar sin sesión en una ruta protegida (ej. `/members/1`) se redirige a `/login` con `state: { from: '/members/1' }`. Tras iniciar sesión, **PublicRoute** redirige siempre a `/dashboard`.
- **Esperado**: tras login, ir a `location.state.from` si existe, si no a `/dashboard`.
- **Solución**: en PublicRoute, usar `to={location.state?.from ?? '/dashboard'}` en el `Navigate` cuando hay user.

### 3.2 404 sin sesión nunca se muestra

- **Comportamiento**: la última ruta es `<Route path="*" element={<AuthLayout />}>` con NotFoundPage. Esa ruta **nunca se alcanza** porque el bloque protegido es un layout sin `path` que coincide con cualquier URL; su hijo `path="*"` captura todo. Cualquier petición (ej. `/ruta-inventada`) entra al layout protegido, y como no hay user se hace redirect a `/login`.
- **Consecuencia**: un usuario sin sesión que escribe una URL inexistente ve login, no una 404 con el mismo aspecto que login/registro.
- **Opciones**: (A) Dejar como está (URLs raras sin sesión → login). (B) Reestructurar para que exista un único `path="*"` que, según auth, muestre NotFound con AuthLayout o con AppLayout (requiere componente wrapper o rutas anidadas).

### 3.3 Invite sin sesión

- **Ruta**: `/invite/:token` sin layout. Si el usuario no está logueado, InviteAcceptPage muestra botón “Iniciar sesión” (o similar) y puede llevar a `/login?invite=TOKEN`. Conviene que el link preserve el token para que tras login se procese la invitación (ya cubierto si se usa `?invite=`).

### 3.4 NotFoundPage siempre enlaza a /dashboard

- El botón “Volver al inicio” es `to="/dashboard"`. Para usuarios no autenticados que en el futuro lleguen a 404, sería más coherente “Volver al inicio” → `/` (landing) o “Iniciar sesión” → `/login`. Por ahora solo ven 404 usuarios autenticados, así que /dashboard es correcto.

## 4. Recomendaciones

1. **Aplicar**: redirect tras login a `state.from` (PublicRoute).
2. **Opcional**: documentar o cambiar que 404 sin sesión no se muestra; si se quiere 404 con AuthLayout, implementar NotFoundWrapper como en 3.2.
3. **Mantener**: orden de rutas (más específicas primero), RoleGuard, uso de `state.from` en ProtectedRouteWithReturnUrl, y bottom nav + “Más” en móvil.
