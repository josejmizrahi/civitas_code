export type FintocStatus = 'inactive' | 'pending' | 'active' | 'suspended'

export interface FintocCommunityConfig {
  fintoc_status: FintocStatus
  fintoc_account_id: string | null
  fintoc_root_clabe: string | null
  fintoc_public_key: string | null
}

export interface FintocEvent {
  id: string
  community_id: string
  fintoc_event_id: string
  event_type: string
  event_data: Record<string, unknown>
  amount: number | null
  currency: string
  counterparty_name: string | null
  counterparty_clabe: string | null
  tracking_key: string | null
  account_number_id: string | null
  reconciliation_status: 'pending' | 'matched' | 'manual' | 'unmatched' | 'ignored'
  matched_obligation_id: string | null
  matched_transaction_id: string | null
  processed_at: string | null
  created_at: string
}

export interface FintocCheckoutSession {
  id: string
  community_id: string
  member_id: string
  obligation_id: string | null
  fintoc_session_id: string
  amount: number
  currency: string
  status: 'created' | 'finished' | 'expired' | 'failed'
  redirect_url: string | null
  payment_intent_id: string | null
  payment_status: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface FintocTransfer {
  id: string
  community_id: string
  fintoc_transfer_id: string | null
  direction: 'inbound' | 'outbound'
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed' | 'rejected' | 'returned'
  counterparty_clabe: string | null
  counterparty_name: string | null
  comment: string | null
  reference_id: string | null
  tracking_key: string | null
  spend_request_id: string | null
  linked_transaction_id: string | null
  metadata: Record<string, unknown>
  error_reason: string | null
  created_at: string
  updated_at: string
}

export interface CreateCheckoutInput {
  obligation_id: string
  amount: number
  concept: string
  member_email?: string
}

export interface CreateTransferInput {
  amount: number
  counterparty_clabe: string
  counterparty_name?: string
  comment?: string
  reference_id?: string
  spend_request_id?: string
}

export interface FintocSetupInput {
  secret_key: string
  public_key: string
}

export interface FintocReconciliationStats {
  total: number
  matched: number
  unmatched: number
  pending: number
  ignored: number
  total_amount_matched: number
  total_amount_unmatched: number
}
