import { useState, useEffect, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { FinancialDashboard } from '@/core/treasury/components/FinancialDashboard'
import { TransactionList } from '@/core/treasury/components/TransactionList'
import { BudgetOverview } from '@/core/treasury/components/BudgetOverview'
import { PaymentObligationList } from '@/core/treasury/components/PaymentObligationList'
import { CollectionView } from '@/core/treasury/components/CollectionView'
import { MyPayments } from '@/core/treasury/components/MyPayments'
import { RecurringScheduleList } from '@/core/treasury/components/RecurringScheduleList'
import { ContractList } from '@/core/treasury/components/ContractList'
import { PaymentPlanManager } from '@/core/treasury/components/PaymentPlanManager'
import { ExpenseForm } from '@/core/treasury/components/ExpenseForm'
import { FundSelector } from '@/core/treasury/components/FundSelector'
import { StatementList } from '@/core/treasury/components/StatementList'
import { useRefreshOverdueObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useProcessRecurringSchedules } from '@/core/treasury/hooks/useRecurring'
import { useRefreshOverdueInstallments } from '@/core/treasury/hooks/useContracts'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useCommunityContext } from '@/app/providers'
import {
  Plus,
  FileSpreadsheet,
  BarChart3,
  Receipt,
  Banknote,
  User,
  RefreshCw,
  FileText,
  ClipboardList,
  Download,
  CalendarRange,
  Wallet,
  ArrowRightLeft,
  CalendarCheck,
  PieChart,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTransactions } from '@/core/treasury/hooks/useTransactions'
import { exportToPDF, exportToExcel } from '@/shared/services/export.service'
import type { TreasuryRules, FundType } from '@/shared/types/rules'
import { cn } from '@/shared/lib/utils'

type MainSection = 'resumen' | 'cobro' | 'programacion' | 'datos'

const MAIN_SECTIONS: { id: MainSection; label: string; icon: typeof Wallet; description: string }[] = [
  { id: 'resumen', label: 'Resumen', icon: BarChart3, description: 'Visión general' },
  { id: 'cobro', label: 'Cobro', icon: Receipt, description: 'Obligaciones y pagos' },
  { id: 'programacion', label: 'Programación', icon: CalendarCheck, description: 'Recurrentes y contratos' },
  { id: 'datos', label: 'Datos e informes', icon: PieChart, description: 'Movimientos y reportes' },
]

export function TreasuryPage() {
  const { canManageTreasury, canImportData } = usePermissions()
  const [mainSection, setMainSection] = useState<MainSection>(canManageTreasury ? 'resumen' : 'cobro')
  const [cobroTab, setCobroTab] = useState(canManageTreasury ? 'obligations' : 'my-payments')
  const [programacionTab, setProgramacionTab] = useState('recurring')
  const [datosTab, setDatosTab] = useState('transactions')
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

  const showFundSelector =
    mainSection === 'resumen' || (mainSection === 'datos' && ['transactions', 'budgets', 'statements'].includes(datosTab))

  return (
    <div id="treasury-content" className="space-y-6">
      {/* Header: título, modo, acciones */}
      <header className="no-print space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Tesorería</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Resumen, cobro y movimientos de la comunidad
            </p>
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
            {/* Secondary actions hidden on small screens */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                title="Exporta la vista actual a PDF"
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={!transactions?.length}
                title="Exporta el listado de transacciones a Excel"
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              {canImportData && (
                <Button variant="outline" size="sm" onClick={() => navigate('/ingestion')} className="gap-1.5">
                  <FileSpreadsheet className="h-4 w-4" />
                  Importar
                </Button>
              )}
            </div>
            {/* Mobile-only compact actions */}
            <div className="flex sm:hidden items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF} title="PDF">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={!transactions?.length} title="Excel">
                <FileSpreadsheet className="h-4 w-4" />
              </Button>
            </div>
            {canManageTreasury && (
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Captura manual</span>
                <span className="sm:hidden">Capturar</span>
              </Button>
            )}
          </div>
        </div>

        {/* Banner modo actual (solo cuando no hay SPEI) */}
        {treasuryMode !== 'fintech_rail' && (
          <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
            Hoy: importación y registro manual. SPEI automático en Fase 2 con socio IFPE.
          </div>
        )}

        {/* Selector de fondo — solo donde aplica */}
        {showFundSelector && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Fondo:</span>
            <FundSelector value={selectedFund} onChange={setSelectedFund} />
          </div>
        )}
      </header>

      {/* Navegacion principal: 4 secciones */}
      <nav className="no-print" aria-label="Secciones de tesoreria">
        <div className="flex gap-1 rounded-xl bg-muted/60 p-1.5 overflow-x-auto scrollbar-hide">
          {MAIN_SECTIONS.map((section) => {
            const Icon = section.icon
            const isActive = mainSection === section.id
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setMainSection(section.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
                )}
                title={section.description}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {section.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Contenido por sección */}
      {mainSection === 'resumen' && (
        <section className="animate-in fade-in duration-200" aria-label="Resumen financiero">
          <FinancialDashboard fundType={selectedFund} />
        </section>
      )}

      {mainSection === 'cobro' && (
        <section className="space-y-4 animate-in fade-in duration-200" aria-label="Cobro">
          <Tabs value={cobroTab} onValueChange={(v) => setCobroTab(v)}>
            {canManageTreasury && (
              <TabsList className="mb-4">
                <TabsTrigger value="obligations" className="gap-1.5 text-xs sm:text-sm">
                  <Receipt className="h-3.5 w-3.5" />
                  Obligaciones
                </TabsTrigger>
                <TabsTrigger value="collection" className="gap-1.5 text-xs sm:text-sm">
                  <Banknote className="h-3.5 w-3.5" />
                  Cuenta y cobro
                </TabsTrigger>
                <TabsTrigger value="my-payments" className="gap-1.5 text-xs sm:text-sm">
                  <User className="h-3.5 w-3.5" />
                  Mis pagos
                </TabsTrigger>
              </TabsList>
            )}
            <div className={canManageTreasury ? undefined : 'mt-0'}>
              {cobroTab === 'obligations' && <PaymentObligationList />}
              {cobroTab === 'collection' && <CollectionView onGoToObligations={() => setCobroTab('obligations')} />}
              {cobroTab === 'my-payments' && <MyPayments />}
            </div>
          </Tabs>
        </section>
      )}

      {mainSection === 'programacion' && (
        <section className="space-y-4 animate-in fade-in duration-200" aria-label="Programación">
          <Tabs value={programacionTab} onValueChange={(v) => setProgramacionTab(v)}>
            <TabsList>
              <TabsTrigger value="recurring" className="gap-1.5 text-xs sm:text-sm">
                <RefreshCw className="h-3.5 w-3.5" />
                Recurrentes
              </TabsTrigger>
              <TabsTrigger value="contracts" className="gap-1.5 text-xs sm:text-sm">
                <FileText className="h-3.5 w-3.5" />
                Contratos
              </TabsTrigger>
              <TabsTrigger value="payment-plans" className="gap-1.5 text-xs sm:text-sm">
                <CalendarRange className="h-3.5 w-3.5" />
                Planes de pago
              </TabsTrigger>
            </TabsList>
            <div className="mt-4">
              {programacionTab === 'recurring' && <RecurringScheduleList />}
              {programacionTab === 'contracts' && <ContractList />}
              {programacionTab === 'payment-plans' && <PaymentPlanManager />}
            </div>
          </Tabs>
        </section>
      )}

      {mainSection === 'datos' && (
        <section className="space-y-4 animate-in fade-in duration-200" aria-label="Datos e informes">
          <Tabs value={datosTab} onValueChange={(v) => setDatosTab(v)}>
            <TabsList>
              <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Transacciones
              </TabsTrigger>
              <TabsTrigger value="budgets" className="gap-1.5 text-xs sm:text-sm">
                <PieChart className="h-3.5 w-3.5" />
                Presupuestos
              </TabsTrigger>
              <TabsTrigger value="statements" className="gap-1.5 text-xs sm:text-sm">
                <ClipboardList className="h-3.5 w-3.5" />
                Estados financieros
              </TabsTrigger>
            </TabsList>
            <div className="mt-4">
              {datosTab === 'transactions' && <TransactionList fundType={selectedFund} />}
              {datosTab === 'budgets' && <BudgetOverview fundType={selectedFund} />}
              {datosTab === 'statements' && <StatementList fundType={selectedFund} />}
            </div>
          </Tabs>
        </section>
      )}

      <ExpenseForm open={showForm} onOpenChange={setShowForm} />
    </div>
  )
}
