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
  { id: 'primitives', label: '3. Las Cinco Primitivas' },
  { id: 'closed-loop', label: '4. Ciclo Cerrado' },
  { id: 'fintech', label: '5. Alianza Fintech (IFPE)' },
  { id: 'social-contract', label: '6. Contrato Social Configurable' },
  { id: 'architecture', label: '7. Arquitectura Tecnica' },
  { id: 'progressive', label: '8. Activacion Progresiva' },
  { id: 'market', label: '9. Mercado Objetivo' },
  { id: 'revenue', label: '10. Modelo de Ingresos' },
  { id: 'deployment', label: '11. Estrategia de Despliegue' },
  { id: 'competitive', label: 'Competencia' },
  { id: 'risks', label: 'Riesgos y Seguridad' },
  { id: 'vision', label: '12. Conclusión' },
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
            <span className="font-semibold">Civitas</span>
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
                Civitas: Infraestructura para comunidades autogobernadas
              </h1>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Cinco primitivas integradas — Identidad, Tesoreria, Gobernanza, Censo y Federacion —
                que se activan de forma progresiva y transforman la administracion colectiva en autodeterminacion digital.
              </p>
              <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>Febrero 2026</span>
                <span className="hidden sm:inline">|</span>
                <span>Civitas Labs</span>
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
                  Civitas es una plataforma modular para comunidades autogobernadas. Integra cinco primitivas
                  — <strong className="text-foreground">Identidad</strong>, <strong className="text-foreground">Tesoreria</strong>, <strong className="text-foreground">Gobernanza</strong>, <strong className="text-foreground">Censo</strong> y <strong className="text-foreground">Federacion</strong> — que se activan de forma progresiva. En el nucleo, Identidad, Tesoreria y Gobernanza forman un ciclo cerrado: cada decision tiene consecuencias financieras, cada pago afecta los derechos y cada derecho habilita decisiones.
                </p>
                <p>
                  El sistema esta disenado para cualquier organizacion colectiva que necesite gobernarse, cobrar
                  y rendir cuentas: condominios, cooperativas, comunidades religiosas, asociaciones industriales
                  y, eventualmente, network states digitales.
                </p>
                <p>
                  Este documento describe el problema que resolvemos, la tesis que guia nuestro diseno, la
                  arquitectura tecnica del sistema y la vision a largo plazo de Civitas como infraestructura
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
                  Civitas parte de una tesis simple: <strong className="text-foreground">la gobernanza comunitaria
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
                  Esta integracion no es un feature: es la arquitectura fundamental del sistema. Civitas no es
                  tres herramientas empaquetadas juntas — es un sistema donde las primitivas se alimentan entre si.
                </p>
              </div>

              <blockquote className="mt-6 border-l-2 border-foreground/20 pl-4 text-lg font-medium text-foreground/80 italic">
                Las decisiones colectivas que no tienen consecuencias financieras reales son ejercicios decorativos.
                Civitas hace que cada voto cuente — literalmente.
              </blockquote>
            </section>

            {/* ─── Primitives ─── */}
            <section id="primitives" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">3. Las Cinco Primitivas</h2>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                Civitas se construye sobre cinco primitivas composables que se activan de forma progresiva.
                Las tres centrales — Identidad, Tesoreria y Gobernanza — forman una maquina integrada; Censo y Federacion amplian el sistema a escala y entre comunidades.
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
                      Lo que distingue a Civitas de un sistema de encuestas es que las propuestas aprobadas
                      se ejecutan. Una propuesta de gasto aprobada genera el registro de egreso en Tesoreria.
                      Una propuesta de cambio de cuota actualiza las obligaciones de pago. Las decisiones
                      tienen consecuencias reales e inmediatas.
                    </p>
                  </div>
                </div>

                {/* Census */}
                <div className="rounded-xl border p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center rounded-lg bg-amber-50 p-2 text-amber-600">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Censo</h3>
                      <p className="text-xs text-muted-foreground">Census Primitive</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      Rastrea tamano de la comunidad, actividad economica y huella geografica. Con el rail
                      fintech, el Censo reporta actividad economica verificada — dinero real que fluye por la
                      comunidad, no estimaciones. Es clave para federacion y para demostrar escala ante
                      instituciones externas.
                    </p>
                  </div>
                </div>

                {/* Federation */}
                <div className="rounded-xl border p-5 sm:p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center justify-center rounded-lg bg-sky-50 p-2 text-sky-600">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Federacion</h3>
                      <p className="text-xs text-muted-foreground">Federation Primitive</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      Permite que comunidades se reconozcan entre si, coordinen decisiones conjuntas y
                      compartan recursos. Con el rail fintech, tesorerias federadas pueden ejecutar compras
                      conjuntas: cientos de condominios que cambian de proveedor energetico, ONGs que
                      coordinan campanas, o cooperativas que negocian precios al mayoreo — y el pago
                      colectivo se desembolsa desde una cuenta federada.
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
                  Lo que hace a Civitas fundamentalmente distinto es que las tres primitivas forman un ciclo
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

            {/* ─── Fintech Partnership ─── */}
            <section id="fintech" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">5. Alianza Fintech (IFPE)</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Civitas es una plataforma de gobernanza, no una institucion financiera. La infraestructura
                  de pagos la provee un socio IFPE (Institucion de Fondos de Pago Electronico) bajo la Ley
                  Fintech en Mexico. El IFPE genera la CLABE de cada comunidad; los pagos SPEI se reconcilian
                  automaticamente; los desembolsos aprobados por gobernanza se ejecutan por API. Sin
                  discrecion del administrador: la decision es la ejecucion.
                </p>
                <p>
                  <strong className="text-foreground">Modos de Tesoreria (progresivos):</strong> Import (CSV/Excel) en MVP; Conector (sincronizacion con ERP); Rail Fintech (SPEI nativo via IFPE) en Fase 2+; Hibrido (import + rail) en transicion. El dashboard distingue transacciones verificadas por el rail de las reportadas manualmente.
                </p>
              </div>
              <div className="mt-6 rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium text-foreground mb-1">Por que no construir la capa financiera?</p>
                <p className="text-muted-foreground">
                  Obtener una licencia IFPE exige capital significativo y aprobacion CNBV. La alianza permite
                  salir al mercado de inmediato; si la escala lo justifica (miles de comunidades), una licencia
                  propia puede evaluarse como opcion estrategica.
                </p>
              </div>
            </section>

            {/* ─── Social Contract ─── */}
            <section id="social-contract" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">6. Contrato Social Configurable</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Cada comunidad es diferente. Un condominio en la Ciudad de Mexico tiene reglas distintas a una
                  cooperativa agricola en Oaxaca o una parroquia en Guadalajara. Civitas no impone un modelo
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
              <h2 className="mb-4 text-2xl font-bold tracking-tight">7. Arquitectura Tecnica</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Civitas se construye sobre una arquitectura multi-tenant con aislamiento real a nivel de
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
              <h2 className="mb-4 text-2xl font-bold tracking-tight">8. Activacion Progresiva</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Civitas no requiere una transformacion digital completa desde el dia uno. El sistema esta
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
              <h2 className="mb-4 text-2xl font-bold tracking-tight">9. Mercado Objetivo</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Civitas se dirige a cualquier organizacion colectiva que necesite gobernarse, cobrar y
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
                    <tr className="border-b"><td className="py-3 pr-4">Condominios</td><td className="py-3 pr-4 font-medium text-foreground">930,000+</td><td className="py-3">Solo en Mexico. Cero visibilidad, fraude administrativo, sin rendicion de cuentas.</td></tr>
                    <tr className="border-b"><td className="py-3 pr-4">Cooperativas</td><td className="py-3 pr-4 font-medium text-foreground">60,000+</td><td className="py-3">Manufactura, agro, servicios. Asignacion de costos opaca.</td></tr>
                    <tr className="border-b"><td className="py-3 pr-4">ONGs y fundaciones</td><td className="py-3 pr-4 font-medium text-foreground">50,000+</td><td className="py-3">Donantes no pueden verificar gastos; juntas controlan todo.</td></tr>
                    <tr className="border-b"><td className="py-3 pr-4">Comunidades religiosas</td><td className="py-3 pr-4 font-medium text-foreground">28,000+</td><td className="py-3">Sin contabilidad verificable, modelo basado solo en confianza.</td></tr>
                    <tr className="border-b"><td className="py-3 pr-4">Clubes y sindicatos</td><td className="py-3 pr-4 font-medium text-foreground">25,000+ / 15,000+</td><td className="py-3">Juntas deciden; miembros pagan sin visibilidad.</td></tr>
                    <tr><td className="py-3 pr-4">Network States</td><td className="py-3 pr-4 font-medium text-foreground">Emergente</td><td className="py-3">Comunidades digitales que buscan gobernanza soberana.</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 space-y-3 sm:hidden">
                {[
                  { seg: 'Condominios', vol: '930,000+', note: 'Solo en Mexico. Cero visibilidad, mayor urgencia.' },
                  { seg: 'Cooperativas', vol: '60,000+', note: 'Manufactura, agro, servicios.' },
                  { seg: 'ONGs / religiosas', vol: '50K / 28K+', note: 'Donantes y feligreses sin visibilidad.' },
                  { seg: 'Clubes / sindicatos', vol: '25K / 15K+', note: 'Juntas deciden; miembros pagan.' },
                  { seg: 'Network States', vol: 'Emergente', note: 'Gobernanza soberana digital.' },
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

            {/* ─── Revenue ─── */}
            <section id="revenue" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">10. Modelo de Ingresos</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  El sistema de primitivas integradas genera tres fuentes de ingreso que se complementan:
                </p>
                <ul className="ml-4 list-disc space-y-2">
                  <li><strong className="text-foreground">Suscripcion SaaS</strong> — Las comunidades pagan por la plataforma (Identidad + Gobernanza). Ingreso recurrente predecible.</li>
                  <li><strong className="text-foreground">Comision por transaccion</strong> — Un porcentaje sobre pagos procesados por el rail fintech (compartido con el IFPE). Ej.: 0,5% sobre flujo mensual por comunidad puede superar la suscripcion.</li>
                  <li><strong className="text-foreground">Productos financieros</strong> — Futuro: cuentas de ahorro comunitarias, seguros colectivos, poder de compra agregado. El socio IFPE lo habilita sin que Civitas requiera licencia propia.</li>
                </ul>
                <p>
                  Efecto compuesto: miles de comunidades x flujo mensual = volumen procesado recurrente y en crecimiento con la red.
                </p>
              </div>
            </section>

            {/* ─── Deployment ─── */}
            <section id="deployment" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">11. Estrategia de Despliegue</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  La adopcion sigue el dolor, no la ideologia. No vendemos &quot;network states&quot;; vendemos visibilidad sobre el dinero y decisiones que se ejecutan solas.
                </p>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { phase: '1', title: 'Validar', members: '1 edificio, 200 miembros', desc: 'Identidad + Tesoreria (import) + Gobernanza. Sin rail fintech. Validar que transparencia y gobernanza digital tienen product-market fit.' },
                  { phase: '2', title: 'Integrar', members: '10 edificios, 2,000 miembros', desc: 'Activar IFPE. Pagos nativos. Reconciliacion automatica. Pago condiciona voto. Gobernanza ejecutable.' },
                  { phase: '3', title: 'Escalar', members: '100 comunidades, 50,000 miembros', desc: 'Expandir a ONGs, cooperativas, clubes, sindicatos, religiosas. Mismo motor, parametros por vertical. Productos financieros iniciales.' },
                  { phase: '4', title: 'Federar', members: '1,000 comunidades, 500,000 miembros', desc: 'Comunidades federadas. Compras colectivas. Tesorerias federadas ejecutan decisiones conjuntas. Censo con escala verificable.' },
                  { phase: '5', title: 'Network State', members: '10,000+ comunidades, 5M+ miembros', desc: 'Infraestructura institucional completa. Verificacion on-chain cross-border. El contrato social como marco constitucional.' },
                ].map((s) => (
                  <div key={s.phase} className="flex items-start gap-4 rounded-lg border p-4">
                    <span className="text-2xl font-bold text-muted-foreground/30">{s.phase}</span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold">{s.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.members}</p>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ─── Competitive Landscape ─── */}
            <section id="competitive" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Competencia</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Las soluciones existentes cubren fragmentos del problema. Ninguna integra identidad, tesoreria y gobernanza en una sola maquina que funcione en todos los verticales:
                </p>
              </div>
              <div className="mt-6 overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2.5 text-left font-semibold">Capacidad</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Software admin</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Herramientas DAO</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Civic tech</th>
                      <th className="px-3 py-2.5 text-left font-semibold">Civitas v3</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="px-3 py-2 font-medium text-foreground">Identidad</td><td className="px-3 py-2">Gestionada por admin</td><td className="px-3 py-2">Wallet</td><td className="px-3 py-2">Registro electoral</td><td className="px-3 py-2">Estado dinamico + standing</td></tr>
                    <tr className="border-b"><td className="px-3 py-2 font-medium text-foreground">Tesoreria</td><td className="px-3 py-2">Solo admin</td><td className="px-3 py-2">On-chain</td><td className="px-3 py-2">—</td><td className="px-3 py-2">Todos los miembros (tiempo real, verificable)</td></tr>
                    <tr className="border-b"><td className="px-3 py-2 font-medium text-foreground">Gobernanza</td><td className="px-3 py-2">—</td><td className="px-3 py-2">Peso por token</td><td className="px-3 py-2">Solo votar</td><td className="px-3 py-2">Configurable + ejecutable</td></tr>
                    <tr className="border-b"><td className="px-3 py-2 font-medium text-foreground">Cobro de pagos</td><td className="px-3 py-2">Banco aparte</td><td className="px-3 py-2">Transferencias token</td><td className="px-3 py-2">—</td><td className="px-3 py-2">SPEI nativo (integrado)</td></tr>
                    <tr className="border-b"><td className="px-3 py-2 font-medium text-foreground">Ejecucion de decisiones</td><td className="px-3 py-2">Manual (admin)</td><td className="px-3 py-2">Smart contract</td><td className="px-3 py-2">—</td><td className="px-3 py-2">Auto-desembolso via IFPE</td></tr>
                    <tr className="border-b"><td className="px-3 py-2 font-medium text-foreground">Pago condiciona derechos</td><td className="px-3 py-2">—</td><td className="px-3 py-2">Por token</td><td className="px-3 py-2">—</td><td className="px-3 py-2">Configurable por comunidad</td></tr>
                    <tr><td className="px-3 py-2 font-medium text-foreground">Multi-vertical</td><td className="px-3 py-2">Un vertical</td><td className="px-3 py-2">Solo crypto</td><td className="px-3 py-2">Solo gobierno</td><td className="px-3 py-2">Cualquier comunidad organizada</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Civitas es el unico sistema donde las decisiones tienen consecuencias financieras automaticas en cualquier tipo de comunidad.
              </p>
            </section>

            {/* ─── Risks & Security ─── */}
            <section id="risks" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">Riesgos y Seguridad</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p><strong className="text-foreground">Riesgos clave y mitigaciones:</strong> fallo del socio IFPE → segregacion de fondos, migracion a otro IFPE, modo import como respaldo. Abuso de auto-ejecucion → periodos de enfriamiento configurables, umbrales, opcion de override manual. Cambios regulatorios → arquitectura de capa financiera intercambiable.</p>
                <p><strong className="text-foreground">Seguridad:</strong> RLS por comunidad en base de datos; votos inmutables y auditoria completa; comunicaciones con IFPE por TLS y verificacion de webhooks; periodos de enfriamiento entre voto y desembolso. Civitas no almacena credenciales bancarias; el IFPE cumple reporteo regulatorio.</p>
              </div>
            </section>

            {/* ─── Conclusion ─── */}
            <section id="vision" className="mb-14 scroll-mt-20">
              <h2 className="mb-4 text-2xl font-bold tracking-tight">12. Conclusión</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Civitas no es solo una herramienta de administracion. Es infraestructura para que cualquier
                  grupo humano pueda gobernarse a si mismo de forma transparente, democratica y eficiente.
                </p>
                <p>
                  En v3 conectamos todo: un socio fintech aporta el rail financiero, la gobernanza ejecutable
                  cierra la brecha entre decision y accion, y el motor de reglas configurable permite que cada
                  comunidad defina como interactuan las piezas. Cualquier comunidad — condominio, ONG,
                  cooperativa, club, sindicato — puede decir: &quot;Votamos contratar a esta empresa y el dinero se
                  transfirio automaticamente. Todos lo vemos. Nadie tuvo que confiar en la junta.&quot;
                </p>
                <p>
                  Eso es imposible con las herramientas actuales. En Civitas es rutinario. Las cinco primitivas
                  son universales. El motor es configurable. Los verticales son plugins. El rail financiero mueve
                  dinero real. El motor de reglas hace cumplir de verdad.
                </p>
                <p className="text-foreground font-medium">
                  Civitas no es un network state. Civitas es infraestructura que hace posibles los network states.
                </p>
                <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Referencias</p>
                  <p>[1] Srinivasan, B. (2022). The Network State: How to Start a New Country.</p>
                  <p>[2] Ley para Regular las Instituciones de Tecnologia Financiera (2018). DOF Mexico.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="rounded-xl border bg-muted/30 p-6 sm:p-8 text-center">
              <h3 className="text-xl font-bold">Construye con nosotros</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Civitas esta en desarrollo activo. Crea tu comunidad hoy y se parte
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
            <span className="font-semibold">Civitas</span>
          </div>
          <span className="text-sm text-muted-foreground">Whitepaper v4 — Febrero 2026</span>
        </div>
      </footer>
    </div>
  )
}
