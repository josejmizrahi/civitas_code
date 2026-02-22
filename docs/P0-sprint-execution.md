# P0 Secuencia de sprints e hitos verificables

Secuenciación de la implementación en sprints cortos con hitos verificables y salida a producción.

---

## Sprint 0 (2–3 días) — Baseline y congelamiento funcional P0 ✅

**Entregables:**

- Matriz de features/flujos con decisión core/opcional/retirar.
- Matriz de riesgos por flujo.
- Contratos de permisos por acción (tabla de authz).

**Hito verificable:** Documento aprobado + backlog técnico P0 cerrado.

**Estado:** Completado (docs: P0-baseline-matrix.md, P0-security-contract.md).

---

## Sprint 1 (3–4 días) — Blindaje de seguridad ✅

**Entregables:**

- `permission.service` integrado en servicios críticos (vote, proposal, ifpe).
- Migraciones RLS/índices aplicadas (052: members INSERT, ifpe_webhook_events SELECT, idx_members_user_community_active, get_community_by_clabe).
- Edge functions endurecidas: ifpe-webhook (lookup por CLABE, idempotencia); send-email (authz admin/tesorero/comite, rate-limit).

**Hito verificable:** Pruebas de penetración RLS y tests negativos de permisos en verde.

**Estado:** Completado (permisos en servicios, migración 052, edge hardening).

---

## Sprint 2 (4–5 días) — Cierre de flujos críticos

**Entregables:**

- Correcciones de huecos en F1–F6 según [P0-flow-gap-closure.md](./P0-flow-gap-closure.md).
- Manejo de errores/bordes y consistencia transaccional.

**Hito verificable:** E2E de F1–F6 en verde con dataset controlado.

**Checklist:**

- [ ] F1: E2E onboarding + test reglas inválidas.
- [ ] F2: E2E invitación + reset; test token inválido / rol correcto.
- [ ] F3: E2E tesorería + idempotencia webhook; test permiso conciliación.
- [ ] F4: E2E propuesta→ejecución; test permiso ejecución y voto único.
- [ ] F5: E2E asamblea; test quórum y permiso convocatoria.
- [ ] F6: E2E importación; test CSV inválido, dedup, rollback.

---

## Sprint 3 (2–3 días) — Quality gates y release readiness

**Entregables:**

- CI bloqueante completo (unit, E2E, RLS, verify-migrations).
- Umbrales de cobertura P0 activados (según vite.config.ts).
- Checklist final de release + runbook de rollback.

**Hito verificable:** Pipeline 100% verde en PR y en main; despliegue sin errores.

**Checklist:**

- [ ] E2E sin continue-on-error cuando corre (ya aplicado en ci.yml).
- [ ] verify-migrations en CI (ya aplicado).
- [ ] RLS tests en CI cuando existan TEST_SUPABASE_* (opcional).
- [ ] Documentar runbook de rollback (migraciones, edge, feature flags si aplica).

---

## Salida a producción

- **Pre-release:** Todos los hitos de Sprint 2 y 3 verificados.
- **Release:** Merge a main con pipeline verde; aplicar migraciones en orden (incl. 052); desplegar edge functions (ifpe-webhook, send-email).
- **Post-release:** Monitorear logs (auth, edge, postgres); ejecutar runbook si incidente.

---

## Resumen de documentos P0

| Documento | Propósito |
|-----------|-----------|
| [P0-baseline-matrix.md](./P0-baseline-matrix.md) | Features/flujos y riesgos |
| [P0-security-contract.md](./P0-security-contract.md) | Permisos por acción y RLS |
| [P0-flow-gap-closure.md](./P0-flow-gap-closure.md) | Brechas F1–F6 y criterios de cierre |
| [P0-dod-by-flow.md](./P0-dod-by-flow.md) | DoD por flujo y pruebas obligatorias |
| [P0-ci-gates.md](./P0-ci-gates.md) | Gates de CI bloqueantes |
| **P0-sprint-execution.md** | Secuencia de sprints e hitos (este doc) |
