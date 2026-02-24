/**
 * Identity Primitive — Event emitters
 *
 * Call these functions when identity-related actions happen.
 * Other primitives subscribe to these events.
 */

import { getEventBus } from '@/engine/events'
import type {
  MemberJoinedPayload,
  MemberRoleChangedPayload,
  StandingChangedPayload,
  MemberDeactivatedPayload,
} from '@/engine/events'

export function emitMemberJoined(
  communityId: string,
  actorId: string | null,
  payload: MemberJoinedPayload,
) {
  return getEventBus().emit('identity.member.joined', communityId, actorId, payload)
}

export function emitMemberRoleChanged(
  communityId: string,
  actorId: string | null,
  payload: MemberRoleChangedPayload,
) {
  return getEventBus().emit('identity.member.role_changed', communityId, actorId, payload)
}

export function emitStandingChanged(
  communityId: string,
  actorId: string | null,
  payload: StandingChangedPayload,
) {
  return getEventBus().emit('identity.member.standing_changed', communityId, actorId, payload)
}

export function emitMemberDeactivated(
  communityId: string,
  actorId: string | null,
  payload: MemberDeactivatedPayload,
) {
  return getEventBus().emit('identity.member.deactivated', communityId, actorId, payload)
}
