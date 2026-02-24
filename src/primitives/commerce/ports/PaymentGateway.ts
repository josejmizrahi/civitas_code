/**
 * PaymentGateway Port — The contract that any fintech provider must implement
 *
 * THIS FILE DOES NOT CHANGE when you switch providers.
 * Only the adapter (e.g. adapters/fintoc/) changes.
 */

// ---------------------------------------------------------------------------
// Checkout (member pays community)
// ---------------------------------------------------------------------------

export interface CheckoutParams {
  communityId: string
  memberId: string
  amount: number
  currency: string
  /** What the payment is for */
  concept: string
  /** Optional obligation to link payment to */
  obligationId?: string
  /** Metadata for reconciliation */
  metadata?: Record<string, string>
}

export interface CheckoutSession {
  id: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  amount: number
  currency: string
  /** URL or widget ID to present to user */
  redirectUrl?: string
  widgetToken?: string
  /** When the session expires */
  expiresAt?: string
  /** Provider-specific data */
  providerData?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Payment events (inbound money)
// ---------------------------------------------------------------------------

export interface PaymentEvent {
  id: string
  externalId: string
  amount: number
  currency: string
  reference: string
  counterpartyName: string | null
  counterpartyClabe: string | null
  receivedAt: string
  /** Raw provider data */
  raw: Record<string, unknown>
}

export type ReconciliationStatus = 'pending' | 'matched' | 'unmatched' | 'manual' | 'ignored'

// ---------------------------------------------------------------------------
// Webhook processing
// ---------------------------------------------------------------------------

export interface WebhookResult {
  accepted: boolean
  eventId: string | null
  paymentEvent: PaymentEvent | null
  error?: string
}

// ---------------------------------------------------------------------------
// Reconciliation
// ---------------------------------------------------------------------------

export interface ReconciliationResult {
  success: boolean
  transactionId: string | null
  obligationId: string | null
  memberId: string | null
  error?: string
}

export interface ReconciliationStats {
  matched: number
  unmatched: number
  pending: number
  ignored: number
  totalAmount: number
  matchedAmount: number
}

// ---------------------------------------------------------------------------
// The Port interface
// ---------------------------------------------------------------------------

export interface PaymentGateway {
  /** Provider identifier */
  readonly providerId: string

  /** Create a checkout session for a member to pay */
  createCheckout(params: CheckoutParams): Promise<CheckoutSession>

  /** Get status of a checkout session */
  getCheckoutStatus(sessionId: string): Promise<CheckoutSession>

  /** Process an incoming webhook from the provider */
  processWebhook(payload: unknown, signature: string): Promise<WebhookResult>

  /** Reconcile a payment event against an obligation */
  reconcile(eventId: string, obligationId: string): Promise<ReconciliationResult>

  /** Get reconciliation statistics */
  getReconciliationStats(communityId: string): Promise<ReconciliationStats>

  /** List unreconciled payment events */
  getUnreconciledEvents(communityId: string): Promise<PaymentEvent[]>
}
