import { BADGES, BADGE_CATEGORIES, getBadgeById } from '../constants'
import type { EarnedBadge } from '../types'
import { formatDate } from '@/shared/lib/utils'

interface Props {
  earned: EarnedBadge[]
  showAll?: boolean
  compact?: boolean
}

/** Grid of badges — earned ones are highlighted, unearned are dimmed. */
export function BadgeGrid({ earned, showAll, compact }: Props) {
  const earnedIds = new Set(earned.map((b) => b.id))
  const earnedMap = new Map(earned.map((b) => [b.id, b]))

  if (compact) {
    // Show only earned badges as a horizontal row
    if (earned.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1">
        {earned.map((b) => {
          const def = getBadgeById(b.id)
          if (!def) return null
          return (
            <span
              key={b.id}
              className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200 transition-transform hover:scale-110 cursor-default"
              title={`${def.name}: ${def.description}`}
            >
              {def.icon} {def.name}
            </span>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {BADGE_CATEGORIES.map((cat) => {
        const catBadges = BADGES.filter((b) => b.category === cat.id)
        if (!showAll && !catBadges.some((b) => earnedIds.has(b.id))) return null

        return (
          <div key={cat.id}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {cat.icon} {cat.label}
            </h4>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {catBadges.map((badge) => {
                const isEarned = earnedIds.has(badge.id)
                const earnedData = earnedMap.get(badge.id)

                if (!showAll && !isEarned) return null

                return (
                  <div
                    key={badge.id}
                    className={`group relative rounded-lg border p-3 text-center transition-all ${
                      isEarned
                        ? 'border-amber-200 bg-amber-50/50 shadow-sm hover:shadow-md hover:scale-[1.02]'
                        : 'border-dashed border-gray-200 bg-gray-50/50 opacity-40 grayscale'
                    }`}
                  >
                    <div className={`text-2xl mb-1 ${isEarned ? 'animate-badge-pop' : ''}`}>
                      {badge.icon}
                    </div>
                    <div className="text-xs font-semibold">{badge.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {badge.description}
                    </div>
                    {isEarned && earnedData && (
                      <div className="mt-1 text-[9px] text-amber-600 font-medium">
                        {formatDate(earnedData.earned_at)}
                      </div>
                    )}
                    {!isEarned && (
                      <div className="mt-1 text-[9px] text-muted-foreground">
                        🔒 Por desbloquear
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
