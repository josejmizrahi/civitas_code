import { BADGES, BADGE_CATEGORIES, getBadgeById } from '../constants'
import type { EarnedBadge } from '../types'
import { formatDate } from '@/shared/lib/utils'
import { DynamicIcon } from '@/shared/components/DynamicIcon'
import { Lock } from 'lucide-react'

interface Props {
  earned: EarnedBadge[]
  showAll?: boolean
  compact?: boolean
}

/** Grid of badges -- earned ones are highlighted, unearned are dimmed. */
export function BadgeGrid({ earned, showAll, compact }: Props) {
  const earnedIds = new Set(earned.map((b) => b.id))
  const earnedMap = new Map(earned.map((b) => [b.id, b]))

  if (compact) {
    if (earned.length === 0) return null
    return (
      <div className="flex flex-wrap gap-1">
        {earned.map((b) => {
          const def = getBadgeById(b.id)
          if (!def) return null
          return (
            <span
              key={b.id}
              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-200 transition-transform hover:scale-110 cursor-default"
              title={`${def.name}: ${def.description}`}
            >
              <DynamicIcon name={def.icon} className="h-3 w-3" />
              {def.name}
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
            <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <DynamicIcon name={cat.icon} className="h-3.5 w-3.5" />
              {cat.label}
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
                    <div className={`flex justify-center mb-1 ${isEarned ? 'animate-badge-pop' : ''}`}>
                      <DynamicIcon name={badge.icon} className="h-6 w-6" />
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
                      <div className="mt-1 flex items-center justify-center gap-0.5 text-[9px] text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" />
                        Por desbloquear
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
