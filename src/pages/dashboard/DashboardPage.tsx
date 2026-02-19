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
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { DailyGoals } from '@/core/gamification/components/DailyGoals'
import { CommunityPulse } from '@/core/gamification/components/CommunityPulse'
import { QuickActions } from '@/core/gamification/components/QuickActions'
import { SocialNudge } from '@/core/gamification/components/SocialNudge'
import { Leaderboard } from '@/core/gamification/components/Leaderboard'
import { GamificationSummary } from '@/core/gamification/components/GamificationSummary'

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
          <span>Error al cargar algunos datos. Intenta recargar la página.</span>
        </div>
      )}

      <MorosoStatusBanner />

      {/* ─── Friendly Header ─── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {community?.name ?? 'Tu comunidad'}
        </p>
      </div>

      {/* ─── Quick Actions: What should I do NOW? (Trigger) ─── */}
      <QuickActions />

      {/* ─── Social Nudges: What are others doing? (FOMO) ─── */}
      <SocialNudge />

      {/* ─── Main Content: Goals + Pulse (Behavioral Loops) ─── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Daily Goals = Trigger → Action → Reward → Progress → Return */}
        <DailyGoals />

        {/* Community Pulse = Collective Progress → Belonging */}
        <CommunityPulse />
      </div>

      {/* ─── Gamification: Progress + Leaderboard (Status + Competition) ─── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <GamificationSummary />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Vecinos más activos</CardTitle>
          </CardHeader>
          <CardContent>
            <Leaderboard limit={5} compact />
          </CardContent>
        </Card>
      </div>

      {/* ─── Alerts (only if relevant) ─── */}
      {(overdueObligations.length > 0 || (proposals && proposals.length > 0)) && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {overdueObligations.length > 0 && (
            <Link to="/treasury" className="block">
              <Card className="border-red-200 bg-red-50/50 hover:bg-red-50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 pt-6">
                  <AlertTriangle className="h-8 w-8 text-red-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800">
                      {overdueObligations.length} pago{overdueObligations.length !== 1 ? 's' : ''} vencido{overdueObligations.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-red-600">
                      Total: {formatCurrency(overdueObligations.reduce((sum, o) => sum + Number(o.amount), 0))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {proposals && proposals.length > 0 && (
            <Link to="/governance" className="block">
              <Card className="border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4 pt-6">
                  <Vote className="h-8 w-8 text-blue-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-800">
                      {proposals.length} propuesta{proposals.length !== 1 ? 's' : ''} en votación
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proposals.slice(0, 3).map((p) => (
                        <Badge key={p.id} variant="default" className="text-xs">{p.title}</Badge>
                      ))}
                      {proposals.length > 3 && (
                        <Badge variant="default" className="text-xs">+{proposals.length - 3} más</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>
      )}

      {/* ─── Admin-only section: Financial overview ─── */}
      {isAdmin && (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Miembros</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{members?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">miembros activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {stats ? formatCurrency(stats.totalIncome) : '$0.00'}
                </div>
                <p className="text-xs text-muted-foreground">total acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Egresos</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {stats ? formatCurrency(stats.totalExpenses) : '$0.00'}
                </div>
                <p className="text-xs text-muted-foreground">total acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {stats ? formatCurrency(stats.balance) : '$0.00'}
                </div>
                <p className="text-xs text-muted-foreground">disponible</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ingresos vs Egresos</CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeVsExpenseChart data={stats?.monthlyData ?? []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Actividad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex items-center gap-3">
                    <Vote className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Propuestas activas</p>
                      <p className="text-xs text-muted-foreground">{proposals?.length ?? 0} en votación</p>
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
                      <p className="text-sm font-medium">Última importación</p>
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
              </CardContent>
            </Card>
          </div>

          {/* System status — admin only */}
          <Card>
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
            </CardContent>
          </Card>
        </>
      )}

      {/* Audit log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLog compact />
        </CardContent>
      </Card>
    </div>
  )
}
