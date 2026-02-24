import { cn } from '@/shared/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  /** Small muted text below subtitle */
  meta?: string
  /** Actions slot (buttons, badges, etc.) rendered on the right */
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, meta, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {meta && <p className="mt-0.5 text-xs text-muted-foreground/70">{meta}</p>}
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  )
}
