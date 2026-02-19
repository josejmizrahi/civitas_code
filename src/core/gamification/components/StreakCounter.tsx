import { getStreakMultiplier } from '../constants'

interface Props {
  streak: number
  maxStreak?: number
  compact?: boolean
}

/** Streak fire counter with multiplier indicator. */
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
        <span className="animate-pulse-fire">🔥</span>
        {streak}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className={`text-xl ${streak >= 7 ? 'animate-pulse-fire' : ''}`}>
          {streak >= 30 ? '⚡' : '🔥'}
        </span>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-orange-500">{streak}</span>
            <span className="text-xs text-muted-foreground">días</span>
            {hasMultiplier && (
              <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600">
                {label}
              </span>
            )}
          </div>
          {maxStreak != null && maxStreak > streak && (
            <span className="text-[10px] text-muted-foreground">
              Récord: {maxStreak} días
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
