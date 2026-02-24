/**
 * Identity Primitive — Event listeners
 *
 * Identity listens to:
 * - treasury.obligation.paid → recalculate standing
 * - treasury.obligation.overdue → recalculate standing
 * - governance.election.completed → update member roles
 */

import { getEventBus, type Unsubscribe } from '@/engine/events'
import type { ObligationPaidPayload, ObligationOverduePayload, ElectionCompletedPayload } from '@/engine/events'

/** Set up all Identity listeners. Returns a cleanup function. */
export function registerIdentityListeners(): Unsubscribe {
  const bus = getEventBus()
  const unsubs: Unsubscribe[] = []

  // When an obligation is paid, standing might improve
  unsubs.push(
    bus.on('treasury.obligation.paid', async (event) => {
      const payload = event.payload as ObligationPaidPayload
      console.info(
        `[Identity] Obligation paid for member ${payload.memberId} — will recalculate standing`,
      )
      // Standing recalculation happens in Postgres via trigger (compute_financial_standing)
      // This listener is for client-side cache invalidation / optimistic UI
    }),
  )

  // When an obligation is overdue, standing might worsen
  unsubs.push(
    bus.on('treasury.obligation.overdue', async (event) => {
      const payload = event.payload as ObligationOverduePayload
      console.info(
        `[Identity] Obligation overdue for member ${payload.memberId} — standing may change`,
      )
    }),
  )

  // When an election completes, update roles
  unsubs.push(
    bus.on('governance.election.completed', async (event) => {
      const payload = event.payload as ElectionCompletedPayload
      console.info(
        `[Identity] Election ${payload.proposalId} completed — updating roles for ${payload.winners.length} winners`,
      )
      // Role updates happen in the proposal execution service
      // This listener is for client-side cache invalidation
    }),
  )

  return () => unsubs.forEach((fn) => fn())
}
