import { useDashboard } from '../hooks/useDashboard'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useCollectionStats } from '../hooks/usePaymentStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { IncomeVsExpenseChart } from './IncomeVsExpenseChart'
import { formatCurrency } from '@/shared/lib/utils'
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, ArrowUpCircle } from 'lucide-react'

export function FinancialDashboard() {
  const { data: stats, isLoading } = useDashboard()
  const { data: collStats } = useCollectionStats()

  if (isLoading) return <LoadingSpinner message="Cargando datos financieros..." className="py-12" />
  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(stats.totalIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</div>
          </CardContent>
        </Card>

        <Card>
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
            <Card>
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa Cobro</CardTitle>
                <ArrowUpCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">{(collStats.collectionRate * 100).toFixed(0)}%</div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${collStats.collectionRate * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {stats.monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ingresos vs Egresos</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeVsExpenseChart data={stats.monthlyData} />
          </CardContent>
        </Card>
      )}

      {stats.byCategory.length > 0 && (
        <Card>
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
