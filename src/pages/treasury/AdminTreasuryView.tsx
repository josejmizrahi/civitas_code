import { useState } from 'react'
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
import { PaymentObligationList } from '@/core/treasury/components/PaymentObligationList'
import { TransactionList } from '@/core/treasury/components/TransactionList'
import { IncomeVsExpenseChart } from '@/core/treasury/components/IncomeVsExpenseChart'
import { RecurringScheduleList } from '@/core/treasury/components/RecurringScheduleList'
import { ContractList } from '@/core/treasury/components/ContractList'
import { BudgetOverview } from '@/core/treasury/components/BudgetOverview'
import { CategoryManager } from '@/core/treasury/components/CategoryManager'
import { StatementList } from '@/core/treasury/components/StatementList'
import { DiscretionaryApprovalsPanel } from '@/core/treasury/components/DiscretionaryApprovalsPanel'
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
  Receipt,
  ArrowRightLeft,
  Settings,
  RefreshCw,
  FileText,
  PieChart,
  ClipboardList,
  Copy,
  Building2,
} from 'lucide-react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

type AdminTab = 'cobranza' | 'movimientos' | 'config'
type ConfigSubTab = 'recurring' | 'contracts' | 'budgets' | 'categories' | 'statements' | 'discretionary'

export function AdminTreasuryView() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { community } = useCommunityContext()
  const { canManageTreasury, canImportData } = usePermissions()
  const [adminTab, setAdminTab] = useState<AdminTab>('cobranza')
  const [configSubTab, setConfigSubTab] = useState<ConfigSubTab>('recurring')
  const [movimientosFund, setMovimientosFund] = useState<FundType>('mantenimiento')
  const [configFund, setConfigFund] = useState<FundType>('mantenimiento')
  const [showForm, setShowForm] = useState(false)

  const rules = community?.rules as { treasury?: TreasuryRules } | null
  const treasuryMode = rules?.treasury?.mode || 'import'
  const collectionConfig = getCollectionConfig(rules)
  const hasClabe = !!collectionConfig?.clabe
  const ifpeStatus = (community as { ifpe_status?: string } | null)?.ifpe_status
  const showBroxelBanner = treasuryMode === 'import' && ifpeStatus !== 'active' && ifpeStatus !== 'pending_kyb'

  const { data: stats, isLoading: statsLoading } = useDashboard()
  const { data: movimientosStats } = useDashboard(adminTab === 'movimientos' ? movimientosFund : undefined)
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
    if (collectionConfig?.clabe) {
      navigator.clipboard.writeText(collectionConfig.clabe)
    }
  }

  if (statsLoading && !stats) {
    return <LoadingSpinner message="Cargando tesorería…" className="py-12" />
  }

  return (
    <div id="treasury-content" className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{t('treasury.title')}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('treasury.subtitle')}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
                  'bg-primary/10 text-primary border border-primary/20'
                )}
              >
                <Wallet className="h-3.5 w-3.5" />
                {modeLabel[treasuryMode] || treasuryMode}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} title={t('treasury.export.pdf.title')} className="gap-1.5">
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={!transactions?.length}
              title={t('treasury.export.excel.title')}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
            {canImportData && (
              <Button variant="outline" size="sm" onClick={() => navigate(path('ingestion'))} className="gap-1.5">
                <FileSpreadsheet className="h-4 w-4" />
                {t('treasury.import')}
              </Button>
            )}
            {canManageTreasury && (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(path('treasury/requests'))} className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  Solicitudes
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(path('entities'))} className="gap-1.5">
                  <Building2 className="h-4 w-4" />
                  Proveedores
                </Button>
                <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  {t('treasury.manualCapture')}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CTA BROXEL: visible cuando modo manual y sin acceso activo/pendiente */}
      {showBroxelBanner && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-emerald-900">
            <Building2 className="h-4 w-4 shrink-0" />
            <span>
              Solicita acceso a BROXEL para recibir pagos SPEI, conciliar cuotas automáticamente y dispersar pagos con gobernanza.
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0"
            onClick={() => navigate(`/c/${community?.slug}/settings?tab=rules&broxel=1`)}
          >
            Solicitar acceso BROXEL
          </Button>
        </div>
      )}

      {/* Quick metrics — 4 cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="rounded-xl border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                'text-lg font-bold',
                (stats?.balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
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

      <Tabs value={adminTab} onValueChange={(v) => setAdminTab(v as AdminTab)}>
        <TabsList className="h-auto flex-wrap gap-1 rounded-xl bg-muted/60 p-1.5">
          <TabsTrigger value="cobranza" className="gap-1.5 text-xs sm:text-sm">
            <Receipt className="h-3.5 w-3.5" />
            Cobranza
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="gap-1.5 text-xs sm:text-sm">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="h-3.5 w-3.5" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cobranza" className="mt-4 space-y-4">
          {/* Compact CLABE banner */}
          {canManageTreasury && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              {hasClabe ? (
                <>
                  <span className="text-sm text-muted-foreground">CLABE:</span>
                  <code className="text-sm font-mono font-medium">{collectionConfig?.clabe}</code>
                  <Button size="sm" variant="ghost" onClick={copyClabe} className="h-7 gap-1">
                    <Copy className="h-3 w-3" />
                    Copiar
                  </Button>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">CLABE no configurada. Configura en Ajustes si usas SPEI.</span>
              )}
            </div>
          )}
          <PaymentObligationList hideSummaryCards />
        </TabsContent>

        <TabsContent value="movimientos" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('treasury.fund')}:</span>
            <FundSelector value={movimientosFund} onChange={setMovimientosFund} />
          </div>
          {movimientosStats && movimientosStats.monthlyData.length > 0 && (
            <Card className="rounded-xl border-border/80">
              <CardHeader>
                <CardTitle className="text-base">Ingresos vs Egresos</CardTitle>
              </CardHeader>
              <CardContent>
                <IncomeVsExpenseChart data={movimientosStats.monthlyData} />
              </CardContent>
            </Card>
          )}
          <TransactionList fundType={movimientosFund} />
        </TabsContent>

        <TabsContent value="config" className="mt-4 space-y-4">
          <Tabs value={configSubTab} onValueChange={(v) => setConfigSubTab(v as ConfigSubTab)}>
            <TabsList className="h-auto flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
              <TabsTrigger value="recurring" className="gap-1 text-xs sm:text-sm">
                <RefreshCw className="h-3.5 w-3.5" />
                {t('treasury.programacion.recurring')}
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-1 text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5" />
                {t('treasury.programacion.contracts')}
              </TabsTrigger>
              <TabsTrigger value="budgets" className="gap-1 text-xs sm:text-sm">
                <PieChart className="h-3.5 w-3.5" />
                {t('treasury.datos.budgets')}
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-1 text-xs sm:text-sm">
                Categorías
              </TabsTrigger>
              <TabsTrigger value="statements" className="gap-1 text-xs sm:text-sm">
                <ClipboardList className="h-3.5 w-3.5" />
                {t('treasury.datos.statements')}
              </TabsTrigger>
              <TabsTrigger value="discretionary" className="gap-1 text-xs sm:text-sm">
                Discrecional
              </TabsTrigger>
            </TabsList>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(configSubTab === 'budgets' || configSubTab === 'statements') && (
                <>
                  <span className="text-sm text-muted-foreground">{t('treasury.fund')}:</span>
                  <FundSelector value={configFund} onChange={setConfigFund} />
                </>
              )}
            </div>
            <div className="mt-4">
              {configSubTab === 'recurring' && <RecurringScheduleList />}
              {configSubTab === 'contracts' && <ContractList />}
              {configSubTab === 'budgets' && <BudgetOverview fundType={configFund} />}
              {configSubTab === 'categories' && <CategoryManager />}
              {configSubTab === 'statements' && <StatementList fundType={configFund} />}
              {configSubTab === 'discretionary' && <DiscretionaryApprovalsPanel />}
            </div>
          </Tabs>
        </TabsContent>
      </Tabs>

      <ExpenseForm
        open={showForm}
        onOpenChange={setShowForm}
        onRequireDiscretionary={() => {
          setShowForm(false)
          setAdminTab('config')
          setConfigSubTab('discretionary')
        }}
        onRequireAssembly={() => {
          setShowForm(false)
          navigate(path('governance'))
        }}
      />
    </div>
  )
}
