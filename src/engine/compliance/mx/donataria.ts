import type { LegalFramework } from '../types'

/**
 * Marco legal: Donataria Autorizada / ONG en México
 * Ley del ISR, CLUNI, Ley de Fomento a las Actividades de las OSC
 */
export const donatariaFramework: LegalFramework = {
  key: 'mx.donataria',
  jurisdiction: 'mx',
  entityType: 'donataria',
  displayName: 'Donataria Autorizada / ONG',
  applicableLaws: [
    {
      id: 'lisr',
      name: 'Ley del Impuesto Sobre la Renta (Art. 79-89)',
    },
    {
      id: 'lfaosc',
      name: 'Ley Federal de Fomento a las Actividades Realizadas por Organizaciones de la Sociedad Civil',
    },
    {
      id: 'cc_federal',
      name: 'Código Civil Federal (constitución como A.C.)',
    },
  ],
  requiredRules: [
    {
      rule: 'governance.default_majority',
      constraint: { min: 0.5 },
      reference: 'CC Art. 2678',
      description: 'Resoluciones por mayoría de miembros presentes',
    },
  ],
  defaultValues: {
    governance: {
      default_quorum: 0.5,
      default_majority: 0.5,
      quorum_first_call: 0.66,
      quorum_second_call: 0.5,
      quorum_third_call: 0.33,
      quarterly_assembly_required: false,
      minimum_notice_days: 10,
      delegation_enabled: true,
      mandatory_discussion_enabled: true,
      default_discussion_hours: 120,
      grace_period_hours: 48,
      proposal_rights: ['admin', 'comite_vigilancia', 'miembro'],
      cool_down_hours: 48,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
      quorum_by_type: {
        ordinary: 0.5,
        extraordinary: 0.66,
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
      extraordinary_quorum: 0.66,
    },
    treasury: {
      reserva_fund_percentage: 10,
      monthly_statement_auto: true,
    },
    identity: {
      admin_max_consecutive_terms: 2,
      admin_term_months: 24,
    },
  },
  warnings: [
    {
      condition: (rules) => !rules.treasury.monthly_statement_auto,
      message: 'Las donatarias autorizadas deben mantener registros contables detallados y transparentes',
      severity: 'warning',
      reference: 'LISR Art. 82, Frac. IV',
    },
    {
      condition: (rules) => rules.governance.default_majority < 0.5,
      message: 'La mayoría debe ser al menos del 50% según el Código Civil',
      severity: 'error',
      reference: 'CC Art. 2678',
    },
  ],
}
