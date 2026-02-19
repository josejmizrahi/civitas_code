import { describe, it, expect } from 'vitest'
import {
  getLevelForXp,
  getNextLevel,
  getXpProgress,
  getStreakMultiplier,
  getBadgeById,
  LEVELS,
  BADGES,
  XP_VALUES,
} from '../constants'

describe('Gamification Constants', () => {
  describe('getLevelForXp', () => {
    it('returns level 1 for 0 XP', () => {
      expect(getLevelForXp(0).level).toBe(1)
    })

    it('returns level 2 at 100 XP', () => {
      expect(getLevelForXp(100).level).toBe(2)
    })

    it('returns level 3 at 300 XP', () => {
      expect(getLevelForXp(300).level).toBe(3)
    })

    it('returns highest level for very high XP', () => {
      expect(getLevelForXp(99999).level).toBe(7)
    })

    it('stays at current level before threshold', () => {
      expect(getLevelForXp(99).level).toBe(1)
      expect(getLevelForXp(299).level).toBe(2)
    })
  })

  describe('getNextLevel', () => {
    it('returns next level definition', () => {
      const next = getNextLevel(1)
      expect(next?.level).toBe(2)
      expect(next?.xpRequired).toBe(100)
    })

    it('returns null for max level', () => {
      expect(getNextLevel(7)).toBeNull()
    })
  })

  describe('getXpProgress', () => {
    it('calculates progress within level', () => {
      const progress = getXpProgress(150)
      expect(progress.current).toBe(50) // 150 - 100 (level 2 start)
      expect(progress.next).toBe(200)   // 300 - 100
      expect(progress.pct).toBe(25)
    })

    it('returns 100% at max level', () => {
      const progress = getXpProgress(5000)
      expect(progress.pct).toBe(100)
    })

    it('returns 0% at start of level', () => {
      const progress = getXpProgress(100) // exactly level 2
      expect(progress.current).toBe(0)
      expect(progress.pct).toBe(0)
    })
  })

  describe('getStreakMultiplier', () => {
    it('returns x1 for 0-2 days', () => {
      expect(getStreakMultiplier(0).multiplier).toBe(1.0)
      expect(getStreakMultiplier(2).multiplier).toBe(1.0)
    })

    it('returns x1.1 for 3-6 days', () => {
      expect(getStreakMultiplier(3).multiplier).toBe(1.1)
      expect(getStreakMultiplier(6).multiplier).toBe(1.1)
    })

    it('returns x1.25 for 7-13 days', () => {
      expect(getStreakMultiplier(7).multiplier).toBe(1.25)
    })

    it('returns x1.5 for 14-29 days', () => {
      expect(getStreakMultiplier(14).multiplier).toBe(1.5)
    })

    it('returns x2 for 30+ days', () => {
      expect(getStreakMultiplier(30).multiplier).toBe(2.0)
      expect(getStreakMultiplier(100).multiplier).toBe(2.0)
    })
  })

  describe('getBadgeById', () => {
    it('finds existing badge', () => {
      const badge = getBadgeById('first_vote')
      expect(badge).toBeDefined()
      expect(badge?.name).toBe('Mi Primera Vez')
    })

    it('returns undefined for unknown badge', () => {
      expect(getBadgeById('nonexistent')).toBeUndefined()
    })
  })

  describe('data integrity', () => {
    it('levels are sorted by XP', () => {
      for (let i = 1; i < LEVELS.length; i++) {
        expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired)
      }
    })

    it('all badge IDs are unique', () => {
      const ids = BADGES.map((b) => b.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('all XP actions have positive values', () => {
      for (const [_action, xp] of Object.entries(XP_VALUES)) {
        expect(xp).toBeGreaterThan(0)
      }
    })
  })
})
