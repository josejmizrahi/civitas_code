/**
 * TransferProvider Port — Outbound money transfers (pay vendors, disbursements)
 *
 * THIS FILE DOES NOT CHANGE when you switch providers.
 */

// ---------------------------------------------------------------------------
// Transfer (community pays external entity)
// ---------------------------------------------------------------------------

export interface TransferParams {
  communityId: string
  amount: number
  currency: string
  destinationClabe: string
  destinationName: string
  concept: string
  reference?: string
  /** Optional link to a spend request or discretionary approval */
  spendRequestId?: string
  approvalId?: string
}

export type TransferStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

export interface TransferResult {
  id: string
  externalId: string
  status: TransferStatus
  amount: number
  currency: string
  destinationClabe: string
  createdAt: string
  completedAt?: string
  failureReason?: string
}

// ---------------------------------------------------------------------------
// Balance
// ---------------------------------------------------------------------------

export interface BalanceInfo {
  available: number
  pending: number
  currency: string
  asOf: string
}

// ---------------------------------------------------------------------------
// Movements (account history)
// ---------------------------------------------------------------------------

export interface MovementFilters {
  communityId: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface Movement {
  id: string
  type: 'inbound' | 'outbound'
  amount: number
  currency: string
  reference: string
  counterpartyName: string | null
  counterpartyClabe: string | null
  date: string
}

// ---------------------------------------------------------------------------
// The Port interface
// ---------------------------------------------------------------------------

export interface TransferProvider {
  /** Provider identifier */
  readonly providerId: string

  /** Send an outbound transfer */
  sendTransfer(params: TransferParams): Promise<TransferResult>

  /** Get status of a transfer */
  getTransferStatus(transferId: string): Promise<TransferResult>

  /** Get available balance */
  getBalance(communityId: string): Promise<BalanceInfo>

  /** List account movements */
  listMovements(filters: MovementFilters): Promise<Movement[]>
}
