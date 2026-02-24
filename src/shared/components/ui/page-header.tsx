import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Small muted text below subtitle */
  meta?: string
  /** Optional icon rendered before the title */
  icon?: LucideIcon
  /** Actions slot (buttons, badges, etc.) rendered on the right */
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, meta, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          {Icon && <Icon className="h-6 w-6 text-primary" />}
          {title}
        </h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {meta && <p className="mt-0.5 text-xs text-muted-foreground/70">{meta}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
