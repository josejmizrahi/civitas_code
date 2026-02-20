import type {
  TransactionType, CategoryType, PaymentStatus,
  RecurringType, RecurringFrequency, ContractType, ContractStatus,
} from '@/shared/types'

export type TransactionOrigin = 'manual' | 'import' | 'rail' | 'system'

export interface Transaction {
  id: string
  community_id: string
  type: TransactionType
  amount: number
  category_id: string | null
  description: string
  date: string
  origin: TransactionOrigin
  source_id: string | null
  evidence_url: string | null
  external_ref: string | null
  import_job_id: string | null
  created_by: string | null
  created_at: string
  verification_status?: 'reported' | 'verified' | 'disputed'
  verified_by?: string | null
  verified_at?: string | null
  // Joined
  category_name?: string
}

export interface Category {
  id: string
  community_id: string
  name: string
  type: CategoryType
  parent_id: string | null
  is_system: boolean
  is_active: boolean
  created_at: string
}

export interface Budget {
  id: string
  community_id: string
  category_id: string
  period: string
  amount: number
  approved_by_proposal_id: string | null
  created_at: string
  // Joined
  category_name?: string
}

export interface PaymentObligation {
  id: string
  community_id: string
  member_id: string
  amount: number
  due_date: string
  status: PaymentStatus
  concept: string
  payment_transaction_id: string | null
  created_at: string
  // Joined
  member_name?: string
}

export type TreasuryMode = 'import' | 'connector' | 'fintech_rail' | 'hybrid'

export interface CollectionConfig {
  clabe: string | null
  bank_name: string | null
  beneficiary_name: string | null
  payment_reference_prefix: string | null
}

export interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  byCategory: { name: string; amount: number; type: string }[]
  monthlyData: { month: string; income: number; expenses: number }[]
  pendingObligations?: number
  overdueObligations?: number
  collectionRate?: number
}

// ==================== RECURRING SCHEDULES ====================

export interface RecurringSchedule {
  id: string
  community_id: string
  name: string
  description: string | null
  type: RecurringType
  frequency: RecurringFrequency
  custom_interval_days: number | null
  amount: number
  currency: string
  category_id: string | null
  target_type: 'all_members' | 'specific_members' | 'entity'
  target_entity_id: string | null
  target_member_ids: string[]
  day_of_month: number
  start_date: string
  end_date: string | null
  next_run_date: string
  last_run_date: string | null
  is_active: boolean
  auto_generate: boolean
  runs_completed: number
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  category_name?: string
  entity_name?: string
  creator_name?: string
  target_member_names?: string[]
}

// ==================== CONTRACTS ====================

export interface Contract {
  id: string
  community_id: string
  name: string
  description: string | null
  type: ContractType
  entity_id: string | null
  member_id: string | null
  total_amount: number
  currency: string
  payment_frequency: string
  number_of_installments: number
  start_date: string
  end_date: string | null
  status: ContractStatus
  compliance_score: number
  terms: Record<string, unknown>
  document_ids: string[]
  approved_by_proposal_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined
  entity_name?: string
  member_name?: string
  creator_name?: string
  proposal_title?: string
}

export interface ContractInstallment {
  id: string
  contract_id: string
  community_id: string
  installment_number: number
  amount: number
  due_date: string
  status: PaymentStatus | 'cancelled'
  payment_obligation_id: string | null
  transaction_id: string | null
  paid_amount: number
  paid_at: string | null
  notes: string | null
  created_at: string
}
