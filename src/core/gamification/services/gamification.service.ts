import { supabase } from '@/shared/lib/supabase'
import type { GamificationProfile, GamificationAction, GamificationEvent, XpAwardResult, LeaderboardEntry, EarnedBadge } from '../types'
import { XP_VALUES, getLevelForXp, getStreakMultiplier, BADGES } from '../constants'

const gam = () => (supabase as any).from('member_gamification')
const events = () => (supabase as any).from('gamification_events')

// ─── Profile CRUD ──────────────────────────────────────────────────────────

/** Get or create gamification profile for a member. */
export async function getOrCreateProfile(
  memberId: string,
  communityId: string
): Promise<GamificationProfile> {
  // Try to get existing profile
  const { data, error } = await gam()
    .select('*')
    .eq('member_id', memberId)
    .eq('community_id', communityId)
    .maybeSingle()

  if (error) throw error
  if (data) return data as GamificationProfile

  // Create new profile
  const { data: created, error: createErr } = await gam()
    .insert({ member_id: memberId, community_id: communityId })
    .select()
    .single()

  if (createErr) {
    // Race condition: another request may have created it
    if (createErr.code === '23505') {
      const { data: existing } = await gam()
        .select('*')
        .eq('member_id', memberId)
        .eq('community_id', communityId)
        .single()
      return existing as GamificationProfile
    }
    throw createErr
  }
  return created as GamificationProfile
}

/** Get profile (returns null if not found). */
export async function getProfile(
  memberId: string,
  communityId: string
): Promise<GamificationProfile | null> {
  const { data, error } = await gam()
    .select('*')
    .eq('member_id', memberId)
    .eq('community_id', communityId)
    .maybeSingle()

  if (error) throw error
  return data as GamificationProfile | null
}

// ─── XP Award Engine ───────────────────────────────────────────────────────

/**
 * Award XP for an action. This is the main entry point.
 * Handles: XP calculation, streak tracking, level-up detection, badge checks.
 */
export async function awardXp(
  memberId: string,
  communityId: string,
  action: GamificationAction,
  metadata?: Record<string, unknown>
): Promise<XpAwardResult> {
  const profile = await getOrCreateProfile(memberId, communityId)
  const baseXp = XP_VALUES[action] ?? 0

  // Streak calculation
  const today = new Date().toISOString().split('T')[0]
  let newStreak = profile.current_streak
  if (profile.last_activity_date) {
    const lastDate = new Date(profile.last_activity_date)
    const todayDate = new Date(today)
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Same day, streak unchanged
    } else if (diffDays === 1) {
      newStreak += 1
    } else {
      newStreak = 1
    }
  } else {
    newStreak = 1
  }

  // Streak multiplier
  const { multiplier } = getStreakMultiplier(newStreak)
  const xpEarned = Math.round(baseXp * multiplier)

  const newXp = profile.xp + xpEarned
  const oldLevel = getLevelForXp(profile.xp)
  const newLevel = getLevelForXp(newXp)
  const leveledUp = newLevel.level > oldLevel.level

  // Check for new badges
  const actionCounts = await getActionCounts(memberId, communityId)
  // Include current action in counts
  actionCounts[action] = (actionCounts[action] ?? 0) + 1
  const newBadges = checkNewBadges(profile.badges, actionCounts, newStreak, newLevel.level)

  const updatedBadges = [
    ...profile.badges,
    ...newBadges.map((id) => ({ id, earned_at: new Date().toISOString() })),
  ]

  // Update profile
  const newMaxStreak = Math.max(profile.max_streak, newStreak)
  const { error: updateErr } = await gam()
    .update({
      xp: newXp,
      level: newLevel.level,
      current_streak: newStreak,
      max_streak: newMaxStreak,
      last_activity_date: today,
      badges: updatedBadges,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id)

  if (updateErr) throw updateErr

  // Log event
  await events()
    .insert({
      member_id: memberId,
      community_id: communityId,
      action,
      xp_earned: xpEarned,
      metadata: {
        ...metadata,
        streak: newStreak,
        multiplier,
        leveled_up: leveledUp,
        new_badges: newBadges,
      },
    })
    .then(() => {}) // fire and forget

  return {
    xp_earned: xpEarned,
    total_xp: newXp,
    level: newLevel.level,
    leveled_up: leveledUp,
    new_level: leveledUp ? newLevel.level : undefined,
    new_badges: newBadges,
    streak: newStreak,
    streak_multiplier: multiplier,
  }
}

// ─── Badge Checker ─────────────────────────────────────────────────────────

/** Get cumulative action counts for a member. */
async function getActionCounts(
  memberId: string,
  communityId: string
): Promise<Record<string, number>> {
  const { data, error } = await events()
    .select('action')
    .eq('member_id', memberId)
    .eq('community_id', communityId)

  if (error || !data) return {}

  const counts: Record<string, number> = {}
  for (const row of data as { action: string }[]) {
    counts[row.action] = (counts[row.action] ?? 0) + 1
  }
  return counts
}

/** Check which new badges should be awarded. */
function checkNewBadges(
  existing: EarnedBadge[],
  actionCounts: Record<string, number>,
  streak: number,
  level: number
): string[] {
  const earnedIds = new Set(existing.map((b) => b.id))
  const newBadges: string[] = []

  for (const badge of BADGES) {
    if (earnedIds.has(badge.id)) continue

    const earned = evaluateBadgeCondition(badge.condition, actionCounts, streak, level)
    if (earned) newBadges.push(badge.id)
  }

  return newBadges
}

/** Evaluate a badge condition string against current stats. */
function evaluateBadgeCondition(
  condition: string,
  counts: Record<string, number>,
  streak: number,
  level: number
): boolean {
  // Format: "action >= N" or "streak >= N" or "level >= N" or "special: xyz"
  if (condition.startsWith('special:')) return false // special badges are awarded manually

  const match = condition.match(/^(\w+)\s*>=\s*(\d+)$/)
  if (!match) return false

  const [, key, valueStr] = match
  const threshold = parseInt(valueStr)

  if (key === 'streak') return streak >= threshold
  if (key === 'level') return level >= threshold
  return (counts[key] ?? 0) >= threshold
}

// ─── Leaderboard ───────────────────────────────────────────────────────────

/** Get community leaderboard sorted by XP. */
export async function getLeaderboard(
  communityId: string,
  limit = 20
): Promise<LeaderboardEntry[]> {
  const { data, error } = await gam()
    .select('member_id, xp, level, current_streak, badges')
    .eq('community_id', communityId)
    .order('xp', { ascending: false })
    .limit(limit)

  if (error) throw error
  if (!data || data.length === 0) return []

  // Fetch member names via member_profiles view (has email from auth.users)
  const memberIds = (data as any[]).map((d) => d.member_id)
  const { data: profiles } = await supabase
    .from('member_profiles' as any)
    .select('id, email, full_name')
    .in('id', memberIds)

  const nameMap = new Map<string, string>()
  for (const m of (profiles ?? []) as any[]) {
    nameMap.set(m.id, m.full_name || m.email || 'Miembro')
  }

  return (data as any[]).map((d, i) => ({
    rank: i + 1,
    member_id: d.member_id,
    member_name: nameMap.get(d.member_id) ?? 'Miembro',
    xp: d.xp,
    level: d.level,
    current_streak: d.current_streak,
    badge_count: Array.isArray(d.badges) ? d.badges.length : 0,
  }))
}

// ─── Recent Events ─────────────────────────────────────────────────────────

/** Get recent gamification events for a member. */
export async function getRecentEvents(
  memberId: string,
  communityId: string,
  limit = 20
): Promise<GamificationEvent[]> {
  const { data, error } = await events()
    .select('*')
    .eq('member_id', memberId)
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data ?? []
}
