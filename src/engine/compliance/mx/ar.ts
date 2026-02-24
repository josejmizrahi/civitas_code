import type { LegalFramework } from '../types'

/**
 * Marco legal: Asociación Religiosa en México
 * Ley de Asociaciones Religiosas y Culto Público (LARCP)
 */
export const arFramework: LegalFramework = {
  key: 'mx.ar',
  jurisdiction: 'mx',
  entityType: 'ar',
  displayName: 'Asociación Religiosa (LARCP)',
  applicableLaws: [
    {
      id: 'larcp',
      name: 'Ley de Asociaciones Religiosas y Culto Público',
    },
    {
      id: 'cc_federal',
      name: 'Código Civil Federal (supletorio)',
    },
  ],
  requiredRules: [
    // La LARCP es flexible en cuanto a gobierno interno
    // Las asociaciones religiosas definen sus propias reglas en sus estatutos
  ],
  defaultValues: {
    governance: {
      default_quorum: 0.25,
      default_majority: 0.5,
      delegation_enabled: false,
      quorum_first_call: 0.5,
      quorum_second_call: 0.25,
      quarterly_assembly_required: false,
      minimum_notice_days: 7,
      proposal_rights: ['admin', 'comite_vigilancia'],
      cool_down_hours: 24,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
      mandatory_discussion_enabled: false,
      default_discussion_hours: 72,
      grace_period_hours: 0,
      quorum_by_type: {
        ordinary: 0.25,
        extraordinary: 0.5,
        budget: 0.33,
        election: 0.5,
        amendment: 0.5,
      },
      majority_by_type: {
        ordinary: 0.5,
        extraordinary: 0.66,
        budget: 0.5,
        election: 0.5,
        amendment: 0.66,
      },
      min_endorsements: 0,
      endorsement_bypass_roles: ['admin'],
      quorum_third_call: 0,
      extraordinary_quorum: 0.5,
    },
    identity: {
      payment_to_vote_enabled: false,
      grace_period_months: 6,
      admin_max_consecutive_terms: 0,
      admin_term_months: 36,
    },
    treasury: {
      reserva_fund_percentage: 10,
      monthly_statement_auto: true,
    },
  },
  warnings: [
    {
      condition: (rules) => !rules.treasury.monthly_statement_auto,
      message: 'Se recomienda transparencia financiera con reportes mensuales para generar confianza en la congregación',
      severity: 'info',
    },
    {
      condition: (rules) => rules.governance.default_quorum > 0.5,
      message: 'Un quórum alto puede dificultar la toma de decisiones en congregaciones grandes',
      severity: 'info',
    },
  ],
}
