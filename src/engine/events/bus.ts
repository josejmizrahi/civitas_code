/**
 * EventBus — Pub/sub for inter-primitive communication
 *
 * This is deliberately simple. No Kafka, no Redis — just an in-memory
 * event bus that also persists events to Supabase for audit/replay.
 *
 * Usage:
 *   const bus = useEventBus()
 *   bus.emit('treasury.obligation.paid', communityId, actorId, payload)
 *   bus.on('treasury.obligation.paid', handler)
 */

import type { DomainEvent, EventHandler, EventMap, EventType, Unsubscribe } from './types'

type Listeners = Map<string, Set<EventHandler>>

let _instance: EventBus | null = null

export class EventBus {
  private listeners: Listeners = new Map()
  private persistFn: ((event: DomainEvent) => Promise<void>) | null = null

  /** Singleton — one bus per app */
  static getInstance(): EventBus {
    if (!_instance) {
      _instance = new EventBus()
    }
    return _instance
  }

  /** Register a persistence function (e.g. insert into domain_events table) */
  setPersistFn(fn: (event: DomainEvent) => Promise<void>): void {
    this.persistFn = fn
  }

  /** Subscribe to an event type. Returns unsubscribe function. */
  on<K extends EventType>(type: K, handler: EventHandler<EventMap[K]>): Unsubscribe {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    const handlers = this.listeners.get(type)!
    handlers.add(handler as EventHandler)

    return () => {
      handlers.delete(handler as EventHandler)
      if (handlers.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  /** Subscribe to all events matching a prefix, e.g. "treasury.*" */
  onPrefix(prefix: string, handler: EventHandler): Unsubscribe {
    const key = `__prefix:${prefix}`
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    const handlers = this.listeners.get(key)!
    handlers.add(handler)

    return () => {
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(key)
      }
    }
  }

  /** Emit an event. Notifies all matching listeners and persists. */
  async emit<K extends EventType>(
    type: K,
    communityId: string,
    actorId: string | null,
    payload: EventMap[K],
  ): Promise<void> {
    const event: DomainEvent<EventMap[K]> = {
      id: crypto.randomUUID(),
      type,
      communityId,
      timestamp: new Date().toISOString(),
      actorId,
      payload,
    }

    // Persist first (fire-and-forget, don't block listeners)
    if (this.persistFn) {
      this.persistFn(event as DomainEvent).catch((err) => {
        console.error(`[EventBus] Failed to persist event ${type}:`, err)
      })
    }

    // Notify exact-match listeners
    const exact = this.listeners.get(type)
    if (exact) {
      for (const handler of exact) {
        try {
          await handler(event as DomainEvent)
        } catch (err) {
          console.error(`[EventBus] Handler error for ${type}:`, err)
        }
      }
    }

    // Notify prefix listeners (e.g. "treasury.*" matches "treasury.obligation.paid")
    for (const [key, handlers] of this.listeners) {
      if (!key.startsWith('__prefix:')) continue
      const prefix = key.slice('__prefix:'.length)
      if (type.startsWith(prefix)) {
        for (const handler of handlers) {
          try {
            await handler(event as DomainEvent)
          } catch (err) {
            console.error(`[EventBus] Prefix handler error for ${prefix} → ${type}:`, err)
          }
        }
      }
    }
  }

  /** Remove all listeners (useful for testing) */
  clear(): void {
    this.listeners.clear()
  }

  /** Get count of registered listeners (useful for debugging) */
  get listenerCount(): number {
    let count = 0
    for (const handlers of this.listeners.values()) {
      count += handlers.size
    }
    return count
  }
}

/** Convenience: get the singleton bus */
export function getEventBus(): EventBus {
  return EventBus.getInstance()
}
