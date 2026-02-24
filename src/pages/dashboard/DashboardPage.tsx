import { useMemo } from 'react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useDashboard } from '@/core/treasury/hooks/useDashboard'
import { useCollectionStats } from '@/core/treasury/hooks/usePaymentStatus'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { useAssemblies } from '@/core/governance/hooks/useAssemblies'
import { useTransactions } from '@/core/treasury/hooks/useTransactions'
import { useCommunityContext } from '@/app/providers'
import { useTenant } from '@/app/providers/TenantProvider'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { AuditLog } from '@/shared/components/AuditLog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { IncomeVsExpenseChart } from '@/core/treasury/components/IncomeVsExpenseChart'
import { MorosoStatusBanner } from '@/core/identity/components/MorosoStatusBanner'
import { formatCurrency } from '@/shared/lib/utils'
import { hasPermission, type Role } from '@/shared/types'
import {
  Users, Wallet, Vote, TrendingUp, TrendingDown,
  AlertCircle, Shield, UserCheck, BarChart3,
  ArrowUpCircle, Receipt, Calendar, FileText, ChevronRight,
  Heart, Activity,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { Button } from '@/shared/components/ui/button'
import { QuickActions } from '@/pages/dashboard/components/QuickActions'
import { FirstStepsChecklist } from '@/pages/dashboard/components/FirstStepsChecklist'
import { AnnouncementFeed } from '@/core/announcements/components/AnnouncementFeed'

// ---------------------------------------------------------------------------
// Nation Health — composite score from 4 pillars
// ---------------------------------------------------------------------------

interface NationHealth {
  overall: number
  identity: number
  treasury: number
  governance: number
  label: string
  color: string
}

function computeNationHealth(params: {
  memberCount: number
  activeCount: number
  delinquentCount: number
  balance: number
  collectionRate: number
  activeProposals: number
  overdueCount: number
}): NationHealth {
  const { memberCount, activeCount, delinquentCount, balance, collectionRate, activeProposals, overdueCount } = params

  // Identity pillar (0-100): based on member activity ratio + delinquency
  const memberRatio = memberCount > 0 ? activeCount / memberCount : 0
  const delinquentRatio = memberCount > 0 ? 1 - delinquentCount / memberCount : 1
  const identity = Math.round((memberRatio * 50 + delinquentRatio * 50))

  // Treasury pillar (0-100): balance health + collection rate
  const balanceScore = balance >= 0 ? 100 : Math.max(0, 50 + balance / 100)
  const collectionScore = collectionRate * 100
  const overdueScore = Math.max(0, 100 - overdueCount * 10)
  const treasury = Math.round((balanceScore * 0.3 + collectionScore * 0.4 + overdueScore * 0.3))

  // Governance pillar (0-100): having active governance is good
  const hasGovernance = activeProposals > 0 ? 100 : 60
  const governance = hasGovernance

  const overall = Math.round(identity * 0.35 + treasury * 0.40 + governance * 0.25)

  let label: string
  let color: string
  if (overall >= 80) { label = 'Excelente'; color = 'text-green-600' }
  else if (overall >= 60) { label = 'Saludable'; color = 'text-blue-600' }
  else if (overall >= 40) { label = 'Atención'; color = 'text-yellow-600' }
  else { label = 'Crítico'; color = 'text-red-600' }

  return { overall, identity, treasury, governance, label, color }
}

// ---------------------------------------------------------------------------
// Dashboard — Estado de la Nación
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { community, currentMember } = useCommunityContext()
  const { labels, isAdmin: tenantIsAdmin, legalFramework } = useTenant()
  const path = useCommunityPath()
  const { data: members, isLoading: membersLoading, error: membersError } = useMembers()
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboard()
  const { data: collStats } = useCollectionStats()
  const { data: activeProposals } = useProposals('active')
  const { data: assemblies } = useAssemblies()
  const { data: recentTx } = useTransactions()
  const { rules, financialStanding, treasuryMode, isPaymentToVoteEnabled } = useRulesEngine()

  const userRole = (currentMember?.role ?? 'observador') as Role
  const isAdmin = hasPermission(userRole, 'admin')

  const queryError = membersError || statsError
  const isFirstLoad = !members && !stats && (membersLoading || statsLoading)

  const hasFinancialData = stats && (stats.totalIncome > 0 || stats.totalExpenses > 0)
  const activeCount = members?.filter((m) => m.status === 'active').length ?? 0
  const goodStandingCount = members?.filter((m) => !m.financial_standing || m.financial_standing === 'good_standing').length ?? 0
  const delinquentCount = members?.filter((m) => m.financial_standing === 'delinquent').length ?? 0

  const upcomingAssemblies = assemblies
    ?.filter((a) => a.status === 'scheduled' && new Date(a.scheduled_date) >= new Date())
    .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
    .slice(0, 3) ?? []

  const latestTransactions = (recentTx ?? []).slice(0, 5)

  // Compute nation health
  const health = useMemo(() => computeNationHealth({
    memberCount: members?.length ?? 0,
    activeCount,
    delinquentCount,
    balance: stats?.balance ?? 0,
    collectionRate: collStats?.collectionRate ?? 0,
    activeProposals: activeProposals?.length ?? 0,
    overdueCount: collStats?.overdueCount ?? 0,
  }), [members, activeCount, delinquentCount, stats, collStats, activeProposals])

  if (isFirstLoad) {
    return <LoadingSpinner message="Cargando..." className="py-20" />
  }

  const firstName = currentMember?.full_name?.split(' ')[0]
    || currentMember?.email?.split('@')[0]
    || labels.member

  return (
    <div className="space-y-6">
      {queryError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Error al cargar algunos datos. Intenta recargar la página.</span>
        </div>
      )}

      <MorosoStatusBanner />

      {/* Estado de la Nación — Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Estado de la Nación
          </h1>
          <p className="text-sm text-muted-foreground">
            {community?.name ?? labels.community} &middot; Hola, {firstName}
          </p>
          {legalFramework && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">
              Marco legal: {legalFramework.displayName}
            </p>
          )}
        </div>
        {/* Health indicator */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-2 justify-end">
            <Heart className={`h-5 w-5 ${health.color}`} />
            <span className={`text-2xl font-bold ${health.color}`}>{health.overall}%</span>
          </div>
          <p className={`text-xs font-medium ${health.color}`}>{health.label}</p>
        </div>
      </div>

      {/* Health pillars — mini progress bars */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs font-medium">{labels.memberPlural}</span>
              <span className="ml-auto text-xs font-bold">{health.identity}%</span>
            </div>
            <Progress value={health.identity} className="h-1.5" />
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Wallet className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs font-medium">Hacienda</span>
              <span className="ml-auto text-xs font-bold">{health.treasury}%</span>
            </div>
            <Progress value={health.treasury} className="h-1.5" />
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Vote className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-medium">Gobierno</span>
              <span className="ml-auto text-xs font-bold">{health.governance}%</span>
            </div>
            <Progress value={health.governance} className="h-1.5" />
          </div>
        </div>
      )}

      {isAdmin && <FirstStepsChecklist />}

      <QuickActions />

      <AnnouncementFeed limit={3} />

      {/* KPI row — visible for admins */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          <Card className="rounded-xl border-border/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">{labels.memberPlural}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{members?.length ?? 0}</div>
            </CardContent>
          </Card>

          {hasFinancialData && (
            <>
              <Card className="rounded-xl border-border/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold ${(stats?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats?.balance ?? 0)}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Ingresos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(stats!.totalIncome)}</div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Egresos</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-600">{formatCurrency(stats!.totalExpenses)}</div>
                </CardContent>
              </Card>
            </>
          )}

          {collStats && (
            <>
              <Card className="rounded-xl border-border/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Tasa cobro</CardTitle>
                  <ArrowUpCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{((collStats.collectionRate ?? 0) * 100).toFixed(0)}%</div>
                  <Progress value={(collStats.collectionRate ?? 0) * 100} className="mt-1 h-1.5" />
                </CardContent>
              </Card>

              <Card className="rounded-xl border-border/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground">Vencidos</CardTitle>
                  <Receipt className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-red-600">{collStats.overdueCount ?? 0}</div>
                  {collStats.overdueAmount > 0 && (
                    <p className="text-xs text-muted-foreground">{formatCurrency(collStats.overdueAmount)}</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Two-column layout: governance + finance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Governance widgets */}
        <div className="space-y-4">
          {/* Active proposals */}
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Vote className="h-4 w-4 text-blue-500" />
                Propuestas activas
              </CardTitle>
              <Link to={path('governance')}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Ver todas <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {!activeProposals?.length ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin propuestas activas</p>
              ) : (
                <div className="space-y-2">
                  {activeProposals.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      to={path(`governance/${p.id}`)}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.type || 'general'}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {p.status === 'active' ? 'Votando' : p.status}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming assemblies */}
          <Card className="rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-violet-500" />
                Próximas asambleas
              </CardTitle>
              <Link to={path('governance')}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  Ver todas <ChevronRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {upcomingAssemblies.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Sin asambleas programadas</p>
              ) : (
                <div className="space-y-2">
                  {upcomingAssemblies.map((a) => (
                    <Link
                      key={a.id}
                      to={path(`governance/assemblies/${a.id}`)}
                      className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      <Calendar className="h-4 w-4 shrink-0 text-violet-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.scheduled_date).toLocaleDateString('es-MX', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 text-xs">{a.status}</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Financial widgets */}
        <div className="space-y-4">
          {/* Chart */}
          {isAdmin && hasFinancialData && stats && (
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ingresos vs Egresos</CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeVsExpenseChart data={stats.monthlyData ?? []} />
              </CardContent>
            </Card>
          )}

          {/* Recent transactions */}
          {isAdmin && latestTransactions.length > 0 && (
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-emerald-500" />
                  Últimas transacciones
                </CardTitle>
                <Link to={path('treasury')}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    Ver todas <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {latestTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || tx.category_name || 'Transacción'}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                          {tx.category_name ? ` · ${tx.category_name}` : ''}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-base">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLog compact />
        </CardContent>
      </Card>

      {/* System config — admin only */}
      {isAdmin && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Configuración del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-violet-500" />
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
                    <span className="text-muted-foreground">Pago → Voto</span>
                    <Badge variant={isPaymentToVoteEnabled ? 'default' : 'secondary'}>
                      {isPaymentToVoteEnabled ? 'Activo' : 'Desactivado'}
                    </Badge>
                  </div>
                  {members && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Al corriente / Morosos</span>
                      <span className="font-medium">{goodStandingCount} / {delinquentCount}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Tesorería</span>
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
                    <span className="text-muted-foreground">Límite admin</span>
                    <span className="font-medium">{formatCurrency(rules.treasury.admin_spending_limit)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Vote className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Gobernanza</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Auto-ejecución</span>
                    <Badge variant={rules.governance.auto_execution_enabled ? 'default' : 'secondary'}>
                      {rules.governance.auto_execution_enabled ? 'Activa' : 'Manual'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delegación</span>
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

            <div className="mt-4 flex gap-2">
              <Link to={path('settings')}>
                <Button variant="outline" size="sm">Configurar Reglas</Button>
              </Link>
              <Link to={path('census')}>
                <Button variant="outline" size="sm">
                  <BarChart3 className="mr-2 h-3 w-3" />
                  Ver Censo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
