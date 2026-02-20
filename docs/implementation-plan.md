# Plan de implementación — Whitepaper, app y compliance

Plan único que recoge todo lo hecho (alineación whitepaper, documentación de brechas, compliance ley mexicana) y las tareas pendientes para cerrar brechas y mantener consistencia producto ↔ whitepaper ↔ ley.

---

## 1. Lo que ya está hecho (resumen)

### 1.1 Whitepaper web alineado al PDF v4
- **Archivo:** `src/pages/whitepaper/WhitepaperPage.tsx`
- Cinco primitivas: Identidad, Tesorería, Gobernanza, Censo, Federación.
- Sección 5: Alianza Fintech (IFPE), modos de tesorería (Import, Conector, Rail, Híbrido).
- Sección 10: Modelo de ingresos (SaaS, comisión, productos financieros).
- Sección 11: Estrategia de despliegue en 5 fases.
- Mercado ampliado, tabla de competencia (id `competitive`), riesgos y mitigaciones, seguridad, conclusión y referencias.

### 1.2 Documentación de brechas
- **`docs/whitepaper-v4-gap.md`** — Comparación PDF v4 vs web (ya cerrada con la actualización del WhitepaperPage).
- **`docs/whitepaper-to-app-gap.md`** — App vs whitepaper: qué está implementado, qué falta, qué “sobra”, checklist por fase, recomendaciones.
- **`docs/app-not-in-whitepaper.md`** — Todo lo que está en la app y no está explicado en el whitepaper (gamificación, documentos, entidades, auditoría, tareas de implementación, vigilancia, moroso, asambleas/poderes, avales, onboarding, vertical residencial, contratos/recurrentes, planes de pago, privacidad ARCO, **compliance ley mexicana**).
- **`docs/compliance-ley-mexicana.md`** — Referencia completa: LPCI CDMX (artículos y ubicación en código), LFPDPPP, Ley Fintech, Código de Comercio/NOM-151.

### 1.3 No implementado aún (pendiente del plan)
- Integración real o mock del rail IFPE y transacciones “verificadas” vs “reportadas”.
- Planes de pago visibles en la UI (ruta/menú).
- Revisión RLS y tests de penetración.
- Opcionales: frases en el whitepaper para compliance, documentos, entidades, etc.; ruta del vertical residencial; banner “Hoy: importación manual”.

---

## 2. Fases del plan de implementación

### Fase 0 — Documentación y mantenimiento (continuo)
**Objetivo:** Mantener los documentos de referencia actualizados y enlazados.

| ID | Tarea | Criterio de aceptación | Prioridad |
|----|-------|------------------------|-----------|
| D0.1 | Mantener `app-not-in-whitepaper.md` cuando se añadan features nuevas en la app. | Cada feature nueva se evalúa: ¿está en el whitepaper? Si no, se añade a la tabla resumen. | Media |
| D0.2 | Mantener `compliance-ley-mexicana.md` cuando se añadan artículos o flujos legales (LPCI, LFPDPPP, etc.). | Tabla ley → artículo → ubicación en código actualizada. | Media |
| D0.3 | En el README o en `docs/README.md`, enlazar los cuatro docs: whitepaper-v4-gap, whitepaper-to-app-gap, app-not-in-whitepaper, compliance-ley-mexicana. | Un solo lugar con índice de documentación de producto/brechas. | Baja |

---

### Fase 1 — Cerrar brechas de producto (app) — Prioridad alta

| ID | Tarea | Detalle | Criterio de aceptación | Dependencias |
|----|-------|---------|------------------------|--------------|
| **P1.1** | Integrar planes de pago en la UI | Los componentes `PaymentPlanManager`, `ProposePaymentPlan`, `PaymentPlanDetail` existen pero no tienen ruta ni entrada en menú. | Opción A: Añadir ruta `/treasury/payment-plans` o pestaña "Planes de pago" en Tesorería, o enlace desde detalle de miembro moroso. Opción B: Página "Próximamente" o ítem en menú que lleve a una vista explicativa y no exponga flujo a medias. | Ninguna |
| **P1.2** | Origen de transacciones: "verificado" vs "reportado" | El whitepaper distingue flujo verificado por el rail vs import/manual. Hoy no hay flag ni filtro en la app. | En el modelo (tabla `transactions` o lógica): campo o derivación `origin: 'rail' | 'import' | 'manual'`. En UI (Tesorería/dashboard): filtro o badge "Verificado" / "Reportado" donde se listen transacciones. Cuando exista el webhook IFPE, las entradas por rail deben marcarse como `rail`. | Preparatorio para P1.3 |
| **P1.3** | Integración IFPE (o mock de webhook) | Alta de CLABE por comunidad, notificación de pago SPEI, actualización de obligación y `financial_standing`. | Con mock: endpoint o job que simule notificación de pago; actualiza obligación y recalcula moroso. Con IFPE real: documentar contrato de API, webhook de recepción SPEI, reconciliación automática. | Producto/backend; puede hacerse mock primero |

**Orden sugerido:** P1.1 (rápido, solo UI) → P1.2 (modelo + UI) → P1.3 (cuando exista socio o se decida mock).

---

### Fase 2 — Seguridad y calidad

| ID | Tarea | Detalle | Criterio de aceptación | Dependencias |
|----|-------|---------|------------------------|--------------|
| **S2.1** | Revisar políticas RLS (Supabase) | Asegurar que todas las tablas sensibles (members, proposals, votes, transactions, etc.) tengan políticas por `community_id` y rol. | Lista de tablas y políticas documentada; sin acceso cross-community para usuarios normales. | Ninguna |
| **S2.2** | Tests de penetración RLS | El test en `src/test/rls-penetration.test.ts` debe validar políticas de verdad (lectura/escritura entre comunidades). | Tests que intenten acceder a datos de otra comunidad y esperen rechazo; CI en verde. | S2.1 |

---

### Fase 3 — Whitepaper: frases opcionales (alinear doc con producto)

Todas son **opcionales**. Añadir solo si se quiere que el whitepaper refleje explícitamente estas capacidades.

| ID | Tarea | Dónde en whitepaper (web) | Texto sugerido (resumen) |
|----|-------|----------------------------|---------------------------|
| W3.1 | Compliance y marcos legales | Nueva subsección corta (p. ej. después de Seguridad o en Mercado). | "Para mercados regulados como México, la plataforma soporta configuraciones alineadas a LPCI (condominios), LFPDPPP (datos personales) y operación con IFPE bajo Ley Fintech. Ver documentación de compliance." |
| W3.2 | Almacén de documentos | En primitiva Gobernanza o Tesorería. | "Almacén de documentos de la comunidad (actas, contratos, reglamentos) con categorías y retención configurable." |
| W3.3 | Partes relacionadas | En Tesorería o verticales. | "Registro de partes relacionadas (proveedores, contratistas) para contratos y desembolsos." |
| W3.4 | Tareas de implementación | En Gobernanza. | "Para decisiones que exigen pasos adicionales (no solo pago), el sistema permite tareas de implementación con responsable y seguimiento." |
| W3.5 | Auditoría para admins | En Seguridad y privacidad. | "Los administradores pueden consultar un registro de auditoría de acciones en la comunidad." |
| W3.6 | Asambleas, convocatorias, poderes | En Gobernanza. | "Soporte para asambleas presenciales o híbridas: convocatorias, registro de asistencia y poderes." |
| W3.7 | Privacidad ARCO | En Seguridad y privacidad. | "Cumplimiento de aviso de privacidad y derechos ARCO (México) donde aplica." |
| W3.8 | Onboarding | En Arquitectura o Despliegue. | "Los usuarios nuevos pueden crear una comunidad o unirse a una existente mediante un flujo guiado." |
| W3.9 | Contratos y recurrentes | En Tesorería. | "Contratos con planes de pago (parcialidades) y cobros o pagos recurrentes configurables." |

**Implementación:** Añadir en `WhitepaperPage.tsx` los párrafos o bullets correspondientes en las secciones ya existentes (por id o por título), sin cambiar la estructura general.

---

### Fase 4 — Producto y UX complementarios

| ID | Tarea | Detalle | Criterio de aceptación | Dependencias |
|----|-------|---------|------------------------|--------------|
| **U4.1** | Vertical residencial: ruta o documento | La página `ResidentialPage` (unidades, mantenimiento, áreas comunes) existe pero no hay ruta `/residential`. | Opción A: Añadir ruta `/residential` y enlace en menú para comunidades tipo `residential`. Opción B: Dejar sin ruta y documentar en `app-not-in-whitepaper.md` que está preparado para cuando se active el vertical. | Ninguna |
| **U4.2** | Mensaje "Hoy: importación y registro manual" | En Cuenta y cobro o Settings ya se explica el futuro rail IFPE. | Banner o texto breve en Tesorería o Settings: "Hoy: importación y registro manual; SPEI automático en Fase 2 con socio IFPE." | Ninguna |
| **U4.3** | Decisión gamificación | La gamificación (XP, rachas, badges) no está en el whitepaper. | Decisión explícita: mantener visible (y opcionalmente 1 línea en whitepaper) u ocultar/simplificar. Documentar en `app-not-in-whitepaper.md`. | Ninguna |

---

### Fase 5 — Federación y censo (futuro, Fase 4 del whitepaper)

| ID | Tarea | Detalle | Criterio de aceptación | Dependencias |
|----|-------|---------|------------------------|--------------|
| F5.1 | Federación | Solo existen tipos en `federation/types.ts`; no hay UI ni flujos. | Mantener tipos; diseño de flujos y API cuando se priorice Fase 4 (Federar). | Roadmap producto |
| F5.2 | Censo "verificado" | Cuando exista rail SPEI, métricas de flujo verificado. | En censo de comunidad o de plataforma, métricas o badge que distingan actividad económica verificada por rail. | P1.3 (IFPE) |

---

## 3. Orden de ejecución recomendado

1. **Inmediato (sin dependencias)**  
   - **P1.1** — Planes de pago en UI (ruta o “Próximamente”).  
   - **D0.3** — Índice de docs en README o `docs/README.md`.  
   - **U4.2** — Banner/texto "Hoy: importación manual; SPEI en Fase 2".

2. **Corto plazo**  
   - **P1.2** — Origen transacciones (verificado/reportado) en modelo + UI.  
   - **S2.1** y **S2.2** — RLS y tests de penetración.  
   - **U4.1** — Decidir ruta residencial o documentar.  
   - **U4.3** — Decisión gamificación.

3. **Cuando haya IFPE o se quiera mock**  
   - **P1.3** — Integración IFPE o mock de webhook.  
   - Asegurar que P1.2 marque correctamente origen `rail`.

4. **Opcional (cuando se quiera alinear más whitepaper y producto)**  
   - **W3.1–W3.9** — Frases en whitepaper según tabla Fase 3.  
   - **F5.1, F5.2** — Cuando toque Fase 4 del whitepaper.

---

## 4. Resumen por prioridad

| Prioridad | Tareas | Objetivo |
|-----------|--------|----------|
| **Alta** | P1.1, P1.2, P1.3, S2.1, S2.2 | Cerrar brechas app ↔ whitepaper (planes de pago, origen transacciones, IFPE) y dar confianza en seguridad (RLS). |
| **Media** | D0.1, D0.2, D0.3, U4.1, U4.2, U4.3 | Documentación al día, mensaje claro al usuario, decisión vertical residencial y gamificación. |
| **Baja / opcional** | W3.1–W3.9, F5.1, F5.2 | Whitepaper más explícito sobre compliance y capacidades; Federación y censo verificado en su fase. |

---

## 5. Documentos de referencia cruzada

| Documento | Propósito |
|-----------|-----------|
| `docs/whitepaper-v4-gap.md` | PDF v4 vs web (estado ya alineado). |
| `docs/whitepaper-to-app-gap.md` | App vs whitepaper: implementado, faltante, recomendaciones. |
| `docs/app-not-in-whitepaper.md` | Qué hay en la app que no está en el whitepaper (incl. compliance). |
| `docs/compliance-ley-mexicana.md` | Ley mexicana (LPCI, LFPDPPP, Fintech, Código/NOM) → artículos → código. |
| **`docs/implementation-plan.md`** (este archivo) | Plan único para implementar todo lo acordado. |

---

*Última actualización: Febrero 2026. Revisar este plan cuando se cierren fases o cambien prioridades de producto.*
