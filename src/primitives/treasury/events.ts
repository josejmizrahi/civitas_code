/**
 * Treasury Primitive — Event emitters
 */

import { getEventBus } from '@/engine/events'
import type {
  ObligationCreatedPayload,
  ObligationPaidPayload,
  ObligationOverduePayload,
  TransactionCreatedPayload,
  BudgetExceededPayload,
} from '@/engine/events'

export function emitObligationCreated(
  communityId: string,
  actorId: string | null,
  payload: ObligationCreatedPayload,
) {
  return getEventBus().emit('treasury.obligation.created', communityId, actorId, payload)
}

export function emitObligationPaid(
  communityId: string,
  actorId: string | null,
  payload: ObligationPaidPayload,
) {
  return getEventBus().emit('treasury.obligation.paid', communityId, actorId, payload)
}

export function emitObligationOverdue(
  communityId: string,
  actorId: string | null,
  payload: ObligationOverduePayload,
) {
  return getEventBus().emit('treasury.obligation.overdue', communityId, actorId, payload)
}

export function emitTransactionCreated(
  communityId: string,
  actorId: string | null,
  payload: TransactionCreatedPayload,
) {
  return getEventBus().emit('treasury.transaction.created', communityId, actorId, payload)
}

export function emitBudgetExceeded(
  communityId: string,
  actorId: string | null,
  payload: BudgetExceededPayload,
) {
  return getEventBus().emit('treasury.budget.exceeded', communityId, actorId, payload)
}
