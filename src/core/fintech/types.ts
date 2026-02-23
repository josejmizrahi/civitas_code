export type FintechStatus = 'inactive' | 'pending' | 'active' | 'suspended'

export type FintechProvider = 'fintoc' | 'custom' | string

export interface FintechConfig {
  fintech_status: FintechStatus
  fintech_provider: FintechProvider | null
  fintech_account_id: string | null
  fintech_root_clabe: string | null
  fintech_public_key: string | null
}

export interface PaymentEvent {
  id: string
  community_id: string
  external_event_id: string
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

export interface CheckoutSession {
  id: string
  community_id: string
  member_id: string
  obligation_id: string | null
  external_session_id: string
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

export interface PaymentTransfer {
  id: string
  community_id: string
  external_transfer_id: string | null
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

export interface ProviderCredentials {
  public_key: string
  account_id: string
  root_clabe: string
}

export interface ReconciliationStats {
  total: number
  matched: number
  unmatched: number
  pending: number
  ignored: number
  total_amount_matched: number
  total_amount_unmatched: number
}

// ─── KYB Application ──────────────────────────────────────────────

export type KybStatus = 'draft' | 'documents_pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_info'

export interface KybShareholder {
  name: string
  id_type: 'ine' | 'passport'
  id_number: string
  ownership_pct: number
  is_foreign: boolean
  is_moral: boolean
  moral_company_name?: string
}

export interface KybDashboardUser {
  name: string
  email: string
  role: 'admin' | 'operator' | 'capturer' | 'authorizer'
}

export interface KybEscalationContact {
  area: string
  email: string
}

export type KybFundOrigin = 'fideicomisos' | 'partidas_presupuestales' | 'regalias' | 'venta_activos' | 'inversion' | 'utilidades' | 'donaciones'

export interface KybDocuments {
  acta_constitutiva?: string
  constancia_fiscal?: string
  comprobante_domicilio?: string
  poder_representante?: string
  id_representante?: string
  estructura_accionaria?: string
  id_accionistas?: string[]
  acta_moral_mexicana?: string[]
  acta_moral_extranjera?: string[]
  estado_cuenta_banco?: string
}

export interface KybApplication {
  id: string
  community_id: string
  submitted_by: string
  status: KybStatus

  company_legal_name: string | null
  company_rfc: string | null
  company_address: string | null
  company_city: string | null
  company_state: string | null
  company_zip: string | null
  company_incorporation_date: string | null
  company_registro_publico: string | null

  rep_legal_name: string | null
  rep_legal_email: string | null
  rep_legal_phone: string | null
  rep_legal_id_type: 'ine' | 'passport' | null

  shareholders: KybShareholder[]

  settlement_bank_name: string | null
  settlement_account_number: string | null
  settlement_clabe: string | null
  settlement_account_holder: string | null

  annex_a_billing_email: string | null
  annex_a_contract_email: string | null
  annex_a_support_email: string | null
  annex_a_escalation: KybEscalationContact[]

  annex_b_users: KybDashboardUser[]

  annex_d_fund_origin: KybFundOrigin[] | null
  annex_d_monthly_volume: string | null
  annex_d_monthly_operations: string | null

  documents: KybDocuments

  rejection_reason: string | null
  provider_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}
