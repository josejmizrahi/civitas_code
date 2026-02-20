import { useToast } from '@/shared/components/ui/toast'
import { getBadgeById, getLevelForXp, getCelebrationMessage } from '../constants'
import type { XpAwardResult, GamificationAction } from '../types'

/**
 * Enhanced achievement toast — variable rewards.
 * Different messages each time (not boring "+10 XP" every time).
 * Celebration message → then level up → then badges.
 */
export function useAchievementToast() {
  const toast = useToast()

  return function showAchievement(result: XpAwardResult, action?: GamificationAction) {
    const celebrationMsg = action ? getCelebrationMessage(action) : null

    // Main celebration (not just "+X points")
    if (celebrationMsg) {
      const streakBonus = result.streak_multiplier > 1
        ? ` (racha ${result.streak}d = ${result.streak_multiplier}x)`
        : ''
      toast.success(`${celebrationMsg} +${result.xp_earned} pts${streakBonus}`)
    } else {
      toast.success(`+${result.xp_earned} puntos`)
    }

    // Level up
    if (result.leveled_up && result.new_level) {
      const level = getLevelForXp(result.total_xp)
      setTimeout(() => {
        toast.success(`Subiste a ${level.title}. Felicidades.`)
      }, 800)
    }

    // New badges
    for (let i = 0; i < result.new_badges.length; i++) {
      const badge = getBadgeById(result.new_badges[i])
      if (badge) {
        setTimeout(() => {
          toast.success(`Nuevo logro: ${badge.name} - ${badge.description}`)
        }, 1500 + i * 700)
      }
    }
  }
}
