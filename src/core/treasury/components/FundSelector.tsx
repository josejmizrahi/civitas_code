import { cn } from '@/shared/lib/utils'
import { Building2, ShieldCheck } from 'lucide-react'
import type { FundType } from '@/shared/types/rules'

interface FundSelectorProps {
  value: FundType
  onChange: (fund: FundType) => void
  className?: string
}

const FUNDS: { value: FundType; label: string; description: string; icon: typeof Building2 }[] = [
  {
    value: 'mantenimiento',
    label: 'Mantenimiento',
    description: 'Gastos operativos ordinarios',
    icon: Building2,
  },
  {
    value: 'reserva',
    label: 'Reserva',
    description: 'Fondo de reserva (Art. 57-58 LPCI)',
    icon: ShieldCheck,
  },
]

/**
 * Toggle between Mantenimiento and Reserva fund views.
 * Implements LPCI CDMX Art. 57-58 dual fund requirement.
 */
export function FundSelector({ value, onChange, className }: FundSelectorProps) {
  return (
    <div className={cn('inline-flex flex-col sm:flex-row rounded-lg bg-muted p-1 w-full sm:w-auto', className)}>
      {FUNDS.map((fund) => {
        const Icon = fund.icon
        const isActive = value === fund.value

        return (
          <button
            key={fund.value}
            onClick={() => onChange(fund.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
              isActive
                ? 'bg-background text-foreground shadow'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
            )}
            title={fund.description}
          >
            <Icon className="h-4 w-4" />
            {fund.label}
          </button>
        )
      })}
    </div>
  )
}
