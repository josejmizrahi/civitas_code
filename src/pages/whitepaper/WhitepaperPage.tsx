import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Users, Landmark, Vote, ArrowRight, Layers, Lock, BarChart3, Scale, RefreshCcw, Clock, Settings2, TrendingUp, Globe } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

// ---------------------------------------------------------------------------
// Table of Contents
// ---------------------------------------------------------------------------
const TOC = [
  { id: 'abstract', label: 'Resumen Ejecutivo' },
  { id: 'problem', label: '1. El Problema' },
  { id: 'thesis', label: '2. Tesis Fundacional' },
  { id: 'primitives', label: '3. Primitivas del Sistema' },
  { id: 'closed-loop', label: '4. Ciclo Cerrado' },
  { id: 'social-contract', label: '5. Contrato Social Configurable' },
  { id: 'architecture', label: '6. Arquitectura Tecnica' },
  { id: 'progressive', label: '7. Activacion Progresiva' },
  { id: 'market', label: '8. Mercado Objetivo' },
  { id: 'vision', label: '9. Vision a Futuro' },
]

// ---------------------------------------------------------------------------
// WhitepaperPage
// ---------------------------------------------------------------------------
export function WhitepaperPage() {
  return (
    <div className="min-h-dvh bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al inicio</span>
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">RYVE</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">/ Whitepaper v4</span>
          </div>
          <Link to="/register">
            <Button size="sm" variant="outline" className="text-xs">Comenzar</Button>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">

          {/* Sidebar TOC -- hidden on mobile, sticky on desktop */}
          <aside className="hidden lg:block">
            <nav className="sticky top-20">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contenido</p>
              <ul className="space-y-1">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* Main content */}
          <article className="min-w-0">

            {/* Title block */}
            <div className="mb-12 border-b pb-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                Whitepaper v4
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-balance">
                RYVE: Infraestructura para comunidades autogobernadas
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Un sistema de primitivas integradas — Identidad, Tesoreria, Gobernanza —
                que transforma la administracion colectiva en autodeterminacion digital.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Febrero 2026</span>
                <span className="hidden sm:inline">|</span>
                <span>RYVE Labs</span>
              </div>
            </div>

            {/* Mobile TOC */}
            <div className="mb-10 rounded-xl border bg-muted/30 p-4 lg:hidden">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contenido</p>
              <ul className="space-y-1">
                {TOC.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="block py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* ─── Abstract ─── */}
            <section id="abstract" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Resumen Ejecutivo</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  RYVE es un sistema operativo para comunidades autogobernadas. A diferencia de las herramientas
                  de administracion fragmentadas que existen hoy, RYVE integra tres primitivas fundamentales
                  — <strong className="text-foreground">Identidad</strong>, <strong className="text-foreground">Tesoreria</strong> y <strong className="text-foreground">Gobernanza</strong> — en un ciclo cerrado donde
                  cada decision tiene consecuencias financieras, cada pago afecta los derechos y cada derecho
                  habilita decisiones.
                </p>
                <p>
                  El sistema esta disenado para cualquier organizacion colectiva que necesite gobernarse, cobrar
                  y rendir cuentas: condominios, cooperativas, comunidades religiosas, asociaciones industriales
                  y, eventualmente, network states digitales.
                </p>
                <p>
                  Este documento describe el problema que resolvemos, la tesis que guia nuestro diseno, la
                  arquitectura tecnica del sistema y la vision a largo plazo de RYVE como infraestructura
                  para la autodeterminacion colectiva.
                </p>
              </div>
            </section>

            {/* ─── Problem ─── */}
            <section id="problem" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">1. El Problema</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  La gobernanza de las comunidades falla no por falta de voluntad, sino por la desconexion
                  entre quienes deciden, quienes pagan y quienes administran.
                </p>
                <p>
                  Solo en Mexico existen mas de 930,000 condominios. La mayoria opera con herramientas
                  fragmentadas: hojas de Excel para finanzas, grupos de WhatsApp para comunicacion,
                  libretas fisicas para votaciones. No existe una fuente de verdad compartida.
                </p>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: Landmark, title: 'Opacidad financiera', desc: 'Los miembros pagan pero no pueden ver a donde va su dinero ni como se gasta.' },
                  { icon: Vote, title: 'Decisiones sin ejecucion', desc: 'Las votaciones existen en papel, pero sus resultados rara vez se ejecutan de forma transparente.' },
                  { icon: Users, title: 'Registros fragmentados', desc: 'Sin fuente de verdad compartida. La informacion vive dispersa en multiples herramientas.' },
                ].map((p) => (
                  <div key={p.title} className="rounded-lg border p-4">
                    <p.icon className="mb-2 h-5 w-5 text-muted-foreground" />
                    <h4 className="text-sm font-semibold text-foreground">{p.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Esta fragmentacion crea un ciclo vicioso: la falta de transparencia genera desconfianza,
                  la desconfianza reduce la participacion, y la baja participacion perpetua malas decisiones
                  que afectan a todos.
                </p>
                <p>
                  El resultado es un deficit de gobernanza que escala con el tamano de la comunidad. Lo que
                  funciona informalmente con 10 vecinos colapsa con 100. Y las herramientas existentes
                  — disenadas para empresas, no para comunidades — no resuelven el problema porque tratan
                  las finanzas, la identidad y las decisiones como silos separados.
                </p>
              </div>
            </section>

            {/* ─── Thesis ─── */}
            <section id="thesis" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">2. Tesis Fundacional</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  RYVE parte de una tesis simple: <strong className="text-foreground">la gobernanza comunitaria
                  solo funciona cuando las decisiones, el dinero y la identidad estan conectados en un
                  sistema integrado.</strong>
                </p>
                <p>
                  Esto significa que:
                </p>
                <ul className="ml-4 list-disc space-y-2">
                  <li>Una propuesta aprobada debe poder generar automaticamente un gasto, un presupuesto o un cambio de cuota.</li>
                  <li>El estado de pagos de cada miembro debe calcularse en tiempo real y debe afectar sus derechos de participacion.</li>
                  <li>Los roles, el peso de voto y el standing financiero deben determinar quien puede votar y proponer.</li>
                </ul>
                <p>
                  Esta integracion no es un feature: es la arquitectura fundamental del sistema. RYVE no es
                  tres herramientas empaquetadas juntas — es un sistema donde las primitivas se alimentan entre si.
                </p>
              </div>

              <blockquote className="mt-6 border-l-2 border-foreground/20 pl-4 text-lg font-medium text-foreground/80 italic">
                Las decisiones colectivas que no tienen consecuencias financieras reales son ejercicios decorativos.
                RYVE hace que cada voto cuente — literalmente.
              </blockquote>
            </section>

            {/* ─── Primitives ─── */}
            <section id="primitives" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">3. Primitivas del Sistema</h2>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                RYVE se construye sobre tres primitivas composables. Cada una puede funcionar de forma
                independiente, pero su verdadero poder emerge cuando operan juntas.
              </p>

              <div className="space-y-6">
                {/* Identity */}
                <div className="rounded-xl border p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center rounded-lg bg-blue-50 p-2 text-blue-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Identidad</h3>
                      <p className="text-xs text-muted-foreground">Identity Primitive</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      El directorio de miembros con roles, permisos, invitaciones seguras y estado financiero
                      calculado en tiempo real. Cada miembro tiene un perfil que incluye su rol dentro de la
                      comunidad, su peso de voto, su historial de participacion y su standing financiero.
                    </p>
                    <p>
                      La primitiva de Identidad es el motor de derechos: determina quien puede votar, quien
                      puede proponer, y con cuanto peso. No es un directorio pasivo — es un sistema dinamico
                      que responde en tiempo real al comportamiento del miembro.
                    </p>
                  </div>
                </div>

                {/* Treasury */}
                <div className="rounded-xl border p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center rounded-lg bg-emerald-50 p-2 text-emerald-600">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Tesoreria</h3>
                      <p className="text-xs text-muted-foreground">Treasury Primitive</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      Ingresos, egresos, presupuestos, obligaciones de pago y cobranza recurrente. Un dashboard
                      financiero en vivo que muestra el estado real de las finanzas de la comunidad.
                    </p>
                    <p>
                      La tesoreria no solo registra transacciones — calcula el cumplimiento financiero de cada
                      miembro y alimenta la primitiva de Identidad con esta informacion. Un miembro moroso
                      puede perder automaticamente su derecho a voto segun las reglas que la comunidad defina.
                    </p>
                  </div>
                </div>

                {/* Governance */}
                <div className="rounded-xl border p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center rounded-lg bg-violet-50 p-2 text-violet-600">
                      <Vote className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Gobernanza</h3>
                      <p className="text-xs text-muted-foreground">Governance Primitive</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      Propuestas, votaciones ponderadas, delegaciones liquidas, ejecucion automatica y actas
                      con firma digital SHA-256 verificable.
                    </p>
                    <p>
                      Lo que distingue a RYVE de un sistema de encuestas es que las propuestas aprobadas
                      se ejecutan. Una propuesta de gasto aprobada genera el registro de egreso en Tesoreria.
                      Una propuesta de cambio de cuota actualiza las obligaciones de pago. Las decisiones
                      tienen consecuencias reales e inmediatas.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Closed Loop ─── */}
            <section id="closed-loop" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">4. El Ciclo Cerrado</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Lo que hace a RYVE fundamentalmente distinto es que las tres primitivas forman un ciclo
                  cerrado. No son modulos separados que comparten una base de datos — son componentes de un
                  sistema donde cada salida alimenta la entrada de otro.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { from: 'Gobernanza', to: 'Tesoreria', icon: ArrowRight, label: 'Decisiones ejecutables', desc: 'Una propuesta aprobada genera automaticamente un gasto, presupuesto o cambio de cuota.' },
                  { from: 'Tesoreria', to: 'Identidad', icon: ArrowRight, label: 'Cumplimiento financiero', desc: 'El estado de pagos de cada miembro se calcula en tiempo real y afecta sus derechos.' },
                  { from: 'Identidad', to: 'Gobernanza', icon: ArrowRight, label: 'Motor de derechos', desc: 'Roles, peso de voto y standing financiero determinan quien puede votar y proponer.' },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="mt-0.5 rounded bg-muted p-1.5">
                      <c.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">{c.from}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">{c.to}</span>
                      </div>
                      <h4 className="mt-0.5 text-sm font-semibold text-foreground">{c.label}</h4>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Este ciclo cerrado resuelve el problema fundamental: las decisiones dejan de ser decorativas
                  porque tienen consecuencias inmediatas y verificables. La transparencia no es una promesa
                  — es una propiedad estructural del sistema.
                </p>
              </div>
            </section>

            {/* ─── Social Contract ─── */}
            <section id="social-contract" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">5. Contrato Social Configurable</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Cada comunidad es diferente. Un condominio en la Ciudad de Mexico tiene reglas distintas a una
                  cooperativa agricola en Oaxaca o una parroquia en Guadalajara. RYVE no impone un modelo
                  unico — proporciona un motor de reglas configurable que cada comunidad adapta a su realidad.
                </p>
                <p>
                  Las reglas configurables incluyen:
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Scale, title: 'Tipo de voto', desc: 'Por indiviso, un miembro = un voto, por aportacion, o esquema personalizado.' },
                  { icon: RefreshCcw, title: 'Delegacion', desc: 'Habilitada o deshabilitada. Revocable en cualquier momento. Transparente siempre.' },
                  { icon: Clock, title: 'Periodos', desc: 'Quorum requerido, periodo de enfriamiento, mayoria necesaria, duracion de votacion.' },
                  { icon: Settings2, title: 'Restricciones', desc: 'Pago condiciona voto, auto-ejecucion bajo monto, roles que pueden proponer.' },
                ].map((r) => (
                  <div key={r.title} className="rounded-lg border p-4">
                    <r.icon className="mb-2 h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">{r.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Llamamos a esta configuracion el "contrato social" de la comunidad. Es el equivalente digital
                  de los estatutos o el reglamento interno, pero con una diferencia fundamental: se ejecuta
                  automaticamente. No es un documento que nadie lee — es codigo que el sistema respeta.
                </p>
              </div>
            </section>

            {/* ─── Architecture ─── */}
            <section id="architecture" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">6. Arquitectura Tecnica</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  RYVE se construye sobre una arquitectura multi-tenant con aislamiento real a nivel de
                  base de datos usando Row-Level Security (RLS) en PostgreSQL.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: Lock, title: 'Aislamiento por RLS', desc: 'Cada comunidad tiene datos completamente aislados. Un tenant nunca puede ver datos de otro.' },
                  { icon: Layers, title: 'Multi-tenant nativo', desc: 'Una sola instancia del sistema sirve multiples comunidades sin comprometer la privacidad.' },
                  { icon: BarChart3, title: 'Censo federado', desc: 'Snapshots periodicos de metricas agregadas permiten comparaciones entre comunidades sin exponer datos.' },
                  { icon: TrendingUp, title: 'Escalabilidad', desc: 'Diseñado para crecer de 10 a 10,000 comunidades sin cambios arquitectonicos.' },
                ].map((a) => (
                  <div key={a.title} className="rounded-lg border p-4">
                    <a.icon className="mb-2 h-4 w-4 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">{a.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  El stack tecnologico incluye React con TypeScript en el frontend, Supabase (PostgreSQL)
                  como base de datos con RLS nativo, y una arquitectura de primitivas que permite a cada
                  modulo evolucionar de forma independiente mientras mantiene las conexiones del ciclo cerrado.
                </p>
                <p>
                  Las firmas digitales de actas usan hashing SHA-256 para garantizar la integridad de los
                  documentos. Los votos se registran de forma inmutable y son verificables por cualquier
                  miembro de la comunidad.
                </p>
              </div>
            </section>

            {/* ─── Progressive ─── */}
            <section id="progressive" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">7. Activacion Progresiva</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  RYVE no requiere una transformacion digital completa desde el dia uno. El sistema esta
                  disenado para una adopcion progresiva que respeta la realidad de cada comunidad.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  { step: '01', title: 'Importar', desc: 'Sube tus datos existentes. CSV, Excel, lo que tengas. El sistema normaliza e importa.' },
                  { step: '02', title: 'Operar', desc: 'Gestiona finanzas, miembros y decisiones en un solo lugar. Sin curva de aprendizaje.' },
                  { step: '03', title: 'Automatizar', desc: 'Cobros recurrentes, ejecucion automatica de decisiones aprobadas, notificaciones.' },
                  { step: '04', title: 'Conectar', desc: 'Integra cuentas bancarias para reconciliacion automatica. Datos financieros en tiempo real.' },
                  { step: '05', title: 'Federar', desc: 'Conecta multiples comunidades. Agrega datos, compara metricas, construye tu red.' },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4 rounded-lg border p-4">
                    <span className="text-2xl font-bold text-muted-foreground/30">{s.step}</span>
                    <div>
                      <h4 className="text-sm font-semibold">{s.title}</h4>
                      <p className="mt-0.5 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Market ─── */}
            <section id="market" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">8. Mercado Objetivo</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  RYVE se dirige a cualquier organizacion colectiva que necesite gobernarse, cobrar y
                  rendir cuentas. Comenzamos con los verticales de mayor urgencia y volumen en Latinoamerica.
                </p>
              </div>
              {/* Mobile: card layout / Desktop: table */}
              <div className="mt-6 hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 font-semibold">Segmento</th>
                      <th className="pb-3 pr-4 font-semibold">Volumen</th>
                      <th className="pb-3 font-semibold">Notas</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="py-3 pr-4">Condominios</td><td className="py-3 pr-4 font-medium text-foreground">930,000+</td><td className="py-3">Solo en Mexico. Verticales con mayor urgencia de digitalizacion.</td></tr>
                    <tr className="border-b"><td className="py-3 pr-4">Cooperativas</td><td className="py-3 pr-4 font-medium text-foreground">60,000+</td><td className="py-3">Agricolas, de ahorro, de vivienda. En toda Latinoamerica.</td></tr>
                    <tr className="border-b"><td className="py-3 pr-4">Comunidades religiosas</td><td className="py-3 pr-4 font-medium text-foreground">50,000+</td><td className="py-3">Parroquias y templos que necesitan transparencia financiera.</td></tr>
                    <tr className="border-b"><td className="py-3 pr-4">Asociaciones industriales</td><td className="py-3 pr-4 font-medium text-foreground">15,000+</td><td className="py-3">Camaras, clusters y gremios con gobernanza colectiva.</td></tr>
                    <tr><td className="py-3 pr-4">Network States</td><td className="py-3 pr-4 font-medium text-foreground">Emergente</td><td className="py-3">Comunidades digitales que buscan gobernanza soberana.</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 space-y-3 sm:hidden">
                {[
                  { seg: 'Condominios', vol: '930,000+', note: 'Solo en Mexico. Mayor urgencia de digitalizacion.' },
                  { seg: 'Cooperativas', vol: '60,000+', note: 'Agricolas, de ahorro, de vivienda. En toda Latinoamerica.' },
                  { seg: 'Comunidades religiosas', vol: '50,000+', note: 'Parroquias y templos con necesidad de transparencia.' },
                  { seg: 'Asociaciones industriales', vol: '15,000+', note: 'Camaras, clusters y gremios.' },
                  { seg: 'Network States', vol: 'Emergente', note: 'Comunidades digitales con gobernanza soberana.' },
                ].map((r) => (
                  <div key={r.seg} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{r.seg}</span>
                      <span className="text-sm font-bold text-foreground">{r.vol}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{r.note}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Vision ─── */}
            <section id="vision" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">9. Vision a Futuro</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  RYVE no es solo una herramienta de administracion. Es infraestructura para que cualquier
                  grupo humano pueda gobernarse a si mismo de forma transparente, democratica y eficiente.
                </p>
                <p>
                  Empezamos con condominios en Mexico porque necesitan una solucion urgente. Pero el mismo
                  sistema que gobierna un edificio de 50 departamentos puede gobernar una cooperativa de 500
                  socios o una comunidad digital de 5,000 miembros.
                </p>
                <p>
                  A largo plazo, RYVE construye la infraestructura para una red federada de comunidades
                  autogobernadas. Cada comunidad opera de forma soberana con sus propias reglas, pero puede
                  conectarse a una red mas amplia para compartir metricas agregadas, comparar su salud
                  organizacional y aprender de otras comunidades.
                </p>
                <p className="text-foreground font-medium">
                  Cada comunidad que se gobierna mejor es un paso hacia un mundo con mas confianza,
                  mas participacion y mas justicia.
                </p>
              </div>
            </section>

            {/* CTA */}
            <div className="rounded-xl border bg-muted/30 p-6 sm:p-8 text-center">
              <h3 className="text-xl font-bold">Construye con nosotros</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                RYVE esta en desarrollo activo. Crea tu comunidad hoy y se parte
                de la primera generacion de comunidades autogobernadas.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="w-full gap-2 sm:w-auto">
                    Crear mi comunidad
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </div>

          </article>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">RYVE</span>
          </div>
          <span className="text-sm text-muted-foreground">Whitepaper v4 — Febrero 2026</span>
        </div>
      </footer>
    </div>
  )
}
