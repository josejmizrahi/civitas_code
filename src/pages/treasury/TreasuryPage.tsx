import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { FinancialDashboard } from '@/core/treasury/components/FinancialDashboard'
import { TransactionList } from '@/core/treasury/components/TransactionList'
import { BudgetOverview } from '@/core/treasury/components/BudgetOverview'
import { PaymentObligationList } from '@/core/treasury/components/PaymentObligationList'
import { CollectionView } from '@/core/treasury/components/CollectionView'
import { MyPayments } from '@/core/treasury/components/MyPayments'
import { RecurringScheduleList } from '@/core/treasury/components/RecurringScheduleList'
import { ContractList } from '@/core/treasury/components/ContractList'
import { ExpenseForm } from '@/core/treasury/components/ExpenseForm'
import { FundSelector } from '@/core/treasury/components/FundSelector'
import { StatementList } from '@/core/treasury/components/StatementList'
import { useRefreshOverdueObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useProcessRecurringSchedules } from '@/core/treasury/hooks/useRecurring'
import { useRefreshOverdueInstallments } from '@/core/treasury/hooks/useContracts'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useCommunityContext } from '@/app/providers'
import {
  Plus, FileSpreadsheet, CreditCard, BarChart3, Receipt, PiggyBank,
  Banknote, User, RefreshCw, FileText, ClipboardList, Download,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '@/core/treasury/hooks/useTransactions'
import { exportToPDF, exportToExcel } from '@/shared/services/export.service'
import type { TreasuryRules, FundType } from '@/shared/types/rules'

export function TreasuryPage() {
  const { canManageTreasury, canImportData } = usePermissions()
  const [tab, setTab] = useState(canManageTreasury ? 'dashboard' : 'my-payments')
  const [showForm, setShowForm] = useState(false)
  const [selectedFund, setSelectedFund] = useState<FundType>('mantenimiento')
  const refreshOverdue = useRefreshOverdueObligations()
  const processRecurring = useProcessRecurringSchedules()
  const refreshInstallments = useRefreshOverdueInstallments()
  const { community } = useCommunityContext()
  const navigate = useNavigate()
  const hasRun = useRef(false)

  const { data: transactions } = useTransactions()

  const rules = community?.rules as { treasury?: TreasuryRules } | null
  const treasuryMode = rules?.treasury?.mode || 'import'

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

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    refreshOverdue.mutate(undefined, { onError: () => {} })
    processRecurring.mutate(undefined, { onError: () => {} })
    refreshInstallments.mutate(undefined, { onError: () => {} })
  }, [])

  const modeLabel: Record<string, string> = {
    import: 'Importación / Manual',
    fintech_rail: 'Fintech Rail (SPEI)',
    connector: 'Conector Bancario',
    hybrid: 'Híbrido',
  }

  const fundAffectedTabs = ['dashboard', 'transactions', 'budgets', 'statements']
  const showFundSelector = fundAffectedTabs.includes(tab)

  return (
    <div id="treasury-content" className="space-y-6">
      <div className="no-print flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Tesorería</h1>
          <p className="text-sm text-muted-foreground">
            Dashboard financiero y transparencia
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              <CreditCard className="h-3 w-3" />
              {modeLabel[treasuryMode] || treasuryMode}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} title="Exporta la vista actual a PDF">
            <Download className="mr-1 h-4 w-4" />
            PDF (vista)
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!transactions?.length} title="Exporta el listado de transacciones a Excel">
            <Download className="mr-1 h-4 w-4" />
            Excel (trans.)
          </Button>
          {canImportData && (
            <Button variant="outline" onClick={() => navigate('/ingestion')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Importar CSV/Excel
            </Button>
          )}
          {canManageTreasury && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Captura Manual
            </Button>
          )}
        </div>
      </div>

      {/* Fund Selector — solo en pestañas donde aplica (LPCI Art. 57-58) */}
      {showFundSelector && (
        <div className="no-print flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Vista por fondo:</span>
          <FundSelector value={selectedFund} onChange={setSelectedFund} />
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-print flex w-full overflow-x-auto overflow-y-hidden scrollbar-hide flex-nowrap sm:flex-wrap gap-1 min-w-0 h-auto py-1">
          <TabsTrigger value="dashboard" className="shrink-0 gap-1 whitespace-nowrap" title="Resumen y métricas de cobranza">
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="obligations" className="shrink-0 gap-1 whitespace-nowrap" title="Crear obligaciones y registrar pagos">
            <Receipt className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Obligaciones</span>
          </TabsTrigger>
          <TabsTrigger value="collection" className="shrink-0 gap-1 whitespace-nowrap" title="Cuenta e instrucciones de cobro (CLABE, SPEI)">
            <Banknote className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cuenta y cobro</span>
          </TabsTrigger>
          <TabsTrigger value="my-payments" className="shrink-0 gap-1 whitespace-nowrap" title="Tus obligaciones y cómo pagar">
            <User className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Mis Pagos</span>
          </TabsTrigger>
          <TabsTrigger value="recurring" className="shrink-0 gap-1 whitespace-nowrap" title="Cobros o pagos que se repiten (ej. cuota mensual)">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Recurrentes</span>
          </TabsTrigger>
          <TabsTrigger value="contracts" className="shrink-0 gap-1 whitespace-nowrap" title="Contratos con planes de pago y parcialidades">
            <FileText className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Contratos</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="shrink-0 gap-1 whitespace-nowrap" title="Listado de movimientos">
            <CreditCard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Transacciones</span>
          </TabsTrigger>
          <TabsTrigger value="budgets" className="shrink-0 gap-1 whitespace-nowrap" title="Presupuesto por categoría y periodo">
            <PiggyBank className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Presupuestos</span>
          </TabsTrigger>
          <TabsTrigger value="statements" className="shrink-0 gap-1 whitespace-nowrap" title="Estados financieros mensuales">
            <ClipboardList className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Est. Financieros</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <FinancialDashboard fundType={selectedFund} />
        </TabsContent>
        <TabsContent value="obligations">
          <PaymentObligationList />
        </TabsContent>
        <TabsContent value="collection">
          <CollectionView onGoToObligations={() => setTab('obligations')} />
        </TabsContent>
        <TabsContent value="my-payments">
          <MyPayments />
        </TabsContent>
        <TabsContent value="recurring">
          <RecurringScheduleList />
        </TabsContent>
        <TabsContent value="contracts">
          <ContractList />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionList fundType={selectedFund} />
        </TabsContent>
        <TabsContent value="budgets">
          <BudgetOverview fundType={selectedFund} />
        </TabsContent>
        <TabsContent value="statements">
          <StatementList fundType={selectedFund} />
        </TabsContent>
      </Tabs>

      <ExpenseForm open={showForm} onOpenChange={setShowForm} />
    </div>
  )
}
