import { StatCard } from '@/shared/components/ui/stat-card'
import { Progress } from '@/shared/components/ui/progress'
import { formatCurrency } from '@/shared/lib/utils'
import {
  Users, Wallet, TrendingUp, TrendingDown,
  ArrowUpCircle, Receipt,
} from 'lucide-react'

interface KpiRowProps {
  memberCount: number
  memberLabel: string
  balance?: number
  totalIncome?: number
  totalExpenses?: number
  collectionRate?: number
  overdueCount?: number
  overdueAmount?: number
  hasFinancialData: boolean
}

export function KpiRow({
  memberCount,
  memberLabel,
  balance,
  totalIncome,
  totalExpenses,
  collectionRate,
  overdueCount,
  overdueAmount,
  hasFinancialData,
}: KpiRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      <StatCard label={memberLabel} value={memberCount} icon={Users} />

      {hasFinancialData && (
        <>
          <StatCard
            label="Balance"
            value={formatCurrency(balance ?? 0)}
            icon={Wallet}
            valueColor={(balance ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
          />
          <StatCard
            label="Ingresos"
            value={formatCurrency(totalIncome ?? 0)}
            icon={TrendingUp}
            iconColor="text-green-500"
            valueColor="text-green-600"
          />
          <StatCard
            label="Egresos"
            value={formatCurrency(totalExpenses ?? 0)}
            icon={TrendingDown}
            iconColor="text-red-500"
            valueColor="text-red-600"
          />
        </>
      )}

      {collectionRate != null && (
        <>
          <StatCard
            label="Tasa cobro"
            value={`${(collectionRate * 100).toFixed(0)}%`}
            icon={ArrowUpCircle}
            iconColor="text-blue-500"
          >
            <Progress value={collectionRate * 100} className="mt-1 h-1.5" />
          </StatCard>

          <StatCard
            label="Vencidos"
            value={overdueCount ?? 0}
            icon={Receipt}
            iconColor="text-red-500"
            valueColor="text-red-600"
          >
            {(overdueAmount ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">{formatCurrency(overdueAmount!)}</p>
            )}
          </StatCard>
        </>
      )}
    </div>
  )
}
