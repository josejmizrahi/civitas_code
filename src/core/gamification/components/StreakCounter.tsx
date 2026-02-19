import { getStreakMultiplier } from '../constants'
import { Flame, Zap } from 'lucide-react'

interface Props {
  streak: number
  maxStreak?: number
  compact?: boolean
}

/** Streak counter with multiplier indicator. */
export function StreakCounter({ streak, maxStreak, compact }: Props) {
  const { label } = getStreakMultiplier(streak)
  const hasMultiplier = streak >= 3

  if (streak === 0) {
    if (compact) return null
    return (
      <span className="text-xs text-muted-foreground">
        Empieza tu racha hoy
      </span>
    )
  }

  if (compact) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-bold text-orange-500">
        <Flame className="h-3.5 w-3.5" />
        {streak}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {streak >= 30 ? (
          <Zap className={`h-5 w-5 text-orange-500 ${streak >= 7 ? 'animate-pulse-fire' : ''}`} />
        ) : (
          <Flame className={`h-5 w-5 text-orange-500 ${streak >= 7 ? 'animate-pulse-fire' : ''}`} />
        )}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-orange-500">{streak}</span>
            <span className="text-xs text-muted-foreground">dias</span>
            {hasMultiplier && (
              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                {label}
              </span>
            )}
          </div>
          {maxStreak != null && maxStreak > streak && (
            <span className="text-[10px] text-muted-foreground">
              Record: {maxStreak} dias
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
