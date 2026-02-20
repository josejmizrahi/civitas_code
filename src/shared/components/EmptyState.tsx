import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Inbox, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-6 px-4' : 'py-12 px-6',
        className,
      )}
    >
      <div className={cn(
        'flex items-center justify-center rounded-full bg-muted',
        compact ? 'h-10 w-10 mb-3' : 'h-12 w-12 mb-4',
      )}>
        <Icon className={cn('text-muted-foreground', compact ? 'h-5 w-5' : 'h-6 w-6')} />
      </div>
      <h3 className={cn('font-medium text-foreground', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h3>
      {description && (
        <p className={cn('mt-1 max-w-sm text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
