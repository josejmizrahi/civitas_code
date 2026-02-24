/**
 * Identity Primitive — Event listeners
 *
 * Identity listens to:
 * - treasury.obligation.paid → invalidate member standing caches
 * - treasury.obligation.overdue → invalidate member standing caches
 * - governance.election.completed → invalidate member/role caches
 */

import { getEventBus, type Unsubscribe } from '@/engine/events'
import type { ObligationPaidPayload, ObligationOverduePayload, ElectionCompletedPayload } from '@/engine/events'
import type { QueryClient } from '@tanstack/react-query'

/** Set up all Identity listeners. Returns a cleanup function. */
export function registerIdentityListeners(queryClient?: QueryClient): Unsubscribe {
  const bus = getEventBus()
  const unsubs: Unsubscribe[] = []

  // When an obligation is paid, standing might improve — refresh member data
  unsubs.push(
    bus.on('treasury.obligation.paid', async (event) => {
      const payload = event.payload as ObligationPaidPayload
      console.info(
        `[Identity] Obligation paid for member ${payload.memberId} — refreshing standing`,
      )
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ['members'] })
        void queryClient.invalidateQueries({ queryKey: ['moroso'] })
        void queryClient.invalidateQueries({ queryKey: ['financial-standing'] })
      }
    }),
  )

  // When an obligation is overdue, standing might worsen
  unsubs.push(
    bus.on('treasury.obligation.overdue', async (event) => {
      const payload = event.payload as ObligationOverduePayload
      console.info(
        `[Identity] Obligation overdue for member ${payload.memberId} — refreshing standing`,
      )
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ['members'] })
        void queryClient.invalidateQueries({ queryKey: ['moroso'] })
        void queryClient.invalidateQueries({ queryKey: ['financial-standing'] })
      }
    }),
  )

  // When an election completes, roles change — refresh member data
  unsubs.push(
    bus.on('governance.election.completed', async (event) => {
      const payload = event.payload as ElectionCompletedPayload
      console.info(
        `[Identity] Election ${payload.proposalId} completed — refreshing roles for ${payload.winners.length} winners`,
      )
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ['members'] })
      }
    }),
  )

  return () => unsubs.forEach((fn) => fn())
}
