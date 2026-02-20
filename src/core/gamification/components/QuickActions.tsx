import { Link } from 'react-router-dom'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useCommunityContext } from '@/app/providers'
import { DynamicIcon } from '@/shared/components/DynamicIcon'
import { ChevronRight } from 'lucide-react'
import type { QuickAction } from '../types'

/**
 * Quick Actions -- reduce friction to 1 tap.
 * Shows the most important thing the member should do right now.
 */
export function QuickActions() {
  const { currentMember } = useCommunityContext()
  const { data: proposals } = useProposals('active')
  const { data: obligations } = usePaymentObligations(currentMember?.id)

  const actions: QuickAction[] = []

  // Overdue payments -- highest urgency
  const overduePayments = obligations?.filter((o) => o.status === 'overdue') ?? []
  if (overduePayments.length > 0) {
    actions.push({
      id: 'overdue',
      title: 'Ponte al corriente',
      subtitle: `Tienes ${overduePayments.length} pago${overduePayments.length > 1 ? 's' : ''} vencido${overduePayments.length > 1 ? 's' : ''}`,
      icon: 'alert-triangle',
      href: '/treasury',
      urgency: 'high',
    })
  }

  // Active proposals to vote on
  if (proposals && proposals.length > 0) {
    actions.push({
      id: 'vote',
      title: 'Vota ahora',
      subtitle: proposals.length === 1
        ? proposals[0].title
        : `${proposals.length} propuestas esperan tu opinion`,
      icon: 'vote',
      href: '/governance',
      urgency: 'medium',
      badge: `${proposals.length}`,
    })
  }

  // Pending payments (not overdue yet)
  const pendingPayments = obligations?.filter((o) => o.status === 'pending') ?? []
  if (pendingPayments.length > 0 && overduePayments.length === 0) {
    actions.push({
      id: 'payment',
      title: 'Revisa tu cuota',
      subtitle: 'Tienes pagos pendientes',
      icon: 'wallet',
      href: '/treasury',
      urgency: 'low',
    })
  }

  if (actions.length === 0) return null

  const urgencyStyles = {
    high: 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-foreground',
    medium: 'border-chart-1/30 bg-chart-1/5 hover:bg-chart-1/10 text-foreground',
    low: 'border-muted bg-card hover:bg-accent',
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground px-1">Acciones pendientes</h3>
      {actions.slice(0, 3).map((action) => (
        <Link
          key={action.id}
          to={action.href}
          className={`flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${urgencyStyles[action.urgency]}`}
        >
          <DynamicIcon name={action.icon} className="h-6 w-6 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold">{action.title}</p>
            <p className="text-sm opacity-80 truncate">{action.subtitle}</p>
          </div>
          {action.badge && (
            <span className="rounded-full bg-primary text-primary-foreground px-2.5 py-0.5 text-xs font-bold">
              {action.badge}
            </span>
          )}
          <ChevronRight className="h-4 w-4 opacity-50 shrink-0" />
        </Link>
      ))}
    </div>
  )
}
