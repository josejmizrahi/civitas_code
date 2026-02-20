# Whitepaper v4 → App: qué falta, qué sobra, y si vas por buen camino

## Conclusión corta

**Vas por buen camino.** El núcleo del whitepaper (Identidad + Tesorería + Gobernanza integrados, reglas configurables, decisiones ejecutables, pago condiciona voto, censo) está implementado. Falta sobre todo el **rail fintech real** (IFPE, SPEI, reconciliación automática), **Federación** como producto, y algunos matices. Nada de lo que hay hoy sobra; hay un par de módulos sin entrada en la UI que conviene integrar o documentar.

---

## 1. Lo que ya está implementado (alineado al whitepaper)

### Identidad
- Miembros, roles, invitaciones, directorio.
- **Estado financiero** (`financial_standing`): moroso / al corriente; usado en toda la app.
- **Peso de voto** (`voting_weight`) y restricciones por rol.
- **Motor de derechos**: `canPerformAction` (vote, propose, delegate, be_elected, quorum_excluded) con reglas configurables y `payment_to_vote_enabled` (moroso sin voto cuando la comunidad lo activa).
- LPCI: comité de vigilancia, términos de administración, moroso (avisos, restricciones).

### Tesorería
- Transacciones, categorías, presupuestos, estados financieros, obligaciones de pago, cobranza (vista Cuenta y cobro).
- **Modos** en reglas: `import` | `connector` | `fintech_rail` | `hybrid`; la UI los muestra y explica.
- **CLABE / referencia de pago**: configurables en reglas; si hay CLABE se muestra en Cuenta y cobro y en Mis Pagos (instrucciones SPEI). Sin integración real con IFPE aún.
- Ingestion (CSV/Excel), captura manual, fondos Mantenimiento/Reserva (LPCI).
- Contratos, recurrentes, planes de pago (servicios existen; planes de pago no están en el menú).

### Gobernanza
- Propuestas, votación ponderada, delegación líquida, avales.
- **Instrucción financiera** en propuestas: gasto, cambio de cuota, presupuesto, cambio de regla, etc.
- **Ejecución automática**: `executeProposal` ejecuta gasto, obligaciones, cambio de configuración; **cool-down** configurable antes de auto-ejecutar.
- Actas (minutes), firmas, asambleas, convocatorias (LPCI).

### Motor de reglas
- `getCommunityRules` / `updateCommunityRules`; gobernanza, tesorería e identidad configurables.
- Catálogo de reglas, presets por vertical, página de Reglamento.

### Censo
- **Censo por comunidad**: snapshots, métricas (miembros, ingresos, propuestas, buen standing).
- **Censo de plataforma** (“Red Civitas”): `get_platform_census` — comunidades, miembros, actividad agregada.
- Toma de snapshot manual; gráficas y tendencias.

### Otro
- **Verticals**: residential, religious, cooperative, manufacturing, other (config y tipos).
- **RLS**: Row-Level Security en Supabase; tests de penetración RLS existen (aunque el test actual no valida políticas).
- **Multi-tenant**: una instancia, comunidades aisladas por `community_id`.

---

## 2. Lo que falta (para cerrar la brecha con el whitepaper)

### Crítico para “Fase 2” del whitepaper
- **Rail Fintech real**
  - Integración con un IFPE (API): alta de CLABE por comunidad, webhooks de recepción SPEI, reconciliación automática obligación ↔ pago.
  - Hoy: solo configuración (CLABE, referencia) y registro manual de pago; la UI ya está preparada para cuando exista el webhook.
- **Transacciones “verificadas” vs “reportadas”**
  - El whitepaper distingue flujo verificado por el rail vs import/manual. En la app aún no hay flag ni filtro “verificado”; cuando el rail exista, habría que marcar origen (rail vs import) y mostrarlo en dashboard/tesorería.

### Importante pero no bloqueante
- **Federación**
  - Solo existen tipos en `federation/types.ts`; no hay UI ni flujos (unirse a federación, decisiones conjuntas, tesorería federada). Es coherente con el whitepaper (Fase 4+).
- **Censo “verificado”**
  - El whitepaper habla de actividad económica verificada por el rail. Hoy el censo usa datos de la base (transacciones, miembros); cuando exista SPEI real, se podría exponer “flujo verificado” en censo.
- **Revenue en producto**
  - Suscripción SaaS, comisión por transacción, productos financieros son modelo de negocio; no tienen por qué estar en la app aún (facturación puede ser externa al inicio).

### Mejoras deseables
- **RLS**
  - Revisar/endurecer políticas RLS y que los tests de penetración las validen de verdad.
- **Documentos**
  - Revisar si la página Documentos y el flujo de documentos están al nivel que quieres para el whitepaper (almacén, permisos, auditoría).
- **Planes de pago**
  - `PaymentPlanManager`, `ProposePaymentPlan`, `PaymentPlanDetail` no están enlazados en navegación; o se integran (p. ej. en Tesorería o en detalle de miembro moroso) o se dejan como “próximamente” y se documenta.

---

## 3. Lo que “sobra” (o está desconectado)

- **Planes de pago (payment plans)**
  - Lógica y UI existen pero no hay entrada en rutas ni menú. Opciones: añadir pestaña/sección en Tesorería o en Miembro, o marcar como “en desarrollo” y no exponer.
- **Gamificación (XP, rachas, badges)**
  - No está en el whitepaper; es una capa extra. Tiene sentido mantenerla si es parte de la estrategia de producto; si no, se puede ocultar o simplificar más adelante.
- **Otras piezas menores**
  - No hay bloques grandes “de más”; el resto (vigilancia, moroso, actas, asambleas) está alineado con LPCI y con el doc.

En resumen: **no sobra nada estructural**; solo conviene decidir si planes de pago y gamificación son parte del producto visible o no.

---

## 4. Checklist por fase (whitepaper)

| Fase whitepaper | Qué pide | Estado en app |
|-----------------|----------|----------------|
| **1. Validar** | Identidad + Tesorería (import) + Gobernanza; ejecución manual | Hecho: import, captura, propuestas, votación, ejecución manual/automática con cool-down. |
| **2. Integrar** | IFPE, CLABE, SPEI, reconciliación automática, pago condiciona voto, gobernanza ejecutable | Parcial: pago condiciona voto y gobernanza ejecutable están; falta integración real con IFPE y SPEI automático. |
| **3. Escalar** | Múltiples verticales, mismos motores | Hecho: verticales en configuración, reglas por comunidad. |
| **4. Federar** | Comunidades federadas, censo verificado | Censo sí (comunidad + plataforma); federación solo tipos, sin flujos. |
| **5. Network state** | Capa institucional, verificación on-chain, etc. | Fuera de alcance actual; coherente. |

---

## 5. Recomendaciones concretas

1. **Prioridad 1**  
   - Definir integración con un IFPE (o mock de webhook) para: alta de CLABE, notificación de pago SPEI, actualización de obligación y de `financial_standing`.  
   - Añadir en modelo de transacciones (o en lógica) “origen: rail | import” y reflejarlo en UI donde aplique.

2. **Prioridad 2**  
   - Integrar planes de pago en la UI (Tesorería o perfil de miembro) o documentarlos como “próximamente” y no exponerlos.  
   - Revisar RLS y tests de penetración para que den confianza real.

3. **Prioridad 3**  
   - Federación: mantener tipos; diseño de flujos y API cuando toque Fase 4.  
   - Censo “verificado”: cuando exista rail, añadir métricas basadas en flujo SPEI.

4. **Mensaje al usuario**  
   - En Cuenta y cobro / configuración ya se explica que el rail SPEI llegará con el socio IFPE; está bien. Opcional: en Settings o en un banner, aclarar “Hoy: importación y registro manual; SPEI automático en Fase 2”.

---

## 6. Resumen en una frase

Tienes el núcleo del whitepaper implementado (ciclo cerrado Identidad–Tesorería–Gobernanza, reglas, ejecución, censo, verticales); lo que falta para estar “100% alineado” es básicamente el **rail fintech real** y, más adelante, **Federación** y matices de censo/verificación. Nada importante sobra; solo conviene conectar o documentar planes de pago y decidir si la gamificación sigue visible.
