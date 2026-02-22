# Plan de implementación — CORE (Kernel universal)

**Fuente:** Especificación funcional completa (Parte 1 – Kernel universal) + CIVITAS_CURSOR_PROMPT.md  
**Alcance:** Solo core. No se implementan verticales (residencial, religiosa, etc.) ni sus módulos adicionales (unidades, áreas comunes, mantenimiento, etc.).  
**Fecha:** Febrero 2026

---

## 1. Resumen ejecutivo

El kernel de Civitas se organiza en: **Identity**, **Treasury**, **Governance**, más **infraestructura transversal** (multi-tenancy, audit, notificaciones, i18n). Este documento es un **gap analysis** entre la especificación y el estado actual del código, y un **plan de implementación** por fases para cerrar las brechas sin tocar verticales.

---

## 2. Gap analysis (especificación vs estado actual)

### 2.0 Principio rector (Identity ↔ Treasury ↔ Governance)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| Standing determina derechos (votar, ser electo, proponer) | Parcial | Existe `financial_standing` y `compute_financial_standing`; revisar que todos los flujos (votar, ejecutar, proponer) validen standing. |
| Ningún gasto sin autorización (presupuesto/vigilancia/asamblea) | Parcial | Instrucciones financieras en propuestas y ejecución existen; **falta** flujo explícito de 4 niveles (operativo, discrecional, asamblea, emergencia) y tabla `discretionary_approvals`. |
| Transparencia estructural (transacciones visibles al registrar) | OK | Transacciones inmutables, realtime; ajustes por corrección con nota. |

---

### 2.1 Primer contacto (público y auth)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| 1.1 Landing con CTA Crear comunidad / Iniciar sesión | OK | `LandingPage.tsx` |
| 1.2 Registro (email, contraseña, nombre) | OK | `RegisterPage` |
| 1.2 Redirigir a onboarding si nuevo, dashboard si tiene comunidades | Verificar | Flujo post-registro. |
| 1.2 Si llegó desde `/invite/:token`, aceptar invitación tras registro | Verificar | `InviteAcceptPage` existe; revisar integración con registro. |
| 1.3 Login con email/contraseña y soporte `?invite=TOKEN` | Verificar | Param en URL y redirección a aceptar invitación. |
| 1.3 Olvidé contraseña (link por email) | OK | `ForgotPasswordPage`, `ResetPasswordPage` |
| 1.4 Aceptar invitación `/invite/:token` (validar, mostrar comunidad/rol, crear miembro) | OK | `InviteAcceptPage` |

---

### 2.2 Onboarding de comunidad (wizard 6 pasos)

| Requisito | Estado | Notas |
|-----------|--------|--------|
| 2.1 Paso 1 — Tipo de comunidad (preset por tipo) | Parcial | Solo 4 pasos actuales: Tipo, Datos, Reglas, Confirmar. Tipos: residential, religious, manufacturing, cooperative, other. |
| 2.2 Paso 2 — Datos básicos (nombre, slug, logo, dirección, moneda, locale) | Parcial | Paso 2 tiene nombre y descripción; **falta**: slug editable, logo, dirección, moneda, locale. |
| 2.3 Paso 3 — Estructura de miembros (custom_attributes, campo peso de voto) | **Falta** | No existe paso dedicado. **Crear**: definición de atributos (preset por tipo + editable), indicar atributo para peso de voto. Persistir en `communities.config` o tabla equivalente. |
| 2.4 Paso 4 — Categorías financieras (ingreso/egreso, jerarquía, fondos separados) | **Falta** | No hay paso de categorías en onboarding. **Crear**: categorías pre-cargadas por tipo, edición, asignación a fondos si aplica. Crear registros en `categories` al crear comunidad. |
| 2.5 Paso 5 — Reglas de gobernanza (quórums, mayorías, grace, umbral discrecional, etc.) | OK | `StepRulesConfig` con reglas; verificar que todas las reglas del spec estén (quórum 1ª/2ª, extraordinario, mayoría simple/calificada, grace, umbral discrecional, avales, delegación, mandato, fondos separados, modo tesorería, moroso puede proponer/ver finanzas). |
| 2.6 Paso 6 — Confirmar y crear (resumen, crear comunidad + config + categorías + fundador admin) | Parcial | Confirmación existe; **falta**: crear categorías y config de miembros al crear; usar RPC o servicio que cree `communities` + `community_config`/config + `categories` + `community_rules` + miembro admin. |

**Resumen onboarding:** Pasar de 4 a 6 pasos; añadir paso “Estructura de miembros” y “Categorías financieras”; completar datos básicos (slug, logo, moneda, locale, dirección); asegurar que al “Crear” se persistan config, categorías y reglas.

---

### 2.3 Identity

| Requisito | Estado | Notas |
|-----------|--------|--------|
| 3.1 Roles: Admin, Tesorero, Comité Vigilancia, Miembro, Observador | Parcial | Roles en DB incluyen `comite_vigilancia`; verificar que permisos y UI usen los 5. |
| 3.2 Matriz de permisos (por acción y rol) | Parcial | `hasPermission` en `shared/types`; **falta** `assertCanPerformAction(communityId, memberId, action)` que además verifique standing y reglas. |
| 3.3 Standing (al corriente / gracia / moroso) automático | OK | `compute_financial_standing`, `refresh_financial_standings`, cron; valores: good_standing, grace_period, delinquent, moroso. |
| 3.3 Transición automática y notificación al cambiar standing | Verificar | Triggers/notificaciones al pasar a moroso o restaurar. |
| 3.4 Directorio de miembros (nombre, email, rol, standing, atributos, filtros, export Excel) | OK | `MemberDirectory`; verificar columnas dinámicas por `custom_attributes` y export. |
| 3.5 Perfil de miembro (detalle, historial pagos/propuestas/votos, admin: cambiar rol, desactivar) | OK | `MemberDetailPage` |
| 3.6 Invitaciones (crear con email+rol, email con link, lista pendientes/aceptadas/expiradas) | OK | `InviteMemberDialog`, `identity.service` |
| 3.7 Perfil usuario multi-comunidad (comunidades, rol por una, cambiar comunidad activa) | OK | `ProfilePage`, selector de comunidad en layout |

---

### 2.4 Treasury

| Requisito | Estado | Notas |
|-----------|--------|--------|
| 4.1 Dashboard financiero (saldos por fondo, ingresos vs egresos, por categoría, presupuesto vs real, tasa cobranza, morosos) | OK | `FinancialDashboard`, `useDashboard`; verificar fondos separados y lista morosos según regla. |
| 4.2 Transacciones inmutables, ajuste solo por corrección con nota | OK | Sin UPDATE/DELETE; corrección con referencia. |
| 4.2 Visibilidad en tiempo real | OK | Realtime / TanStack Query. |
| 4.3.1 Definición contribución periódica (fijo o proporcional, frecuencia, días) | OK | `recurring_schedules`, `RecurringScheduleList` |
| 4.3.2 Generación automática de obligaciones | Verificar | Cron/scheduled function; **crítico**: admin define cuota → sistema genera N obligaciones (ej. 200) por miembros activos. Si falla, no hay cobranza ni standing ni gobernanza. Requiere ítem explícito de verificación y testing. |
| 4.3.3 Estado de cuenta del miembro (pendientes, vencidas, historial, saldo) | OK | `MyPayments`, `PaymentObligationList` |
| 4.3.4 Registro de pago (manual / IFPE / híbrido) | OK | `RegisterPaymentDialog`, `ifpe-webhook`, `IfpeReconciliationPanel` |
| 4.3.5 Cobranza (panel, recordatorios, planes de pago) | OK | `CollectionView`, `PaymentPlanManager`, `ProposePaymentPlan` |
| 4.4 Niveles de autorización de gasto (1–4) | **Falta** | **Nivel 1:** gasto dentro de presupuesto → validar y notificar vigilancia. **Nivel 2:** tabla `discretionary_approvals` + flujo admin solicita → vigilancia aprueba en app. **Nivel 3:** propuesta aprobada → ejecutar (ya existe). **Nivel 4:** emergencia → ejecutar y crear propuesta de ratificación 72h. Implementar lógica en registro de gasto y panel vigilancia. |
| 4.5 Presupuestos (CRUD, aprobación por propuesta, dashboard vs real) | OK | `budgets`, `BudgetOverview`, `useBudgets` |
| 4.6 Entidades (proveedores/contratistas, contacto, RFC, CLABE, valoraciones) | OK | `EntitiesPage`, `EntityDetailPage`, ratings |
| 4.7 Contratos y recurrentes (contratos con entidad, cuotas, pagos recurrentes) | OK | `contracts`, `ContractList`, `contracts.service` |
| 4.8 Importación (CSV/Excel, mapeo, categorías, duplicados, preview) | OK | `IngestionPage`, ingestion tables |
| 4.9 Reportes y exportación (PDF/Excel, reporte mensual automático por email) | Parcial | `StatementPDF`, export; **verificar** reporte mensual automático (cron + email). |

---

### 2.5 Governance

| Requisito | Estado | Notas |
|-----------|--------|--------|
| 5.1.1 Plantillas de propuesta (gasto, contribución extraordinaria, presupuesto, cambio regla, admisión, elección, emergencia, obra, remoción, general) | Parcial | Formularios por plantilla existen; verificar que todas las plantillas del spec estén y que la instrucción de ejecución esté definida por tipo. |
| 5.1.2 Ciclo de vida (draft → endorsement → discussion → active → closed → executed) | OK | Estados en propuestas; endorsement, discussion, voting. |
| 5.1.3 Campos universales y por plantilla | Parcial | Revisar que cada plantilla tenga todos los campos (gasto: monto, categoría, beneficiario, fondo; cambio regla: regla, valor actual/nuevo; elección: cargos, candidatos; etc.). |
| 5.2.1 Votación Sí/No/Abstención y opción múltiple (elecciones) | Parcial | `VotingPanel`; **falta** en backend: función `calculate_vote_weight(member_id, community_id)` y uso en votación; elecciones con `election_candidates` y `election_votes` si no existen. |
| 5.2.2 Peso de voto en backend (1p1v, por atributo, custom) | **Falta** | Implementar función SQL `calculate_vote_weight` según `community_config` / config de comunidad; usarla al emitir voto y en quórum. |
| 5.2.3 Delegación de voto (general o por propuesta, vigencia, ambos al corriente) | OK | `delegations`, `DelegationManager`, `useDelegation` |
| 5.2.4 Visualización (quórum, resultado parcial, desglose nominal/anónimo) | OK | `VotingVisualization`, barras de progreso |
| 5.3 Asambleas (convocatoria, quórum por 1ª/2ª/3ª convocatoria, asistencia, proxies, actas) | OK | `assemblies`, `convocatorias`, `assembly_proxies`, `minutes`, `AssemblyDetailPage` |
| 5.4 Elecciones (propuesta tipo elección, candidatos, votación múltiple, ejecución asigna roles) | Parcial | Verificar tablas `election_candidates` y `election_votes`; flujo de inscripción, votación y ejecución que asigne roles y `term_start`. |
| 5.5 Comité de vigilancia (logs admin/tesorero, alertas, aprobar discrecional, flag transacciones, solicitar auditoría) | Parcial | `VigilanciaPage`, `VigilanciaPanel`; **falta** cola de aprobación discrecional (Nivel 2) y flag/bloqueo de transacciones; solicitud de auditoría. |

---

### 2.6 Reglamento, documentos, censo, notificaciones, configuración

| Requisito | Estado | Notas |
|-----------|--------|--------|
| 6 Reglamento (catálogo de reglas, valor actual, referencia legal, historial, “Proponer cambio”) | OK | `RulesPage`, `rule_versions`; edición solo vía propuesta cuando hay miembros. |
| 7 Documentos (categorías, subida, actas/contratos auto-archivados) | OK | `DocumentsPage`, `documents` |
| 8 Censo (snapshot, evolución, métricas) | OK | `CensusPage`, `census_snapshots` |
| 9 Notificaciones automáticas (tabla de eventos → destinatario, canal, plantilla) | Parcial | `notifications`, Edge Functions; **verificar** que todos los eventos del spec disparen notificación (obligación generada/vencida, standing, propuesta, votación, resultado, ejecución, vigilancia, asamblea, reporte mensual, etc.). |
| 10 Configuración (General, Categorías, Invitaciones, Reglas, Notificaciones, Auditoría, Privacidad) | Parcial | `SettingsPage`, `AuditLogPage`; **verificar** pestaña Notificaciones (qué notificaciones activas y parámetros) y Privacidad. |

---

### 2.7 Multi-comunidad e infraestructura

| Requisito | Estado | Notas |
|-----------|--------|--------|
| 11 Selector de comunidad y vista consolidada (admins con varias comunidades) | Parcial | Selector en layout; **verificar** vista consolidada con tarjetas por comunidad (saldo, morosidad, alertas). |
| 12.1 Multi-tenancy y RLS en todas las tablas | OK | `community_id`, RLS en migraciones. |
| 12.2 Audit log (acciones relevantes, quién qué cuándo) | OK | `audit_log`, `audit.service` |
| 12.3 Email transaccional (Edge Function, plantillas, rate limit) | OK | `send-email`, Resend |
| 12.4 Webhook IFPE (Broxel, HMAC, conciliación) | OK | `ifpe-webhook`, `ifpe_webhook_events` |
| 12.5 Push notifications | OK | `push_subscriptions`, servicio |
| 12.6 i18n (es, en) | OK | `useI18n`, `messages` |
| 12.7 Tema claro/oscuro | OK | `useTheme` |
| 12.8 Exportación PDF/Excel | OK | `export.service`, statements |

---

### 2.8 Patrones críticos (CURSOR_PROMPT)

| Patrón | Estado | Notas |
|--------|--------|--------|
| Multi-tenancy vía hook (uso de community_id en todas las queries) | Parcial | Se usa `useCommunityContext`; **falta** nombre estándar `useTenant()` y documentar que nunca se consulte sin `community_id`. |
| Labels vertical-agnósticos vía config (member_label, entity_label, etc.) | Parcial | **Falta** `useCommunityConfig()` que lea `community_config` o `communities.config` y exponga memberLabel, entityLabel, contributionLabel, votingFormula, categories; usar en UI en lugar de textos fijos. |
| assertCanPerformAction antes de acciones protegidas | **Falta** | Implementar servicio/hook que verifique rol + standing + reglas antes de crear propuesta, votar, ejecutar, registrar transacción, aprobar discrecional, etc. |
| Peso de voto siempre desde backend | **Falta** | Función SQL `calculate_vote_weight` y uso en votación. |
| Transacciones inmutables | OK | Solo corrección con nota. |

---

## 3. Criterios de priorización

- **F0 + F1 en una sola fase:** Los hooks `useTenant` y `useCommunityConfig` no tienen sentido sin el onboarding que genera la config que leen. Se construyen juntos; el onboarding es el primer consumidor real.
- **F2.2 (discrecional) es flujo diario:** Nivel 3 (asamblea) pasa una vez al mes; Nivel 2 pasa varias veces por semana. La UX de vigilancia debe ser mínima: idealmente push con botón aprobar/rechazar.
- **F4 (notificaciones) antes de F3 (elecciones):** Sin notificaciones nadie se entera de votaciones abiertas y el producto se siente muerto. Las elecciones son una vez al año → van a F5.
- **Generación masiva de obligaciones:** Es el flujo más crítico de Treasury (admin define cuota → sistema genera N obligaciones). Si falla, no hay cobranza, standing ni gobernanza. Ítem explícito de verificación y testing.
- **Tests RLS desde el inicio (F0):** Si no se prueba aislamiento entre comunidades desde el principio, los leaks aparecen con 3 comunidades en producción. Mínimo: test que crea 2 comunidades y verifica que un miembro de A no ve datos de B. Se ejecutan en paralelo con el resto.

---

## 4. Plan de implementación por fases (solo core)

**Orden de ejecución:**  
**F0+1** (fundamentos + onboarding juntos) → **F2** (niveles de autorización) → **F3** (notificaciones) → **F4** (peso de voto en UI) → **F5** (pulido, elecciones, multi-comunidad).  
**Tests RLS** en paralelo desde el inicio (F01.5). **Generación masiva de obligaciones**: ítem explícito de verificación/testing (OBLIG).

---

### Fase 0+1 — Fundamentos + Onboarding (una sola fase)

Los hooks y la config se construyen junto con el wizard; el onboarding es el primer consumidor.

1. **useTenant / useCommunityConfig**
   - Hook `useTenant()`: `communityId`, `membership`, `role`, `isAdmin`, `isTreasurer`, `isVigilance`.
   - Hook `useCommunityConfig()`: lee config (communities.config o community_config) → `memberLabel`, `entityLabel`, `contributionLabel`, `votingFormula`, `categories`, `vertical`. La config la escribe el onboarding al crear la comunidad.
   - Sustituir en la UI textos fijos por valores de `useCommunityConfig()`.

2. **assertCanPerformAction**
   - Acciones: `create_proposal`, `cast_vote`, `open_voting`, `close_proposal`, `execute_proposal`, `reconcile_payment`, `approve_discretionary`, `register_transaction`, etc.
   - Implementar verificación rol + standing + reglas; lanzar si no autorizado. Usar en todos los flujos protegidos.

3. **calculate_vote_weight**
   - Función SQL `calculate_vote_weight(p_member_id, p_community_id)` según config (1p1v o custom_attribute). Usar al emitir voto y en quórum/totales.

4. **Onboarding 6 pasos**
   - Paso 1: Tipo. Paso 2: Datos básicos (nombre, slug editable, logo, dirección, moneda, locale). Paso 3: Estructura de miembros (custom_attributes, atributo peso de voto). Paso 4: Categorías financieras (ingreso/egreso por tipo, fondos si aplica). Paso 5: Reglas de gobernanza. Paso 6: Confirmar y crear.
   - Al crear: RPC o servicio que cree comunidad + config (labels, atributos, fórmula de voto) + categorías + reglas + miembro admin en una transacción.

5. **Tests RLS (en paralelo desde el inicio)**
   - Mínimo: test que crea 2 comunidades y verifica que un miembro de A no puede ver datos de B (transacciones, miembros, propuestas). Ejecutar y mantener en paralelo con el resto de fases.

---

### Fase 2 — Niveles de autorización de gasto y vigilancia

6. **Nivel 1 (operativo)**  
   Validar presupuesto al registrar gasto; notificar a vigilancia.

7. **Nivel 2 (discrecional) — prioridad alta en UX**  
   - Tabla `discretionary_approvals`. Flujo: admin/tesorero crea solicitud → vigilancia recibe notificación → aprobar/rechazar en app (o desde push: botón aprobar/rechazar). Al aprobar, crear transacción vinculada.  
   - Es el flujo diario real del admin (varias veces por semana). La UX de vigilancia debe ser muy simple.

8. **Nivel 4 (emergencia)**  
   Gasto de emergencia → transacción inmediata + propuesta de ratificación 72h; si no se ratifica, registrar en audit.

9. **Panel vigilancia**  
   Cola discrecional, flag/bloqueo de transacciones, solicitar auditoría.

---

### Fase 3 — Notificaciones y configuración (antes que elecciones)

10. **Notificaciones**  
    Todos los eventos del spec (obligación generada/vencida, standing, propuesta, votación, resultado, ejecución, vigilancia, asamblea, reporte mensual, nuevo miembro, pago IFPE) deben disparar email/push según configuración.

11. **Configuración**  
    Pestaña Notificaciones (activar/desactivar por tipo, parámetros). Pestaña Privacidad.

12. **Reporte mensual automático**  
    Cron que el día configurado por comunidad genere y envíe el reporte por email.

---

### Fase 4 — Peso de voto en UI (sin elecciones aún)

13. **Peso de voto**  
    Mostrar en votación el peso del miembro (calculate_vote_weight). Quórum y mayorías con suma de pesos en `votes.weight`.

*(Elecciones completas se mueven a F5: ocurren una vez al año.)*

---

### Fase 5 — Pulido, elecciones, multi-comunidad

14. **Vista consolidada multi-comunidad**  
    Dashboard con tarjetas por comunidad (saldo, morosidad, alertas) para admins con varias comunidades.

15. **Login con `?invite=TOKEN`**  
    Tras login, redirigir a `/invite/:token` si la URL trae invite.

16. **Revisión de plantillas de propuesta**  
    Todas las plantillas con campos e instrucción de ejecución correctos.

17. **Elecciones (flujo completo)**  
    Tablas y flujo: candidatos, votación múltiple, ejecución asigna roles y `term_start`. Frecuencia baja (una vez al año), por eso va al final.

18. **assertCanPerformAction en tests**  
    Tests que verifiquen bloqueo cuando el miembro no tiene permiso o no está al corriente.

---

### Ítem transversal: Generación masiva de obligaciones

- **Verificación y testing explícitos:** Admin define cuota (recurring_schedule) → cron/scheduled function genera obligaciones para todos los miembros activos (ej. 200). Sin esto no hay cobranza, standing ni gobernanza. Incluir: test o script que cree una comunidad con N miembros, defina una cuota, ejecute la generación y compruebe que se crearon N obligaciones correctas. Revisar en F0+1 o F2 que el flujo esté cubierto y documentado.

---

## 5. Orden sugerido de tareas (checklist)

**F0+1 — Fundamentos + Onboarding (construir juntos)**  
- [ ] **F01.1** useTenant / useCommunityConfig (onboarding es el primer consumidor)
- [ ] **F01.2** assertCanPerformAction e integración en flujos protegidos
- [ ] **F01.3** Función SQL calculate_vote_weight y uso en votación
- [ ] **F01.4** Onboarding 6 pasos: datos básicos (slug, logo, dirección, moneda, locale), estructura miembros, categorías financieras, reglas, confirmar y crear (RPC transaccional)
- [ ] **F01.5** Tests RLS desde el inicio: 2 comunidades, miembro de A no ve datos de B (ejecutar en paralelo con todo)

**Transversal (verificar en F01 o F2)**  
- [ ] **OBLIG** Generación masiva de obligaciones: verificación + test (cuota → N obligaciones para N miembros activos)

**F2 — Niveles de autorización**  
- [ ] **F2.1** Nivel 1: validar presupuesto al registrar gasto y notificar vigilancia
- [ ] **F2.2** Tabla discretionary_approvals + flujo Nivel 2 + UX vigilancia simple (ideal: push con aprobar/rechazar)
- [ ] **F2.3** Nivel 4: gasto emergencia + propuesta de ratificación 72h
- [ ] **F2.4** Vigilancia: cola discrecional, flag/bloqueo transacciones, solicitar auditoría

**F3 — Notificaciones (antes que elecciones)**  
- [ ] **F3.1** Triggers/eventos de notificaciones (todos los eventos del spec)
- [ ] **F3.2** Settings: pestaña Notificaciones y Privacidad
- [ ] **F3.3** Cron reporte mensual automático por comunidad

**F4 — Peso de voto en UI**  
- [ ] **F4.1** Mostrar peso en votación y quórum/mayorías con votes.weight

**F5 — Pulido, elecciones, multi-comunidad**  
- [ ] **F5.1** Vista consolidada para admins multi-comunidad
- [ ] **F5.2** Login con ?invite=TOKEN
- [ ] **F5.3** Revisión de todas las plantillas de propuesta
- [ ] **F5.4** Elecciones: candidatos, votación múltiple, ejecución asigna roles y term_start
- [ ] **F5.5** Tests assertCanPerformAction (bloqueo cuando sin permiso o no al corriente)

---

## 6. Lo que queda fuera de este plan (verticales)

- Módulos específicos residencial: unidades, áreas comunes, solicitudes de mantenimiento.
- Presets y UX específicos por vertical (religiosa, cooperativa, educativa, club, ONG, manufactura).
- Compliance específico (LPCI, LGSC, etc.) más allá de lo que ya carga el preset de reglas.

Todo lo anterior se implementará en un plan posterior, una vez cerrado el core según este documento.

---

## 7. Referencia rápida: Spec → Plan

| § Spec | Tema | Plan |
|--------|------|------|
| 0 | Principio rector (3 primitivos integrados) | F01, F2 (niveles), F01.3 (peso de voto) |
| 1 | Primer contacto, auth, invitación | F5.2 (login con invite), resto OK |
| 2 | Onboarding 6 pasos | F01.4 |
| 3 | Identity (roles, permisos, standing, directorio, invitaciones) | F01.2 assertCanPerformAction, resto OK/parcial |
| 4 | Treasury (obligaciones masivas, niveles 1–4, reportes) | OBLIG (generación), F2, F3.3 |
| 5 | Governance (peso de voto, vigilancia, elecciones) | F01.3, F2.4, F4.1, F5.4 |
| 6–8 | Reglamento, documentos, censo | OK |
| 9–10 | Notificaciones, configuración | F3 |
| 11–12 | Multi-comunidad, infraestructura | F5.1, resto OK |
| — | Tests RLS y permisos | F01.5 (paralelo), F5.5 |
