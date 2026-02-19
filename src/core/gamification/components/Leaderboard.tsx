import { useLeaderboard } from '../hooks/useGamification'
import { useCommunityContext } from '@/app/providers'
import { getLevelForXp } from '../constants'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

interface Props {
  limit?: number
  compact?: boolean
}

const RANK_DECORATIONS = ['🥇', '🥈', '🥉']

/** Community leaderboard showing top members by XP. */
export function Leaderboard({ limit = 10, compact }: Props) {
  const { data: entries, isLoading } = useLeaderboard(limit)
  const { currentMember } = useCommunityContext()

  if (isLoading) return <LoadingSpinner message="" className="py-4" />

  if (!entries || entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Sin datos de participación aún.</p>
  }

  if (compact) {
    return (
      <div className="space-y-1.5">
        {entries.slice(0, 5).map((entry) => {
          const level = getLevelForXp(entry.xp)
          const isMe = entry.member_id === currentMember?.id
          return (
            <div
              key={entry.member_id}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                isMe ? 'bg-primary/5 font-semibold' : ''
              }`}
            >
              <span className="w-5 text-center text-xs">
                {entry.rank <= 3 ? RANK_DECORATIONS[entry.rank - 1] : `${entry.rank}`}
              </span>
              <span className="text-sm">{level.icon}</span>
              <span className="flex-1 truncate">{entry.member_name}</span>
              <span className="text-xs font-mono text-muted-foreground">{entry.xp}</span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const level = getLevelForXp(entry.xp)
        const isMe = entry.member_id === currentMember?.id

        return (
          <div
            key={entry.member_id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              isMe
                ? 'bg-primary/5 ring-1 ring-primary/20'
                : entry.rank <= 3
                  ? 'bg-amber-50/50'
                  : 'hover:bg-muted/50'
            }`}
          >
            <span className="w-6 text-center font-bold text-sm">
              {entry.rank <= 3 ? RANK_DECORATIONS[entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className="text-lg">{level.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm truncate ${isMe ? 'font-bold' : 'font-medium'}`}>
                  {entry.member_name}
                  {isMe && <span className="text-xs text-muted-foreground ml-1">(Tú)</span>}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Niv.{entry.level} · {entry.badge_count} logros
                {entry.current_streak > 0 && ` · 🔥${entry.current_streak}`}
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold font-mono" style={{ color: level.color }}>
                {entry.xp.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground ml-0.5">pts</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
