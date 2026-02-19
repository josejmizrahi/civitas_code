// Rules Catalog — structured metadata for every configurable rule
// Used by the Reglamento page and the rule-change proposal flow

import type { CommunityRules } from '@/shared/types/rules'

export type RuleCategory = 'governance' | 'treasury' | 'identity'

export interface RuleCatalogEntry {
  /** Dot-path key, e.g. "governance.default_quorum" */
  id: string
  category: RuleCategory
  /** Friendly label in Spanish */
  label: string
  /** What this rule controls (shown in detail view) */
  description: string
  /** Optional legal reference */
  legalRef?: string
  /** Format the current value for display */
  format: (rules: CommunityRules) => string
  /** Get the raw value (for the proposal description) */
  rawValue: (rules: CommunityRules) => unknown
}

const pct = (n: number) => `${Math.round(n * 100)}%`
const hrs = (n: number) => (n === 1 ? '1 hora' : `${n} horas`)
const days = (n: number) => (n === 1 ? '1 día' : `${n} días`)
const months = (n: number) => (n === 1 ? '1 mes' : `${n} meses`)
const bool = (v: boolean) => (v ? 'Sí' : 'No')
const money = (n: number, currency: string) => `$${n.toLocaleString()} ${currency}`
const list = (arr: string[]) => arr.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')

export const RULES_CATALOG: RuleCatalogEntry[] = [
  // ═══════════════════════════════════════════════════════
  // GOVERNANCE
  // ═══════════════════════════════════════════════════════
  {
    id: 'governance.default_quorum',
    category: 'governance',
    label: 'Quórum por defecto',
    description: 'Porcentaje mínimo de miembros que deben participar para que una votación sea válida.',
    format: (r) => pct(r.governance.default_quorum),
    rawValue: (r) => r.governance.default_quorum,
  },
  {
    id: 'governance.default_majority',
    category: 'governance',
    label: 'Mayoría por defecto',
    description: 'Porcentaje mínimo de votos a favor necesarios para aprobar una propuesta.',
    format: (r) => pct(r.governance.default_majority),
    rawValue: (r) => r.governance.default_majority,
  },
  {
    id: 'governance.delegation_enabled',
    category: 'governance',
    label: 'Delegación de voto',
    description: 'Permite que los miembros deleguen su voto a otro miembro cuando no puedan asistir.',
    format: (r) => bool(r.governance.delegation_enabled),
    rawValue: (r) => r.governance.delegation_enabled,
  },
  {
    id: 'governance.proposal_rights',
    category: 'governance',
    label: 'Roles con derecho a proponer',
    description: 'Roles que pueden crear nuevas propuestas. Solo estos roles pueden iniciar votaciones.',
    format: (r) => list(r.governance.proposal_rights),
    rawValue: (r) => r.governance.proposal_rights,
  },
  {
    id: 'governance.cool_down_hours',
    category: 'governance',
    label: 'Periodo de enfriamiento',
    description: 'Tiempo de espera entre la aprobación de una propuesta y su ejecución. Permite apelaciones.',
    format: (r) => hrs(r.governance.cool_down_hours),
    rawValue: (r) => r.governance.cool_down_hours,
  },
  {
    id: 'governance.auto_execution_enabled',
    category: 'governance',
    label: 'Auto-ejecución',
    description: 'Cuando se aprueba una propuesta con instrucción financiera, se ejecuta automáticamente después del periodo de enfriamiento.',
    format: (r) => bool(r.governance.auto_execution_enabled),
    rawValue: (r) => r.governance.auto_execution_enabled,
  },
  {
    id: 'governance.mandatory_discussion_enabled',
    category: 'governance',
    label: 'Discusión obligatoria',
    description: 'Requiere un periodo de discusión antes de abrir la votación, para que todos puedan opinar.',
    legalRef: 'GV-001, GV-006',
    format: (r) => bool(r.governance.mandatory_discussion_enabled),
    rawValue: (r) => r.governance.mandatory_discussion_enabled,
  },
  {
    id: 'governance.default_discussion_hours',
    category: 'governance',
    label: 'Horas de discusión por defecto',
    description: 'Duración predeterminada del periodo de discusión para nuevas propuestas.',
    format: (r) => hrs(r.governance.default_discussion_hours),
    rawValue: (r) => r.governance.default_discussion_hours,
  },
  {
    id: 'governance.grace_period_hours',
    category: 'governance',
    label: 'Periodo de gracia (apelaciones)',
    description: 'Tiempo después de que una propuesta se aprueba durante el cual se pueden presentar apelaciones.',
    legalRef: 'GV-043',
    format: (r) => r.governance.grace_period_hours > 0 ? hrs(r.governance.grace_period_hours) : 'Deshabilitado',
    rawValue: (r) => r.governance.grace_period_hours,
  },
  {
    id: 'governance.min_endorsements',
    category: 'governance',
    label: 'Endorsos mínimos',
    description: 'Número mínimo de miembros que deben respaldar un borrador antes de que avance a votación. Funciona como filtro anti-spam.',
    format: (r) => r.governance.min_endorsements === 0 ? 'Deshabilitado' : String(r.governance.min_endorsements),
    rawValue: (r) => r.governance.min_endorsements,
  },
  {
    id: 'governance.endorsement_bypass_roles',
    category: 'governance',
    label: 'Roles que no necesitan endorsos',
    description: 'Estos roles pueden avanzar propuestas sin necesitar endorsos de otros miembros.',
    format: (r) => list(r.governance.endorsement_bypass_roles),
    rawValue: (r) => r.governance.endorsement_bypass_roles,
  },
  {
    id: 'governance.quorum_by_type',
    category: 'governance',
    label: 'Quórum por tipo de propuesta',
    description: 'Quórum diferenciado según el tipo de propuesta (ordinaria, extraordinaria, presupuesto, elección, enmienda).',
    legalRef: 'GV-036',
    format: (r) => Object.entries(r.governance.quorum_by_type).map(([k, v]) => `${k}: ${pct(v)}`).join(', '),
    rawValue: (r) => r.governance.quorum_by_type,
  },
  {
    id: 'governance.majority_by_type',
    category: 'governance',
    label: 'Mayoría por tipo de propuesta',
    description: 'Mayoría diferenciada según el tipo de propuesta. Las enmiendas y temas extraordinarios suelen requerir mayoría calificada (⅔).',
    legalRef: 'GV-036',
    format: (r) => Object.entries(r.governance.majority_by_type).map(([k, v]) => `${k}: ${pct(v)}`).join(', '),
    rawValue: (r) => r.governance.majority_by_type,
  },
  {
    id: 'governance.quorum_first_call',
    category: 'governance',
    label: 'Quórum primera convocatoria',
    description: 'Porcentaje mínimo de asistencia requerido en la primera convocatoria de una asamblea.',
    legalRef: 'Art. 33 LPCI CDMX',
    format: (r) => pct(r.governance.quorum_first_call),
    rawValue: (r) => r.governance.quorum_first_call,
  },
  {
    id: 'governance.quorum_second_call',
    category: 'governance',
    label: 'Quórum segunda convocatoria',
    description: 'Porcentaje mínimo de asistencia en la segunda convocatoria (usualmente 50%+1).',
    legalRef: 'Art. 33 LPCI CDMX',
    format: (r) => pct(r.governance.quorum_second_call),
    rawValue: (r) => r.governance.quorum_second_call,
  },
  {
    id: 'governance.quorum_third_call',
    category: 'governance',
    label: 'Quórum tercera convocatoria',
    description: 'En tercera convocatoria, la asamblea sesiona con los presentes.',
    legalRef: 'Art. 33 LPCI CDMX',
    format: (r) => r.governance.quorum_third_call === 0 ? 'Los presentes' : pct(r.governance.quorum_third_call),
    rawValue: (r) => r.governance.quorum_third_call,
  },
  {
    id: 'governance.minimum_notice_days',
    category: 'governance',
    label: 'Días de aviso mínimo',
    description: 'Días de anticipación para enviar la convocatoria antes de una asamblea.',
    legalRef: 'Art. 34 LPCI CDMX',
    format: (r) => days(r.governance.minimum_notice_days),
    rawValue: (r) => r.governance.minimum_notice_days,
  },
  {
    id: 'governance.quarterly_assembly_required',
    category: 'governance',
    label: 'Asamblea trimestral obligatoria',
    description: 'Requiere que se realice una asamblea ordinaria al menos cada tres meses.',
    legalRef: 'Art. 31 LPCI CDMX',
    format: (r) => bool(r.governance.quarterly_assembly_required),
    rawValue: (r) => r.governance.quarterly_assembly_required,
  },
  {
    id: 'governance.extraordinary_quorum',
    category: 'governance',
    label: 'Quórum extraordinario',
    description: 'Quórum especial para temas extraordinarios que requieren mayor representación.',
    format: (r) => pct(r.governance.extraordinary_quorum),
    rawValue: (r) => r.governance.extraordinary_quorum,
  },

  // ═══════════════════════════════════════════════════════
  // TREASURY
  // ═══════════════════════════════════════════════════════
  {
    id: 'treasury.mode',
    category: 'treasury',
    label: 'Modo de tesorería',
    description: 'Cómo se conecta la comunidad con sus finanzas. Importación = subir estados de cuenta; Conector = conexión automática con banco.',
    format: (r) => ({ import: 'Importación', connector: 'Conector', fintech_rail: 'Rail IFPE', hybrid: 'Híbrido' }[r.treasury.mode] ?? r.treasury.mode),
    rawValue: (r) => r.treasury.mode,
  },
  {
    id: 'treasury.currency',
    category: 'treasury',
    label: 'Moneda',
    description: 'Moneda principal de la comunidad para cuotas, presupuestos y gastos.',
    format: (r) => r.treasury.currency,
    rawValue: (r) => r.treasury.currency,
  },
  {
    id: 'treasury.admin_spending_limit',
    category: 'treasury',
    label: 'Límite de gasto del administrador',
    description: 'Monto máximo que el administrador puede autorizar sin necesidad de una votación.',
    format: (r) => money(r.treasury.admin_spending_limit, r.treasury.currency),
    rawValue: (r) => r.treasury.admin_spending_limit,
  },
  {
    id: 'treasury.require_vote_above',
    category: 'treasury',
    label: 'Votación requerida arriba de',
    description: 'Los gastos que superen este monto requieren aprobación por votación de la asamblea.',
    format: (r) => money(r.treasury.require_vote_above, r.treasury.currency),
    rawValue: (r) => r.treasury.require_vote_above,
  },
  {
    id: 'treasury.reserva_fund_percentage',
    category: 'treasury',
    label: 'Fondo de reserva',
    description: 'Porcentaje de los ingresos que se destina automáticamente al fondo de reserva.',
    legalRef: 'Art. 57-58 LPCI CDMX',
    format: (r) => `${r.treasury.reserva_fund_percentage}%`,
    rawValue: (r) => r.treasury.reserva_fund_percentage,
  },
  {
    id: 'treasury.collection_reminder_days',
    category: 'treasury',
    label: 'Días para recordatorio de cobro',
    description: 'Días antes del vencimiento para enviar recordatorio de pago a los miembros.',
    format: (r) => days(r.treasury.collection_reminder_days),
    rawValue: (r) => r.treasury.collection_reminder_days,
  },
  {
    id: 'treasury.monthly_statement_auto',
    category: 'treasury',
    label: 'Estado de cuenta mensual automático',
    description: 'Genera automáticamente un estado financiero al cierre de cada mes.',
    legalRef: 'Art. 43 LPCI CDMX',
    format: (r) => bool(r.treasury.monthly_statement_auto),
    rawValue: (r) => r.treasury.monthly_statement_auto,
  },

  // ═══════════════════════════════════════════════════════
  // IDENTITY
  // ═══════════════════════════════════════════════════════
  {
    id: 'identity.payment_to_vote_enabled',
    category: 'identity',
    label: 'Pago condiciona voto',
    description: 'Si está activado, los miembros con pagos vencidos pierden su derecho a votar hasta que se pongan al corriente.',
    format: (r) => bool(r.identity.payment_to_vote_enabled),
    rawValue: (r) => r.identity.payment_to_vote_enabled,
  },
  {
    id: 'identity.grace_period_months',
    category: 'identity',
    label: 'Periodo de gracia',
    description: 'Meses de tolerancia antes de restringir los derechos de un miembro con pagos pendientes.',
    format: (r) => months(r.identity.grace_period_months),
    rawValue: (r) => r.identity.grace_period_months,
  },
  {
    id: 'identity.auto_restore_on_payment',
    category: 'identity',
    label: 'Restaurar derechos al pagar',
    description: 'Restaura automáticamente los derechos de voto cuando un miembro moroso regulariza sus pagos.',
    format: (r) => bool(r.identity.auto_restore_on_payment),
    rawValue: (r) => r.identity.auto_restore_on_payment,
  },
  {
    id: 'identity.delinquent_restrictions',
    category: 'identity',
    label: 'Restricciones para morosos',
    description: 'Acciones que no pueden realizar los miembros con pagos vencidos.',
    format: (r) => list(r.identity.delinquent_restrictions),
    rawValue: (r) => r.identity.delinquent_restrictions,
  },
  {
    id: 'identity.moroso_threshold_ordinary',
    category: 'identity',
    label: 'Cuotas ordinarias para ser moroso',
    description: 'Número de cuotas ordinarias impagadas para que un miembro sea declarado moroso.',
    legalRef: 'Art. 2 LPCI CDMX',
    format: (r) => String(r.identity.moroso_threshold_ordinary),
    rawValue: (r) => r.identity.moroso_threshold_ordinary,
  },
  {
    id: 'identity.moroso_threshold_extraordinary',
    category: 'identity',
    label: 'Cuotas extraordinarias para ser moroso',
    description: 'Número de cuotas extraordinarias impagadas para que un miembro sea declarado moroso.',
    legalRef: 'Art. 2 LPCI CDMX',
    format: (r) => String(r.identity.moroso_threshold_extraordinary),
    rawValue: (r) => r.identity.moroso_threshold_extraordinary,
  },
  {
    id: 'identity.moroso_notice_days',
    category: 'identity',
    label: 'Días de aviso a morosos',
    description: 'Días de anticipación antes de una asamblea para notificar a los miembros morosos sobre su estatus.',
    legalRef: 'Art. 36 LPCI CDMX',
    format: (r) => days(r.identity.moroso_notice_days),
    rawValue: (r) => r.identity.moroso_notice_days,
  },
  {
    id: 'identity.admin_max_consecutive_terms',
    category: 'identity',
    label: 'Términos consecutivos máximos',
    description: 'Número máximo de veces que un administrador puede ser reelecto de forma consecutiva.',
    legalRef: 'Art. 42 LPCI CDMX',
    format: (r) => String(r.identity.admin_max_consecutive_terms),
    rawValue: (r) => r.identity.admin_max_consecutive_terms,
  },
  {
    id: 'identity.admin_term_months',
    category: 'identity',
    label: 'Duración del término',
    description: 'Meses que dura cada periodo de administración antes de requerir reelección o relevo.',
    legalRef: 'Art. 42 LPCI CDMX',
    format: (r) => months(r.identity.admin_term_months),
    rawValue: (r) => r.identity.admin_term_months,
  },
]

/** Get a rule entry by id */
export function getRuleCatalogEntry(ruleId: string): RuleCatalogEntry | undefined {
  return RULES_CATALOG.find((r) => r.id === ruleId)
}

/** Get all rules for a category */
export function getRulesForCategory(category: RuleCategory): RuleCatalogEntry[] {
  return RULES_CATALOG.filter((r) => r.category === category)
}

export const CATEGORY_LABELS: Record<RuleCategory, string> = {
  governance: 'Gobernanza',
  treasury: 'Tesorería',
  identity: 'Identidad y Derechos',
}

export const CATEGORY_DESCRIPTIONS: Record<RuleCategory, string> = {
  governance: 'Cómo se toman las decisiones: votaciones, quórum, delegaciones y asambleas.',
  treasury: 'Cómo se manejan las finanzas: cuotas, presupuestos y gastos.',
  identity: 'Derechos y obligaciones de los miembros: pagos, morosos y administración.',
}

export const CATEGORY_ICONS: Record<RuleCategory, string> = {
  governance: 'Shield',
  treasury: 'Wallet',
  identity: 'UserCheck',
}
