import { useMemo } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useBudgets } from '../hooks/useBudgets'
import { useTransactions } from '../hooks/useTransactions'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useCollectionStats } from '../hooks/usePaymentStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { IncomeVsExpenseChart } from './IncomeVsExpenseChart'
import { formatCurrency } from '@/shared/lib/utils'
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, ArrowUpCircle, PieChart } from 'lucide-react'
import type { FundType } from '@/shared/types/rules'

export function FinancialDashboard({ fundType }: { fundType?: FundType } = {}) {
  const { data: stats, isLoading } = useDashboard(fundType)
  const { data: collStats } = useCollectionStats()
  const { data: budgets } = useBudgets(fundType)
  const { data: transactions } = useTransactions(fundType ? { fundType } : undefined)

  const currentPeriod = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }, [])

  const budgetVsReal = useMemo(() => {
    if (!budgets?.length || !transactions) return []
    const spentByCat = new Map<string, number>()
    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.category_id) {
        spentByCat.set(tx.category_id, (spentByCat.get(tx.category_id) ?? 0) + Number(tx.amount))
      }
    })
    return budgets
      .filter((b) => b.period === currentPeriod)
      .map((b) => ({
        name: (b as any).category_name ?? b.category_id,
        budget: Number(b.amount),
        spent: spentByCat.get(b.category_id) ?? 0,
      }))
      .filter((r) => r.budget > 0)
  }, [budgets, transactions, currentPeriod])

  if (isLoading) return <LoadingSpinner message="Cargando datos financieros..." className="py-12" />
  if (!stats) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <Wallet className="mx-auto h-10 w-10 opacity-50" />
        <p className="mt-2 font-medium">Sin datos financieros</p>
        <p className="text-sm">Registra transacciones o importa datos para ver el resumen aquí.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="rounded-xl border-border/80 shadow-sm transition-shadow hover:shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-sm transition-shadow hover:shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/80 shadow-sm transition-shadow hover:shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.balance)}
            </div>
          </CardContent>
        </Card>

        {collStats && (
          <>
            <Card className="rounded-xl border-border/80 shadow-sm transition-shadow hover:shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {formatCurrency(collStats.pendingAmount + collStats.overdueAmount)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {collStats.overdueCount > 0 && (
                    <span className="text-red-500">{collStats.overdueCount} vencidas</span>
                  )}
                  {collStats.overdueCount > 0 && collStats.pendingCount > 0 && ' · '}
                  {collStats.pendingCount > 0 && (
                    <span>{collStats.pendingCount} pendientes</span>
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/80 shadow-sm transition-shadow hover:shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa Cobro</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{(collStats.collectionRate * 100).toFixed(0)}%</div>
                <Progress value={collStats.collectionRate * 100} className="mt-1" indicatorClassName="bg-blue-500" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {budgetVsReal.length > 0 && (
        <Card className="rounded-xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Presupuesto vs real ({currentPeriod})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetVsReal.map((row) => {
                const pct = Math.min(100, (row.spent / row.budget) * 100)
                return (
                  <div key={row.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{row.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(row.spent)} / {formatCurrency(row.budget)}</span>
                    </div>
                    <Progress value={pct} className="h-2" indicatorClassName={pct > 100 ? 'bg-destructive' : 'bg-primary'} />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.monthlyData.length > 0 && (
        <Card className="rounded-xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeVsExpenseChart data={stats.monthlyData} />
          </CardContent>
        </Card>
      )}

      {stats.byCategory.length > 0 && (
        <Card className="rounded-xl border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle>Por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byCategory.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <span className="text-sm">{cat.name}</span>
                  <span className={`text-sm font-medium ${cat.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
