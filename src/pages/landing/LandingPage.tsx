import { useState } from 'react'
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
  Menu,
  FileDown,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PROBLEM_POINTS = [
  {
    icon: AlertTriangle,
    title: 'Opacidad financiera',
    description: 'Los miembros pagan pero no pueden ver a donde va su dinero ni como se gasta.',
  },
  {
    icon: Vote,
    title: 'Decisiones sin ejecucion',
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

const NAV_LINKS = [
  { href: '#problem', label: 'Problema' },
  { href: '#system', label: 'Sistema' },
  { href: '#features', label: 'Funcionalidades' },
  { href: '#rules', label: 'Reglas' },
  { href: '#market', label: 'Mercado' },
  { href: '/whitepaper', label: 'Whitepaper', isRoute: true },
]

// ---------------------------------------------------------------------------
// Landing page -- Mobile First
// ---------------------------------------------------------------------------

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      {/* ─── Nav ─── */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-lg font-bold tracking-tight sm:text-xl">RYVE</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 text-sm md:flex">
            {NAV_LINKS.map((link) =>
              link.isRoute ? (
                <Link key={link.href} to={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                  {link.label}
                </a>
              )
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login">
              <Button variant="ghost" size="sm">Iniciar sesion</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Comenzar gratis</Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center rounded-md p-2 text-muted-foreground md:hidden"
            aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t bg-background px-4 pb-4 pt-2 md:hidden">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {link.label}
                  </a>
                )
              )}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t pt-3">
              <Link to="/login" onClick={() => setMenuOpen(false)}>
                <Button variant="outline" className="w-full">Iniciar sesion</Button>
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)}>
                <Button className="w-full">Comenzar gratis</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(23,23,23,0.06),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground sm:px-4 sm:py-1.5 sm:text-sm">
              <Globe className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              Infrastructure for Network States
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              De la opacidad a la
              <span className="block text-primary">autodeterminacion colectiva</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:mt-6 sm:text-lg lg:text-xl leading-relaxed">
              RYVE es el sistema operativo para comunidades autogobernadas.
              Tres primitivas integradas — Identidad, Tesoreria, Gobernanza —
              que convierten decisiones en acciones con consecuencias reales.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Crear mi comunidad
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/whitepaper" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto">
                  <FileDown className="h-4 w-4" />
                  Leer el Whitepaper
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex flex-col items-center gap-2 text-sm text-muted-foreground sm:mt-12 sm:flex-row sm:justify-center sm:gap-x-8 sm:gap-y-3">
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> Gratis para empezar</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> Sin tarjeta de credito</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> Datos 100% privados</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Thesis bar ─── */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-base font-medium leading-relaxed sm:text-lg lg:text-xl">
              &ldquo;La gobernanza de las comunidades falla no por falta de voluntad, sino por la
              desconexion entre quienes deciden, quienes pagan y quienes administran.&rdquo;
            </p>
            <Link to="/whitepaper" className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
              RYVE Whitepaper v4 — La tesis fundacional
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section id="problem" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3 w-3" />
              El problema
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              Las comunidades estan rotas por dentro
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              930,000 condominios solo en Mexico. La mayoria opera con herramientas que
              fragmentan la informacion y desconectan las decisiones de sus consecuencias.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:mt-16 sm:grid sm:grid-cols-3 sm:gap-6">
            {PROBLEM_POINTS.map((p) => (
              <div
                key={p.title}
                className="rounded-xl border border-red-100 bg-red-50/30 p-5 sm:p-6"
              >
                <div className="mb-3 inline-flex rounded-lg bg-red-100 p-2 text-red-600 sm:mb-4 sm:p-2.5">
                  <p.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed sm:mt-2">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Integrated Primitive System ─── */}
      <section id="system" className="scroll-mt-16 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Layers className="h-3 w-3" />
              La solucion
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              Sistema de Primitivas Integradas
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              Tres primitivas composables que forman un ciclo cerrado.
              Cada decision tiene consecuencias financieras. Cada pago afecta los derechos.
              Cada derecho habilita decisiones.
            </p>
          </div>

          {/* 3 primitives */}
          <div className="mt-8 flex flex-col gap-4 sm:mt-16 sm:grid sm:grid-cols-3 sm:gap-6">
            {PRIMITIVES.map((p) => (
              <div
                key={p.name}
                className="rounded-xl border bg-card p-5 sm:p-6"
              >
                <div className={cn('mb-3 inline-flex rounded-lg p-2 sm:mb-4 sm:p-2.5', p.bg, p.color)}>
                  <p.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{p.label}</h3>
                  <span className="text-xs text-muted-foreground">({p.name})</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed sm:mt-2">{p.description}</p>
              </div>
            ))}
          </div>

          {/* Closed loop */}
          <div className="mt-10 sm:mt-16">
            <div className="mx-auto max-w-2xl text-center mb-6 sm:mb-10">
              <h3 className="text-lg font-semibold sm:text-xl">El ciclo cerrado</h3>
              <p className="mt-1.5 text-sm text-muted-foreground sm:mt-2">
                Lo que hace a RYVE unico: las primitivas se alimentan entre si.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4">
              {LOOP_CONNECTIONS.map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl border bg-card p-4 sm:p-5"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <span>{c.from}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    <span>{c.to}</span>
                  </div>
                  <h4 className="mt-1.5 font-semibold text-primary sm:mt-2">{c.label}</h4>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed sm:mt-1.5">{c.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              Funcionalidades que importan
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              Cada feature existe para cerrar el ciclo entre decidir, cobrar y rendir cuentas.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {FEATURES_EXTENDED.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-foreground/20 sm:p-6"
              >
                <div className="mb-3 inline-flex rounded-lg bg-muted p-2 transition-colors group-hover:bg-primary group-hover:text-primary-foreground sm:mb-4 sm:p-2.5">
                  <f.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed sm:mt-2">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Smart Contract / Rules Engine ─── */}
      <section id="rules" className="scroll-mt-16 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Settings2 className="h-3 w-3" />
              Contrato Social Configurable
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              Un motor, infinitas constituciones
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              Cada comunidad define sus propias reglas de gobernanza, tesoreria e identidad.
              El mismo sistema se adapta desde un condominio en CDMX hasta una cooperativa en Oaxaca.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {RULES_EXAMPLES.map((r) => (
              <div key={r.community} className="rounded-xl border bg-card p-5 sm:p-6">
                <div className="mb-3 inline-flex rounded-lg bg-muted p-2 sm:p-2.5">
                  <r.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <h3 className="font-semibold">{r.community}</h3>
                <ul className="mt-2 space-y-1.5 sm:mt-3">
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
      <section className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                Activacion progresiva
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
                De la hoja de Excel
                <span className="block text-primary">al network state</span>
              </h2>
              <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
                No necesitas transformarte de golpe. RYVE crece contigo:
                empieza importando tu Excel, termina operando como un estado digital.
              </p>
              <ul className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                {[
                  { label: 'Importar', desc: 'Sube tus datos existentes. CSV, Excel, lo que tengas.' },
                  { label: 'Operar', desc: 'Gestiona finanzas, miembros y decisiones en un solo lugar.' },
                  { label: 'Automatizar', desc: 'Cobros recurrentes, ejecucion automatica de decisiones.' },
                  { label: 'Conectar', desc: 'Integra cuentas bancarias. Reconciliacion automatica.' },
                  { label: 'Federar', desc: 'Conecta multiples comunidades. Agrega datos. Escala.' },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-600 sm:h-5 sm:w-5" />
                    <div>
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground"> — {item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Eye, label: 'Transparencia', value: 'Cada peso rastreable, cada voto verificable' },
                { icon: Vote, label: 'Democracia', value: 'Votaciones con peso real y delegacion liquida' },
                { icon: Zap, label: 'Ejecucion', value: 'Decisiones que se convierten en acciones' },
                { icon: Workflow, label: 'Integracion', value: 'Gov + Treasury + Identity = ciclo cerrado' },
              ].map((card) => (
                <div key={card.label} className="rounded-xl border bg-card p-4 sm:p-5">
                  <card.icon className="h-6 w-6 text-muted-foreground sm:h-8 sm:w-8" />
                  <div className="mt-2 font-semibold text-sm sm:mt-3 sm:text-base">{card.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground leading-relaxed sm:mt-1">{card.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="scroll-mt-16 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              Empieza en 4 pasos
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              No necesitas configuraciones complicadas. El wizard de onboarding pre-configura
              todo segun tu tipo de comunidad.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:mt-16 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="absolute right-0 top-8 hidden h-0.5 w-8 translate-x-full bg-border lg:block" />
                )}
                <div className="rounded-xl border bg-card p-5 h-full sm:p-8">
                  <div className="text-3xl font-bold text-muted-foreground/30 sm:text-4xl">{step.number}</div>
                  <h3 className="mt-3 text-base font-semibold sm:mt-4 sm:text-lg">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed sm:mt-2">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Competitive advantage ─── */}
      <section className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              Por que RYVE es diferente
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              La unica plataforma donde las decisiones colectivas tienen consecuencias financieras reales.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-3xl sm:mt-16">
            <div className="rounded-xl border overflow-hidden">
              <div className="hidden sm:grid grid-cols-2 bg-muted/50 px-6 py-3 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> RYVE
                </div>
                <div className="text-muted-foreground">Herramientas tradicionales</div>
              </div>
              {COMPETITIVE_ADVANTAGES.map((adv, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col gap-2 px-4 py-3.5 sm:grid sm:grid-cols-2 sm:gap-0 sm:px-6 sm:py-4 text-sm',
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
      <section id="market" className="scroll-mt-16 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              Para todo tipo de comunidades
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              RYVE se adapta a cualquier organizacion colectiva que necesite
              gobernarse, cobrar y rendir cuentas.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {MARKET_SEGMENTS.map((seg) => (
              <div
                key={seg.name}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md sm:gap-3 sm:p-6"
              >
                <div className="rounded-lg bg-muted p-2 sm:p-3">
                  <seg.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <span className="block text-xs font-semibold sm:text-sm">{seg.name}</span>
                  <span className="block text-base font-bold text-primary sm:text-lg">{seg.count}</span>
                  <span className="block text-[10px] text-muted-foreground sm:text-xs">{seg.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Whitepaper CTA ─── */}
      <section className="scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl rounded-2xl border bg-muted/30 p-6 sm:p-10 lg:p-12">
            <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:text-left lg:gap-8">
              <div className="mb-4 flex items-center justify-center rounded-xl bg-primary/10 p-4 lg:mb-0 lg:shrink-0">
                <FileDown className="h-8 w-8 text-primary sm:h-10 sm:w-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Lee el Whitepaper completo
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed sm:text-base">
                  Conoce en detalle la tesis fundacional, la arquitectura del sistema de primitivas integradas,
                  el motor de reglas configurable y la vision a largo plazo de RYVE como infraestructura
                  para network states.
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Link to="/whitepaper" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full gap-2 sm:w-auto">
                      Leer Whitepaper v4
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Vision ─── */}
      <section className="scroll-mt-16 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Star className="h-3 w-3" />
              La vision
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              De la transparencia a la autodeterminacion
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed sm:mt-6 sm:text-lg">
              RYVE no es solo una herramienta de administracion. Es infraestructura
              para que cualquier grupo humano pueda gobernarse a si mismo de forma
              transparente, democratica y eficiente.
            </p>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed sm:mt-4 sm:text-lg">
              Empezamos con condominios en Mexico porque necesitan una solucion urgente.
              Pero el mismo sistema que gobierna un edificio de 50 departamentos puede
              gobernar una cooperativa de 500 socios o una comunidad digital de 5,000 miembros.
            </p>
            <p className="mt-3 text-base font-medium sm:mt-4 sm:text-lg">
              Cada comunidad que se gobierna mejor es un paso hacia un mundo con mas
              confianza, mas participacion y mas justicia.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_50%_at_50%_50%,rgba(23,23,23,0.04),transparent)]" />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl text-balance">
              Empieza a gobernar mejor hoy
            </h2>
            <p className="mt-3 text-base text-muted-foreground sm:mt-4 sm:text-lg">
              Crea tu comunidad en menos de 2 minutos. El wizard configura
              las reglas segun tu tipo de organizacion.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:justify-center sm:gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 sm:w-auto">
                  Crear mi comunidad gratis
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
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
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6 sm:py-8">
          <div className="flex items-center gap-2 shrink-0">
            <Shield className="h-5 w-5 shrink-0" />
            <span className="font-semibold">RYVE</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">/ Infrastructure for Network States</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground sm:gap-x-6">
            <a href="#system" className="hover:text-foreground transition-colors">Sistema</a>
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <Link to="/whitepaper" className="hover:text-foreground transition-colors">Whitepaper</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Ingresar</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Registrarse</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
