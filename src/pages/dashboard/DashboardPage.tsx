import { useState, lazy, Suspense } from 'react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useDashboard } from '@/core/treasury/hooks/useDashboard'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { useDataSources } from '@/ingestion/hooks/useDataSources'
import { useCommunityContext } from '@/app/providers'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { AuditLog } from '@/shared/components/AuditLog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { IncomeVsExpenseChart } from '@/core/treasury/components/IncomeVsExpenseChart'
import { MorosoStatusBanner } from '@/core/identity/components/MorosoStatusBanner'
import { formatCurrency, formatDateTime } from '@/shared/lib/utils'
import { hasPermission, type Role } from '@/shared/types'
import {
  Users, Wallet, Vote, Upload, TrendingUp, TrendingDown,
  AlertTriangle, AlertCircle, Shield, UserCheck, BarChart3,
  ChevronDown,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { QuickActions } from '@/core/gamification/components/QuickActions'
import { SocialNudge } from '@/core/gamification/components/SocialNudge'
import { cn } from '@/shared/lib/utils'

/* ── Lazy-loaded secondary sections (loaded after first paint) ── */
const DailyGoals = lazy(() => import('@/core/gamification/components/DailyGoals').then(m => ({ default: m.DailyGoals })))
const CommunityPulse = lazy(() => import('@/core/gamification/components/CommunityPulse').then(m => ({ default: m.CommunityPulse })))
const Leaderboard = lazy(() => import('@/core/gamification/components/Leaderboard').then(m => ({ default: m.Leaderboard })))
const GamificationSummary = lazy(() => import('@/core/gamification/components/GamificationSummary').then(m => ({ default: m.GamificationSummary })))

/* ── Collapsible section for progressive disclosure on mobile ── */
function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-lg"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-out',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            {open && children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { community, currentMember } = useCommunityContext()
  const { data: members, isLoading: membersLoading, error: membersError } = useMembers()
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboard()
  const { data: proposals, isLoading: _proposalsLoading } = useProposals('active')
  const { data: sources } = useDataSources()
  const { data: obligations, isLoading: _obligationsLoading } = usePaymentObligations()
  const { rules, financialStanding, treasuryMode, isPaymentToVoteEnabled } = useRulesEngine()

  const userRole = (currentMember?.role ?? 'observador') as Role
  const isAdmin = hasPermission(userRole, 'admin')

  const lastSync = sources
    ?.filter((s) => s.last_sync_at)
    .sort((a, b) => (b.last_sync_at! > a.last_sync_at! ? 1 : -1))[0]

  const overdueObligations = obligations?.filter(
    (o) => o.status === 'pending' && new Date(o.due_date) < new Date()
  ) ?? []

  const queryError = membersError || statsError
  const hasNoData = !members && !stats && !proposals && !obligations
  const isFirstLoad = hasNoData && (membersLoading || statsLoading)

  const goodStandingCount = members?.filter((m) => !m.financial_standing || m.financial_standing === 'good_standing').length ?? 0
  const delinquentCount = members?.filter((m) => m.financial_standing === 'delinquent').length ?? 0

  if (isFirstLoad) {
    return <LoadingSpinner message="Cargando..." className="py-20" />
  }

  const firstName = currentMember?.full_name?.split(' ')[0]
    || currentMember?.email?.split('@')[0]
    || 'Vecino'

  return (
    <div className="space-y-6">
      {queryError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Error al cargar algunos datos. Intenta recargar la pagina.</span>
        </div>
      )}

      <MorosoStatusBanner />

      {/* ─── Friendly Header ─── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl text-balance">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {community?.name ?? 'Tu comunidad'}
        </p>
      </div>

      {/* ─── Quick Actions: always visible, highest priority ─── */}
      <QuickActions />

      {/* ─── Alerts (only if relevant, always visible) ─── */}
      {(overdueObligations.length > 0 || (proposals && proposals.length > 0)) && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {overdueObligations.length > 0 && (
            <Link to="/treasury" className="block">
              <Card className="border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">
                      {overdueObligations.length} pago{overdueObligations.length !== 1 ? 's' : ''} vencido{overdueObligations.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total: {formatCurrency(overdueObligations.reduce((sum, o) => sum + Number(o.amount), 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {proposals && proposals.length > 0 && (
            <Link to="/governance" className="block">
              <Card className="border-chart-1/30 bg-chart-1/5 hover:bg-chart-1/10 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-chart-1/10">
                    <Vote className="h-5 w-5 text-chart-1" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">
                      {proposals.length} propuesta{proposals.length !== 1 ? 's' : ''} en votacion
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proposals.slice(0, 2).map((p) => (
                        <Badge key={p.id} variant="default" className="text-xs max-w-[140px] truncate">{p.title}</Badge>
                      ))}
                      {proposals.length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{proposals.length - 2}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* ─── Social Nudges: light, non-blocking ─── */}
      <SocialNudge />

      {/* ─── Secondary sections: collapsible on all, lazy-loaded ─── */}
      <Suspense fallback={null}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DailyGoals />
          <CommunityPulse />
        </div>
      </Suspense>

      <Suspense fallback={null}>
        <CollapsibleSection title="Tu progreso y ranking" icon={Users} defaultOpen={false}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <GamificationSummary />
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3 px-0 pt-0">
                <CardTitle className="text-base">Vecinos mas activos</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Leaderboard limit={5} compact />
              </CardContent>
            </Card>
          </div>
        </CollapsibleSection>
      </Suspense>

      {/* ─── Admin-only section: Financial overview ─── */}
      {isAdmin && (
        <>
          {/* Key stats - always visible for admins, compact on mobile */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Miembros</span>
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="text-lg font-bold">{members?.length ?? 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Ingresos</span>
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                </div>
                <div className="text-lg font-bold text-success">
                  {stats ? formatCurrency(stats.totalIncome) : '$0.00'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Egresos</span>
                  <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                </div>
                <div className="text-lg font-bold text-destructive">
                  {stats ? formatCurrency(stats.totalExpenses) : '$0.00'}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">Balance</span>
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="text-lg font-bold">
                  {stats ? formatCurrency(stats.balance) : '$0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts and activity - collapsible */}
          <CollapsibleSection title="Detalle financiero" icon={Wallet} defaultOpen={false}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium mb-3">Ingresos vs Egresos</h4>
                <IncomeVsExpenseChart data={stats?.monthlyData ?? []} />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Actividad</h4>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Vote className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Propuestas activas</p>
                      <p className="text-xs text-muted-foreground">{proposals?.length ?? 0} en votacion</p>
                    </div>
                  </div>
                  <Link to="/governance">
                    <Button variant="outline" size="sm">Ver</Button>
                  </Link>
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Ultima importacion</p>
                      <p className="text-xs text-muted-foreground">
                        {lastSync?.last_sync_at
                          ? formatDateTime(lastSync.last_sync_at)
                          : 'Sin datos importados'}
                      </p>
                    </div>
                  </div>
                  <Link to="/ingestion">
                    <Button variant="outline" size="sm">Importar</Button>
                  </Link>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* System configuration - collapsible */}
          <CollapsibleSection title="Configuracion del sistema" icon={Shield} defaultOpen={false}>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-chart-4" />
                  <span className="text-sm font-medium">Identidad</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tu standing</span>
                    <Badge variant={financialStanding === 'good_standing' ? 'default' : financialStanding === 'grace_period' ? 'secondary' : 'destructive'}>
                      {financialStanding === 'good_standing' ? 'Al corriente' : financialStanding === 'grace_period' ? 'Periodo de gracia' : 'Moroso'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pago a Voto</span>
                    <Badge variant={isPaymentToVoteEnabled ? 'default' : 'secondary'}>
                      {isPaymentToVoteEnabled ? 'Activo' : 'Desactivado'}
                    </Badge>
                  </div>
                  {members && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Corriente / Morosos</span>
                      <span className="font-medium">{goodStandingCount} / {delinquentCount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium">Tesoreria</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Modo</span>
                    <Badge variant="secondary">{treasuryMode}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Moneda</span>
                    <span className="font-medium">{rules.treasury.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Limite admin</span>
                    <span className="font-medium">{formatCurrency(rules.treasury.admin_spending_limit)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-chart-1" />
                  <span className="text-sm font-medium">Gobernanza</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Auto-ejecucion</span>
                    <Badge variant={rules.governance.auto_execution_enabled ? 'default' : 'secondary'}>
                      {rules.governance.auto_execution_enabled ? 'Activa' : 'Manual'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delegacion</span>
                    <Badge variant={rules.governance.delegation_enabled ? 'default' : 'secondary'}>
                      {rules.governance.delegation_enabled ? 'Activa' : 'Desactivada'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Enfriamiento</span>
                    <span className="font-medium">{rules.governance.cool_down_hours}h</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to="/settings">
                <Button variant="outline" size="sm">Configurar Reglas</Button>
              </Link>
              <Link to="/census">
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-3 w-3" />
                  Ver Censo
                </Button>
              </Link>
            </div>
          </CollapsibleSection>
        </>
      )}

      {/* Audit log - collapsible */}
      <CollapsibleSection title="Actividad reciente" icon={AlertCircle} defaultOpen={false}>
        <AuditLog compact />
      </CollapsibleSection>
    </div>
  )
}
