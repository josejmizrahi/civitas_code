import { useMemo } from 'react'
import { useCommunityContext } from '@/app/providers'
import { useQuery } from '@tanstack/react-query'
import { getTransactions } from '@/core/treasury/services/treasury.service'
import { getStatements } from '@/core/treasury/services/statement.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
} from 'lucide-react'

export function FinancialReviewPanel() {
  const { communityId } = useCommunityContext()

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', communityId, 'review'],
    queryFn: () => getTransactions(communityId!),
    enabled: !!communityId,
  })

  const { data: statements, isLoading: stmtLoading } = useQuery({
    queryKey: ['statements', communityId, 'review'],
    queryFn: () => getStatements(communityId!),
    enabled: !!communityId,
  })

  const analysis = useMemo(() => {
    if (!transactions) return null

    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`

    const thisMonthTx = transactions.filter((t) => t.date?.startsWith(currentMonth))
    const prevMonthTx = transactions.filter((t) => t.date?.startsWith(prevMonthStr))

    const sumByType = (txs: typeof transactions, type: string) =>
      txs.filter((t) => t.type === type).reduce((sum, t) => sum + (t.amount || 0), 0)

    const currentIncome = sumByType(thisMonthTx, 'income')
    const currentExpense = sumByType(thisMonthTx, 'expense')
    const prevIncome = sumByType(prevMonthTx, 'income')
    const prevExpense = sumByType(prevMonthTx, 'expense')

    const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0)
    const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0)

    const byCategory = new Map<string, { income: number; expense: number }>()
    for (const tx of transactions) {
      const cat = (tx as any).category_name || 'Sin categoría'
      const curr = byCategory.get(cat) || { income: 0, expense: 0 }
      if (tx.type === 'income') curr.income += tx.amount || 0
      else curr.expense += tx.amount || 0
      byCategory.set(cat, curr)
    }

    const largeTx = transactions
      .filter((t) => t.type === 'expense' && (t.amount || 0) > totalExpense * 0.1 && totalExpense > 0)
      .slice(0, 5)

    const txWithoutCategory = transactions.filter((t) => !(t as any).category_name && !(t as any).category_id)

    return {
      currentMonth: currentMonth,
      currentIncome,
      currentExpense,
      currentBalance: currentIncome - currentExpense,
      prevIncome,
      prevExpense,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory: Array.from(byCategory.entries())
        .map(([name, vals]) => ({ name, ...vals, net: vals.income - vals.expense }))
        .sort((a, b) => b.expense - a.expense),
      largeTx,
      txWithoutCategory: txWithoutCategory.length,
      totalTx: transactions.length,
    }
  }, [transactions])

  const isLoading = txLoading || stmtLoading

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Cargando datos financieros...</p>
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No hay datos financieros disponibles para revisar.
        </CardContent>
      </Card>
    )
  }

  const unapprovedStatements = (statements ?? []).filter((s) => !s.approved)
  const anomalyCount =
    analysis.largeTx.length + (analysis.txWithoutCategory > 0 ? 1 : 0) + unapprovedStatements.length
  const healthScore = Math.max(0, 100 - anomalyCount * 15 - (analysis.balance < 0 ? 20 : 0))

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">{formatCurrency(analysis.totalIncome)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Este mes: {formatCurrency(analysis.currentIncome)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-red-600">{formatCurrency(analysis.totalExpense)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Este mes: {formatCurrency(analysis.currentExpense)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${analysis.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(analysis.balance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salud Financiera</CardTitle>
            {healthScore >= 70 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{healthScore}%</div>
            <Progress value={healthScore} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Anomalies / Alerts */}
      {anomalyCount > 0 && (
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-yellow-800">
              <FileWarning className="h-5 w-5" />
              Alertas de Revision ({anomalyCount})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {analysis.largeTx.length > 0 && (
              <div className="rounded-md bg-white border px-3 py-2 text-sm">
                <span className="font-medium text-yellow-800">Gastos grandes:</span>{' '}
                {analysis.largeTx.length} transacciones representan mas del 10% del gasto total.
                <ul className="mt-1 ml-4 text-muted-foreground list-disc">
                  {analysis.largeTx.map((tx) => (
                    <li key={tx.id}>
                      {tx.description || 'Sin descripcion'} — {formatCurrency(tx.amount || 0)} ({formatDate(tx.date)})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.txWithoutCategory > 0 && (
              <div className="rounded-md bg-white border px-3 py-2 text-sm">
                <span className="font-medium text-yellow-800">Sin categorizar:</span>{' '}
                {analysis.txWithoutCategory} transacciones no tienen categoria asignada.
              </div>
            )}

            {unapprovedStatements.length > 0 && (
              <div className="rounded-md bg-white border px-3 py-2 text-sm">
                <span className="font-medium text-yellow-800">Estados sin aprobar:</span>{' '}
                {unapprovedStatements.length} estados financieros pendientes de aprobacion.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desglose por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {analysis.byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos de categorias.</p>
          ) : (
            <div className="space-y-3">
              {analysis.byCategory.slice(0, 10).map((cat) => {
                const maxAmount = Math.max(
                  ...analysis.byCategory.map((c) => Math.max(c.income, c.expense)),
                )
                const pctExpense = maxAmount > 0 ? (cat.expense / maxAmount) * 100 : 0
                const pctIncome = maxAmount > 0 ? (cat.income / maxAmount) * 100 : 0
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">{cat.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        {cat.income > 0 && (
                          <span className="text-green-600 text-xs">{formatCurrency(cat.income)}</span>
                        )}
                        {cat.expense > 0 && (
                          <span className="text-red-600 text-xs">{formatCurrency(cat.expense)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      {cat.income > 0 && (
                        <div
                          className="bg-green-400 rounded-full"
                          style={{ width: `${pctIncome}%` }}
                        />
                      )}
                      {cat.expense > 0 && (
                        <div
                          className="bg-red-400 rounded-full"
                          style={{ width: `${pctExpense}%` }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unapproved Statements */}
      {unapprovedStatements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estados Financieros Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unapprovedStatements.map((stmt) => (
                <div key={stmt.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="text-sm">
                    <span className="font-medium">{stmt.period}</span>
                    <span className="text-muted-foreground ml-2">
                      ({stmt.fund_type === 'mantenimiento' ? 'Mantenimiento' : 'Reserva'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{formatCurrency(stmt.closing_balance)}</span>
                    <Badge variant="warning">Pendiente</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
