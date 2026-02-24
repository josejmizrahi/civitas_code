/**
 * Treasury Primitive — Event listeners
 *
 * Treasury listens to:
 * - commerce.payment.received → invalidate transaction/obligation caches
 * - governance.proposal.executed → invalidate treasury caches after financial instruction
 */

import { getEventBus, type Unsubscribe } from '@/engine/events'
import type { PaymentReceivedPayload, ProposalExecutedPayload } from '@/engine/events'
import type { QueryClient } from '@tanstack/react-query'

/** Set up all Treasury listeners. Returns a cleanup function. */
export function registerTreasuryListeners(queryClient?: QueryClient): Unsubscribe {
  const bus = getEventBus()
  const unsubs: Unsubscribe[] = []

  // When a payment is received via Commerce, invalidate treasury caches
  unsubs.push(
    bus.on('commerce.payment.received', async (event) => {
      const payload = event.payload as PaymentReceivedPayload
      console.info(
        `[Treasury] Payment received from ${payload.provider}: $${payload.amount} ${payload.currency}`,
      )
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ['transactions'] })
        void queryClient.invalidateQueries({ queryKey: ['obligations'] })
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        void queryClient.invalidateQueries({ queryKey: ['fintech'] })
        void queryClient.invalidateQueries({ queryKey: ['collection-stats'] })
      }
    }),
  )

  // When a proposal with a financial instruction is executed
  unsubs.push(
    bus.on('governance.proposal.executed', async (event) => {
      const payload = event.payload as ProposalExecutedPayload
      console.info(
        `[Treasury] Proposal ${payload.proposalId} executed — refreshing treasury data`,
      )
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ['transactions'] })
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        void queryClient.invalidateQueries({ queryKey: ['budgets'] })
      }
    }),
  )

  return () => unsubs.forEach((fn) => fn())
}
