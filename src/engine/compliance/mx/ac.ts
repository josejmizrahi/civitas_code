import type { LegalFramework } from '../types'

/**
 * Marco legal: Asociación Civil (A.C.) en México
 * Código Civil Federal, Art. 2670-2687
 */
export const acFramework: LegalFramework = {
  key: 'mx.ac',
  jurisdiction: 'mx',
  entityType: 'ac',
  displayName: 'Asociación Civil (Código Civil)',
  applicableLaws: [
    {
      id: 'cc_federal',
      name: 'Código Civil Federal, Título Undécimo — De las Asociaciones y Sociedades',
    },
  ],
  requiredRules: [
    {
      rule: 'governance.default_majority',
      constraint: { min: 0.5 },
      reference: 'CC Art. 2678',
      description: 'Las resoluciones se toman por mayoría de los miembros presentes',
    },
  ],
  defaultValues: {
    governance: {
      default_quorum: 0.5,
      default_majority: 0.5,
      quorum_first_call: 0.5,
      quorum_second_call: 0.33,
      quarterly_assembly_required: false,
      minimum_notice_days: 7,
      delegation_enabled: true,
      proposal_rights: ['admin', 'comite_vigilancia', 'tesorero', 'miembro'],
      cool_down_hours: 48,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
      mandatory_discussion_enabled: false,
      default_discussion_hours: 48,
      grace_period_hours: 0,
      quorum_by_type: {
        ordinary: 0.5,
        extraordinary: 0.66,
        budget: 0.5,
        election: 0.5,
        amendment: 0.66,
      },
      majority_by_type: {
        ordinary: 0.5,
        extraordinary: 0.66,
        budget: 0.5,
        election: 0.5,
        amendment: 0.66,
      },
      min_endorsements: 2,
      endorsement_bypass_roles: ['admin'],
      quorum_third_call: 0,
      extraordinary_quorum: 0.66,
    },
    identity: {
      admin_max_consecutive_terms: 0, // según estatutos
      admin_term_months: 24,
      moroso_threshold_ordinary: 3,
      grace_period_months: 3,
    },
    treasury: {
      reserva_fund_percentage: 0,
    },
  },
  warnings: [
    {
      condition: (rules) => rules.governance.default_majority < 0.5,
      message: 'La mayoría debe ser al menos del 50% de los presentes según el Código Civil',
      severity: 'error',
      reference: 'CC Art. 2678',
    },
    {
      condition: (rules) => rules.governance.minimum_notice_days < 5,
      message: 'Se recomienda al menos 5 días de anticipación para convocatoria de asamblea',
      severity: 'warning',
    },
  ],
}
