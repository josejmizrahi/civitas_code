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
  correction_of?: string | null
  correction_note?: string | null
  vigilance_flag?: boolean
  vigilance_note?: string | null
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

export interface DiscretionaryApproval {
  id: string
  community_id: string
  requested_by: string
  amount: number
  description: string
  category_id: string | null
  beneficiary_entity_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  approved_by: string | null
  response_note: string | null
  transaction_id: string | null
  responded_at: string | null
  created_at: string
}

// ==================== SPEND REQUESTS ====================

export type SpendRequestStatus =
  | 'draft'
  | 'pending_approval'
  | 'pending_vote'
  | 'approved'
  | 'executing'
  | 'executed'
  | 'verified'
  | 'rejected'
  | 'cancelled'

export type SpendRequestAttachmentType = 'quote' | 'invoice' | 'receipt' | 'evidence' | 'delivery' | 'other'

export interface SpendRequest {
  id: string
  community_id: string
  title: string
  description: string | null
  amount: number
  category_id: string
  fund: string
  beneficiary_entity_id: string | null
  evidence_url: string | null
  status: SpendRequestStatus
  authorization_level: number | null
  budget_id: string | null
  proposal_id: string | null
  approved_by: string | null
  approval_note: string | null
  rejection_reason: string | null
  transaction_id: string | null
  payment_reference: string | null
  paid_at: string | null
  verified_by: string | null
  verification_note: string | null
  verified_at: string | null
  is_emergency: boolean
  ratification_proposal_id: string | null
  ratification_deadline: string | null
  requested_by: string
  created_at: string
  updated_at: string
  // Joined
  category_name?: string
  beneficiary_name?: string
  requested_by_name?: string
}

export interface SpendRequestAttachment {
  id: string
  spend_request_id: string
  type: SpendRequestAttachmentType
  file_url: string
  description: string | null
  uploaded_by: string | null
  created_at: string
}

export interface SpendRequestComment {
  id: string
  spend_request_id: string
  member_id: string
  content: string
  created_at: string
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
  // GAP-10: proportional obligations
  proportional_attribute?: string | null
  total_amount?: number | null
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
