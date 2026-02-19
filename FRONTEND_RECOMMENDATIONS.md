# Recomendaciones Frontend — CIVITAS

Hallazgos de la auditoría completa del frontend. Organizados por prioridad.

---

## Alta Prioridad

### 1. Bundle principal demasiado grande (1,079 KB)

El chunk `index.js` supera los 500KB recomendados. Acciones:

- **Extraer `recharts` y `xlsx` como chunks separados** en `vite.config.ts`:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        recharts: ['recharts'],
        xlsx: ['xlsx'],
      }
    }
  }
}
```

- **Importar `xlsx` dinámicamente** en `src/shared/lib/utils.ts` y `src/ingestion/adapters/excel.adapter.ts`:
```typescript
const XLSX = await import('xlsx')
```

- **Lazy-load las auth pages** (`LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `LandingPage`, `ResetPasswordPage`) — actualmente se importan eagerly en `routes.tsx` líneas 6-11.

- **Evaluar remover `i18next`/`react-i18next`**: están instalados (~40KB) pero no hay llamadas a `useTranslation()` en ningún componente. Toda la app usa strings hardcoded en español.

**Impacto estimado**: reducción de ~600KB del chunk principal.

### 2. Instalar `@vitest/coverage-v8`

El script `test:coverage` en `package.json` falla porque el proveedor de coverage no está instalado:
```bash
pnpm add -D @vitest/coverage-v8
```

### 3. Test de RLS no-op

`src/test/rls-penetration.test.ts:181-187` — El test "should not update community rules" siempre pasa:
```typescript
expect(true).toBe(true)  // ← esto no verifica nada
```
Debería verificar que `error` no es null o que `data` no cambió.

### 4. `MemberDetailPage` — mutaciones sin manejo de errores

`src/pages/members/MemberDetailPage.tsx:143-155` — Tres llamadas `mutateAsync` sin `try/catch`. Cualquier fallo es un unhandled promise rejection que no se muestra al usuario.

---

## Media Prioridad

### 5. Cobertura de tests baja

| Categoría | Testeado | Total | Cobertura |
|-----------|----------|-------|-----------|
| Services | 8 | ~25 | ~32% |
| Components | 3 | ~100 | ~3% |
| Hooks | 0 | 35 | 0% |
| Pages | 0 | 28 | 0% |

Prioridad de tests: `useAuth`, `useTransactions`, `useProposals`, `useVoting`, `DashboardPage`, `TreasuryPage`.

### 6. `ForgotPasswordPage` — UI de error inalcanzable

`src/pages/auth/ForgotPasswordPage.tsx:95-97` — El estado `error` nunca se setea en `handleSubmit` (siempre muestra éxito para prevenir enumeración de emails). El bloque JSX `{error && ...}` es dead code.

### 7. Login — invitación falla silenciosamente

`src/pages/auth/LoginPage.tsx:21-27` — Si `acceptInvitation` falla, el catch solo navega al dashboard sin feedback:
```typescript
.catch(() => navigate('/dashboard'))  // ← debería mostrar toast
```

### 8. PASSWORD_RECOVERY causa hard navigation

`src/app/providers.tsx:51-52` — Usa `window.location.href` causando flash visible. Considerar usar un flag en el state para que `AppRouter` haga navigate con React Router.

### 9. `SIGNED_OUT` sin feedback al usuario

`src/app/providers.tsx:45-54` — Cuando la sesión expira, el usuario es redirigido a login sin mensaje. Agregar manejo de `event === 'SIGNED_OUT'` con un toast o parámetro en URL.

### 10. `ARCHITECTURE.md` desactualizado

Solo documenta 3 de 10+ módulos core. Faltan: `deliberation`, `accountability`, `privacy`, `gamification`, `entities`, `ingestion`, `verticals/residential`, `census`, `documents`. El diagrama del Provider tree es incorrecto.

---

## Baja Prioridad

### 11. TSConfig — habilitar checks más estrictos

`tsconfig.app.json`:
- `noUnusedLocals: true` (actualmente `false`)
- `noUnusedParameters: true` (actualmente `false`)
- Considerar `noUncheckedIndexedAccess: true`

### 12. Standardizar el mock de Supabase en tests

El patrón `vi.hoisted` + `createBuilder` de `governance.service.test.ts` es más flexible que el mock centralizado en `src/test/mocks/supabase.ts`. Estandarizar en uno solo.

### 13. `TestWrapper` incompleto

`src/test/` — El wrapper incluye `QueryClient` y `MemoryRouter` pero no `AuthContext` ni `CommunityContext`. Los tests de componentes que necesitan auth deben mockear providers manualmente.

### 14. Accesibilidad

- Verificar que todos los botones de ícono tengan `aria-label`
- Verificar navegación por teclado en modales y dropdowns
- Verificar contraste de colores en temas claros/oscuros

### 15. 404 fuera del layout

`src/app/routes.tsx:123` — La página 404 está fuera de `AppLayout`. Un usuario autenticado que escribe una URL incorrecta ve una página sin sidebar ni navegación. Considerar moverla dentro del layout protegido.

### 16. `/governance/assemblies` sin ruta index

Solo existe `/governance/assemblies/:assemblyId`. Navegar a `/governance/assemblies` (sin ID) cae en el catch de `:proposalId`.
