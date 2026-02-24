/**
 * Governance Primitive — Event listeners
 *
 * Governance listens to:
 * - identity.member.standing_changed → invalidate voting caches
 * - treasury.budget.exceeded → invalidate governance/vigilance caches
 */

import { getEventBus, type Unsubscribe } from '@/engine/events'
import type { StandingChangedPayload, BudgetExceededPayload } from '@/engine/events'
import type { QueryClient } from '@tanstack/react-query'

/** Set up all Governance listeners. Returns a cleanup function. */
export function registerGovernanceListeners(queryClient?: QueryClient): Unsubscribe {
  const bus = getEventBus()
  const unsubs: Unsubscribe[] = []

  // When a member's standing changes, their voting rights may change
  unsubs.push(
    bus.on('identity.member.standing_changed', async (event) => {
      const payload = event.payload as StandingChangedPayload
      console.info(
        `[Governance] Standing changed for member ${payload.memberId}: ${payload.previousStanding} → ${payload.newStanding}`,
      )
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ['proposals'] })
        void queryClient.invalidateQueries({ queryKey: ['votes'] })
      }
    }),
  )

  // When a budget is exceeded, refresh governance/vigilance data
  unsubs.push(
    bus.on('treasury.budget.exceeded', async (event) => {
      const payload = event.payload as BudgetExceededPayload
      console.info(
        `[Governance] Budget exceeded: ${payload.budgetId} — excess $${payload.excessAmount}`,
      )
      if (queryClient) {
        void queryClient.invalidateQueries({ queryKey: ['vigilance'] })
        void queryClient.invalidateQueries({ queryKey: ['budgets'] })
      }
    }),
  )

  return () => unsubs.forEach((fn) => fn())
}
