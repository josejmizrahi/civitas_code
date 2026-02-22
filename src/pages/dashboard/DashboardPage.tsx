import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useDashboard } from '@/core/treasury/hooks/useDashboard'
import { useCommunityContext } from '@/app/providers'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { AuditLog } from '@/shared/components/AuditLog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { IncomeVsExpenseChart } from '@/core/treasury/components/IncomeVsExpenseChart'
import { MorosoStatusBanner } from '@/core/identity/components/MorosoStatusBanner'
import { formatCurrency } from '@/shared/lib/utils'
import { hasPermission, type Role } from '@/shared/types'
import {
  Users, Wallet, Vote, TrendingUp, TrendingDown,
  AlertCircle, Shield, UserCheck, BarChart3,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { QuickActions } from '@/pages/dashboard/components/QuickActions'
import { FirstStepsChecklist } from '@/pages/dashboard/components/FirstStepsChecklist'

export function DashboardPage() {
  const { community, currentMember } = useCommunityContext()
  const { data: members, isLoading: membersLoading, error: membersError } = useMembers()
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboard()
  const { rules, financialStanding, treasuryMode, isPaymentToVoteEnabled } = useRulesEngine()

  const userRole = (currentMember?.role ?? 'observador') as Role
  const isAdmin = hasPermission(userRole, 'admin')

  const queryError = membersError || statsError
  const isFirstLoad = !members && !stats && (membersLoading || statsLoading)

  const hasFinancialData = stats && (stats.totalIncome > 0 || stats.totalExpenses > 0)
  const goodStandingCount = members?.filter((m) => !m.financial_standing || m.financial_standing === 'good_standing').length ?? 0
  const delinquentCount = members?.filter((m) => m.financial_standing === 'delinquent').length ?? 0

  if (isFirstLoad) {
    return <LoadingSpinner message="Cargando..." className="py-20" />
  }

  const memberLabel = typeof (community?.config as Record<string, unknown>)?.member_label === 'string'
    ? (community!.config as Record<string, string>).member_label
    : 'Miembro'

  const firstName = currentMember?.full_name?.split(' ')[0]
    || currentMember?.email?.split('@')[0]
    || memberLabel

  return (
    <div className="space-y-6">
      {queryError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Error al cargar algunos datos. Intenta recargar la página.</span>
        </div>
      )}

      <MorosoStatusBanner />

      {/* ─── Header ─── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Hola, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {community?.name ?? 'Tu comunidad'}
        </p>
      </div>

      {/* ─── Primeros pasos (admin, hero para comunidad nueva) ─── */}
      {isAdmin && <FirstStepsChecklist />}

      {/* ─── Acciones prioritarias (pagos vencidos, propuestas activas, etc.) ─── */}
      <QuickActions />

      {/* ─── Resumen financiero — solo admin, solo cuando hay datos ─── */}
      {isAdmin && hasFinancialData && (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Miembros</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{members?.length ?? 0}</div>
                <p className="text-xs text-muted-foreground">activos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalIncome)}
                </div>
                <p className="text-xs text-muted-foreground">acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Egresos</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {formatCurrency(stats.totalExpenses)}
                </div>
                <p className="text-xs text-muted-foreground">acumulado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {formatCurrency(stats.balance)}
                </div>
                <p className="text-xs text-muted-foreground">disponible</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingresos vs Egresos</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeVsExpenseChart data={stats.monthlyData ?? []} />
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Actividad reciente (feed) ─── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLog compact />
        </CardContent>
      </Card>

      {/* ─── Configuración del sistema — solo admin ─── */}
      {isAdmin && (
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
      )}
    </div>
  )
}
