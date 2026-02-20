import { useMemo, useState } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { useTransactions } from '../hooks/useTransactions'
import { useCollectionStats } from '../hooks/usePaymentStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Select } from '@/shared/components/ui/select'
import { Progress } from '@/shared/components/ui/progress'
import { formatCurrency } from '@/shared/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
} from 'lucide-react'

const COLORS = ['#16a34a', '#dc2626', '#2563eb', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function FinancialAnalytics() {
  const { data: stats, isLoading: statsLoading } = useDashboard()
  const { data: transactions } = useTransactions()
  const { data: collStats } = useCollectionStats()
  const [period, setPeriod] = useState('12')

  const analytics = useMemo(() => {
    if (!stats || !transactions) return null

    const monthCount = parseInt(period)

    // Monthly trends (limited to period)
    const monthlyTrends = (stats.monthlyData || []).slice(-monthCount)

    // Category breakdown
    const categoryExpenses = new Map<string, number>()
    const categoryIncome = new Map<string, number>()
    for (const tx of transactions) {
      const cat = (tx as any).category_name || 'Sin categoría'
      const map = tx.type === 'expense' ? categoryExpenses : categoryIncome
      map.set(cat, (map.get(cat) || 0) + tx.amount)
    }

    const expensePieData = Array.from(categoryExpenses.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    const incomePieData = Array.from(categoryIncome.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    // Collection rate
    const collectionRate = collStats
      ? collStats.collectionRate
      : null

    // Morosidad projection (simple linear)
    const overdueRate = collStats
      ? collStats.totalObligations > 0 ? (collStats.overdueCount / collStats.totalObligations) * 100 : 0
      : 0

    // Average expense per month
    const totalMonths = monthlyTrends.length || 1
    const avgMonthlyExpense = stats.totalExpenses / totalMonths
    const avgMonthlyIncome = stats.totalIncome / totalMonths

    return {
      monthlyTrends,
      expensePieData,
      incomePieData,
      collectionRate,
      overdueRate,
      avgMonthlyExpense,
      avgMonthlyIncome,
      projectedAnnualIncome: avgMonthlyIncome * 12,
      projectedAnnualExpense: avgMonthlyExpense * 12,
    }
  }, [stats, transactions, collStats, period])

  if (statsLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Cargando analisis financiero...</p>
  }

  if (!analytics || !stats) return null

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Periodo:</span>
        <Select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-40">
          <option value="3">Ultimos 3 meses</option>
          <option value="6">Ultimos 6 meses</option>
          <option value="12">Ultimo anio</option>
          <option value="24">Ultimos 2 anios</option>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Promedio Ingreso/Mes</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(analytics.avgMonthlyIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Promedio Gasto/Mes</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(analytics.avgMonthlyExpense)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tasa de Cobranza</p>
            <p className="text-lg font-bold">
              {analytics.collectionRate !== null ? `${(analytics.collectionRate * 100).toFixed(1)}%` : '—'}
            </p>
            {analytics.collectionRate !== null && (
              <Progress value={analytics.collectionRate * 100} className="mt-1 h-1.5" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Morosidad</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">{analytics.overdueRate.toFixed(1)}%</p>
              {analytics.overdueRate > 20 && (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      {analytics.monthlyTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-hidden">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.monthlyTrends} margin={{ left: -10, right: 5, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={55} />
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Ingresos" fill="#16a34a" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" name="Egresos" fill="#dc2626" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pie Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {analytics.expensePieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Egresos por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={analytics.expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
                      {analytics.expensePieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                    <Legend layout="horizontal" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {analytics.incomePieData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Ingresos por Categoria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={analytics.incomePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={false}>
                      {analytics.incomePieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                    <Legend layout="horizontal" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Projections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proyeccion Anual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Ingreso Proyectado</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(analytics.projectedAnnualIncome)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gasto Proyectado</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(analytics.projectedAnnualExpense)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Balance Proyectado</p>
              <p className={`text-lg font-bold ${analytics.projectedAnnualIncome - analytics.projectedAnnualExpense >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(analytics.projectedAnnualIncome - analytics.projectedAnnualExpense)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
