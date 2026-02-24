/**
 * Primitives Setup — Initialize the event bus and register all listeners
 *
 * Call this ONCE at app bootstrap (in App.tsx or a top-level provider).
 * Returns a cleanup function to unregister all listeners.
 */

import { getEventBus } from '@/engine/events'
import { supabase } from '@/shared/lib/supabase'
import type { DomainEvent } from '@/engine/events'

import { registerIdentityListeners } from './identity/listeners'
import { registerTreasuryListeners } from './treasury/listeners'
import { registerGovernanceListeners } from './governance/listeners'
import { registerCommerceListeners } from './commerce/listeners'

let _initialized = false
let _cleanup: (() => void) | null = null

/**
 * Initialize the primitive event system.
 * Safe to call multiple times — only runs once.
 */
export function initializePrimitives(): () => void {
  if (_initialized && _cleanup) return _cleanup

  const bus = getEventBus()

  // Persist events to Supabase for audit trail
  // Uses audit_log table which already exists (domain_events can be added later)
  bus.setPersistFn(async (event: DomainEvent) => {
    try {
      await supabase.from('audit_log').insert({
        community_id: event.communityId,
        user_id: event.actorId,
        action: event.type,
        entity_type: 'domain_event',
        details: JSON.parse(JSON.stringify(event.payload ?? {})),
      })
    } catch {
      // Silent fail — events still work in-memory without persistence
    }
  })

  // Register all primitive listeners
  const cleanups = [
    registerIdentityListeners(),
    registerTreasuryListeners(),
    registerGovernanceListeners(),
    registerCommerceListeners(),
  ]

  _initialized = true
  _cleanup = () => {
    cleanups.forEach((fn) => fn())
    bus.clear()
    _initialized = false
    _cleanup = null
  }

  console.info(`[Civitas] Primitive event system initialized (${bus.listenerCount} listeners)`)

  return _cleanup
}
