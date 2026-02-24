/**
 * Governance Primitive — Event emitters
 */

import { getEventBus } from '@/engine/events'
import type {
  ProposalApprovedPayload,
  ProposalExecutedPayload,
  ElectionCompletedPayload,
  RuleChangedPayload,
} from '@/engine/events'

export function emitProposalApproved(
  communityId: string,
  actorId: string | null,
  payload: ProposalApprovedPayload,
) {
  return getEventBus().emit('governance.proposal.approved', communityId, actorId, payload)
}

export function emitProposalExecuted(
  communityId: string,
  actorId: string | null,
  payload: ProposalExecutedPayload,
) {
  return getEventBus().emit('governance.proposal.executed', communityId, actorId, payload)
}

export function emitElectionCompleted(
  communityId: string,
  actorId: string | null,
  payload: ElectionCompletedPayload,
) {
  return getEventBus().emit('governance.election.completed', communityId, actorId, payload)
}

export function emitRuleChanged(
  communityId: string,
  actorId: string | null,
  payload: RuleChangedPayload,
) {
  return getEventBus().emit('governance.rule.changed', communityId, actorId, payload)
}
