/**
 * Governance Service — barrel re-export
 *
 * Split into focused modules for maintainability:
 *   - proposal.service.ts  — CRUD + lifecycle + execution
 *   - vote.service.ts      — Voting + summaries + delegated votes
 *   - endorsement.service.ts — Endorsement system
 *   - delegation.service.ts — Liquid delegation
 *   - minutes.service.ts   — Actas + signatures
 *
 * All existing imports from '@/core/governance/services/governance.service'
 * continue to work without changes.
 */

export {
  getProposals,
  getProposal,
  createProposal,
  startDiscussion,
  openVotingFromDiscussion,
  declareOutcome,
  appealProposal,
  updateProposalStatus,
  closeProposal,
  processExpiredProposals,
  processAutoExecutions,
  executeProposal,
} from './proposal.service'

export {
  getVotes,
  castVote,
  castVoteWithDelegations,
  getMemberVoteWeight,
  computeVoteSummary,
  getVoteSummary,
} from './vote.service'

export {
  getEndorsements,
  addEndorsement,
  removeEndorsement,
} from './endorsement.service'

export {
  getDelegations,
  createDelegation,
  revokeDelegation,
} from './delegation.service'

export {
  generateMinutes,
  getMinutes,
  approveMinutes,
  signMinutes,
} from './minutes.service'
