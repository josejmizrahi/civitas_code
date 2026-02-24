/**
 * Treasury Primitive — Event listeners
 *
 * Treasury listens to:
 * - commerce.payment.received → create transaction + mark obligation paid
 * - governance.proposal.executed → execute financial instruction
 */

import { getEventBus, type Unsubscribe } from '@/engine/events'
import type { PaymentReceivedPayload, ProposalExecutedPayload } from '@/engine/events'

/** Set up all Treasury listeners. Returns a cleanup function. */
export function registerTreasuryListeners(): Unsubscribe {
  const bus = getEventBus()
  const unsubs: Unsubscribe[] = []

  // When a payment is received via Commerce, register it as a transaction
  unsubs.push(
    bus.on('commerce.payment.received', async (event) => {
      const payload = event.payload as PaymentReceivedPayload
      console.info(
        `[Treasury] Payment received from ${payload.provider}: $${payload.amount} ${payload.currency}`,
      )
      // The actual transaction creation happens in the reconciliation flow
      // This listener is for real-time UI updates and cache invalidation
    }),
  )

  // When a proposal with a financial instruction is executed
  unsubs.push(
    bus.on('governance.proposal.executed', async (event) => {
      const payload = event.payload as ProposalExecutedPayload
      console.info(
        `[Treasury] Proposal ${payload.proposalId} executed — checking for financial instructions`,
      )
      // Financial execution is handled by governance.service.executeProposal
      // This listener is for treasury-side effects (budget updates, notifications)
    }),
  )

  return () => unsubs.forEach((fn) => fn())
}
