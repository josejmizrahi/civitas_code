import { useMemo } from 'react'
import { useDashboard } from '../hooks/useDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatCurrency } from '@/shared/lib/utils'
import { ArrowRight, TrendingUp, TrendingDown, Equal } from 'lucide-react'

interface Props {
  type: 'income' | 'expense'
  amount: number
  description?: string
}

export function FinancialImpactSimulator({ type, amount, description }: Props) {
  const { data: stats } = useDashboard()

  const impact = useMemo(() => {
    if (!stats) return null
    const currentBalance = stats.balance
    const newBalance = type === 'income' ? currentBalance + amount : currentBalance - amount
    const diff = newBalance - currentBalance
    return { currentBalance, newBalance, diff }
  }, [stats, type, amount])

  if (!impact || amount <= 0) return null

  const isPositive = impact.diff > 0

  return (
    <Card className={`border-2 ${isPositive ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
          Impacto Financiero
          {description && <span className="text-muted-foreground font-normal">— {description}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Balance Actual</p>
            <p className={`text-lg font-bold ${impact.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(impact.currentBalance)}
            </p>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground mx-auto sm:mx-0 rotate-90 sm:rotate-0" />

          <div className="text-center">
            <p className="text-xs text-muted-foreground">Balance Nuevo</p>
            <p className={`text-lg font-bold ${impact.newBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(impact.newBalance)}
            </p>
          </div>

          <div className="text-center sm:ml-auto">
            <p className="text-xs text-muted-foreground">Diferencia</p>
            <p className={`text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '+' : ''}{formatCurrency(impact.diff)}
            </p>
          </div>
        </div>

        {impact.newBalance < 0 && impact.currentBalance >= 0 && (
          <div className="mt-3 rounded-md bg-red-100 border border-red-200 px-3 py-2 text-sm text-red-800">
            Esta operacion dejaria la comunidad con balance negativo.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
