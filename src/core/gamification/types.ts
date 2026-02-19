// Gamification Types — Behavioral Loops, Goals, Progress, Community Pulse

export type GamificationAction =
  | 'vote'
  | 'endorse'
  | 'propose'
  | 'pay_on_time'
  | 'attend_assembly'
  | 'daily_login'
  | 'comment'
  | 'sign_minutes'
  | 'create_delegation'

export interface GamificationProfile {
  id: string
  member_id: string
  community_id: string
  xp: number
  level: number
  current_streak: number
  max_streak: number
  last_activity_date: string | null
  badges: EarnedBadge[]
  created_at: string
  updated_at: string
  // Joined
  member_name?: string
}

export interface EarnedBadge {
  id: string
  earned_at: string
}

export interface GamificationEvent {
  id: string
  member_id: string
  community_id: string
  action: GamificationAction
  xp_earned: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface LevelDefinition {
  level: number
  title: string
  titleShort: string
  xpRequired: number
  color: string
  icon: string
}

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  category: 'governance' | 'treasury' | 'community' | 'streak' | 'special'
  condition: string
}

export interface LeaderboardEntry {
  rank: number
  member_id: string
  member_name: string
  xp: number
  level: number
  current_streak: number
  badge_count: number
}

export interface XpAwardResult {
  xp_earned: number
  total_xp: number
  level: number
  leveled_up: boolean
  new_level?: number
  new_badges: string[]
  streak: number
  streak_multiplier: number
}

// ─── Behavioral Loop Types ──────────────────────────────────────────────────

/** A daily goal — part of the trigger → action → reward loop. */
export interface DailyGoal {
  id: string
  title: string
  description: string
  icon: string
  completed: boolean
  action: {
    label: string
    href: string
  }
  points: number
}

/** Community health pulse — collective progress meter. */
export interface CommunityPulse {
  overall: number
  payments: { pct: number; label: string }
  participation: { pct: number; label: string }
  activity: { pct: number; label: string }
}

/** Social nudge — peer activity for FOMO / belonging. */
export interface SocialNudge {
  type: 'vote' | 'payment' | 'proposal' | 'general'
  message: string
  icon: string
  href?: string
}

/** Quick action — one-tap contextual action. */
export interface QuickAction {
  id: string
  title: string
  subtitle: string
  icon: string
  href: string
  urgency: 'high' | 'medium' | 'low'
  badge?: string
}
