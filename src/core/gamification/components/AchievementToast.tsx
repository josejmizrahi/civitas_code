import { useToast } from '@/shared/components/ui/toast'
import { getBadgeById, getLevelForXp } from '../constants'
import type { XpAwardResult } from '../types'

/** Hook that shows achievement toasts for XP awards. */
export function useAchievementToast() {
  const toast = useToast()

  return function showAchievement(result: XpAwardResult) {
    const { multiplier, label } = result.streak_multiplier > 1
      ? { multiplier: result.streak_multiplier, label: `x${result.streak_multiplier}` }
      : { multiplier: 1, label: '' }

    // XP earned toast
    const streakText = multiplier > 1 ? ` (${label} racha)` : ''
    toast.success(`+${result.xp_earned} XP${streakText}`)

    // Level up toast
    if (result.leveled_up && result.new_level) {
      const level = getLevelForXp(result.total_xp)
      setTimeout(() => {
        toast.success(`${level.icon} ¡Subiste a Nivel ${result.new_level}! ${level.title}`)
      }, 800)
    }

    // New badges
    for (let i = 0; i < result.new_badges.length; i++) {
      const badge = getBadgeById(result.new_badges[i])
      if (badge) {
        setTimeout(() => {
          toast.success(`${badge.icon} Insignia desbloqueada: ${badge.name}`)
        }, 1500 + i * 700)
      }
    }
  }
}
