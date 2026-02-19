// Gamification Types — XP, Levels, Badges, Streaks

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
  condition: string // human-readable condition
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
