# Civitas OS — Rediseño desde cero

**Fecha:** Febrero 2026
**Visión:** Cada comunidad es un país virtual. La plataforma es el sistema operativo para fundarlo, gobernarlo y conectarlo con otros.

---

## 0. Diagnóstico honesto del estado actual

### Qué funciona bien (rescatable)
- **Stack tecnológico** (React 19 + Vite + Supabase + TanStack Query) — moderno, ligero, correcto
- **Multi-tenancy con RLS** — aislamiento por `community_id` bien implementado
- **Estructura modular** (`core/identity`, `core/treasury`, `core/governance`) — buena separación
- **Rules Engine** ("Social Smart Contract") — concepto sólido, solo necesita desacoplar de ley mexicana
- **Fintech abstraction** (`fintech.service.ts`) — ya provider-agnostic después de 3 refactors
- **62 migraciones SQL** — mucho schema real que funciona

### Qué está mal (raíz del desorden)
| Problema | Impacto |
|----------|---------|
| **Construido de lo específico a lo general** | Se empezó como app de condominios en CDMX y se intentó generalizar después. Debió ser al revés. |
| **Los primitivos no se hablan entre sí** | Identity, Treasury y Governance son módulos aislados. No hay un bus de eventos ni contratos claros entre ellos. El "standing determina derechos" es un if suelto, no una arquitectura. |
| **Inestabilidad fintech** (Broxel → IFPE → Fintoc) | 3 proveedores en 62 migraciones. Falta un puerto/adaptador limpio que sobreviva al siguiente cambio. |
| **CommunityType demasiado estrecho** | Solo 5 tipos hardcodeados. Falta: club, escuela, ONG, asociación civil. Y los tipos no cambian comportamiento real. |
| **Federation es un placeholder vacío** | Solo un `interface` con 3 campos. No hay modelo de inter-comunidad. |
| **UX de administrador, no de ciudadano** | La app se siente como un ERP. No como fundar un país. |
| **Compliance acoplado a LPCI CDMX** | Los defaults y nombres asumen ley de propiedad en condominio. Un club deportivo no tiene "morosos" ni "fondo de reserva". |
| **58K líneas, 330 archivos, demasiados docs de "planes"** | Señal de scope creep sin delivery. |

### Veredicto
**No hay que tirar todo.** El 60% del código (auth, RLS, queries, componentes UI básicos) es rescatable. Lo que hay que rehacer es la **arquitectura conceptual**: cómo se definen los primitivos, cómo interactúan, y cómo escalan a cualquier tipo de comunidad.

---

## 1. La metáfora: Network State OS

Basado en *The Network State* de Balaji Srinivasan, cada comunidad progresa por etapas:

```
Startup Society → Network Archipelago → Network State
(1 comunidad)     (federación)           (reconocimiento)
```

En Civitas, la progresión del usuario es:

```
Fundar → Poblar → Gobernar → Prosperar → Federar
```

### Los 5 Primitivos (capas acumulativas)

Cada primitivo es una capa que se activa sobre la anterior. No todos son obligatorios — una comunidad puede empezar solo con Identity y agregar capas conforme crece.

```
┌─────────────────────────────────────────────┐
│  5. FEDERATION (Federación)                 │  ← Conectar con otros
│     Tratados, identidad compartida,         │
│     gobernanza inter-comunidad              │
├─────────────────────────────────────────────┤
│  4. COMMERCE (Comercio)                     │  ← Mover dinero
│     Fintech rail, pagos, dispersiones,      │
│     marketplace de servicios                │
├─────────────────────────────────────────────┤
│  3. GOVERNANCE (Gobierno)                   │  ← Decidir juntos
│     Propuestas, votación, asambleas,        │
│     constitución, delegación                │
├─────────────────────────────────────────────┤
│  2. TREASURY (Hacienda)                     │  ← Administrar recursos
│     Contribuciones, presupuestos,           │
│     obligaciones, reportes                  │
├─────────────────────────────────────────────┤
│  1. IDENTITY (Ciudadanía)                   │  ← Saber quiénes somos
│     Registro, roles, verificación,          │
│     directorio, standing                    │
└─────────────────────────────────────────────┘
```

**Regla fundamental:** Cada primitivo de arriba DEPENDE de los de abajo, nunca al revés.
- Treasury lee Identity (quién debe qué) pero Identity NO lee Treasury
- Governance lee Identity (quién puede votar) y Treasury (standing financiero)
- Commerce lee Governance (autorizaciones) y Treasury (cuentas)
- Federation lee todos los demás

### El bus de eventos: cómo se hablan los primitivos

En lugar de imports directos entre módulos, los primitivos se comunican por **eventos de dominio**:

```
Identity emite:
  → member.joined
  → member.role_changed
  → member.standing_changed    ← Treasury lo escucha para actualizar derechos
  → member.deactivated

Treasury emite:
  → obligation.created
  → obligation.paid
  → obligation.overdue         ← Identity lo escucha para cambiar standing
  → payment.received
  → budget.exceeded            ← Governance lo escucha para alertar vigilancia

Governance emite:
  → proposal.approved
  → proposal.executed          ← Treasury lo escucha para ejecutar instrucción financiera
  → election.completed         ← Identity lo escucha para cambiar roles
  → rule.changed               ← Todos lo escuchan para recargar config

Commerce emite:
  → payment.reconciled         ← Treasury lo escucha para registrar transacción
  → transfer.completed
  → checkout.completed

Federation emite:
  → treaty.established
  → member.passport_verified   ← Identity lo escucha para marcar verificación cruzada
```

**Implementación:** Supabase Realtime + un `EventBus` en frontend que escucha canales por `community_id`. En backend, triggers de Postgres que insertan en una tabla `domain_events` y notifican via `pg_notify`.

---

## 2. Tipos de comunidad (verticals como configuración, no como código)

### Principio: Un vertical NO es código diferente. Es un preset de configuración.

La diferencia entre un condominio y un club deportivo no está en el código sino en:
- Las **etiquetas** (miembro vs vecino vs feligrés)
- Las **categorías financieras** default
- Las **reglas de gobernanza** default
- El **marco legal** aplicable
- Los **módulos activados**

### Tipos soportados

| Tipo | Etiqueta miembro | Marco legal (MX) | Módulos extra |
|------|-----------------|-------------------|---------------|
| `residential` | Vecino/Condómino | LPCI CDMX, Código Civil | Unidades, Áreas comunes, Mantenimiento |
| `association` | Asociado | Código Civil (A.C.) | Membresías, Cuotas |
| `club` | Socio | Código Civil, Estatutos | Reservaciones, Eventos |
| `school` | Padre de familia / Alumno | Ley General de Educación, SEP | Inscripciones, Ciclo escolar |
| `religious` | Feligrés / Miembro | LARCP, SAT (donataria) | Diezmos, Eventos litúrgicos |
| `ngo` | Miembro / Voluntario | CLUNI, Ley de Fomento | Proyectos, Donantes, Reportes CLUNI |
| `cooperative` | Cooperativista | LGSC | Aportaciones, Certificados |
| `custom` | (configurable) | (configurable) | (configurable) |

### Estructura de un preset

```typescript
interface CommunityPreset {
  type: CommunityType
  labels: {
    member: string        // "Vecino" | "Socio" | "Feligrés"
    contribution: string  // "Cuota" | "Membresía" | "Diezmo"
    entity: string        // "Proveedor" | "Colaborador"
    leader: string        // "Administrador" | "Presidente" | "Pastor"
  }
  defaultRules: CommunityRules
  defaultCategories: CategoryPreset[]
  legalFramework: LegalFramework
  enabledModules: ModuleId[]
  onboardingSteps: OnboardingStep[]  // qué pasos del wizard mostrar
}
```

---

## 3. Arquitectura técnica

### 3.1 Estructura de carpetas (nueva)

```
src/
├── app/                          # Bootstrap, router, providers
│   ├── router.tsx                # Rutas (simplificado)
│   ├── providers/
│   │   ├── AuthProvider.tsx
│   │   ├── TenantProvider.tsx    # community + config + labels
│   │   └── EventBusProvider.tsx  # bus de eventos entre primitivos
│   └── App.tsx
│
├── primitives/                   # LOS 5 PRIMITIVOS (core del sistema)
│   ├── identity/
│   │   ├── services/             # identity.service.ts, invitation.service.ts
│   │   ├── hooks/                # useMembers, useCurrentMember, useStanding
│   │   ├── components/           # MemberDirectory, MemberProfile, InviteDialog
│   │   ├── events.ts             # Eventos que emite Identity
│   │   ├── listeners.ts          # Eventos de otros primitivos que escucha
│   │   └── types.ts
│   │
│   ├── treasury/
│   │   ├── services/             # treasury.service.ts, obligations.service.ts
│   │   ├── hooks/                # useTransactions, useBudgets, useObligations
│   │   ├── components/           # Dashboard, TransactionList, BudgetOverview
│   │   ├── events.ts
│   │   ├── listeners.ts
│   │   └── types.ts
│   │
│   ├── governance/
│   │   ├── services/             # proposals.service.ts, voting.service.ts, assemblies.service.ts
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── events.ts
│   │   ├── listeners.ts
│   │   └── types.ts
│   │
│   ├── commerce/                 # TODA la integración fintech vive aquí
│   │   ├── ports/                # INTERFACES (contratos)
│   │   │   ├── PaymentGateway.ts     # interface: createCheckout, getStatus
│   │   │   ├── TransferProvider.ts   # interface: sendTransfer, getBalance
│   │   │   └── ReconciliationEngine.ts
│   │   ├── adapters/             # IMPLEMENTACIONES por proveedor
│   │   │   ├── fintoc/           # FintocGateway, FintocTransferProvider
│   │   │   ├── stripe/           # (futuro)
│   │   │   └── manual/           # ManualPaymentGateway (para comunidades sin fintech)
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── events.ts
│   │   ├── listeners.ts
│   │   └── types.ts
│   │
│   └── federation/
│       ├── services/             # treaties.service.ts, passport.service.ts
│       ├── hooks/
│       ├── components/
│       ├── events.ts
│       ├── listeners.ts
│       └── types.ts
│
├── modules/                      # MÓDULOS OPCIONALES (no son primitivos)
│   ├── documents/
│   ├── announcements/
│   ├── calendar/
│   ├── census/
│   ├── gamification/
│   └── residential/             # módulo vertical-específico
│       ├── units/
│       ├── common-areas/
│       └── maintenance/
│
├── engine/                       # MOTOR TRANSVERSAL
│   ├── rules/                    # Rules engine, presets, validation
│   │   ├── engine.ts             # evaluateRule, canPerformAction
│   │   ├── presets/              # residential.ts, club.ts, ngo.ts...
│   │   └── types.ts
│   ├── events/                   # EventBus implementation
│   │   ├── bus.ts
│   │   ├── types.ts
│   │   └── supabase-channel.ts   # Realtime integration
│   ├── compliance/               # Marco legal por jurisdicción
│   │   ├── mx/                   # México
│   │   │   ├── lpci.ts           # Ley Propiedad en Condominio
│   │   │   ├── lgsc.ts           # Ley General Soc. Cooperativas
│   │   │   ├── ac.ts             # Asociaciones Civiles
│   │   │   ├── larcp.ts          # Asoc. Religiosas
│   │   │   └── ley-fintech.ts    # Regulación fintech
│   │   └── types.ts
│   ├── audit/                    # Audit trail
│   ├── notifications/            # Email, push, in-app
│   └── i18n/
│
├── ui/                           # COMPONENTES UI COMPARTIDOS
│   ├── primitives/               # Button, Input, Card, Dialog (design system)
│   ├── layouts/                  # AppLayout, AuthLayout, OnboardingLayout
│   ├── patterns/                 # DataTable, EmptyState, StatsCard
│   └── theme/
│
├── pages/                        # PÁGINAS (composición de primitivos)
│   ├── public/                   # Landing, Whitepaper
│   ├── auth/                     # Login, Register, Reset
│   ├── onboarding/               # Wizard de fundación
│   ├── home/                     # Dashboard (compose Identity + Treasury + Governance)
│   ├── nation/                   # Vista "mi país" — ciudadanos, constitución
│   └── federation/               # Vista inter-comunidad
│
└── lib/                          # UTILIDADES PURAS
    ├── supabase.ts
    ├── errors.ts
    ├── utils.ts
    └── constants.ts
```

### 3.2 El puerto/adaptador fintech (clave para el socio)

El problema #1 que describes es la integración con el socio fintech. La solución es **Ports & Adapters**:

```typescript
// primitives/commerce/ports/PaymentGateway.ts
// ESTE ARCHIVO NO CAMBIA NUNCA — es el contrato

export interface PaymentGateway {
  /** Crear sesión de pago (checkout link o widget) */
  createCheckout(params: CheckoutParams): Promise<CheckoutSession>

  /** Consultar estado de un pago */
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>

  /** Webhook: procesar evento del proveedor */
  processWebhook(payload: unknown, signature: string): Promise<WebhookResult>

  /** Reconciliar pago contra obligación */
  reconcile(event: PaymentEvent, obligationId?: string): Promise<ReconciliationResult>
}

export interface TransferProvider {
  /** Enviar transferencia (SPEI, wire, etc.) */
  sendTransfer(params: TransferParams): Promise<TransferResult>

  /** Consultar saldo disponible */
  getBalance(): Promise<BalanceInfo>

  /** Listar movimientos */
  listMovements(filters: MovementFilters): Promise<Movement[]>
}

export interface KybProvider {
  /** Iniciar proceso KYB para una comunidad */
  startOnboarding(community: CommunityInfo): Promise<KybApplication>

  /** Consultar estado del KYB */
  getStatus(applicationId: string): Promise<KybStatus>
}
```

```typescript
// primitives/commerce/adapters/fintoc/FintocGateway.ts
// ESTE ARCHIVO SÍ CAMBIA si cambias de proveedor

import type { PaymentGateway, CheckoutParams, CheckoutSession } from '../../ports/PaymentGateway'

export class FintocGateway implements PaymentGateway {
  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    // Lógica específica de Fintoc
    const response = await supabase.functions.invoke('fintoc-checkout', {
      body: { amount: params.amount, metadata: params.metadata }
    })
    return mapFintocToCheckoutSession(response)
  }
  // ...
}
```

```typescript
// primitives/commerce/adapters/manual/ManualGateway.ts
// Para comunidades que aún no tienen fintech

export class ManualGateway implements PaymentGateway {
  async createCheckout(params: CheckoutParams): Promise<CheckoutSession> {
    // Genera una referencia de pago manual + instrucciones bancarias
    return { type: 'manual', reference: generateReference(), instructions: '...' }
  }
  // ...
}
```

**Cambiar de proveedor fintech = crear un nuevo adapter. Cero cambios en el resto del sistema.**

### 3.3 Flujo de interacción entre primitivos (ejemplo real)

**Escenario: Un miembro paga su cuota mensual via SPEI**

```
                    COMMERCE                    TREASURY                 IDENTITY
                    ────────                    ────────                 ────────
Fintoc webhook ──→ processWebhook()
                    │
                    ├─ Valida firma
                    ├─ Matchea por CLABE/ref
                    │
                    emit: payment.received ──→  onPaymentReceived()
                                                │
                                                ├─ Crea transaction
                                                ├─ Marca obligación paid
                                                │
                                                emit: obligation.paid ──→ onObligationPaid()
                                                                          │
                                                                          ├─ Recalcula standing
                                                                          ├─ Si era moroso → good
                                                                          │
                                                                          emit: standing.changed
                                                                               │
                                               ┌─────────────────────────────────┘
                                               ↓
                                          GOVERNANCE
                                          ──────────
                                          onStandingChanged()
                                          │
                                          ├─ Restaura derecho a voto
                                          └─ Log en audit trail
```

**Todo esto sin que Commerce importe Treasury, ni Treasury importe Identity.** Se comunican por eventos.

---

## 4. UX: Fundar un país virtual

### 4.1 Onboarding = Declaración de Independencia

El wizard de creación NO es un formulario aburrido. Es **fundar tu nación**:

```
Paso 1: "¿Qué tipo de nación estás fundando?"
        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ 🏘️       │ │ ⚽        │ │ 🏫       │ │ ⛪        │
        │Residencia│ │  Club    │ │ Escuela  │ │ Iglesia  │
        └──────────┘ └──────────┘ └──────────┘ └──────────┘
        ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ 🤝       │ │ 🏭       │ │ 🌍       │ │ ⚙️       │
        │Asociación│ │Cooperat. │ │   ONG    │ │ Custom   │
        └──────────┘ └──────────┘ └──────────┘ └──────────┘

Paso 2: "Nombra tu nación"
        Nombre, slug (/c/mi-nacion), logo, descripción, ubicación

Paso 3: "Define tu ciudadanía"
        Tipos de miembro, roles, atributos custom, peso de voto

Paso 4: "Establece tu economía"
        Moneda, categorías financieras, contribuciones iniciales
        "¿Quieres conectar con un socio financiero?" → KYB flow

Paso 5: "Escribe tu constitución"
        Reglas de gobernanza (presets por tipo con opción de editar)
        Quórums, mayorías, delegación, periodos

Paso 6: "Firma la declaración"
        Resumen visual tipo "acta constitutiva"
        Botón: "Fundar [nombre]"
```

### 4.2 Navegación = Gobernar tu país

**Sidebar simplificado (5 secciones):**

```
🏛️ Mi Nación          ← Dashboard: salud general del país
   ├── Panorama        ← Stats, alertas, actividad reciente
   └── Anuncios        ← Comunicados oficiales

👥 Ciudadanía          ← Primitivo 1: Identity
   ├── Directorio      ← Todos los miembros
   ├── Invitar         ← Invitaciones
   └── Mi perfil       ← Mi cuenta en esta comunidad

💰 Hacienda            ← Primitivo 2: Treasury
   ├── Finanzas        ← Dashboard financiero
   ├── Mis pagos       ← Estado de cuenta personal
   ├── Presupuestos    ← Planeación
   └── Cobranza        ← Obligaciones, morosos

🏛️ Gobierno            ← Primitivo 3: Governance
   ├── Propuestas      ← Ciclo legislativo
   ├── Asambleas       ← Reuniones formales
   ├── Constitución    ← Reglas vigentes
   └── Vigilancia      ← Comité (si aplica por rol)

⚙️ Configuración       ← Admin only
   ├── General
   ├── Fintech         ← Primitivo 4: Commerce (setup)
   ├── Auditoría
   └── Documentos
```

### 4.3 Dashboard = Estado de la Nación

El dashboard NO es una tabla de números. Es un **reporte del estado de la nación**:

```
┌─────────────────────────────────────────────────────────┐
│  🏛️ Estado de la Nación: [Nombre Comunidad]             │
│  "Tu comunidad está saludable"  |  ██████████░░ 83%     │
├─────────────────┬───────────────┬───────────────────────┤
│ 👥 Ciudadanos   │ 💰 Hacienda   │ 🏛️ Gobierno           │
│ 127 activos     │ $284,500 MXN  │ 3 propuestas activas │
│ 4 nuevos        │ 92% cobranza  │ 1 asamblea próxima   │
│ 2 morosos       │ 8 pendientes  │ Quórum: 67%          │
├─────────────────┴───────────────┴───────────────────────┤
│ 📋 Actividad reciente                                   │
│ • María pagó cuota de febrero          hace 2h         │
│ • Propuesta "Pintura fachada" aprobada hace 1d         │
│ • Juan se unió a la comunidad          hace 3d         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Compliance: legal por tipo de entidad

### Principio: La ley NO se hardcodea. Se configura por jurisdicción + tipo.

```typescript
// engine/compliance/types.ts

interface LegalFramework {
  jurisdiction: 'mx' | 'us' | 'co' | 'ar' | 'es' // extensible
  entityType: EntityLegalType
  applicableLaws: Law[]
  requiredRules: RequiredRule[]     // reglas que la ley OBLIGA
  defaultValues: Partial<CommunityRules>  // valores que sugiere la ley
  warnings: ComplianceWarning[]    // alertas si la config viola la ley
}

// México
type MxEntityLegalType =
  | 'condominio'       // LPCI CDMX / estatal
  | 'ac'               // Asociación Civil — Código Civil
  | 'sc'               // Sociedad Cooperativa — LGSC
  | 'ar'               // Asociación Religiosa — LARCP
  | 'abp'              // Asoc. de Beneficencia Privada
  | 'donataria'        // Donataria autorizada SAT
  | 'informal'         // Sin personalidad jurídica (club, grupo)
```

```typescript
// engine/compliance/mx/condominio.ts

export const condominioFramework: LegalFramework = {
  jurisdiction: 'mx',
  entityType: 'condominio',
  applicableLaws: [
    { id: 'lpci_cdmx', name: 'Ley de Propiedad en Condominio de Inmuebles CDMX' },
    { id: 'cc_cdmx', name: 'Código Civil CDMX' },
  ],
  requiredRules: [
    {
      rule: 'governance.quorum_first_call',
      constraint: { min: 0.75 },
      reference: 'LPCI Art. 33',
      description: 'Quórum mínimo de 75% del indiviso en primera convocatoria',
    },
    {
      rule: 'governance.quarterly_assembly_required',
      constraint: { equals: true },
      reference: 'LPCI Art. 31',
      description: 'Asambleas ordinarias trimestrales obligatorias',
    },
    {
      rule: 'identity.moroso_threshold_ordinary',
      constraint: { max: 2 },
      reference: 'LPCI Art. 2',
      description: 'Moroso después de 2 cuotas ordinarias vencidas',
    },
    {
      rule: 'treasury.reserva_fund_percentage',
      constraint: { min: 0 },
      reference: 'LPCI Art. 57-58',
      description: 'Fondo de reserva separado',
    },
  ],
  defaultValues: {
    // todos los defaults de LPCI que ya tienes en rules.ts
  },
  warnings: [
    {
      condition: (rules) => rules.governance.quorum_first_call < 0.75,
      message: 'LPCI Art. 33 requiere quórum mínimo de 75% en primera convocatoria',
      severity: 'error', // no permite guardar
    },
  ],
}
```

```typescript
// engine/compliance/mx/ac.ts — Asociación Civil

export const acFramework: LegalFramework = {
  jurisdiction: 'mx',
  entityType: 'ac',
  applicableLaws: [
    { id: 'cc_federal', name: 'Código Civil Federal, Art. 2670-2687' },
  ],
  requiredRules: [
    {
      rule: 'governance.default_majority',
      constraint: { min: 0.5 },
      reference: 'CC Art. 2678',
      description: 'Mayoría de miembros presentes para resoluciones',
    },
  ],
  // Una AC tiene más libertad que un condominio — menos restricciones
  defaultValues: {
    governance: {
      quorum_first_call: 0.5,
      quarterly_assembly_required: false, // anual es suficiente
    },
    identity: {
      moroso_threshold_ordinary: 3, // más flexible
      admin_max_consecutive_terms: 0, // según estatutos, no ley
    },
    treasury: {
      reserva_fund_percentage: 0, // no obligatorio
    },
  },
}
```

**Resultado:** En el onboarding, cuando seleccionas tipo de comunidad:
1. Se carga el `LegalFramework` correspondiente
2. Los defaults se aplican automáticamente
3. Si el admin cambia una regla que viola la ley, aparece un warning en tiempo real
4. Todo queda documentado y auditable

---

## 6. Federation: el camino a la Federación

### Modelo progresivo

```
Nivel 1: DESCUBRIMIENTO
  - Directorio público de comunidades
  - Perfil público: nombre, tipo, # miembros, ubicación
  - Búsqueda y filtros

Nivel 2: PASAPORTE (identidad cruzada)
  - Un miembro puede "vincular" su membresía en múltiples comunidades
  - "Pasaporte Civitas": perfil verificado que viaja entre comunidades
  - Reputación acumulada (standing en cada comunidad)

Nivel 3: TRATADOS (acuerdos bilaterales)
  - Dos comunidades firman un tratado (propuesta + votación en ambas)
  - Tipos de tratado:
    • Reconocimiento mutuo de standing
    • Descuento cruzado en servicios
    • Proveedor compartido
    • Gobernanza compartida en tema específico

Nivel 4: FEDERACIÓN (gobernanza compartida)
  - N comunidades forman una federación
  - Consejo federal: delegados de cada comunidad
  - Presupuesto federal (contribuciones de cada comunidad)
  - Propuestas federales (votan delegados o todos)
  - Ejemplo: 5 condominios de una colonia forman federación
    para negociar seguridad privada juntos
```

### Schema de base de datos (Federation)

```sql
-- Federaciones
CREATE TABLE federations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  rules JSONB DEFAULT '{}', -- reglas de la federación
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Membresía de comunidades en federaciones
CREATE TABLE federation_members (
  federation_id UUID REFERENCES federations(id),
  community_id UUID REFERENCES communities(id),
  status TEXT DEFAULT 'pending', -- pending, active, suspended
  joined_at TIMESTAMPTZ DEFAULT now(),
  delegate_member_id UUID REFERENCES members(id), -- representante
  voting_weight NUMERIC DEFAULT 1,
  PRIMARY KEY (federation_id, community_id)
);

-- Tratados bilaterales
CREATE TABLE treaties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_a UUID REFERENCES communities(id),
  community_b UUID REFERENCES communities(id),
  type TEXT NOT NULL, -- mutual_recognition, shared_vendor, etc.
  terms JSONB NOT NULL,
  status TEXT DEFAULT 'proposed', -- proposed, active, expired
  proposal_a UUID REFERENCES proposals(id), -- propuesta que lo aprobó en A
  proposal_b UUID REFERENCES proposals(id), -- propuesta que lo aprobó en B
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pasaporte (identidad cross-community)
CREATE TABLE passports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  verification_level TEXT DEFAULT 'basic', -- basic, verified, trusted
  reputation_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE passport_memberships (
  passport_id UUID REFERENCES passports(id),
  member_id UUID REFERENCES members(id),
  community_id UUID REFERENCES communities(id),
  standing TEXT, -- cached from member
  PRIMARY KEY (passport_id, community_id)
);
```

---

## 7. Plan de ejecución: no tirar, refactorizar

### Fase 0: Foundation (1-2 semanas)
**Objetivo:** Establecer la nueva estructura sin romper nada.

- [ ] Crear `engine/events/bus.ts` — EventBus simple (pub/sub)
- [ ] Crear `engine/rules/presets/` — Un preset por tipo de comunidad
- [ ] Crear `engine/compliance/` — Legal frameworks por tipo
- [ ] Crear `primitives/commerce/ports/` — Interfaces del socio fintech
- [ ] Mover `core/fintech/` → `primitives/commerce/adapters/fintoc/`
- [ ] Crear `app/providers/TenantProvider.tsx` (fusionar CommunityProvider + config)

### Fase 1: Identity + Commerce rewire (2-3 semanas)
**Objetivo:** Que el primitivo 1 (Identity) y el 4 (Commerce) funcionen limpios.

- [ ] Refactorizar `core/identity/` → `primitives/identity/` con events
- [ ] Refactorizar `core/treasury/` → `primitives/treasury/` con events
- [ ] Implementar `commerce/adapters/fintoc/` contra las interfaces port
- [ ] Implementar `commerce/adapters/manual/` para comunidades sin fintech
- [ ] Conectar Commerce → Treasury via eventos (pago recibido → transacción)
- [ ] Conectar Treasury → Identity via eventos (obligación pagada → standing)

### Fase 2: Governance + Onboarding (2-3 semanas)
**Objetivo:** Que la gobernanza lea Identity y Treasury correctamente. Nuevo onboarding.

- [ ] Refactorizar `core/governance/` → `primitives/governance/` con events
- [ ] `canPerformAction()` usando rules engine + standing + role
- [ ] Nuevo onboarding wizard (6 pasos, metáfora "fundar nación")
- [ ] Presets por tipo de comunidad con compliance warnings
- [ ] Ampliar `CommunityType` a 8 tipos

### Fase 3: UX overhaul (2 semanas)
**Objetivo:** Que se sienta como gobernar un país, no como un ERP.

- [ ] Nuevo dashboard "Estado de la Nación"
- [ ] Sidebar simplificado (5 bloques)
- [ ] Labels dinámicos por tipo de comunidad (vecino/socio/feligrés)
- [ ] Limpiar páginas redundantes

### Fase 4: Federation MVP (2-3 semanas)
**Objetivo:** Que dos comunidades puedan conectarse.

- [ ] Migraciones: federations, treaties, passports
- [ ] Directorio público de comunidades
- [ ] Pasaporte Civitas (identidad cross-community)
- [ ] Tratados bilaterales (propuesta + votación en ambas)

### Fase 5: Polish + Legal (1-2 semanas)
- [ ] Compliance warnings en tiempo real por tipo de entidad
- [ ] Notificaciones para todos los eventos del bus
- [ ] Tests: RLS, permisos, integración entre primitivos

---

## 8. Decisiones técnicas clave

| Decisión | Elección | Razón |
|----------|----------|-------|
| Bus de eventos | Supabase Realtime + tabla `domain_events` | Ya tenemos Supabase, no agregar Kafka/Redis |
| Fintech | Ports & Adapters | Sobrevivir al siguiente cambio de proveedor |
| Verticals | Configuración, no código | 1 codebase para todos los tipos |
| Compliance | Framework por jurisdicción + tipo | Extensible sin reescribir |
| State management | TanStack Query (mantener) | Funciona bien, no cambiar |
| Router | Mantener slug-based `/c/:slug/` | Ya funciona, buena URL |
| DB | Mantener Supabase + RLS | Ya está, funciona, no migrar |
| CSS | Mantener Tailwind 4 | Ya está, funciona |
| Testing | Vitest + Playwright (mantener) | Ya está configurado |

**Lo que NO se toca:** Auth flow, Supabase client, RLS policies, edge functions existentes, componentes UI base.

**Lo que SÍ se mueve:** Estructura de carpetas (core → primitives), acoplamiento entre módulos (imports directos → eventos), rules engine (desacoplar de LPCI), community types (ampliar).

---

## 9. Métricas de éxito

- [ ] Un club deportivo puede hacer onboarding sin ver nada de "morosos" o "fondo de reserva"
- [ ] Cambiar de Fintoc a otro proveedor requiere solo crear un nuevo adapter (< 200 líneas)
- [ ] Un miembro nuevo entiende la app en < 2 minutos sin manual
- [ ] Dos comunidades pueden firmar un tratado bilateral
- [ ] Las reglas que viola la ley se marcan en rojo antes de guardar
- [ ] Los 5 primitivos se comunican solo por eventos, cero imports cruzados
