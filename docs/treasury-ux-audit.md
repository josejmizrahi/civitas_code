# Auditoría UX — Tesorería

Revisión de la página de Tesorería: pestañas, flujos, duplicación y mejoras posibles.

---

## 1. Resumen de lo que hay hoy

- **9 pestañas**: Dashboard, Cobranza, Recurrentes, Contratos, Obligaciones, Mis Pagos, Transacciones, Presupuestos, Estados Financieros.
- **Selector de fondo** (Mantenimiento / Reserva) arriba, que solo afecta a: Dashboard, Transacciones, Presupuestos y Estados Financieros.
- **Acciones globales**: Exportar PDF, Exportar Excel, Importar CSV/Excel, Captura Manual.

---

## 2. Qué no tiene sentido o está duplicado

### 2.1 Métricas de cobranza duplicadas

- **Dashboard** ya muestra: Ingresos, Egresos, Balance, **Por Cobrar**, **Tasa Cobro** (y en móvil son 5 cards).
- **Cobranza** muestra: Por Cobrar, Vencido, Cobrado, Tasa de Cobro (4 cards muy similares).

**Problema**: La misma información “por cobrar / tasa de cobro” aparece en dos sitios. Para un tesorero puede ser redundante; para un miembro, “Cobranza” con métricas globales no aporta mucho (él solo necesita “Mis Pagos”).

**Recomendación**:  
- Dejar en **Dashboard** el resumen ejecutivo (incl. por cobrar y tasa de cobro).  
- En **Cobranza** centrarse en: **cómo se cobra** (CLABE, instrucciones, modo SPEI) y, si se quiere, un enlace “Ver detalle en Obligaciones” en lugar de repetir las mismas cifras.

### 2.2 Cobranza vs Obligaciones vs Mis Pagos

- **Cobranza**: Modo tesorería, CLABE (solo admin), estadísticas de cobro, texto “Flujo de Cobranza” (manual vs SPEI).
- **Obligaciones**: Lista de obligaciones (admin): crear, filtrar, “Registrar Pago”.
- **Mis Pagos**: Vista del miembro: mis obligaciones, instrucciones de pago (CLABE + referencia), estado (moroso/pendiente/al corriente).

**Problemas**:
- El nombre **“Cobranza”** suena a “cobrar dinero”, que también es lo que hace un tesorero en **Obligaciones** (registrar pagos). La frontera no es obvia.
- Para **miembros**, la única pestaña que realmente necesitan es **Mis Pagos** (ver deudas y cómo pagar). Cobranza les muestra métricas globales (por cobrar, vencido, cobrado, tasa) que no les ayudan a “saber qué hacer”.

**Recomendación**:
- **Cobranza** renombrar o acotar a algo como **“Cuenta y cobro”** o **“Instrucciones de cobro”**: CLABE, instrucciones SPEI, modo actual y flujo (manual vs futuro SPEI). Quitar ahí el duplicado de métricas o dejarlas como “resumen” con enlace a Obligaciones.
- Dejar **Obligaciones** como la pestaña de gestión (crear obligaciones, registrar pagos).
- **Mis Pagos** como la única pestaña orientada al miembro (“qué debo, cómo pago”). Considerar ponerla más visible (por ejemplo segunda pestaña o destacada por rol).

### 2.3 Recurrentes vs Contratos

- **Recurrentes**: Cronogramas recurrentes (semanal, mensual, etc.) de tipo cobro o pago, con entidades/destinatarios.
- **Contratos**: Contratos con planes de pago (parcialidades), estados (borrador, activo, completado, etc.).

Son conceptos distintos (programación recurrente vs contratos con N cuotas), pero ambos son bastante “admin/tesorería” y los nombres no explican el propósito de cada uno.

**Recomendación**:
- Añadir **subtítulo o tooltip** en cada pestaña, por ejemplo:
  - **Recurrentes**: “Cobros o pagos que se repiten (ej. cuota mensual automática).”
  - **Contratos**: “Contratos con planes de pago y parcialidades (obra, arrendamiento, etc.).”
- Opcional: agrupar en un mismo bloque “Programación” (Recurrentes + Contratos) con sub-pestañas o acordeón si se quiere reducir ruido en la barra principal.

---

## 3. Mejoras concretas

### 3.1 Selector de fondo (Mantenimiento / Reserva)

- Solo aplica a 4 pestañas (Dashboard, Transacciones, Presupuestos, Estados Financieros). En el resto el selector no cambia nada.
- No se explica en la UI que “solo afecta a algunas vistas”.

**Recomendación**:
- Añadir una etiqueta corta, por ejemplo: **“Vista por fondo:”** o **“Fondo:”** junto al selector.
- Opcional: en pestañas donde el fondo no aplica (Cobranza, Recurrentes, Contratos, Obligaciones, Mis Pagos), mostrar un texto discreto: “Esta vista no filtra por fondo” o no mostrar el selector en esas pestañas y dejarlo solo donde sí aplica.

### 3.2 Orden y prioridad de pestañas

Orden actual: Dashboard → Cobranza → Recurrentes → Contratos → Obligaciones → Mis Pagos → Transacciones → Presupuestos → Estados Financieros.

**Recomendación**:
- **Para todos**: Mantener **Dashboard** primero.
- **Para miembros (sin rol tesorería)**: Dar mucha prominencia a **Mis Pagos** (segunda o con badge “Tus pagos”). El resto puede ir después o incluso ocultarse/colapsarse por rol.
- **Para tesorería/admin**: Orden lógico de flujo:
  1. Dashboard  
  2. Obligaciones (crear y registrar pagos — acción principal)  
  3. Cuenta / Cobranza (CLABE e instrucciones)  
  4. Recurrentes, Contratos  
  5. Transacciones, Presupuestos, Estados Financieros  

Así “qué hacer” (obligaciones y cobro) queda antes que “recurrentes/contratos” y que “datos e informes”.

### 3.3 Exportar PDF / Excel

- **PDF**: Exporta el contenido actual del `#treasury-content` (lo que se ve en la pestaña activa). Dependiendo de la pestaña, puede ser poco útil (ej. en Cobranza sale el texto de flujo).
- **Excel**: Siempre exporta **transacciones** (desde `useTransactions()`), no el contenido de la pestaña actual.

**Problema**: En “Presupuestos” o “Estados Financieros”, el usuario puede esperar que Excel exporte presupuestos o estados, no transacciones.

**Recomendación**:
- Etiquetar los botones de forma explícita, por ejemplo: **“PDF (vista actual)”** y **“Excel (transacciones)”**.
- O situar “Exportar Excel (transacciones)” cerca de la pestaña **Transacciones** (o dentro de ella), y dejar en el header solo “PDF (vista actual)” si se quiere simplificar.

### 3.4 Móvil: solo iconos en pestañas

- En `<sm` el texto de las pestañas está oculto (`hidden sm:inline`), solo se ven iconos.
- Con 9 pestañas, iconos como Banknote, RefreshCw, FileText, Receipt, User, CreditCard, PiggyBank, ClipboardList son difíciles de distinguir sin contexto.

**Recomendación**:
- Mostrar al menos la **primera palabra** o una abreviatura en móvil (ej. “Dashboard”, “Cobranza”, “Mis Pagos”, “Trans.”, “Presup.”, “Estados”).
- O usar un menú desplegable “Más secciones” en móvil y dejar visibles 3–4 pestañas principales (Dashboard, Mis Pagos, Obligaciones, Transacciones).

### 3.5 Guía de “qué hacer”

- No hay un flujo guiado para un tesorero nuevo (ej. “Configura categorías → Crea obligaciones → Registra pagos”).
- El card “Flujo de Cobranza” en Cobranza ayuda, pero está enterrado en una pestaña que suena genérica.

**Recomendación**:
- En **Dashboard**, si no hay obligaciones (o no hay transacciones), mostrar un empty state con acciones claras: “Crear primera obligación”, “Importar datos”, “Captura manual”.
- En **Obligaciones**, empty state: “No hay obligaciones. Crear obligación o importar desde Ingestion.”
- Opcional: una sección corta “Primeros pasos” (solo para canManageTreasury) en Dashboard o Cobranza con 3–4 pasos y enlaces a cada pestaña.

---

## 4. Funcionalidad no enlazada (plan de pagos)

- **PaymentPlanManager**, **ProposePaymentPlan** y **PaymentPlanDetail** no se usan en ninguna ruta ni página.
- Los hooks de payment plans sí existen y tienen lógica; la UI está implementada pero no hay entrada desde Tesorería ni desde Miembros.

**Recomendación**:
- Si los planes de pago son parte del producto: integrarlos, por ejemplo:
  - En **Obligaciones**: pestaña o sección “Planes de pago” que use `PaymentPlanManager`, y desde detalle de miembro (moroso) usar `ProposePaymentPlan` / `PaymentPlanDetail`.
- Si no se usan aún: documentar como “Próximamente” o mover a una feature flag para no confundir con “pestañas que no llevan a nada”.

---

## 5. Checklist de cambios sugeridos

| Prioridad | Cambio |
|-----------|--------|
| Alta | Quitar o reducir métricas duplicadas entre Dashboard y Cobranza; Cobranza = cuenta + instrucciones de cobro. |
| Alta | Aclarar en UI qué exporta PDF (vista actual) y Excel (solo transacciones). |
| Media | Reordenar pestañas: Dashboard → Obligaciones → Cobranza/Cuenta → …; destacar Mis Pagos para miembros. |
| Media | Etiquetar selector de fondo (“Vista por fondo”) y/o mostrarlo solo en pestañas donde aplica. |
| Media | Añadir descripciones cortas a Recurrentes y Contratos (tooltip o subtítulo). |
| Baja | En móvil, mostrar al menos una palabra por pestaña o agrupar en “Más secciones”. |
| Baja | Empty states en Dashboard y Obligaciones con acciones claras (crear obligación, importar, etc.). |
| Baja | Integrar o documentar PaymentPlanManager / ProposePaymentPlan / PaymentPlanDetail. |

---

## 6. Resumen en una frase

**Problemas principales**: demasiadas pestañas sin jerarquía clara, métricas de cobranza duplicadas entre Dashboard y Cobranza, nombres que no diferencian bien “cuenta/instrucciones” vs “gestión de obligaciones” vs “mis pagos”, y exportación PDF/Excel poco clara. **Mejora rápida**: unificar resumen de cobro en Dashboard, convertir Cobranza en “Cuenta e instrucciones”, reordenar pestañas y etiquetar bien los botones de exportación.
