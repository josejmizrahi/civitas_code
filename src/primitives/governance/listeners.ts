/**
 * Governance Primitive — Event listeners
 *
 * Governance listens to:
 * - identity.member.standing_changed → update voting rights
 * - treasury.budget.exceeded → alert vigilance committee
 */

import { getEventBus, type Unsubscribe } from '@/engine/events'
import type { StandingChangedPayload, BudgetExceededPayload } from '@/engine/events'

/** Set up all Governance listeners. Returns a cleanup function. */
export function registerGovernanceListeners(): Unsubscribe {
  const bus = getEventBus()
  const unsubs: Unsubscribe[] = []

  // When a member's standing changes, their voting rights may change
  unsubs.push(
    bus.on('identity.member.standing_changed', async (event) => {
      const payload = event.payload as StandingChangedPayload
      console.info(
        `[Governance] Standing changed for member ${payload.memberId}: ${payload.previousStanding} → ${payload.newStanding}`,
      )
      // Voting rights are enforced at vote time via canPerformAction
      // This listener is for UI updates (show/hide vote buttons)
    }),
  )

  // When a budget is exceeded, alert the vigilance committee
  unsubs.push(
    bus.on('treasury.budget.exceeded', async (event) => {
      const payload = event.payload as BudgetExceededPayload
      console.info(
        `[Governance] Budget exceeded: ${payload.budgetId} — excess $${payload.excessAmount}`,
      )
      // TODO: Create notification for vigilance committee
    }),
  )

  return () => unsubs.forEach((fn) => fn())
}
