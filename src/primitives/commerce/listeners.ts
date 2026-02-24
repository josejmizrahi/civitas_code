/**
 * Commerce Primitive — Event listeners
 *
 * Commerce listens to:
 * - governance.rule.changed → update fintech config if treasury rules changed
 */

import { getEventBus, type Unsubscribe } from '@/engine/events'
import type { RuleChangedPayload } from '@/engine/events'

/** Set up all Commerce listeners. Returns a cleanup function. */
export function registerCommerceListeners(): Unsubscribe {
  const bus = getEventBus()
  const unsubs: Unsubscribe[] = []

  unsubs.push(
    bus.on('governance.rule.changed', async (event) => {
      const payload = event.payload as RuleChangedPayload
      if (payload.ruleKey.startsWith('treasury.')) {
        console.info(
          `[Commerce] Treasury rule changed: ${payload.ruleKey} — may need to update fintech config`,
        )
      }
    }),
  )

  return () => unsubs.forEach((fn) => fn())
}
