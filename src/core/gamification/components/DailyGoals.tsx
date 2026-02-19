import { Link } from 'react-router-dom'
import { useMyGamification } from '../hooks/useGamification'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useCommunityContext } from '@/app/providers'
import type { DailyGoal } from '../types'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { getStreakWarning } from '../constants'
import { DynamicIcon } from '@/shared/components/DynamicIcon'
import { Target, Check, Flame, AlertTriangle, CheckCircle } from 'lucide-react'

/**
 * Daily Goals — the core behavioral loop.
 * Trigger: "Tienes metas pendientes"
 * Action: 1 tap to complete
 * Reward: Progress bar + streak grows
 * Return: "No pierdas tu racha"
 */
export function DailyGoals() {
  const { currentMember } = useCommunityContext()
  const { data: profile } = useMyGamification()
  const { data: activeProposals } = useProposals('active')
  const { data: obligations } = usePaymentObligations(currentMember?.id)

  if (!profile) return null

  // Build contextual daily goals based on what's actually happening
  const goals: DailyGoal[] = []

  // Goal 1: Check in (always available)
  const checkedInToday = profile.last_activity_date === new Date().toISOString().split('T')[0]
  goals.push({
    id: 'checkin',
    title: checkedInToday ? 'Ya entraste hoy' : 'Entra a tu comunidad',
    description: checkedInToday ? 'Revisa las novedades' : 'Revisa las novedades del dia',
    icon: 'log-in',
    completed: checkedInToday,
    action: { label: 'Ver novedades', href: '/dashboard' },
    points: 5,
  })

  // Goal 2: Vote if there are active proposals
  if (activeProposals && activeProposals.length > 0) {
    goals.push({
      id: 'vote',
      title: `${activeProposals.length} propuesta${activeProposals.length > 1 ? 's' : ''} esperan tu voto`,
      description: activeProposals[0].title,
      icon: 'vote',
      completed: false,
      action: { label: 'Ir a votar', href: '/governance' },
      points: 20,
    })
  }

  // Goal 3: Pending payments
  const pendingPayments = obligations?.filter(
    (o) => o.status === 'pending' || o.status === 'overdue'
  ) ?? []
  if (pendingPayments.length > 0) {
    const overdue = pendingPayments.filter((o) => o.status === 'overdue')
    goals.push({
      id: 'payment',
      title: overdue.length > 0
        ? `Tienes ${overdue.length} pago${overdue.length > 1 ? 's' : ''} vencido${overdue.length > 1 ? 's' : ''}`
        : 'Revisa tu estado de cuenta',
      description: overdue.length > 0 ? 'Ponte al corriente para no perder tu voto' : 'Verifica que estés al día',
      icon: overdue.length > 0 ? 'alert-triangle' : 'wallet',
      completed: false,
      action: { label: overdue.length > 0 ? 'Pagar ahora' : 'Ver pagos', href: '/treasury' },
      points: 50,
    })
  } else if (obligations && obligations.length > 0) {
    // All paid!
    goals.push({
      id: 'payment',
      title: 'Estas al corriente',
      description: 'Todos tus pagos estan al dia',
      icon: 'check-circle',
      completed: true,
      action: { label: 'Ver historial', href: '/treasury' },
      points: 0,
    })
  }

  const completedCount = goals.filter((g) => g.completed).length
  const totalGoals = goals.length
  const progressPct = totalGoals > 0 ? (completedCount / totalGoals) * 100 : 0

  // Streak warning (loss aversion — Duolingo style)
  const streakWarning = getStreakWarning(profile.current_streak, profile.last_activity_date)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4" />
            Tus metas de hoy
          </CardTitle>
          <span className="text-sm font-bold text-muted-foreground">
            {completedCount}/{totalGoals}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-700 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {goals.map((goal) => (
          <Link
            key={goal.id}
            to={goal.action.href}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-all ${
              goal.completed
                ? 'border-green-200 bg-green-50/50 opacity-75'
                : 'border-border hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm'
            }`}
          >
            <DynamicIcon name={goal.icon} className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${goal.completed ? 'line-through text-muted-foreground' : ''}`}>
                {goal.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">{goal.description}</p>
            </div>
            {goal.completed ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <span className="text-xs text-primary font-medium shrink-0">{goal.action.label}</span>
            )}
          </Link>
        ))}

        {/* Streak warning — loss aversion */}
        {streakWarning && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 mt-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-orange-800">
              <Flame className="h-4 w-4 shrink-0" />
              {streakWarning}
            </p>
          </div>
        )}

        {/* All complete celebration */}
        {completedCount === totalGoals && totalGoals > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center mt-2 animate-slide-up-fade">
            <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-green-800">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Completaste todas tus metas de hoy
            </p>
            <p className="text-xs text-green-600 mt-1">Tu racha sigue creciendo</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
