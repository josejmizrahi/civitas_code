import type { LevelDefinition, BadgeDefinition, GamificationAction } from './types'

// ─── XP Values per Action ──────────────────────────────────────────────────

export const XP_VALUES: Record<GamificationAction, number> = {
  vote: 20,
  endorse: 10,
  propose: 30,
  pay_on_time: 50,
  attend_assembly: 40,
  daily_login: 5,
  comment: 10,
  sign_minutes: 15,
  create_delegation: 10,
}

// ─── Streak Multipliers ────────────────────────────────────────────────────

export const STREAK_MULTIPLIERS = [
  { minDays: 30, multiplier: 2.0, label: 'x2' },
  { minDays: 14, multiplier: 1.5, label: 'x1.5' },
  { minDays: 7, multiplier: 1.25, label: 'x1.25' },
  { minDays: 3, multiplier: 1.1, label: 'x1.1' },
  { minDays: 0, multiplier: 1.0, label: 'x1' },
]

export function getStreakMultiplier(streak: number): { multiplier: number; label: string } {
  return STREAK_MULTIPLIERS.find((s) => streak >= s.minDays) ?? STREAK_MULTIPLIERS[STREAK_MULTIPLIERS.length - 1]
}

// ─── Level System ──────────────────────────────────────────────────────────

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: 'Vecino Nuevo', titleShort: 'Nuevo', xpRequired: 0, color: '#94a3b8', icon: '🏠' },
  { level: 2, title: 'Vecino Activo', titleShort: 'Activo', xpRequired: 100, color: '#22c55e', icon: '🌱' },
  { level: 3, title: 'Participante', titleShort: 'Participante', xpRequired: 300, color: '#3b82f6', icon: '⭐' },
  { level: 4, title: 'Colaborador', titleShort: 'Colaborador', xpRequired: 600, color: '#8b5cf6', icon: '🤝' },
  { level: 5, title: 'Líder Comunitario', titleShort: 'Líder', xpRequired: 1000, color: '#f59e0b', icon: '🏆' },
  { level: 6, title: 'Pilar de la Comunidad', titleShort: 'Pilar', xpRequired: 1800, color: '#ef4444', icon: '🏛️' },
  { level: 7, title: 'Guardián del Condominio', titleShort: 'Guardián', xpRequired: 3000, color: '#ec4899', icon: '👑' },
]

export function getLevelForXp(xp: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i]
  }
  return LEVELS[0]
}

export function getNextLevel(currentLevel: number): LevelDefinition | null {
  const idx = LEVELS.findIndex((l) => l.level === currentLevel)
  return idx >= 0 && idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
}

export function getXpProgress(xp: number): { current: number; next: number; pct: number } {
  const level = getLevelForXp(xp)
  const nextLevel = getNextLevel(level.level)
  if (!nextLevel) return { current: xp, next: xp, pct: 100 }
  const inLevel = xp - level.xpRequired
  const needed = nextLevel.xpRequired - level.xpRequired
  return { current: inLevel, next: needed, pct: Math.min((inLevel / needed) * 100, 100) }
}

// ─── Badge Definitions ─────────────────────────────────────────────────────

export const BADGES: BadgeDefinition[] = [
  // Governance
  { id: 'first_vote', name: 'Primer Voto', description: 'Emitiste tu primer voto', icon: '🗳️', category: 'governance', condition: 'vote >= 1' },
  { id: 'voter_10', name: 'Voz del Pueblo', description: 'Emitiste 10 votos', icon: '📢', category: 'governance', condition: 'vote >= 10' },
  { id: 'voter_50', name: 'Democracia Pura', description: 'Emitiste 50 votos', icon: '🏛️', category: 'governance', condition: 'vote >= 50' },
  { id: 'first_proposal', name: 'Proponente', description: 'Creaste tu primera propuesta', icon: '💡', category: 'governance', condition: 'propose >= 1' },
  { id: 'proposer_10', name: 'Innovador', description: 'Creaste 10 propuestas', icon: '🚀', category: 'governance', condition: 'propose >= 10' },
  { id: 'endorser_5', name: 'Avalista', description: 'Avalaste 5 propuestas', icon: '✅', category: 'governance', condition: 'endorse >= 5' },
  { id: 'endorser_20', name: 'Respaldo Total', description: 'Avalaste 20 propuestas', icon: '🛡️', category: 'governance', condition: 'endorse >= 20' },
  // Treasury
  { id: 'first_payment', name: 'Al Corriente', description: 'Pagaste a tiempo por primera vez', icon: '💰', category: 'treasury', condition: 'pay_on_time >= 1' },
  { id: 'payer_6', name: 'Buen Pagador', description: '6 pagos puntuales', icon: '💎', category: 'treasury', condition: 'pay_on_time >= 6' },
  { id: 'payer_12', name: 'Impecable', description: '12 pagos puntuales', icon: '🌟', category: 'treasury', condition: 'pay_on_time >= 12' },
  // Community
  { id: 'first_comment', name: 'Primera Opinión', description: 'Comentaste en una discusión', icon: '💬', category: 'community', condition: 'comment >= 1' },
  { id: 'commenter_25', name: 'Conversador', description: '25 comentarios en discusiones', icon: '🗣️', category: 'community', condition: 'comment >= 25' },
  { id: 'assembler_5', name: 'Asistente Fiel', description: 'Asististe a 5 asambleas', icon: '🪑', category: 'community', condition: 'attend_assembly >= 5' },
  { id: 'signer', name: 'Firmante', description: 'Firmaste un acta', icon: '✍️', category: 'community', condition: 'sign_minutes >= 1' },
  // Streaks
  { id: 'streak_7', name: 'Semana Activa', description: '7 días consecutivos de actividad', icon: '🔥', category: 'streak', condition: 'streak >= 7' },
  { id: 'streak_30', name: 'Buen Vecino', description: '30 días consecutivos de actividad', icon: '⚡', category: 'streak', condition: 'streak >= 30' },
  { id: 'streak_90', name: 'Inquebrantable', description: '90 días consecutivos de actividad', icon: '💪', category: 'streak', condition: 'streak >= 90' },
  // Special
  { id: 'early_adopter', name: 'Pionero', description: 'Uno de los primeros 10 miembros', icon: '🌅', category: 'special', condition: 'special: early_adopter' },
  { id: 'level_max', name: 'Leyenda', description: 'Alcanzaste el nivel máximo', icon: '👑', category: 'special', condition: 'level >= 7' },
]

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id)
}

export const BADGE_CATEGORIES = [
  { id: 'governance', label: 'Gobernanza', icon: '🏛️' },
  { id: 'treasury', label: 'Tesorería', icon: '💰' },
  { id: 'community', label: 'Comunidad', icon: '🤝' },
  { id: 'streak', label: 'Rachas', icon: '🔥' },
  { id: 'special', label: 'Especial', icon: '⭐' },
] as const
