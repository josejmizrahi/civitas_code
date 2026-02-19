import { useMyGamification } from '../hooks/useGamification'
import { getLevelForXp, getXpProgress, getNextLevel } from '../constants'

interface Props {
  compact?: boolean
}

/** Global XP progress bar — shows current level, XP progress to next level. */
export function XpBar({ compact }: Props) {
  const { data: profile } = useMyGamification()

  if (!profile) return null

  const level = getLevelForXp(profile.xp)
  const next = getNextLevel(level.level)
  const progress = getXpProgress(profile.xp)

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold" style={{ color: level.color }}>
          {level.icon} Nv.{level.level}
        </span>
        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden min-w-[60px]">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out animate-xp-fill"
            style={{ width: `${progress.pct}%`, backgroundColor: level.color }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {profile.xp}xp
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{level.icon}</span>
          <div>
            <span className="text-sm font-bold" style={{ color: level.color }}>
              Nivel {level.level}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">{level.title}</span>
          </div>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {profile.xp} XP
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out animate-xp-fill"
          style={{ width: `${progress.pct}%`, backgroundColor: level.color }}
        />
      </div>
      {next && (
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{progress.current} / {progress.next} XP</span>
          <span>{next.icon} Nivel {next.level}: {next.title}</span>
        </div>
      )}
    </div>
  )
}
