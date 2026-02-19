import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import {
  Shield,
  Landmark,
  Vote,
  Users,
  BarChart3,
  FileText,
  Globe,
  ArrowRight,
  CheckCircle,
  Building2,
  Wallet,
  Star,
  Zap,
  Lock,
  ChevronRight,
  CircleDot,
  Workflow,
  Scale,
  RefreshCcw,
  AlertTriangle,
  Eye,
  Handshake,
  Church,
  Factory,
  Layers,
  TrendingUp,
  Clock,
  Settings2,
  X,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PROBLEM_POINTS = [
  {
    icon: AlertTriangle,
    title: 'Opacidad financiera',
    description: 'Los miembros pagan pero no pueden ver a dónde va su dinero ni cómo se gasta.',
  },
  {
    icon: Vote,
    title: 'Decisiones sin dientes',
    description: 'Las votaciones existen en papel, pero sus resultados rara vez se ejecutan de forma transparente.',
  },
  {
    icon: Users,
    title: 'Registros fragmentados',
    description: 'Hojas de Excel, grupos de WhatsApp y libretas. Sin fuente de verdad compartida.',
  },
]

const PRIMITIVES = [
  {
    icon: Users,
    name: 'Identity',
    label: 'Identidad',
    description: 'Directorio de miembros con roles, permisos, invitaciones seguras y estado financiero calculado en tiempo real.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Landmark,
    name: 'Treasury',
    label: 'Tesoreria',
    description: 'Ingresos, egresos, presupuestos, obligaciones de pago y cobranza recurrente. Dashboard financiero en vivo.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Vote,
    name: 'Governance',
    label: 'Gobernanza',
    description: 'Propuestas, votaciones ponderadas, delegaciones, ejecucion automatica, actas con firma digital.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
]

const LOOP_CONNECTIONS = [
  {
    from: 'Gobernanza',
    to: 'Tesoreria',
    label: 'Decisiones ejecutables',
    description: 'Una propuesta aprobada genera automaticamente un gasto, presupuesto o cambio de cuota.',
  },
  {
    from: 'Tesoreria',
    to: 'Identidad',
    label: 'Cumplimiento financiero',
    description: 'El estado de pagos de cada miembro se calcula en tiempo real y afecta sus derechos.',
  },
  {
    from: 'Identidad',
    to: 'Gobernanza',
    label: 'Motor de derechos',
    description: 'Roles, peso de voto y standing financiero determinan quien puede votar y proponer.',
  },
]

const FEATURES_EXTENDED = [
  {
    icon: Scale,
    title: 'Voto ponderado',
    description: 'Cada miembro vota con su peso real. En condominios, por indiviso. En cooperativas, por aportacion.',
  },
  {
    icon: RefreshCcw,
    title: 'Delegacion liquida',
    description: 'Delega tu voto a alguien de confianza. Revocable en cualquier momento, transparente siempre.',
  },
  {
    icon: Clock,
    title: 'Ejecucion automatica',
    description: 'Propuestas aprobadas entran en periodo de enfriamiento y se ejecutan automaticamente.',
  },
  {
    icon: Wallet,
    title: 'Cobros recurrentes',
    description: 'Cuotas mensuales, planes de pago y tracking de cumplimiento por miembro.',
  },
  {
    icon: Building2,
    title: 'Entidades y contratos',
    description: 'Directorio de proveedores con contratos, ratings multidimensionales e historial de pagos.',
  },
  {
    icon: FileText,
    title: 'Actas con firma digital',
    description: 'Genera actas de asamblea automaticamente. Firma con hash SHA-256 verificable.',
  },
  {
    icon: BarChart3,
    title: 'Censo y estadisticas',
    description: 'Snapshots periodicos de la salud de tu comunidad. Base para la red federada.',
  },
  {
    icon: Lock,
    title: 'Aislamiento total',
    description: 'Cada comunidad tiene datos completamente aislados con Row-Level Security en Postgres.',
  },
]

const RULES_EXAMPLES = [
  {
    community: 'Condominio',
    icon: Building2,
    rules: ['Quorum 50%', 'Voto por indiviso', 'Pago condiciona voto', 'Auto-ejecucion < $50,000'],
  },
  {
    community: 'Cooperativa',
    icon: Handshake,
    rules: ['Quorum 50%', 'Un miembro = un voto', 'Delegacion habilitada', 'Gracia 2 meses'],
  },
  {
    community: 'Comunidad religiosa',
    icon: Church,
    rules: ['Quorum 33%', 'Solo admin propone', 'Sin restriccion por pago', 'Delegacion deshabilitada'],
  },
  {
    community: 'Manufactura',
    icon: Factory,
    rules: ['Quorum 66%', 'Mayoria 66%', 'Cool-down 72h', 'Restriccion total a morosos'],
  },
]

const MARKET_SEGMENTS = [
  { icon: Building2, name: 'Condominios', count: '930,000+', description: 'Solo en Mexico' },
  { icon: Handshake, name: 'Cooperativas', count: '60,000+', description: 'En Latinoamerica' },
  { icon: Church, name: 'Comunidades religiosas', count: '50,000+', description: 'Parroquias y templos' },
  { icon: Factory, name: 'Asociaciones industriales', count: '15,000+', description: 'Camaras y clusters' },
  { icon: Globe, name: 'Network States', count: 'Emergente', description: 'Comunidades digitales' },
]

const STEPS = [
  {
    number: '01',
    title: 'Crea tu comunidad',
    description: 'Elige el tipo de organizacion. El sistema pre-configura reglas de gobernanza, tesoreria e identidad adaptadas a tu vertical.',
  },
  {
    number: '02',
    title: 'Invita miembros',
    description: 'Envia invitaciones por enlace seguro. Cada miembro obtiene su rol, peso de voto y acceso inmediato.',
  },
  {
    number: '03',
    title: 'Opera y decide',
    description: 'Registra finanzas, crea propuestas, vota. Las decisiones aprobadas se ejecutan automaticamente.',
  },
  {
    number: '04',
    title: 'Escala y federa',
    description: 'Conecta multiples comunidades. Agrega datos, compara metricas y construye tu network state.',
  },
]

const COMPETITIVE_ADVANTAGES = [
  {
    us: 'Decisiones con consecuencia financiera',
    them: 'Votaciones decorativas sin ejecucion',
  },
  {
    us: 'Un sistema integrado: Gov + Treasury + Identity',
    them: 'Herramientas separadas que no se hablan',
  },
  {
    us: 'Configurable por tipo de comunidad',
    them: 'Hecho solo para condominios o solo para DAOs',
  },
  {
    us: 'Multi-tenant con aislamiento real (RLS)',
    them: 'Datos mezclados o single-tenant costoso',
  },
  {
    us: 'Progresivo: de Excel a fintech',
    them: 'Todo-o-nada: requiere banca desde dia 1',
  },
]

// ---------------------------------------------------------------------------
// Landing page
// ---------------------------------------------------------------------------

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background">
      {/* ─── Nav ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7" />
            <span className="text-xl font-bold tracking-tight">Civitas</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#problem" className="text-muted-foreground transition-colors hover:text-foreground">Problema</a>
            <a href="#system" className="text-muted-foreground transition-colors hover:text-foreground">Sistema</a>
            <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">Funcionalidades</a>
            <a href="#rules" className="text-muted-foreground transition-colors hover:text-foreground">Reglas</a>
            <a href="#market" className="text-muted-foreground transition-colors hover:text-foreground">Mercado</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Iniciar sesion</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Comenzar gratis</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(23,23,23,0.06),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              Infrastructure for Network States
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              De la opacidad a la
              <span className="block text-primary">autodeterminacion colectiva</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Civitas es el sistema operativo para comunidades autogobernadas.
              Tres primitivas integradas — Identidad, Tesoreria, Gobernanza —
              que convierten decisiones en acciones con consecuencias reales.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Crear mi comunidad
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#system">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ver como funciona
                </Button>
              </a>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> Gratis para empezar</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> Sin tarjeta de credito</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> Datos 100% privados</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Thesis bar ─── */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-lg font-medium leading-relaxed sm:text-xl">
              &ldquo;La gobernanza de las comunidades falla no por falta de voluntad, sino por la
              desconexion entre quienes deciden, quienes pagan y quienes administran.&rdquo;
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Civitas Whitepaper v4 — La tesis fundacional
            </p>
          </div>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section id="problem" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" />
              El problema
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Las comunidades estan rotas por dentro
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              930,000 condominios solo en Mexico. La mayoria opera con herramientas que
              fragmentan la informacion y desconectan las decisiones de sus consecuencias.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PROBLEM_POINTS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-red-100 bg-red-50/30 p-6"
              >
                <div className="mb-4 inline-flex rounded-lg bg-red-100 p-2.5 text-red-600">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Integrated Primitive System ─── */}
      <section id="system" className="scroll-mt-20 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Layers className="h-3 w-3" />
              La solucion
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Sistema de Primitivas Integradas
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Tres primitivas composables que forman un ciclo cerrado.
              Cada decision tiene consecuencias financieras. Cada pago afecta los derechos.
              Cada derecho habilita decisiones.
            </p>
          </div>

          {/* 3 primitives */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {PRIMITIVES.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border bg-card p-6"
              >
                <div className={cn('mb-4 inline-flex rounded-lg p-2.5', p.bg, p.color)}>
                  <p.icon className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{p.label}</h3>
                  <span className="text-xs text-muted-foreground">({p.name})</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>

          {/* Closed loop */}
          <div className="mt-16">
            <div className="mx-auto max-w-2xl text-center mb-10">
              <h3 className="text-xl font-semibold">El ciclo cerrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Lo que hace a Civitas unico: las primitivas se alimentan entre si.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {LOOP_CONNECTIONS.map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl border bg-card p-5"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span>{c.from}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    <span>{c.to}</span>
                  </div>
                  <h4 className="mt-2 font-semibold text-primary">{c.label}</h4>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Funcionalidades que importan
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Cada feature existe para cerrar el ciclo entre decidir, cobrar y rendir cuentas.
            </p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES_EXTENDED.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border bg-card p-6 transition-all hover:shadow-md hover:border-foreground/20"
              >
                <div className="mb-4 inline-flex rounded-lg bg-muted p-2.5 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Smart Contract / Rules Engine ─── */}
      <section id="rules" className="scroll-mt-20 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Settings2 className="h-3 w-3" />
              Contrato Social Configurable
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Un motor, infinitas constituciones
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Cada comunidad define sus propias reglas de gobernanza, tesoreria e identidad.
              El mismo sistema se adapta desde un condominio en CDMX hasta una cooperativa en Oaxaca.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {RULES_EXAMPLES.map((r) => (
              <div key={r.community} className="rounded-xl border bg-card p-6">
                <div className="mb-3 inline-flex rounded-lg bg-muted p-2.5">
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{r.community}</h3>
                <ul className="mt-3 space-y-1.5">
                  {r.rules.map((rule) => (
                    <li key={rule} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CircleDot className="h-3 w-3 shrink-0 text-primary" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Progressive Activation ─── */}
      <section className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Activacion progresiva
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                De la hoja de Excel
                <span className="block text-primary">al network state</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                No necesitas transformarte de golpe. Civitas crece contigo:
                empieza importando tu Excel, termina operando como un estado digital.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { label: 'Importar', desc: 'Sube tus datos existentes. CSV, Excel, lo que tengas.' },
                  { label: 'Operar', desc: 'Gestiona finanzas, miembros y decisiones en un solo lugar.' },
                  { label: 'Automatizar', desc: 'Cobros recurrentes, ejecucion automatica de decisiones.' },
                  { label: 'Conectar', desc: 'Integra cuentas bancarias. Reconciliacion automatica.' },
                  { label: 'Federar', desc: 'Conecta multiples comunidades. Agrega datos. Escala.' },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <div>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground"> — {item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2">
              {[
                { icon: Eye, label: 'Transparencia', value: 'Cada peso rastreable, cada voto verificable' },
                { icon: Vote, label: 'Democracia', value: 'Votaciones con peso real y delegacion liquida' },
                { icon: Zap, label: 'Ejecucion', value: 'Decisiones que se convierten en acciones' },
                { icon: Workflow, label: 'Integracion', value: 'Gov + Treasury + Identity = ciclo cerrado' },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border bg-card p-5">
                  <card.icon className="h-8 w-8 text-muted-foreground" />
                  <div className="mt-3 font-semibold">{card.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground leading-relaxed">{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Empieza en 4 pasos
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              No necesitas configuraciones complicadas. El wizard de onboarding pre-configura
              todo segun tu tipo de comunidad.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-8 translate-x-full bg-border lg:block" />
                )}
                <div className="rounded-xl border bg-card p-8 h-full">
                  <div className="text-4xl font-bold text-muted-foreground/30">{step.number}</div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Competitive advantage ─── */}
      <section className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Por que Civitas es diferente
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              La unica plataforma donde las decisiones colectivas tienen consecuencias financieras reales.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="rounded-xl border overflow-hidden">
              <div className="hidden sm:grid grid-cols-2 bg-muted/50 px-6 py-3 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Civitas
                </div>
                <div className="text-muted-foreground">Herramientas tradicionales</div>
              </div>
              {COMPETITIVE_ADVANTAGES.map((adv, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col gap-2 px-4 py-4 sm:grid sm:grid-cols-2 sm:gap-0 sm:px-6 text-sm',
                    i % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    <span>{adv.us}</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground pl-6 sm:pl-0">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <span>{adv.them}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Market ─── */}
      <section id="market" className="scroll-mt-20 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Para todo tipo de comunidades
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Civitas se adapta a cualquier organizacion colectiva que necesite
              gobernarse, cobrar y rendir cuentas.
            </p>
          </div>
          <div className="mt-12 grid gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {MARKET_SEGMENTS.map((seg) => (
              <div
                key={seg.name}
                className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center transition-all hover:shadow-md"
              >
                <div className="rounded-lg bg-muted p-3">
                  <seg.icon className="h-6 w-6" />
                </div>
                <div>
                  <span className="block text-sm font-semibold">{seg.name}</span>
                  <span className="block text-lg font-bold text-primary">{seg.count}</span>
                  <span className="block text-xs text-muted-foreground">{seg.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Vision ─── */}
      <section className="scroll-mt-20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Star className="h-3 w-3" />
              La vision
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              De la transparencia a la autodeterminacion
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Civitas no es solo una herramienta de administracion. Es infraestructura
              para que cualquier grupo humano pueda gobernarse a si mismo de forma
              transparente, democratica y eficiente.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Empezamos con condominios en Mexico porque necesitan una solucion urgente.
              Pero el mismo sistema que gobierna un edificio de 50 departamentos puede
              gobernar una cooperativa de 500 socios o una comunidad digital de 5,000 miembros.
            </p>
            <p className="mt-4 text-lg font-medium">
              Cada comunidad que se gobierna mejor es un paso hacia un mundo con mas
              confianza, mas participacion y mas justicia.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden border-t bg-muted/30">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_50%_at_50%_50%,rgba(23,23,23,0.04),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Empieza a gobernar mejor hoy
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Crea tu comunidad en menos de 2 minutos. El wizard configura
              las reglas segun tu tipo de organizacion.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Crear mi comunidad gratis
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">Civitas</span>
            <span className="text-sm text-muted-foreground">· Infrastructure for Network States</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#system" className="hover:text-foreground transition-colors">Sistema</a>
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <Link to="/login" className="hover:text-foreground transition-colors">Ingresar</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
