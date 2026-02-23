import { useDashboard } from '../hooks/useDashboard'
import { useCollectionStats } from '../hooks/usePaymentStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Progress } from '@/shared/components/ui/progress'
import { formatCurrency } from '@/shared/lib/utils'
import { Wallet, ArrowUpCircle } from 'lucide-react'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

/**
 * Compact community financial summary for member view (balance + collection rate).
 * No fund filter — shows default/aggregate.
 */
export function FinancialSummaryCompact() {
  const { data: stats, isLoading } = useDashboard()
  const { data: collStats } = useCollectionStats()

  if (isLoading) return <LoadingSpinner message="Cargando resumen…" className="py-6" />
  if (!stats) {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          <Wallet className="mx-auto h-8 w-8 opacity-50" />
          <p className="mt-2">Sin datos financieros de la comunidad aún.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-xl border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Resumen de la comunidad</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={`text-lg font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.balance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ingresos</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Egresos</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalExpenses)}</p>
          </div>
        </div>
        {collStats != null && (
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                Tasa de cobro
              </span>
              <span className="font-medium">{(collStats.collectionRate * 100).toFixed(0)}%</span>
            </div>
            <Progress value={collStats.collectionRate * 100} className="mt-1 h-2" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
