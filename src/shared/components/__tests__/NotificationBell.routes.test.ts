import { describe, expect, it } from 'vitest'
import { getNotificationRoute } from '../NotificationBell'
import type { Notification } from '@/shared/services/notification.service'

function buildNotification(
  type: string,
  metadata: Record<string, unknown> = {},
): Notification {
  return {
    id: 'n-1',
    community_id: 'c-1',
    member_id: 'm-1',
    type,
    title: 'x',
    body: null,
    metadata,
    read: false,
    created_at: new Date().toISOString(),
  }
}

describe('NotificationBell route resolution', () => {
  it('resuelve proposal_id en snake_case (segment bajo /c/:slug/)', () => {
    const route = getNotificationRoute(
      buildNotification('proposal_opened', { proposal_id: 'p-1' }),
    )
    expect(route).toBe('governance/p-1')
  })

  it('resuelve proposalId en camelCase', () => {
    const route = getNotificationRoute(
      buildNotification('proposal_opened', { proposalId: 'p-2' }),
    )
    expect(route).toBe('governance/p-2')
  })

  it('resuelve assembly_id para convocatoria', () => {
    const route = getNotificationRoute(
      buildNotification('convocatoria', { assembly_id: 'a-1' }),
    )
    expect(route).toBe('governance/assemblies/a-1')
  })

  it('envia notificaciones financieras a tesoreria', () => {
    expect(getNotificationRoute(buildNotification('monthly_statement_ready'))).toBe('treasury')
    expect(getNotificationRoute(buildNotification('discretionary_request'))).toBe('treasury')
    expect(getNotificationRoute(buildNotification('payment_reminder'))).toBe('treasury')
  })
})
