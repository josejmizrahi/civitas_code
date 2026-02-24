/**
 * Commerce Primitive — Event emitters
 */

import { getEventBus } from '@/engine/events'
import type {
  PaymentReceivedPayload,
  TransferCompletedPayload,
  CheckoutCompletedPayload,
} from '@/engine/events'

export function emitPaymentReceived(
  communityId: string,
  actorId: string | null,
  payload: PaymentReceivedPayload,
) {
  return getEventBus().emit('commerce.payment.received', communityId, actorId, payload)
}

export function emitTransferCompleted(
  communityId: string,
  actorId: string | null,
  payload: TransferCompletedPayload,
) {
  return getEventBus().emit('commerce.transfer.completed', communityId, actorId, payload)
}

export function emitCheckoutCompleted(
  communityId: string,
  actorId: string | null,
  payload: CheckoutCompletedPayload,
) {
  return getEventBus().emit('commerce.checkout.completed', communityId, actorId, payload)
}
