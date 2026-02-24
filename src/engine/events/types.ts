/**
 * Domain Events — The nervous system of Civitas OS
 *
 * Primitives communicate ONLY through events, never by direct imports.
 * Each primitive emits events when something happens, and other primitives
 * subscribe to events they care about.
 *
 * Dependency direction: Identity ← Treasury ← Governance ← Commerce ← Federation
 * Events flow in BOTH directions, but imports only flow upward.
 */

// ---------------------------------------------------------------------------
// Base
// ---------------------------------------------------------------------------

export interface DomainEvent<T = unknown> {
  /** Unique event ID */
  id: string
  /** Dot-namespaced event type, e.g. "identity.member.joined" */
  type: string
  /** Community scope */
  communityId: string
  /** ISO timestamp */
  timestamp: string
  /** Actor who triggered the event (member or system) */
  actorId: string | null
  /** Event-specific payload */
  payload: T
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => void | Promise<void>

export type Unsubscribe = () => void

// ---------------------------------------------------------------------------
// Identity Events
// ---------------------------------------------------------------------------

export interface MemberJoinedPayload {
  memberId: string
  userId: string
  role: string
  invitedBy: string | null
}

export interface MemberRoleChangedPayload {
  memberId: string
  previousRole: string
  newRole: string
}

export interface StandingChangedPayload {
  memberId: string
  previousStanding: string
  newStanding: string
  reason: string
}

export interface MemberDeactivatedPayload {
  memberId: string
  reason: string
}

// ---------------------------------------------------------------------------
// Treasury Events
// ---------------------------------------------------------------------------

export interface ObligationCreatedPayload {
  obligationId: string
  memberId: string
  amount: number
  dueDate: string
  concept: string
}

export interface ObligationPaidPayload {
  obligationId: string
  memberId: string
  amount: number
  transactionId: string
}

export interface ObligationOverduePayload {
  obligationId: string
  memberId: string
  amount: number
  dueDate: string
  daysOverdue: number
}

export interface TransactionCreatedPayload {
  transactionId: string
  type: 'income' | 'expense'
  amount: number
  categoryId: string | null
  origin: string
  description: string
}

export interface BudgetExceededPayload {
  budgetId: string
  categoryId: string
  budgetAmount: number
  spentAmount: number
  excessAmount: number
}

// ---------------------------------------------------------------------------
// Governance Events
// ---------------------------------------------------------------------------

export interface ProposalApprovedPayload {
  proposalId: string
  proposalType: string
  title: string
  financialInstruction: unknown | null
}

export interface ProposalExecutedPayload {
  proposalId: string
  proposalType: string
  executionResult: unknown
}

export interface ElectionCompletedPayload {
  proposalId: string
  winners: Array<{ memberId: string; role: string }>
}

export interface RuleChangedPayload {
  ruleKey: string
  previousValue: unknown
  newValue: unknown
  proposalId: string | null
}

// ---------------------------------------------------------------------------
// Commerce Events
// ---------------------------------------------------------------------------

export interface PaymentReceivedPayload {
  externalId: string
  provider: string
  amount: number
  currency: string
  reference: string
  counterpartyClabe: string | null
  matchedObligationId: string | null
  matchedMemberId: string | null
}

export interface TransferCompletedPayload {
  transferId: string
  provider: string
  amount: number
  destinationClabe: string
  status: string
}

export interface CheckoutCompletedPayload {
  sessionId: string
  memberId: string
  amount: number
  obligationId: string | null
}

// ---------------------------------------------------------------------------
// Federation Events
// ---------------------------------------------------------------------------

export interface TreatyEstablishedPayload {
  treatyId: string
  otherCommunityId: string
  treatyType: string
}

export interface PassportVerifiedPayload {
  passportId: string
  userId: string
  verificationLevel: string
}

// ---------------------------------------------------------------------------
// Event Type Registry — exhaustive map of type → payload
// ---------------------------------------------------------------------------

export interface EventMap {
  // Identity
  'identity.member.joined': MemberJoinedPayload
  'identity.member.role_changed': MemberRoleChangedPayload
  'identity.member.standing_changed': StandingChangedPayload
  'identity.member.deactivated': MemberDeactivatedPayload

  // Treasury
  'treasury.obligation.created': ObligationCreatedPayload
  'treasury.obligation.paid': ObligationPaidPayload
  'treasury.obligation.overdue': ObligationOverduePayload
  'treasury.transaction.created': TransactionCreatedPayload
  'treasury.budget.exceeded': BudgetExceededPayload

  // Governance
  'governance.proposal.approved': ProposalApprovedPayload
  'governance.proposal.executed': ProposalExecutedPayload
  'governance.election.completed': ElectionCompletedPayload
  'governance.rule.changed': RuleChangedPayload

  // Commerce
  'commerce.payment.received': PaymentReceivedPayload
  'commerce.transfer.completed': TransferCompletedPayload
  'commerce.checkout.completed': CheckoutCompletedPayload

  // Federation
  'federation.treaty.established': TreatyEstablishedPayload
  'federation.passport.verified': PassportVerifiedPayload
}

export type EventType = keyof EventMap
