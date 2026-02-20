import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertBannerProps {
  variant: AlertVariant
  children: ReactNode
  icon?: LucideIcon
  className?: string
  compact?: boolean
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-200',
  success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50 text-green-800 dark:text-green-200',
  warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200',
  error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-200',
}

const variantIcons: Record<AlertVariant, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
}

const iconColorStyles: Record<AlertVariant, string> = {
  info: 'text-blue-600 dark:text-blue-400',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-red-600 dark:text-red-400',
}

export function AlertBanner({ variant, children, icon, className, compact }: AlertBannerProps) {
  const Icon = icon || variantIcons[variant]

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-lg border',
        compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
        variantStyles[variant],
        className,
      )}
    >
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColorStyles[variant])} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
