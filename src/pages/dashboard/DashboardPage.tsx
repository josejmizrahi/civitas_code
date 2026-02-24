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
import { useI18n } from '@/shared/hooks/useI18n'
import { AuditLog } from '@/shared/components/AuditLog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { PageHeader } from '@/shared/components/ui/page-header'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { IncomeVsExpenseChart } from '@/core/treasury/components/IncomeVsExpenseChart'
import { MorosoStatusBanner } from '@/core/identity/components/MorosoStatusBanner'
import { formatCurrency } from '@/shared/lib/utils'
import { hasPermission, type Role } from '@/shared/types'
import {
  AlertCircle, Heart, Vote, Calendar,
  FileText, ChevronRight, Receipt,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { Button } from '@/shared/components/ui/button'
import { QuickActions } from '@/pages/dashboard/components/QuickActions'
import { FirstStepsChecklist } from '@/pages/dashboard/components/FirstStepsChecklist'
import { AnnouncementFeed } from '@/core/announcements/components/AnnouncementFeed'
import { HealthPillars } from '@/pages/dashboard/components/HealthPillars'
import { KpiRow } from '@/pages/dashboard/components/KpiRow'
import { SystemConfigPanel } from '@/pages/dashboard/components/SystemConfigPanel'

// ---------------------------------------------------------------------------
// Nation Health — composite score from 4 pillars
// ---------------------------------------------------------------------------

type HealthLevel = 'excellent' | 'healthy' | 'attention' | 'critical'

interface NationHealth {
  overall: number
  identity: number
  treasury: number
  governance: number
  level: HealthLevel
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

  const memberRatio = memberCount > 0 ? activeCount / memberCount : 0
  const delinquentRatio = memberCount > 0 ? 1 - delinquentCount / memberCount : 1
  const identity = Math.round((memberRatio * 50 + delinquentRatio * 50))

  const balanceScore = balance >= 0 ? 100 : Math.max(0, 50 + balance / 100)
  const collectionScore = collectionRate * 100
  const overdueScore = Math.max(0, 100 - overdueCount * 10)
  const treasury = Math.round((balanceScore * 0.3 + collectionScore * 0.4 + overdueScore * 0.3))

  const governance = activeProposals > 0 ? 100 : 60

  const overall = Math.round(identity * 0.35 + treasury * 0.40 + governance * 0.25)

  let level: HealthLevel
  let color: string
  if (overall >= 80) { level = 'excellent'; color = 'text-green-600' }
  else if (overall >= 60) { level = 'healthy'; color = 'text-blue-600' }
  else if (overall >= 40) { level = 'attention'; color = 'text-yellow-600' }
  else { level = 'critical'; color = 'text-red-600' }

  return { overall, identity, treasury, governance, level, color }
}

// ---------------------------------------------------------------------------
// Dashboard — Estado de la Nación
// ---------------------------------------------------------------------------

export function DashboardPage() {
  const { community, currentMember } = useCommunityContext()
  const { labels, legalFramework } = useTenant()
  const path = useCommunityPath()
  const { data: members, isLoading: membersLoading, error: membersError } = useMembers()
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboard()
  const { data: collStats } = useCollectionStats()
  const { data: activeProposals } = useProposals('active')
  const { data: assemblies } = useAssemblies()
  const { data: recentTx } = useTransactions()
  const { rules, financialStanding, treasuryMode, isPaymentToVoteEnabled } = useRulesEngine()
  const { t } = useI18n()

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
    return <LoadingSpinner message={t('dashboard.loading')} className="py-20" />
  }

  const firstName = currentMember?.full_name?.split(' ')[0]
    || currentMember?.email?.split('@')[0]
    || labels.member

  return (
    <div className="space-y-6">
      {queryError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{t('dashboard.error')}</span>
        </div>
      )}

      <MorosoStatusBanner />

      {/* Header + Health indicator */}
      <PageHeader
        title={t('dashboard.title')}
        subtitle={`${community?.name ?? labels.community} \u00b7 ${t('dashboard.greeting')}, ${firstName}`}
        meta={legalFramework ? `${t('dashboard.legalFramework')}: ${legalFramework.displayName}` : undefined}
        actions={
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Heart className={`h-5 w-5 ${health.color}`} />
              <span className={`text-2xl font-bold ${health.color}`}>{health.overall}%</span>
            </div>
            <p className={`text-xs font-medium ${health.color}`}>
              {t(`dashboard.health.${health.level}` as any)}
            </p>
          </div>
        }
      />

      {isAdmin && (
        <HealthPillars
          identity={health.identity}
          treasury={health.treasury}
          governance={health.governance}
          memberLabel={labels.memberPlural}
        />
      )}

      {isAdmin && <FirstStepsChecklist />}
      <QuickActions />
      <AnnouncementFeed limit={3} />

      {/* KPI row */}
      {isAdmin && (
        <KpiRow
          memberCount={members?.length ?? 0}
          memberLabel={labels.memberPlural}
          balance={stats?.balance}
          totalIncome={stats?.totalIncome}
          totalExpenses={stats?.totalExpenses}
          collectionRate={collStats?.collectionRate}
          overdueCount={collStats?.overdueCount}
          overdueAmount={collStats?.overdueAmount}
          hasFinancialData={!!hasFinancialData}
        />
      )}

      {/* Two-column layout: governance + finance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Governance widgets */}
        <div className="space-y-4">
          <ProposalWidget proposals={activeProposals} pathFn={path} t={t} />
          <AssemblyWidget assemblies={upcomingAssemblies} pathFn={path} t={t} />
        </div>

        {/* Financial widgets */}
        <div className="space-y-4">
          {isAdmin && hasFinancialData && stats && (
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t('dashboard.incomeVsExpense')}</CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeVsExpenseChart data={stats.monthlyData ?? []} />
              </CardContent>
            </Card>
          )}

          {isAdmin && latestTransactions.length > 0 && (
            <Card className="rounded-xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Receipt className="h-4 w-4 text-emerald-500" />
                  {t('dashboard.latestTransactions')}
                </CardTitle>
                <Link to={path('treasury')}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3" />
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
          <CardTitle className="text-base">{t('dashboard.recentActivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLog compact />
        </CardContent>
      </Card>

      {/* System config — admin only */}
      {isAdmin && (
        <SystemConfigPanel
          financialStanding={financialStanding}
          isPaymentToVoteEnabled={isPaymentToVoteEnabled}
          goodStandingCount={goodStandingCount}
          delinquentCount={delinquentCount}
          hasMemberData={!!members}
          treasuryMode={treasuryMode}
          currency={rules.treasury.currency}
          adminSpendingLimit={rules.treasury.admin_spending_limit}
          autoExecutionEnabled={rules.governance.auto_execution_enabled}
          delegationEnabled={rules.governance.delegation_enabled}
          coolDownHours={rules.governance.cool_down_hours}
          settingsPath={path('settings')}
          censusPath={path('census')}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline sub-components (keep in same file — small and dashboard-specific)
// ---------------------------------------------------------------------------

interface ProposalWidgetProps {
  proposals: Array<{ id: string; title: string; type?: string; status: string }> | undefined
  pathFn: (p: string) => string
  t: (key: any) => string
}

function ProposalWidget({ proposals, pathFn, t }: ProposalWidgetProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Vote className="h-4 w-4 text-blue-500" />
          {t('dashboard.proposals')}
        </CardTitle>
        <Link to={pathFn('governance')}>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!proposals?.length ? (
          <EmptyState message={t('proposals.empty')} className="py-4" />
        ) : (
          <div className="space-y-2">
            {proposals.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to={pathFn(`governance/${p.id}`)}
                className="flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.type || 'general'}</p>
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
  )
}

interface AssemblyWidgetProps {
  assemblies: Array<{ id: string; title: string; status: string; scheduled_date: string }>
  pathFn: (p: string) => string
  t: (key: any) => string
}

function AssemblyWidget({ assemblies, pathFn, t }: AssemblyWidgetProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4 text-violet-500" />
          {t('dashboard.assemblies')}
        </CardTitle>
        <Link to={pathFn('governance')}>
          <Button variant="ghost" size="sm" className="gap-1 text-xs">
            {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {assemblies.length === 0 ? (
          <EmptyState message={t('assemblies.empty')} className="py-4" />
        ) : (
          <div className="space-y-2">
            {assemblies.map((a) => (
              <Link
                key={a.id}
                to={pathFn(`governance/assemblies/${a.id}`)}
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
  )
}
