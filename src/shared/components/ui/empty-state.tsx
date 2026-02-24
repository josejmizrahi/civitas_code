import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  message: string
  /** Optional smaller text below the main message */
  hint?: string
  /** Use "dashed" for actionable hints, "plain" for simple absence */
  variant?: 'plain' | 'dashed'
  className?: string
}

export function EmptyState({
  icon: Icon,
  message,
  hint,
  variant = 'plain',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'py-8 text-center',
        variant === 'dashed' && 'rounded-lg border border-dashed p-6',
        className,
      )}
    >
      {Icon && <Icon className="mx-auto h-10 w-10 text-muted-foreground/40" />}
      <p className={cn('text-sm text-muted-foreground', Icon && 'mt-3')}>{message}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  )
}
