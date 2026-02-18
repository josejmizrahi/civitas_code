import { CheckCircle2, Circle, MessageSquare, Vote, XCircle, Gavel, Play } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import type { ProposalStatus } from '@/shared/types'

interface Step {
  key: ProposalStatus | 'appeal'
  label: string
  icon: typeof Circle
}

const LIFECYCLE_STEPS: Step[] = [
  { key: 'draft', label: 'Borrador', icon: Circle },
  { key: 'discussion', label: 'Discusión', icon: MessageSquare },
  { key: 'active', label: 'Votación', icon: Vote },
  { key: 'approved', label: 'Resultado', icon: Gavel },
  { key: 'executed', label: 'Ejecutada', icon: Play },
]

// Map each status to its step index
const STATUS_INDEX: Record<string, number> = {
  draft: 0,
  discussion: 1,
  active: 2,
  closed: 3,
  approved: 3,
  rejected: 3,
  executed: 4,
}

interface Props {
  status: ProposalStatus
  appealed?: boolean
  className?: string
}

export function ProposalLifecycleIndicator({ status, appealed, className }: Props) {
  const currentIndex = STATUS_INDEX[status] ?? 0
  const isRejected = status === 'rejected'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {LIFECYCLE_STEPS.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isFuture = index > currentIndex
        const Icon = step.icon

        // Skip "executed" step if there's no financial instruction (would be detected by parent)
        // We always show it but it stays gray if not applicable

        let dotColor = 'bg-gray-200 text-gray-400'
        let lineColor = 'bg-gray-200'

        if (isCompleted) {
          dotColor = 'bg-green-100 text-green-600'
          lineColor = 'bg-green-400'
        } else if (isCurrent) {
          if (isRejected) {
            dotColor = 'bg-red-100 text-red-600'
          } else if (appealed) {
            dotColor = 'bg-amber-100 text-amber-600'
          } else {
            dotColor = 'bg-blue-100 text-blue-600'
          }
        }

        return (
          <div key={step.key} className="flex items-center">
            {/* Step dot */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
                  dotColor
                )}
                title={step.label}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent && isRejected ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium leading-none',
                  isCurrent ? 'text-foreground' : isFuture ? 'text-muted-foreground/50' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < LIFECYCLE_STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 w-6 sm:w-8 rounded-full transition-colors -mt-4',
                  isCompleted ? lineColor : 'bg-gray-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
