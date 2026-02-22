# P0 Definition of Done por flujo

Cada flujo core debe cumplir su DoD para considerarse cerrado en P0. Las pruebas indicadas son **obligatorias** en CI (unit, E2E o RLS según corresponda).

---

## DoD-S1 — Seguridad (transversal)

- Cada operación crítica valida permisos en **servicio** (p. ej. `assertCanPerformAction`) y tiene **policy RLS** de respaldo.
- Existe al menos un **test negativo**: actor no autorizado recibe error (403/Forbidden o equivalente) y no se realiza la operación.

**Pruebas obligatorias:**

- RLS penetration / permisos: suite `src/test/rls-penetration.test.ts` (o equivalente) en verde.
- Test negativo por acción crítica: create_proposal, cast_vote, execute_proposal, reconcile_payment, etc.: usuario sin rol adecuado no puede ejecutar la acción.

---

## DoD-F1 — Onboarding

- Crear comunidad con reglas válidas; sin estados huérfanos (comunidad sin admin o sin reglas aplicables).
- Caminos de error cubiertos: reglas inválidas, fallo de red, reintento.

**Pruebas obligatorias:**

- **Positiva:** E2E que complete el wizard de onboarding y verifique comunidad creada con reglas y admin.
- **Negativa:** Test (unit o E2E) que envíe reglas inválidas o tipo inconsistente y espere error; no creación.

---

## DoD-F2 — Auth / Invitaciones / Reset

- Token inválido/expirado manejado; no escalación de permisos por invitación (rol = rol de la invitación).
- Reset password: enlace de un uso o expiración; sin reutilización.

**Pruebas obligatorias:**

- **Positiva:** E2E invitación (crear → aceptar) y E2E reset password hasta correo/enlace.
- **Negativa:** Token expirado o inválido en aceptación de invitación → error y no creación de miembro; rol del miembro = rol de la invitación.

---

## DoD-F3 — Tesorería

- Idempotencia de pagos/webhooks (clave_rastreo o equivalente).
- Conciliación determinística; auditoría completa en operaciones críticas.

**Pruebas obligatorias:**

- **Positiva:** E2E obligación → pago (manual o rail) → conciliación; idempotencia webhook (mismo payload dos veces → 200 duplicate, una sola fila).
- **Negativa:** Usuario sin rol admin/tesorero no puede ejecutar conciliación manual.

---

## DoD-F4 — Gobernanza

- Transición de estados válida (draft → discussion → active → closed → executed).
- Voto único por miembro por propuesta; ejecución controlada por rol/regla; apelación probada.

**Pruebas obligatorias:**

- **Positiva:** E2E propuesta → discusión → votación → cierre → ejecución (con/sin apelación).
- **Negativa:** Usuario no admin no puede ejecutar propuesta; segundo voto mismo miembro misma propuesta no duplica voto.

---

## DoD-F5 — Asamblea

- Convocatoria válida; quórum correcto por tipo/llamada (LPCI); acta y firmas consistentes.

**Pruebas obligatorias:**

- **Positiva:** E2E convocatoria → asistencia → acta (y firmas si aplica); test de cálculo de quórum con datos conocidos.
- **Negativa:** Usuario no admin no puede crear/convocar asamblea (según contrato).

---

## DoD-F6 — Importación

- Validación de columnas/fechas/montos; control de duplicados; rollback lógico en fallo.

**Pruebas obligatorias:**

- **Positiva:** E2E importación con CSV válido; datos persistidos según mapeo.
- **Negativa:** CSV inválido (columnas/fechas/montos) → error y no persistencia; duplicados no generan filas duplicadas; fallo a mitad no deja datos inconsistentes (rollback lógico).

---

## DoD-QA — Release

- Lint + typecheck + unit + E2E + RLS tests en verde y **bloqueantes** (no `continue-on-error` en smoke crítico).
- Migraciones verificadas en CI; cobertura P0 según umbrales definidos.

**Pruebas obligatorias:**

- Pipeline CI (`.github/workflows/ci.yml`) con gates: lint, typecheck, unit, E2E, RLS, verificación de migraciones.
- PR y main: pipeline 100% verde para merge/despliegue.

---

## Resumen

| DoD   | Prueba positiva obligatoria     | Prueba negativa obligatoria              |
|-------|--------------------------------|------------------------------------------|
| S1    | RLS/permisos en verde          | Actor no autorizado rechazado            |
| F1    | E2E onboarding completo        | Reglas inválidas → error                  |
| F2    | E2E invitación + reset         | Token inválido, rol correcto             |
| F3    | E2E tesorería + idempotencia   | Sin permiso conciliación                 |
| F4    | E2E propuesta→ejecución        | Sin permiso ejecución, voto único        |
| F5    | E2E asamblea + quórum          | Permiso convocatoria                     |
| F6    | E2E importación válida         | CSV inválido, dedup, rollback            |
| QA    | Pipeline completo en verde    | Gates bloqueantes (no continue-on-error) |

Referencia: [P0-flow-gap-closure.md](./P0-flow-gap-closure.md) para criterios detallados de cierre por brecha.
