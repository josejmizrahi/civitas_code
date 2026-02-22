# P0 Baseline: Matriz de features/flujos y riesgos

Alcance: **core universal multi-comunidad**. Fuente híbrida: inventario en código + benchmark HOA/RLS.

## 1. Matriz de features por dominio

| Dominio | Feature | Decisión | Notas |
|---------|---------|----------|--------|
| Auth | Login / Registro | **core** | Rutas `/login`, `/register`. |
| Auth | Recuperación contraseña | **core** | `/forgot-password`, `/reset-password`, edge `reset-password`. |
| Auth | Aceptación invitación | **core** | `/invite/:token`, RPC `accept_invitation`. |
| Onboarding | Wizard 4 pasos | **core** | `/onboarding`, `create_community_with_admin`, reglas por tipo. |
| Tesorería | Transacciones (manual/import/rail/system) | **core** | `treasury.service`, dual fund. |
| Tesorería | Obligaciones de pago | **core** | `payment_obligations`, cobranza. |
| Tesorería | Conciliación IFPE/SPEI | **core** | `ifpe-webhook`, `ifpe.service`, reconciliación. |
| Tesorería | Presupuestos / Contratos / Planes pago | **core** | Visualización y flujos básicos. |
| Gobernanza | Propuestas (ciclo completo) | **core** | draft→discussion→active→closed→executed, avales. |
| Gobernanza | Votación (simple/múltiple/consenso) | **core** | `vote.service`, delegaciones. |
| Gobernanza | Ejecución y apelación | **core** | `executeProposal`, cool-down, appeal. |
| Gobernanza | Asambleas y convocatorias | **core** | `assembly.service`, quórum LPCI, actas. |
| Gobernanza | Archivo decisiones / Vigilancia | **opcional** | `/governance/archive`, `/governance/vigilancia` (por rol). |
| Miembros | Directorio y detalle | **core** | `/members`, `/members/:id`. |
| Miembros | Invitaciones (crear/aceptar) | **core** | `InviteMemberDialog`, `accept_invitation`. |
| Miembros | Standing / morosidad | **core** | `financial_standing`, restricción voto. |
| Reglas | Catálogo y versionado | **core** | `/rules`, `rules.service`, cambio vía propuesta. |
| Entidades | Partes relacionadas | **core** | `/entities`, contactos, tipos. |
| Documentos | Gestión documental | **core** | `/documents`, retención. |
| Importación | Ingesta CSV/Excel | **core** | `/ingestion`, mapeo, duplicados, `ingestion.service`. |
| Censo | Página y analytics | **opcional** | `/census`. |
| Config | Settings (admin) | **core** | `/settings`, reglas, categorías, invitaciones. |
| Config | Auditoría | **core** | `/settings/audit`, `audit_log`. |
| Config | Perfil usuario | **core** | `/profile`. |
| Vertical | Residencial (página específica) | **opcional** | `/residential`, `CommunityTypeGuard`. |
| Vertical | Religiosa / Cooperativa / Manufactura / Otros | **opcional** | Sin nav específica aún; baseline común. |

## 2. Flujos core (F1–F6) y decisión

| Id | Flujo | Decisión | Descripción breve |
|----|-------|----------|-------------------|
| F1 | Onboarding → primera operación | **core** | Crear comunidad, reglas, primer movimiento. |
| F2 | Invitación → alta → primer acceso | **core** | Token, aceptación, rol correcto. |
| F3 | Obligación → pago → conciliación | **core** | Manual + SPEI/rail, idempotente. |
| F4 | Propuesta → votación → resultado → ejecución | **core** | Con/sin apelación. |
| F5 | Asamblea → quórum → acta → firmas | **core** | Legal y trazable. |
| F6 | Cambio de regla → aprobación → aplicación | **core** | Vía gobernanza. |
| F7 | Importación → mapeo → validación → persistencia | **core** | Sin duplicados, rollback lógico. |
| F8 | Incidente/rollback operativo | **core** | Errores recuperables sin corrupción. |

## 3. Matriz de riesgos por flujo

| Flujo | Riesgo | Severidad | Mitigación P0 |
|-------|--------|-----------|----------------|
| F1 | Reglas inválidas o estado huérfano | Alta | Validación cliente + RPC atómico, DoD-F1. |
| F2 | Token inválido/expirado o escalación de permisos | Alta | Validación token, RLS members INSERT controlado, DoD-F2. |
| F3 | Duplicación de pagos, conciliación no determinística | Crítica | Idempotencia webhook, locks, auditoría, DoD-F3. |
| F4 | Voto duplicado, ejecución sin permiso | Crítica | Permisos en servicio + RLS, voto único, DoD-F4. |
| F5 | Quórum incorrecto, acta inconsistente | Alta | Cálculo por tipo/llamada, firmas y hash, DoD-F5. |
| F6 | Regla aplicada sin aprobación | Alta | Solo vía propuesta aprobada, DoD-F6. |
| F7 | Duplicados o fallo parcial sin rollback | Media | Validación, dedup, transacción/rollback lógico, DoD-F6. |
| F8 | Corrupción de datos en fallo | Alta | Transacciones, auditoría, runbook rollback. |
| Global | Bypass de permisos (solo RLS, sin servicio) | Crítica | permission.service + validación en servicios críticos. |
| Global | service_role en cliente | Crítica | Solo edge functions; verificar en CI. |

## 4. Backlog técnico P0 cerrado (referencia)

- Seguridad: contrato de permisos, permission.service, RLS members + ifpe_webhook_events, edge authz.
- Flujos: cierre de gaps F1–F6 y F8 según DoD.
- Calidad: CI bloqueante (unit, E2E, RLS, migraciones, cobertura).

Documento aprobado como baseline para Sprints 1–3.
