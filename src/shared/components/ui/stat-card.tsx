import type { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { cn } from '@/shared/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  /** Optional color class for the value (e.g. 'text-green-600') */
  valueColor?: string
  /** Optional color class for the icon */
  iconColor?: string
  /** Optional content below the value */
  children?: React.ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  valueColor,
  iconColor = 'text-muted-foreground',
  children,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('rounded-xl border-border/80', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className={cn('text-xl font-bold', valueColor)}>{value}</div>
        {children}
      </CardContent>
    </Card>
  )
}
