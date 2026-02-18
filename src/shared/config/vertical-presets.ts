import type { CommunityRules } from '@/shared/types/rules'
import type { CommunityType } from '@/shared/types'

/**
 * Vertical presets — RE-004
 * Pre-configured rule sets for different community types.
 * These serve as starting points and can be customized per community.
 */

export interface VerticalPreset {
  type: CommunityType
  label: string
  description: string
  rules: {
    governance?: Partial<CommunityRules['governance']>
    treasury?: Partial<CommunityRules['treasury']>
    identity?: Partial<CommunityRules['identity']>
  }
}

export const VERTICAL_PRESETS: VerticalPreset[] = [
  {
    type: 'residential',
    label: 'Condominio Residencial',
    description: 'Configuración para condominios bajo LPCI CDMX. Incluye cuotas de mantenimiento, fondo de reserva, y comité de vigilancia.',
    rules: {
      governance: {
        default_quorum: 0.75,
        default_majority: 0.5,
        delegation_enabled: true,
        proposal_rights: ['admin', 'miembro'],
        cool_down_hours: 48,
        auto_execution_enabled: false,
        auto_execution_threshold: 0,
        mandatory_discussion_enabled: false,
        default_discussion_hours: 48,
        grace_period_hours: 72,
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
        quorum_first_call: 0.75,
        quorum_second_call: 0.5001,
        quorum_third_call: 0,
        minimum_notice_days: 7,
        quarterly_assembly_required: true,
        extraordinary_quorum: 0.75,
      },
      treasury: {
        mode: 'import',
        currency: 'MXN',
        admin_spending_limit: 50000,
        require_vote_above: 50000,
        reserva_fund_percentage: 5,
        monthly_statement_auto: true,
        collection_reminder_days: 5,
      },
      identity: {
        payment_to_vote_enabled: true,
        grace_period_months: 2,
        auto_restore_on_payment: true,
        delinquent_restrictions: ['vote', 'propose'],
        moroso_threshold_ordinary: 2,
        moroso_threshold_extraordinary: 1,
        moroso_notice_days: 7,
        moroso_restrictions: ['vote', 'be_elected', 'quorum_excluded'],
        admin_max_consecutive_terms: 2,
        admin_term_months: 12,
      },
    },
  },
  {
    type: 'cooperative',
    label: 'Cooperativa',
    description: 'Configuración para cooperativas. Voto democrático (un miembro = un voto), deliberación obligatoria, y transparencia financiera.',
    rules: {
      governance: {
        default_quorum: 0.5,
        default_majority: 0.5,
        delegation_enabled: false,
        proposal_rights: ['admin', 'tesorero', 'miembro'],
        cool_down_hours: 72,
        auto_execution_enabled: false,
        auto_execution_threshold: 0,
        mandatory_discussion_enabled: true,
        default_discussion_hours: 72,
        grace_period_hours: 48,
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
        quorum_first_call: 0.5,
        quorum_second_call: 0.33,
        quorum_third_call: 0,
        minimum_notice_days: 5,
        quarterly_assembly_required: true,
        extraordinary_quorum: 0.66,
      },
      treasury: {
        mode: 'import',
        currency: 'MXN',
        admin_spending_limit: 20000,
        require_vote_above: 20000,
        reserva_fund_percentage: 10,
        monthly_statement_auto: true,
        collection_reminder_days: 3,
      },
      identity: {
        payment_to_vote_enabled: true,
        grace_period_months: 3,
        auto_restore_on_payment: true,
        delinquent_restrictions: ['vote', 'propose', 'delegate'],
        moroso_threshold_ordinary: 3,
        moroso_threshold_extraordinary: 1,
        moroso_notice_days: 10,
        moroso_restrictions: ['vote', 'be_elected'],
        admin_max_consecutive_terms: 3,
        admin_term_months: 24,
      },
    },
  },
  {
    type: 'religious',
    label: 'Organización Religiosa',
    description: 'Configuración para iglesias y comunidades religiosas. Transparencia alta, cuotas voluntarias, y delegación permitida.',
    rules: {
      governance: {
        default_quorum: 0.33,
        default_majority: 0.5,
        delegation_enabled: true,
        proposal_rights: ['admin'],
        cool_down_hours: 24,
        auto_execution_enabled: true,
        auto_execution_threshold: 10000,
        mandatory_discussion_enabled: false,
        default_discussion_hours: 24,
        grace_period_hours: 24,
        quorum_by_type: {
          ordinary: 0.33,
          extraordinary: 0.5,
          budget: 0.33,
          election: 0.5,
          amendment: 0.5,
        },
        majority_by_type: {
          ordinary: 0.5,
          extraordinary: 0.5,
          budget: 0.5,
          election: 0.5,
          amendment: 0.66,
        },
        quorum_first_call: 0.33,
        quorum_second_call: 0.25,
        quorum_third_call: 0,
        minimum_notice_days: 3,
        quarterly_assembly_required: false,
        extraordinary_quorum: 0.5,
      },
      treasury: {
        mode: 'import',
        currency: 'MXN',
        admin_spending_limit: 25000,
        require_vote_above: 25000,
        reserva_fund_percentage: 0,
        monthly_statement_auto: true,
        collection_reminder_days: 0,
      },
      identity: {
        payment_to_vote_enabled: false,
        grace_period_months: 6,
        auto_restore_on_payment: true,
        delinquent_restrictions: [],
        moroso_threshold_ordinary: 6,
        moroso_threshold_extraordinary: 3,
        moroso_notice_days: 14,
        moroso_restrictions: [],
        admin_max_consecutive_terms: 0,
        admin_term_months: 24,
      },
    },
  },
  {
    type: 'other',
    label: 'Asociación General / Club',
    description: 'Configuración flexible para asociaciones, clubs deportivos, ONGs y otras comunidades organizadas.',
    rules: {
      governance: {
        default_quorum: 0.5,
        default_majority: 0.5,
        delegation_enabled: true,
        proposal_rights: ['admin', 'tesorero', 'miembro'],
        cool_down_hours: 48,
        auto_execution_enabled: false,
        auto_execution_threshold: 0,
        mandatory_discussion_enabled: false,
        default_discussion_hours: 48,
        grace_period_hours: 48,
        quorum_by_type: {
          ordinary: 0.5,
          extraordinary: 0.66,
          budget: 0.5,
          election: 0.5,
          amendment: 0.66,
        },
        majority_by_type: {
          ordinary: 0.5,
          extraordinary: 0.5,
          budget: 0.5,
          election: 0.5,
          amendment: 0.66,
        },
        quorum_first_call: 0.5,
        quorum_second_call: 0.33,
        quorum_third_call: 0,
        minimum_notice_days: 5,
        quarterly_assembly_required: false,
        extraordinary_quorum: 0.66,
      },
      treasury: {
        mode: 'import',
        currency: 'MXN',
        admin_spending_limit: 30000,
        require_vote_above: 30000,
        reserva_fund_percentage: 0,
        monthly_statement_auto: false,
        collection_reminder_days: 5,
      },
      identity: {
        payment_to_vote_enabled: false,
        grace_period_months: 3,
        auto_restore_on_payment: true,
        delinquent_restrictions: ['vote'],
        moroso_threshold_ordinary: 3,
        moroso_threshold_extraordinary: 2,
        moroso_notice_days: 7,
        moroso_restrictions: ['vote'],
        admin_max_consecutive_terms: 0,
        admin_term_months: 12,
      },
    },
  },
]

export function getPresetForType(type: CommunityType): VerticalPreset | undefined {
  return VERTICAL_PRESETS.find((p) => p.type === type)
}
