import { useLeaderboard } from '../hooks/useGamification'
import { useCommunityContext } from '@/app/providers'
import { getLevelForXp } from '../constants'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { DynamicIcon } from '@/shared/components/DynamicIcon'
import { Flame } from 'lucide-react'

interface Props {
  limit?: number
  compact?: boolean
}

const RANK_COLORS = ['text-amber-500', 'text-gray-400', 'text-amber-700']

/** Community leaderboard showing top members by XP. */
export function Leaderboard({ limit = 10, compact }: Props) {
  const { data: entries, isLoading } = useLeaderboard(limit)
  const { currentMember } = useCommunityContext()

  if (isLoading) return <LoadingSpinner message="" className="py-4" />

  if (!entries || entries.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Sin datos de participacion aun.</p>
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
              <span className={`w-5 text-center text-xs font-bold ${entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : 'text-muted-foreground'}`}>
                {entry.rank}
              </span>
              <DynamicIcon name={level.icon} className="h-3.5 w-3.5" style={{ color: level.color }} />
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
            <span className={`w-6 text-center font-bold text-sm ${entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : 'text-muted-foreground'}`}>
              {entry.rank <= 3 ? `${entry.rank}` : `#${entry.rank}`}
            </span>
            <DynamicIcon name={level.icon} className="h-4.5 w-4.5" style={{ color: level.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm truncate ${isMe ? 'font-bold' : 'font-medium'}`}>
                  {entry.member_name}
                  {isMe && <span className="text-xs text-muted-foreground ml-1">(Tu)</span>}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span>Niv.{entry.level}</span>
                <span>·</span>
                <span>{entry.badge_count} logros</span>
                {entry.current_streak > 0 && (
                  <>
                    <span>·</span>
                    <Flame className="inline h-2.5 w-2.5 text-orange-500" />
                    <span>{entry.current_streak}</span>
                  </>
                )}
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
