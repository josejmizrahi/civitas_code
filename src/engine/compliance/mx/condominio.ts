import type { LegalFramework } from '../types'

/**
 * Marco legal: Condominio en México (CDMX)
 * Ley de Propiedad en Condominio de Inmuebles para el Distrito Federal
 */
export const condominioFramework: LegalFramework = {
  key: 'mx.condominio',
  jurisdiction: 'mx',
  entityType: 'condominio',
  displayName: 'Condominio (LPCI CDMX)',
  applicableLaws: [
    {
      id: 'lpci_cdmx',
      name: 'Ley de Propiedad en Condominio de Inmuebles para el D.F.',
    },
    {
      id: 'cc_cdmx',
      name: 'Código Civil para el Distrito Federal',
    },
    {
      id: 'nom_151',
      name: 'NOM-151 — Conservación de mensajes de datos',
    },
  ],
  requiredRules: [
    {
      rule: 'governance.quorum_first_call',
      constraint: { min: 0.75 },
      reference: 'LPCI Art. 33',
      description: 'Quórum mínimo de 75% del indiviso en primera convocatoria',
    },
    {
      rule: 'governance.quarterly_assembly_required',
      constraint: { equals: true },
      reference: 'LPCI Art. 31',
      description: 'Asambleas ordinarias trimestrales obligatorias',
    },
    {
      rule: 'governance.minimum_notice_days',
      constraint: { min: 7 },
      reference: 'LPCI Art. 34',
      description: 'Convocatoria con mínimo 7 días de anticipación',
    },
    {
      rule: 'identity.moroso_threshold_ordinary',
      constraint: { max: 2 },
      reference: 'LPCI Art. 2',
      description: 'Se considera moroso al dejar de pagar 2 cuotas ordinarias',
    },
    {
      rule: 'identity.moroso_threshold_extraordinary',
      constraint: { max: 1 },
      reference: 'LPCI Art. 2',
      description: 'Se considera moroso al dejar de pagar 1 cuota extraordinaria',
    },
    {
      rule: 'identity.admin_max_consecutive_terms',
      constraint: { max: 2 },
      reference: 'LPCI Art. 42',
      description: 'Máximo 2 periodos consecutivos de administración',
    },
  ],
  defaultValues: {
    governance: {
      quorum_first_call: 0.75,
      quorum_second_call: 0.5001,
      quorum_third_call: 0,
      minimum_notice_days: 7,
      quarterly_assembly_required: true,
      extraordinary_quorum: 0.75,
      default_quorum: 0.5,
      default_majority: 0.5,
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
        extraordinary: 0.75,
        budget: 0.5,
        election: 0.5,
        amendment: 0.75,
      },
      majority_by_type: {
        ordinary: 0.5,
        extraordinary: 0.66,
        budget: 0.5,
        election: 0.5,
        amendment: 0.66,
      },
      min_endorsements: 3,
      endorsement_bypass_roles: ['admin', 'tesorero'],
    },
    treasury: {
      reserva_fund_percentage: 5,
      monthly_statement_auto: true,
    },
    identity: {
      payment_to_vote_enabled: true,
      moroso_threshold_ordinary: 2,
      moroso_threshold_extraordinary: 1,
      moroso_notice_days: 7,
      moroso_restrictions: ['vote', 'be_elected', 'quorum_excluded'],
      admin_max_consecutive_terms: 2,
      admin_term_months: 12,
    },
  },
  warnings: [
    {
      condition: (rules) => rules.governance.quorum_first_call < 0.75,
      message: 'El quórum de primera convocatoria debe ser al menos 75% del indiviso',
      severity: 'error',
      reference: 'LPCI Art. 33',
    },
    {
      condition: (rules) => !rules.governance.quarterly_assembly_required,
      message: 'Las asambleas ordinarias trimestrales son obligatorias',
      severity: 'error',
      reference: 'LPCI Art. 31',
    },
    {
      condition: (rules) => rules.governance.minimum_notice_days < 7,
      message: 'La convocatoria requiere mínimo 7 días de anticipación',
      severity: 'error',
      reference: 'LPCI Art. 34',
    },
    {
      condition: (rules) => rules.identity.moroso_threshold_ordinary > 2,
      message: 'La LPCI define moroso como quien deja de pagar 2 cuotas ordinarias. Un umbral mayor puede ser impugnado.',
      severity: 'warning',
      reference: 'LPCI Art. 2',
    },
    {
      condition: (rules) =>
        rules.identity.admin_max_consecutive_terms > 2 &&
        rules.identity.admin_max_consecutive_terms !== 0,
      message: 'La LPCI limita a 2 periodos consecutivos de administración',
      severity: 'error',
      reference: 'LPCI Art. 42',
    },
    {
      condition: (rules) => rules.treasury.reserva_fund_percentage === 0,
      message: 'Se recomienda destinar un porcentaje al fondo de reserva',
      severity: 'warning',
      reference: 'LPCI Art. 57-58',
    },
    {
      condition: (rules) => !rules.identity.payment_to_vote_enabled,
      message: 'La ley permite restringir el voto de morosos. Desactivar esto puede generar conflictos legales.',
      severity: 'warning',
      reference: 'LPCI Art. 36',
    },
  ],
}
