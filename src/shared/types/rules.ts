// Configurable Rules Engine — The Social Smart Contract
// Each community defines rules for how Identity ↔ Treasury ↔ Governance interact
// Compliant with: LPCI CDMX, LFPDPPP 2025, Código de Comercio, NOM-151
import type { ComplianceRules } from '@/shared/types/compliance'

export interface QuorumByType {
  ordinary: number
  extraordinary: number
  budget: number
  election: number
  amendment: number
}

export interface MajorityByType {
  ordinary: number
  extraordinary: number
  budget: number
  election: number
  amendment: number
}

export interface GovernanceRules {
  default_quorum: number          // 0-1, e.g. 0.5 = 50%
  default_majority: number        // 0-1, e.g. 0.5 = 50%
  delegation_enabled: boolean
  proposal_rights: string[]       // roles that can create proposals
  cool_down_hours: number         // hours between vote and execution
  auto_execution_enabled: boolean // when vote passes, auto-execute financial instruction
  auto_execution_threshold: number // auto-execute only below this amount (0 = no limit)
  // Discussion phase — GV-001, GV-006
  mandatory_discussion_enabled: boolean  // require discussion before voting
  default_discussion_hours: number       // default discussion period in hours
  // Grace period (appeal window) — GV-043
  grace_period_hours: number             // hours after approval for appeals
  // Differentiated quorum/majority by proposal type — GV-036
  quorum_by_type: QuorumByType
  majority_by_type: MajorityByType
  // Endorsement system — anti-spam
  min_endorsements: number           // minimum endorsements to advance draft (0 = disabled)
  endorsement_bypass_roles: string[] // roles that skip endorsement requirement
  // Mexican legal compliance — LPCI CDMX Art. 33
  quorum_first_call: number       // 1st call quorum (75% indiviso) — Art. 33
  quorum_second_call: number      // 2nd call quorum (50%+1) — Art. 33
  quorum_third_call: number       // 3rd call quorum (whoever present) — Art. 33
  minimum_notice_days: number     // days before assembly for convocatoria — Art. 34
  quarterly_assembly_required: boolean // mandatory quarterly ordinary assemblies — Art. 31
  extraordinary_quorum: number    // quorum override for extraordinary topics
}

export interface TreasuryRules {
  mode: 'import' | 'connector' | 'fintech_rail' | 'hybrid'
  locale: string
  currency: string
  admin_spending_limit: number    // admin can spend below this without vote
  require_vote_above: number      // require governance vote above this amount
  // Fintech rail config (Phase 2+)
  clabe: string | null
  bank_name: string | null
  beneficiary_name: string | null
  payment_reference_prefix: string | null
  auto_reconciliation: boolean
  collection_reminder_days: number
  // Dual fund accounting — LPCI CDMX Art. 57-58
  reserva_fund_percentage: number     // % of income auto-allocated to reserve fund
  monthly_statement_auto: boolean     // auto-generate monthly statements — Art. 43
}

export interface IdentityRules {
  payment_to_vote_enabled: boolean     // if true, delinquent members can't vote
  grace_period_months: number          // months before losing rights
  auto_restore_on_payment: boolean     // auto-restore rights when member pays
  delinquent_restrictions: string[]    // what delinquent members can't do: 'vote', 'propose', 'delegate'
  // Mexican moroso rules — LPCI CDMX Art. 2, 36
  moroso_threshold_ordinary: number      // # of ordinary cuotas to become moroso (Art. 2: 2)
  moroso_threshold_extraordinary: number // # of extraordinary cuotas to become moroso (Art. 2: 1)
  moroso_notice_days: number             // days before assembly to notify morosos (Art. 36: 7)
  moroso_restrictions: string[]          // moroso-specific restrictions: 'vote', 'be_elected', 'quorum_excluded'
  // Admin term tracking — LPCI CDMX Art. 42
  admin_max_consecutive_terms: number    // max consecutive re-elections (Art. 42: 2)
  admin_term_months: number              // months per admin term (Art. 42: 12)
}

export interface CommunityRules {
  governance: GovernanceRules
  treasury: TreasuryRules
  identity: IdentityRules
  compliance: ComplianceRules
}

export type FinancialStanding = 'good_standing' | 'grace_period' | 'delinquent' | 'suspended' | 'moroso'

export type ExecutionStatus = 'pending' | 'cool_down' | 'executed' | 'failed' | 'manual'

export type FundType = 'mantenimiento' | 'reserva'

export interface FinancialInstruction {
  type: 'disbursement' | 'budget_allocation' | 'quota_change' | 'config_change' | 'none'
  amount?: number
  recipient_name?: string
  recipient_clabe?: string
  category_id?: string
  description?: string
  period?: string
  new_amount?: number
  effective_date?: string
  config_key?: string
  config_value?: unknown
}

export const DEFAULT_RULES: CommunityRules = {
  governance: {
    default_quorum: 0.5,
    default_majority: 0.5,
    delegation_enabled: true,
    proposal_rights: ['admin', 'comite_vigilancia', 'tesorero', 'miembro'],
    cool_down_hours: 48,
    auto_execution_enabled: false,
    auto_execution_threshold: 0,
    // Discussion phase defaults
    mandatory_discussion_enabled: false,
    default_discussion_hours: 48,
    // Grace period defaults
    grace_period_hours: 0,
    // Differentiated quorum/majority by type
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
    // Endorsement defaults
    min_endorsements: 3,
    endorsement_bypass_roles: ['admin', 'tesorero'],
    // Mexican legal defaults — LPCI CDMX
    quorum_first_call: 0.75,
    quorum_second_call: 0.5001,
    quorum_third_call: 0,
    minimum_notice_days: 7,
    quarterly_assembly_required: true,
    extraordinary_quorum: 0.75,
  },
  treasury: {
    mode: 'import',
    locale: 'es-MX',
    currency: 'MXN',
    admin_spending_limit: 50000,
    require_vote_above: 50000,
    clabe: null,
    bank_name: null,
    beneficiary_name: null,
    payment_reference_prefix: null,
    auto_reconciliation: false,
    collection_reminder_days: 5,
    reserva_fund_percentage: 0,
    monthly_statement_auto: true,
  },
  identity: {
    payment_to_vote_enabled: false,
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
  compliance: {
    jurisdiction: 'mx',
    privacy_framework: 'lfpdppp',
    property_framework: 'lpci_cdmx',
  },
}
