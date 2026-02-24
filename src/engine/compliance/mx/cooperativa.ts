import type { LegalFramework } from '../types'

/**
 * Marco legal: Sociedad Cooperativa en México
 * Ley General de Sociedades Cooperativas (LGSC)
 */
export const cooperativaFramework: LegalFramework = {
  key: 'mx.cooperativa',
  jurisdiction: 'mx',
  entityType: 'cooperativa',
  displayName: 'Sociedad Cooperativa (LGSC)',
  applicableLaws: [
    {
      id: 'lgsc',
      name: 'Ley General de Sociedades Cooperativas',
    },
    {
      id: 'cc_federal',
      name: 'Código Civil Federal (supletorio)',
    },
  ],
  requiredRules: [
    {
      rule: 'governance.delegation_enabled',
      constraint: { equals: false },
      reference: 'LGSC Art. 16',
      description: 'Un socio, un voto. El voto es personal e intransferible.',
    },
    {
      rule: 'identity.admin_max_consecutive_terms',
      constraint: { max: 1 },
      reference: 'LGSC Art. 43',
      description: 'Los miembros del consejo de administración duran máximo un periodo',
    },
  ],
  defaultValues: {
    governance: {
      delegation_enabled: false,
      default_quorum: 0.5,
      default_majority: 0.5,
      quorum_first_call: 0.75,
      quorum_second_call: 0.5,
      quorum_third_call: 0.33,
      quarterly_assembly_required: false,
      minimum_notice_days: 7,
      proposal_rights: ['admin', 'comite_vigilancia', 'tesorero', 'miembro'],
      cool_down_hours: 48,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
      mandatory_discussion_enabled: true,
      default_discussion_hours: 72,
      grace_period_hours: 24,
      quorum_by_type: {
        ordinary: 0.5,
        extraordinary: 0.75,
        budget: 0.66,
        election: 0.5,
        amendment: 0.75,
      },
      majority_by_type: {
        ordinary: 0.5,
        extraordinary: 0.66,
        budget: 0.66,
        election: 0.5,
        amendment: 0.75,
      },
      min_endorsements: 3,
      endorsement_bypass_roles: ['admin'],
      extraordinary_quorum: 0.75,
    },
    treasury: {
      reserva_fund_percentage: 10, // fondo de reserva obligatorio
      monthly_statement_auto: true,
    },
    identity: {
      payment_to_vote_enabled: true,
      admin_max_consecutive_terms: 1,
      admin_term_months: 36,
    },
  },
  warnings: [
    {
      condition: (rules) => rules.governance.delegation_enabled,
      message: 'En cooperativas, el voto es personal e intransferible. No se permite la delegación.',
      severity: 'error',
      reference: 'LGSC Art. 16',
    },
    {
      condition: (rules) =>
        rules.identity.admin_max_consecutive_terms > 1 &&
        rules.identity.admin_max_consecutive_terms !== 0,
      message: 'Los miembros del consejo de administración solo pueden ocupar el cargo un periodo',
      severity: 'error',
      reference: 'LGSC Art. 43',
    },
    {
      condition: (rules) => rules.treasury.reserva_fund_percentage < 5,
      message: 'La LGSC requiere un fondo de reserva. Se recomienda al menos 5%.',
      severity: 'warning',
      reference: 'LGSC Art. 55',
    },
  ],
}
