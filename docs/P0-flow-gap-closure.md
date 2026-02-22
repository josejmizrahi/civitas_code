# P0 Cierre de brechas funcionales F1–F6

Criterios de cierre verificables para cada flujo core. Cada brecha tiene un criterio que puede comprobarse con prueba (unit/E2E), revisión o checklist.

---

## F1 — Onboarding → primera operación

| Brecha | Descripción | Criterio de cierre verificable |
|--------|-------------|-------------------------------|
| F1.1 | Reglas inválidas (locale/currency/type) permiten crear comunidad | **Test:** Unit o E2E que envíe reglas inválidas y espere error; creación solo con reglas válidas. |
| F1.2 | Estado huérfano si falla a mitad del wizard | **Test:** Simular fallo tras crear comunidad y antes de completar; verificar que no queden comunidades sin admin o sin reglas aplicables. |
| F1.3 | Errores de red no se manejan y dejan UI en estado inconsistente | **Criterio:** OnboardingWizard muestra mensaje de error y permite reintentar o salir sin corrupción; no estado “cargando” infinito. |
| F1.4 | Consistencia reglas/tipo de comunidad | **Criterio:** create_community_with_admin (o RPC equivalente) valida que rules coincidan con el tipo elegido; test negativo con tipo ≠ rules. |

**Hito F1:** E2E de onboarding completo con dataset controlado en verde; al menos un test negativo (reglas inválidas) en suite unit o E2E.

---

## F2 — Auth / Invitaciones / Reset

| Brecha | Descripción | Criterio de cierre verificable |
|--------|-------------|-------------------------------|
| F2.1 | Token inválido/expirado aceptado | **Test:** InviteAcceptPage (o equivalente) con token expirado/inválido devuelve error claro y no crea miembro. |
| F2.2 | Escalación de permisos vía invitación (rol mayor al esperado) | **Criterio:** accept_invitation asigna solo el rol de la invitación; RLS members INSERT no permite insert con rol distinto al de invitación pendiente (ya cubierto por policy 052). **Test:** Aceptar invitación como miembro y verificar que el rol guardado es el de la invitación. |
| F2.3 | Reset password sin validar email o con enlace reutilizable | **Criterio:** reset-password edge valida email; enlace de reset de un solo uso o con expiración; test que reintentar mismo enlace falle. |
| F2.4 | Login/Register sin manejo de errores (Supabase auth) | **Criterio:** LoginPage y RegisterPage muestran mensaje de error ante credenciales inválidas o usuario existente; no crash. |

**Hito F2:** E2E de flujo invitación (crear → aceptar) y de reset password en verde; tests negativos token inválido y rol correcto.

---

## F3 — Tesorería: obligación → pago → conciliación

| Brecha | Descripción | Criterio de cierre verificable |
|--------|-------------|-------------------------------|
| F3.1 | Duplicación de pagos por webhook repetido | **Criterio:** ifpe-webhook rechaza o ignora duplicados por clave_rastreo (idempotencia); ya implementado con SELECT previo + UNIQUE. **Test:** Enviar mismo payload dos veces; segunda respuesta 200 duplicate, una sola fila en ifpe_webhook_events. |
| F3.2 | Conciliación manual sin permiso (admin/tesorero) | **Criterio:** ifpe.service manualReconcile llama assertCanPerformAction(..., 'reconcile_payment'); RLS ifpe_webhook_events SELECT solo admin/tesorero (052). **Test:** Negativo: usuario sin rol no puede conciliar. |
| F3.3 | Conciliación no determinística (múltiples obligaciones mismo monto) | **Criterio:** Documentado o restringido: estrategia por referencia primero; por monto solo si hay una sola obligación. **Test:** Escenario con dos obligaciones mismo monto sin referencia: comportamiento definido (unmatched o regla clara). |
| F3.4 | Sin auditoría en operaciones críticas | **Criterio:** Operaciones de pago/conciliación registran en audit_log o transacciones con origen/tipo trazable. Revisión en código. |

**Hito F3:** E2E de flujo obligación → pago (manual o rail) → conciliación en verde; test idempotencia webhook; test negativo permiso conciliación.

---

## F4 — Gobernanza: propuesta → voto → resultado → ejecución

| Brecha | Descripción | Criterio de cierre verificable |
|--------|-------------|-------------------------------|
| F4.1 | Voto duplicado (mismo miembro, misma propuesta) | **Criterio:** votes tiene UNIQUE(proposal_id, member_id) o equivalente; vote.service hace upsert. **Test:** Emitir dos votos mismo miembro misma propuesta; solo uno persistido. |
| F4.2 | Ejecución sin permiso (solo admin) | **Criterio:** executeProposal llama assertCanPerformAction(..., 'execute_proposal'); RLS en proposals/transactions. **Test:** Negativo: usuario no admin no puede ejecutar. |
| F4.3 | Transiciones de estado inválidas (draft → executed sin votación) | **Criterio:** proposal.service valida estado en startDiscussion, openVoting, closeProposal, executeProposal; tests de transición válida e inválida. |
| F4.4 | Apelación no reflejada o sin efecto | **Criterio:** appealProposal actualiza estado y bloquea ejecución hasta resolución; test que apelación ponga propuesta en estado apelado y no ejecutable. |

**Hito F4:** E2E propuesta → discusión → votación → cierre → ejecución en verde; tests negativos permiso ejecución y voto duplicado.

---

## F5 — Asamblea: convocatoria → quórum → acta

| Brecha | Descripción | Criterio de cierre verificable |
|--------|-------------|-------------------------------|
| F5.1 | Quórum calculado incorrectamente por tipo/llamada | **Criterio:** assembly.service (o reglas) usa quorum_by_type y quorum_first_call / second_call según LPCI; test con datos conocidos y quórum esperado. |
| F5.2 | Acta o firmas inconsistentes | **Criterio:** Minutos tienen hash o versión; firmas asociadas a member_id y acta; test que guardar acta y firmas sea consistente. |
| F5.3 | Convocatoria sin permiso (solo admin) | **Criterio:** createAssembly y cambios de estado validan rol admin; test negativo. |

**Hito F5:** E2E convocatoria → asistencia → acta (y firmas si aplica) en verde; test quórum por tipo/llamada.

---

## F6 — Importación y cambio de reglas

| Brecha | Descripción | Criterio de cierre verificable |
|--------|-------------|-------------------------------|
| F6.1 | Importación con columnas/fechas/montos inválidos | **Criterio:** ingestion.service valida columnas requeridas, fechas y montos antes de persistir; test con CSV inválido devuelve error y no inserta. |
| F6.2 | Duplicados en importación | **Criterio:** Criterio de dedup definido (ej. external_ref + date); test que filas duplicadas no generen registros duplicados. |
| F6.3 | Fallo parcial sin rollback lógico | **Criterio:** En fallo, no quedar transacciones/obligaciones a medias; rollback lógico o transacción; test que falle a mitad y verificar consistencia. |
| F6.4 | Cambio de regla sin aprobación vía gobernanza | **Criterio:** updateCommunityRules solo desde flujo de propuesta aprobada o admin con trazabilidad; no cambio directo desde UI sin permiso. Revisión. |

**Hito F6:** E2E de importación con dataset válido e inválido; tests de validación y dedup; al menos un test de rollback/consistencia en fallo.

---

## Resumen de criterios por flujo

| Flujo | Tests positivos | Tests negativos / bordes | Revisión código |
|-------|-----------------|--------------------------|-----------------|
| F1 | E2E onboarding completo | Reglas inválidas, fallo a mitad | Validación RPC/reglas |
| F2 | E2E invitación, E2E reset | Token inválido, rol correcto | - |
| F3 | E2E obligación→pago→conciliación, idempotencia webhook | Permiso conciliación | Auditoría |
| F4 | E2E propuesta→ejecución | Permiso ejecución, voto duplicado, apelación | Transiciones |
| F5 | E2E convocatoria→acta | Quórum por tipo, permiso convocatoria | - |
| F6 | E2E importación válida | CSV inválido, dedup, rollback | Cambio reglas |

Documento de referencia para DoD por flujo y para definir casos de prueba en CI.
