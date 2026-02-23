import { useState, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useDashboard } from '@/core/treasury/hooks/useDashboard'
import { useCollectionStats } from '@/core/treasury/hooks/usePaymentStatus'
import { useTransactions } from '@/core/treasury/hooks/useTransactions'
import { getCollectionConfig } from '@/core/treasury/services/treasury.service'
import { exportToPDF, exportToExcel } from '@/shared/services/export.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Progress } from '@/shared/components/ui/progress'
import { FundSelector } from '@/core/treasury/components/FundSelector'
import { FinancialDashboard } from '@/core/treasury/components/FinancialDashboard'
import { PaymentObligationList } from '@/core/treasury/components/PaymentObligationList'
import { TransactionList } from '@/core/treasury/components/TransactionList'
import { BudgetOverview } from '@/core/treasury/components/BudgetOverview'
import { RecurringScheduleList } from '@/core/treasury/components/RecurringScheduleList'
import { ContractList } from '@/core/treasury/components/ContractList'
import { StatementList } from '@/core/treasury/components/StatementList'
import { CollectionView } from '@/core/treasury/components/CollectionView'
import { MyPayments } from '@/core/treasury/components/MyPayments'
import { MorosoAdminPanel } from '@/core/identity/components/MorosoAdminPanel'
import { DiscretionaryApprovalsPanel } from '@/core/treasury/components/DiscretionaryApprovalsPanel'
import { PaymentPlanManager } from '@/core/treasury/components/PaymentPlanManager'
import { ExpenseForm } from '@/core/treasury/components/ExpenseForm'
import { formatCurrency } from '@/shared/lib/utils'
import { useI18n } from '@/shared/hooks/useI18n'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import type { TreasuryRules, FundType } from '@/shared/types/rules'
import { cn } from '@/shared/lib/utils'
import {
  Plus,
  FileSpreadsheet,
  Download,
  Wallet,
  AlertTriangle,
  ArrowUpCircle,
  BarChart3,
  FileText,
  ArrowRightLeft,
  PieChart,
  Receipt,
  Building2,
  Banknote,
  Copy,
} from 'lucide-react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

type TreasuryTab = 'dashboard' | 'requests' | 'transactions' | 'budgets' | 'obligations' | 'ifpe'

export function AdminTreasuryView() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { community } = useCommunityContext()
  const { canManageTreasury, canImportData } = usePermissions()
  const [activeTab, setActiveTab] = useState<TreasuryTab>('dashboard')
  const [selectedFund, setSelectedFund] = useState<FundType>('mantenimiento')
  const [showForm, setShowForm] = useState(false)
  const [obligationsSubTab, setObligationsSubTab] = useState<string>('cobranza')
  const [memberIdFilter, setMemberIdFilter] = useState<string | null>(null)

  const rules = community?.rules as { treasury?: TreasuryRules } | null
  const treasuryMode = rules?.treasury?.mode || 'import'
  const collectionConfig = getCollectionConfig(rules)
  const hasClabe = !!collectionConfig?.clabe
  const ifpeStatus = (community as { ifpe_status?: string } | null)?.ifpe_status
  const showBroxelBanner = treasuryMode === 'import' && ifpeStatus !== 'active' && ifpeStatus !== 'pending_kyb'
  const showIfpeTab = treasuryMode === 'fintech_rail' || treasuryMode === 'hybrid' || ifpeStatus === 'active'

  const { data: stats, isLoading: statsLoading } = useDashboard()
  const { data: collStats } = useCollectionStats()
  const { data: transactions } = useTransactions()

  const modeLabel: Record<string, string> = {
    import: t('treasury.mode.import'),
    fintech_rail: t('treasury.mode.fintech_rail'),
    connector: t('treasury.mode.connector'),
    hybrid: t('treasury.mode.hybrid'),
  }

  const handleExportExcel = () => {
    const rows = (transactions ?? []).map((tx) => ({
      Fecha: tx.date,
      Tipo: tx.type === 'income' ? 'Ingreso' : 'Egreso',
      Monto: tx.amount,
      Categoria: tx.category_name || '',
      Descripcion: tx.description || '',
      Referencia: tx.external_ref || '',
    }))
    exportToExcel(rows, { filename: 'tesoreria', sheetName: 'Transacciones' })
  }

  const handleExportPDF = () => {
    exportToPDF('treasury-content', {
      filename: 'tesoreria',
      title: 'Reporte de Tesorería',
      subtitle: community?.name,
    })
  }

  const copyClabe = () => {
    if (collectionConfig?.clabe) navigator.clipboard.writeText(collectionConfig.clabe)
  }

  if (statsLoading && !stats) {
    return <LoadingSpinner message="Cargando tesorería…" className="py-12" />
  }

  const showFundSelector = activeTab === 'dashboard' || activeTab === 'transactions' || activeTab === 'budgets'

  return (
    <div id="treasury-content" className="space-y-6">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t('treasury.title')}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('treasury.subtitle')}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                'bg-primary/10 text-primary border border-primary/20'
              )}>
                <Wallet className="h-3.5 w-3.5" />
                {modeLabel[treasuryMode] || treasuryMode}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} title={t('treasury.export.pdf.title')} className="gap-1.5">
              <Download className="h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!transactions?.length} title={t('treasury.export.excel.title')} className="gap-1.5">
              <Download className="h-4 w-4" /> Excel
            </Button>
            {canImportData && (
              <Button variant="outline" size="sm" onClick={() => navigate(path('ingestion'))} className="gap-1.5">
                <FileSpreadsheet className="h-4 w-4" /> {t('treasury.import')}
              </Button>
            )}
            {canManageTreasury && (
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> {t('treasury.manualCapture')}
              </Button>
            )}
          </div>
        </div>

        {showBroxelBanner && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-900">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>Solicita acceso a BROXEL para recibir pagos SPEI, conciliar cuotas automáticamente y dispersar pagos con gobernanza.</span>
            </div>
            <Button variant="outline" size="sm" className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0" onClick={() => navigate(`/c/${community?.slug}/settings?tab=rules&broxel=1`)}>
              Solicitar acceso BROXEL
            </Button>
          </div>
        )}

        {showFundSelector && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('treasury.fund')}:</span>
            <FundSelector value={selectedFund} onChange={setSelectedFund} />
          </div>
        )}
      </header>

      {/* Quick metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-xl border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn('text-lg font-bold', (stats?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600')}>
              {formatCurrency(stats?.balance ?? 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Por cobrar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-yellow-600">
              {formatCurrency((collStats?.pendingAmount ?? 0) + (collStats?.overdueAmount ?? 0))}
            </div>
            {collStats && (collStats.overdueCount > 0 || collStats.pendingCount > 0) && (
              <p className="text-xs text-muted-foreground">
                {collStats.overdueCount > 0 && <span className="text-red-500">{collStats.overdueCount} vencidas</span>}
                {collStats.overdueCount > 0 && collStats.pendingCount > 0 && ' · '}
                {collStats.pendingCount > 0 && <span>{collStats.pendingCount} pendientes</span>}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">{collStats?.overdueCount ?? 0}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Tasa cobro</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{((collStats?.collectionRate ?? 0) * 100).toFixed(0)}%</div>
            <Progress value={(collStats?.collectionRate ?? 0) * 100} className="mt-1 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* 7 Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TreasuryTab)}>
        <TabsList className="h-auto flex-wrap gap-1 rounded-xl bg-muted/60 p-1.5">
          <TabsTrigger value="dashboard" className="gap-1.5 text-xs sm:text-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5" />
            Solicitudes
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Transacciones
          </TabsTrigger>
          <TabsTrigger value="budgets" className="gap-1.5 text-xs sm:text-sm">
            <PieChart className="h-3.5 w-3.5" />
            Presupuestos
          </TabsTrigger>
          <TabsTrigger value="obligations" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-3.5 w-3.5" />
            Obligaciones
          </TabsTrigger>
          {showIfpeTab && (
            <TabsTrigger value="ifpe" className="gap-1.5 text-xs sm:text-sm">
              <Banknote className="h-3.5 w-3.5" />
              IFPE
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Dashboard */}
        <TabsContent value="dashboard" className="mt-4">
          <FinancialDashboard fundType={selectedFund} />
        </TabsContent>

        {/* Tab: Solicitudes */}
        <TabsContent value="requests" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Ciclo de vida de egresos: borrador → clasificación → aprobación/ejecución.
              </p>
              {canManageTreasury && (
                <Button size="sm" onClick={() => navigate(path('treasury/requests/new'))} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Nueva solicitud
                </Button>
              )}
            </div>
            <Suspense fallback={<LoadingSpinner className="py-8" />}>
              <SpendRequestsInline />
            </Suspense>
          </div>
        </TabsContent>

        {/* Tab: Transacciones */}
        <TabsContent value="transactions" className="mt-4">
          <TransactionList fundType={selectedFund} />
        </TabsContent>

        {/* Tab: Presupuestos */}
        <TabsContent value="budgets" className="mt-4">
          <BudgetOverview fundType={selectedFund} />
        </TabsContent>

        {/* Tab: Obligaciones — sub-tabs */}
        <TabsContent value="obligations" className="mt-4">
          <Tabs value={obligationsSubTab} onValueChange={setObligationsSubTab}>
            <TabsList className="h-auto flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
              <TabsTrigger value="cobranza" className="gap-1 text-xs sm:text-sm">Cobranza</TabsTrigger>
              <TabsTrigger value="collection" className="gap-1 text-xs sm:text-sm">Recaudación</TabsTrigger>
              <TabsTrigger value="recurring" className="gap-1 text-xs sm:text-sm">Cuotas Recurrentes</TabsTrigger>
              <TabsTrigger value="contracts" className="gap-1 text-xs sm:text-sm">Contratos</TabsTrigger>
              <TabsTrigger value="plans" className="gap-1 text-xs sm:text-sm">Planes de Pago</TabsTrigger>
              <TabsTrigger value="my-payments" className="gap-1 text-xs sm:text-sm">Mi Estado</TabsTrigger>
              <TabsTrigger value="morosos" className="gap-1 text-xs sm:text-sm">Morosos</TabsTrigger>
              <TabsTrigger value="statements" className="gap-1 text-xs sm:text-sm">Estados de Cuenta</TabsTrigger>
              <TabsTrigger value="discretionary" className="gap-1 text-xs sm:text-sm">Discrecional</TabsTrigger>
            </TabsList>
            <div className="mt-4">
              {obligationsSubTab === 'cobranza' && (
                <>
                  {canManageTreasury && hasClabe && (
                    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">CLABE:</span>
                      <code className="text-sm font-mono font-medium">{collectionConfig?.clabe}</code>
                      <Button size="sm" variant="ghost" onClick={copyClabe} className="h-7 gap-1">
                        <Copy className="h-3 w-3" /> Copiar
                      </Button>
                    </div>
                  )}
                  <PaymentObligationList
                    memberIdFilter={memberIdFilter}
                    onClearMemberFilter={() => setMemberIdFilter(null)}
                  />
                </>
              )}
              {obligationsSubTab === 'collection' && <CollectionView onGoToObligations={() => setObligationsSubTab('cobranza')} />}
              {obligationsSubTab === 'recurring' && <RecurringScheduleList />}
              {obligationsSubTab === 'contracts' && <ContractList />}
              {obligationsSubTab === 'plans' && <PaymentPlanManager />}
              {obligationsSubTab === 'my-payments' && <MyPayments />}
              {obligationsSubTab === 'statements' && <StatementList fundType={selectedFund} />}
              {obligationsSubTab === 'morosos' && canManageTreasury && (
                <MorosoAdminPanel
                  onRegisterPayment={(memberId) => {
                    setMemberIdFilter(memberId)
                    setObligationsSubTab('cobranza')
                  }}
                />
              )}
              {obligationsSubTab === 'discretionary' && canManageTreasury && <DiscretionaryApprovalsPanel />}
            </div>
          </Tabs>
        </TabsContent>

        {/* Tab: IFPE */}
        {showIfpeTab && (
          <TabsContent value="ifpe" className="mt-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Integración IFPE / BROXEL</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>Módulo de conciliación, dispersiones y rendimientos.</p>
                  <p className="mt-2">Estado: <span className="font-medium text-foreground">{ifpeStatus || 'No configurado'}</span></p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <ExpenseForm
        open={showForm}
        onOpenChange={setShowForm}
        onRequireDiscretionary={() => {
          setShowForm(false)
          setActiveTab('obligations')
          setObligationsSubTab('discretionary')
        }}
        onRequireAssembly={() => {
          setShowForm(false)
          navigate(path('governance'))
        }}
      />
    </div>
  )
}

import { useSpendRequests } from '@/core/treasury/hooks/useSpendRequests'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import type { SpendRequestStatus } from '@/core/treasury/types'

const SR_STATUS_LABELS: Record<SpendRequestStatus, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente',
  pending_vote: 'En votación',
  approved: 'Aprobado',
  executing: 'Ejecutando',
  executed: 'Ejecutado',
  verified: 'Verificado',
  rejected: 'Rechazado',
  cancelled: 'Cancelado',
}

function statusVariant(s: SpendRequestStatus): 'secondary' | 'warning' | 'success' | 'destructive' {
  if (s === 'executed' || s === 'verified') return 'success'
  if (s === 'rejected' || s === 'cancelled') return 'destructive'
  if (s === 'pending_approval' || s === 'pending_vote' || s === 'executing') return 'warning'
  return 'secondary'
}

function SpendRequestsInline() {
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { data: requests, isLoading } = useSpendRequests()

  if (isLoading) return <LoadingSpinner className="py-8" />
  if (!requests?.length) return <p className="py-8 text-center text-sm text-muted-foreground">Sin solicitudes de gasto.</p>

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead>Nivel</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((r) => (
            <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(path(`treasury/requests/${r.id}`))}>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>{formatCurrency(r.amount)}</TableCell>
              <TableCell className="text-xs">N{r.authorization_level ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(r.status)}>{SR_STATUS_LABELS[r.status] || r.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
