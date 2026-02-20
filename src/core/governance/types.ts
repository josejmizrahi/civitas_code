import type { ProposalStatus, ProposalType, VoteValue, VotingModel } from '@/shared/types'
import type { FinancialInstruction, ExecutionStatus } from '@/shared/types/rules'

export interface VotingOption {
  id: string
  label: string
}

export interface Proposal {
  id: string
  community_id: string
  title: string
  description: string
  type: ProposalType
  status: ProposalStatus
  quorum_required: number
  majority_required: number
  voting_start: string | null
  voting_end: string | null
  result: string | null
  closed_at: string | null
  closed_by: string | null
  created_by: string
  created_at: string
  assembly_id?: string | null
  // Discussion phase — GV-001, GV-006
  discussion_start: string | null
  discussion_end: string | null
  discussion_min_hours: number | null
  // Outcome declaration — GV-001
  outcome_declared: string | null
  outcome_declared_by: string | null
  outcome_declared_at: string | null
  // Grace period (appeal window) — GV-043
  grace_period_end: string | null
  appealed: boolean
  // Template — GV-003
  template_id: string | null
  // Voting model — GV-012, GV-016
  voting_model: VotingModel
  voting_options: VotingOption[]
  // Executable governance fields
  financial_instruction: FinancialInstruction | null
  execution_status: ExecutionStatus | null
  executed_at: string | null
  cool_down_until: string | null
  // Endorsement system
  endorsements_required: number
  endorsements_met: boolean
  // Joined / computed
  creator_name?: string
  vote_summary?: VoteSummary
  endorsement_count?: number
}

export interface Vote {
  id: string
  proposal_id: string
  member_id: string
  value: VoteValue
  weight: number
  delegated_from: string | null
  cast_at: string
  block_reason: string | null
  is_override: boolean
  // Joined
  member_name?: string
}

export interface VoteSummary {
  yes: number
  no: number
  abstain: number
  total: number
  quorum_met: boolean
  majority_met: boolean
  participation_pct: number
}

export interface Endorsement {
  id: string
  proposal_id: string
  member_id: string
  community_id: string
  endorsed_at: string
  member_name?: string
}

export interface Delegation {
  id: string
  community_id: string
  from_member_id: string
  to_member_id: string
  scope: string
  active: boolean
  created_at: string
  // Joined
  from_member_name?: string
  to_member_name?: string
}

export interface MinuteSignature {
  member_id: string
  member_name: string
  signed_at: string
  hash: string
}

export interface Minutes {
  id: string
  community_id: string
  proposal_id: string | null
  assembly_id?: string | null
  content: string
  generated_at: string
  approved: boolean
  approved_at: string | null
  approved_by: string | null
  signatures: MinuteSignature[]
}

// ---------------------------------------------------------------------------
// Assembly & Convocatoria types — LPCI CDMX Phase 1
// ---------------------------------------------------------------------------

export type AssemblyType = 'ordinary' | 'extraordinary'

export type AssemblyStatus =
  | 'scheduled'
  | 'convened'
  | 'in_session'
  | 'first_call'
  | 'second_call'
  | 'third_call'
  | 'completed'
  | 'cancelled'

export interface AgendaItem {
  order: number
  topic: string
  description: string
}

export interface AttendanceRecord {
  member_id: string
  member_name: string
  present: boolean
  /** Voting weight for quorum (e.g. indiviso % in residential). Default 1.0 for one-member-one-vote. */
  indiviso_pct?: number
  checked_in_at?: string
}

export interface DeliveryRecord {
  member_id: string
  member_name: string
  method: string
  delivered_at: string
}

export interface Assembly {
  id: string
  community_id: string
  type: AssemblyType
  title: string
  scheduled_date: string
  location: string
  called_by: string
  agenda: AgendaItem[]
  status: AssemblyStatus
  current_call: number
  first_call_at: string | null
  second_call_at: string | null
  third_call_at: string | null
  quorum_met: boolean
  quorum_pct: number | null
  attendance: AttendanceRecord[]
  notes: string | null
  created_at: string
  // Joined
  caller_name?: string
}

export interface Convocatoria {
  id: string
  community_id: string
  assembly_id: string
  call_number: number
  type: string
  scheduled_date: string
  location: string
  agenda: AgendaItem[]
  called_by: string
  issued_at: string
  minimum_notice_days: number
  delivery_method: string
  delivery_log: DeliveryRecord[]
  created_at: string
  // Joined
  caller_name?: string
}

// ---------------------------------------------------------------------------
// Proxy / Representación — LPCI CDMX Art. 36
// ---------------------------------------------------------------------------

export interface AssemblyProxy {
  id: string
  community_id: string
  assembly_id: string
  grantor_id: string
  representative_id: string
  granted_at: string
  revoked_at: string | null
  is_active: boolean
  created_at: string
  // Joined
  grantor_name?: string
  representative_name?: string
}

// ---------------------------------------------------------------------------
// Document Retention — Código de Comercio Art. 38-52, NOM-151
// ---------------------------------------------------------------------------

export type RetentionDocumentType = 'minutes' | 'financial_statement' | 'convocatoria' | 'report'

export interface RetentionRecord {
  id: string
  community_id: string
  document_type: RetentionDocumentType
  document_id: string
  retention_years: number
  created_at: string
  expires_at: string
  integrity_hash: string | null
  archived: boolean
  archived_at: string | null
}
