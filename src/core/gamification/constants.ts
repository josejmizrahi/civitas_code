import type { LevelDefinition, BadgeDefinition, GamificationAction } from './types'

// ─── Friendly Action Labels (no jargon) ─────────────────────────────────────

export const ACTION_LABELS: Record<GamificationAction, { verb: string; past: string; icon: string }> = {
  vote: { verb: 'Votar', past: 'Votaste', icon: 'vote' },
  endorse: { verb: 'Apoyar', past: 'Apoyaste', icon: 'thumbs-up' },
  propose: { verb: 'Proponer', past: 'Propusiste', icon: 'lightbulb' },
  pay_on_time: { verb: 'Pagar', past: 'Pagaste', icon: 'wallet' },
  attend_assembly: { verb: 'Asistir', past: 'Asististe', icon: 'landmark' },
  daily_login: { verb: 'Entrar', past: 'Entraste', icon: 'log-in' },
  comment: { verb: 'Opinar', past: 'Opinaste', icon: 'message-square' },
  sign_minutes: { verb: 'Firmar', past: 'Firmaste', icon: 'pen-line' },
  create_delegation: { verb: 'Delegar', past: 'Delegaste', icon: 'handshake' },
}

// ─── Points per Action ──────────────────────────────────────────────────────

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
  { minDays: 30, multiplier: 2.0, label: 'x2', message: '¡Imparable! Doble puntos' },
  { minDays: 14, multiplier: 1.5, label: 'x1.5', message: '¡Increíble racha! 50% más puntos' },
  { minDays: 7, multiplier: 1.25, label: 'x1.25', message: '¡Una semana! 25% más puntos' },
  { minDays: 3, multiplier: 1.1, label: 'x1.1', message: '¡Vas bien! 10% extra' },
  { minDays: 0, multiplier: 1.0, label: '', message: '' },
]

export function getStreakMultiplier(streak: number): { multiplier: number; label: string; message: string } {
  return STREAK_MULTIPLIERS.find((s) => streak >= s.minDays) ?? STREAK_MULTIPLIERS[STREAK_MULTIPLIERS.length - 1]
}

// ─── Level System ───────────────────────────────────────────────────────────

export const LEVELS: LevelDefinition[] = [
  { level: 1, title: 'Vecino Nuevo', titleShort: 'Nuevo', xpRequired: 0, color: '#94a3b8', icon: 'home' },
  { level: 2, title: 'Vecino Activo', titleShort: 'Activo', xpRequired: 100, color: '#22c55e', icon: 'sprout' },
  { level: 3, title: 'Participante', titleShort: 'Participante', xpRequired: 300, color: '#3b82f6', icon: 'star' },
  { level: 4, title: 'Colaborador', titleShort: 'Colaborador', xpRequired: 600, color: '#8b5cf6', icon: 'handshake' },
  { level: 5, title: 'Lider Comunitario', titleShort: 'Lider', xpRequired: 1000, color: '#f59e0b', icon: 'trophy' },
  { level: 6, title: 'Pilar de la Comunidad', titleShort: 'Pilar', xpRequired: 1800, color: '#ef4444', icon: 'landmark' },
  { level: 7, title: 'Guardian del Condominio', titleShort: 'Guardian', xpRequired: 3000, color: '#ec4899', icon: 'crown' },
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

// ─── Badge Definitions ──────────────────────────────────────────────────────

export const BADGES: BadgeDefinition[] = [
  // Tu Voz
  { id: 'first_vote', name: 'Mi Primera Vez', description: 'Votaste por primera vez', icon: 'vote', category: 'governance', condition: 'vote >= 1' },
  { id: 'voter_10', name: 'Voz Activa', description: 'Ya votaste 10 veces', icon: 'megaphone', category: 'governance', condition: 'vote >= 10' },
  { id: 'voter_50', name: 'Siempre Presente', description: '50 votos', icon: 'landmark', category: 'governance', condition: 'vote >= 50' },
  { id: 'first_proposal', name: 'Tengo una Idea', description: 'Hiciste tu primera propuesta', icon: 'lightbulb', category: 'governance', condition: 'propose >= 1' },
  { id: 'proposer_10', name: 'Lleno de Ideas', description: '10 propuestas', icon: 'rocket', category: 'governance', condition: 'propose >= 10' },
  { id: 'endorser_5', name: 'Buen Apoyo', description: 'Apoyaste 5 propuestas de otros', icon: 'check-circle', category: 'governance', condition: 'endorse >= 5' },
  { id: 'endorser_20', name: 'Respaldo Seguro', description: '20 apoyos', icon: 'shield', category: 'governance', condition: 'endorse >= 20' },
  // Pagos
  { id: 'first_payment', name: 'Al Corriente', description: 'Tu primer pago a tiempo', icon: 'wallet', category: 'treasury', condition: 'pay_on_time >= 1' },
  { id: 'payer_6', name: 'Puntual', description: '6 meses pagando a tiempo', icon: 'gem', category: 'treasury', condition: 'pay_on_time >= 6' },
  { id: 'payer_12', name: 'Ejemplo a Seguir', description: 'Un anio sin fallar un pago', icon: 'award', category: 'treasury', condition: 'pay_on_time >= 12' },
  // Comunidad
  { id: 'comentarista', name: 'Opinion Cuenta', description: 'Diste tu primera opinion', icon: 'message-square', category: 'community', condition: 'comment >= 1' },
  { id: 'commenter_25', name: 'Conversador', description: '25 opiniones', icon: 'messages-square', category: 'community', condition: 'comment >= 25' },
  { id: 'assembler_5', name: 'Siempre Ahi', description: 'Fuiste a 5 asambleas', icon: 'armchair', category: 'community', condition: 'attend_assembly >= 5' },
  { id: 'signer', name: 'De Palabra', description: 'Firmaste un acta de asamblea', icon: 'pen-line', category: 'community', condition: 'sign_minutes >= 1' },
  // Constancia
  { id: 'streak_7', name: 'Una Semana', description: '7 dias seguidos participando', icon: 'flame', category: 'streak', condition: 'streak >= 7' },
  { id: 'streak_30', name: 'Todo un Mes', description: '30 dias sin faltar', icon: 'zap', category: 'streak', condition: 'streak >= 30' },
  { id: 'streak_90', name: 'Inquebrantable', description: '90 dias seguidos', icon: 'shield-check', category: 'streak', condition: 'streak >= 90' },
  // Especial
  { id: 'early_adopter', name: 'Pionero', description: 'De los primeros en unirse', icon: 'sunrise', category: 'special', condition: 'special: early_adopter' },
  { id: 'level_max', name: 'Leyenda', description: 'Llegaste al nivel maximo', icon: 'crown', category: 'special', condition: 'level >= 7' },
]

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES.find((b) => b.id === id)
}

export const BADGE_CATEGORIES = [
  { id: 'governance', label: 'Tu Voz', icon: 'vote' },
  { id: 'treasury', label: 'Pagos', icon: 'wallet' },
  { id: 'community', label: 'Comunidad', icon: 'users' },
  { id: 'streak', label: 'Constancia', icon: 'flame' },
  { id: 'special', label: 'Especial', icon: 'star' },
] as const

// ─── Celebration Messages (variable rewards — not always the same) ──────────

export const CELEBRATION_MESSAGES: Record<GamificationAction, string[]> = {
  vote: ['¡Tu voz cuenta!', '¡Gracias por votar!', '¡Así se decide en comunidad!', '¡Cada voto importa!'],
  endorse: ['¡Buen apoyo!', '¡Gracias por respaldar!', '¡Así se trabaja en equipo!'],
  propose: ['¡Buena idea!', '¡Tu propuesta ya está lista!', '¡Así se mejora la comunidad!'],
  pay_on_time: ['¡Al corriente! Gracias.', '¡Pago registrado! Eres ejemplo.', '¡La comunidad te lo agradece!'],
  attend_assembly: ['¡Gracias por asistir!', '¡Tu presencia importa!', '¡Así se construye comunidad!'],
  daily_login: ['¡Bienvenido de vuelta!', '¡Qué bueno verte!', '¡Otro día participando!'],
  comment: ['¡Tu opinión importa!', '¡Gracias por participar!', '¡Buena contribución!'],
  sign_minutes: ['¡Firmado! Gracias.', '¡Quedó registrado!', '¡De palabra y por escrito!'],
  create_delegation: ['¡Delegación creada!', '¡Confías en tu vecino!'],
}

export function getCelebrationMessage(action: GamificationAction): string {
  const msgs = CELEBRATION_MESSAGES[action]
  return msgs[Math.floor(Math.random() * msgs.length)]
}

// ─── Streak Warning Messages ────────────────────────────────────────────────

export function getStreakWarning(streak: number, lastActivity: string | null): string | null {
  if (!lastActivity || streak === 0) return null
  const lastDate = new Date(lastActivity)
  const today = new Date()
  const hoursAgo = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60)

  if (hoursAgo < 20) return null
  if (hoursAgo < 36 && streak >= 3) {
    return `No pierdas tu racha de ${streak} dias. Participa hoy.`
  }
  if (hoursAgo >= 36 && streak >= 3) {
    return `Tu racha de ${streak} dias esta en riesgo. Actua ahora.`
  }
  return null
}
