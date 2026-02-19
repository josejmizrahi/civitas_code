import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VotingPanel } from '../VotingPanel'

vi.mock('../../hooks/useVoting', () => ({
  useCastVoteWithDelegations: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/shared/hooks/useRulesEngine', () => ({
  useRulesEngine: () => ({
    canVote: { allowed: true },
  }),
}))

vi.mock('@/shared/components/ui/toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

describe('VotingPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders vote buttons', () => {
    render(
      <VotingPanel
        proposalId="p1"
        memberId="m1"
        voteSummary={{ yes: 1, no: 0, abstain: 0, total: 1, quorum_met: true, majority_met: true, participation_pct: 0.5 }}
        existingVotes={[]}
      />
    )
    expect(screen.getByRole('button', { name: /a favor/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /en contra/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /abstención/i })).toBeInTheDocument()
  })

  it('shows vote summary when provided', () => {
    render(
      <VotingPanel
        proposalId="p1"
        memberId="m1"
        voteSummary={{ yes: 5, no: 2, abstain: 1, total: 8, quorum_met: true, majority_met: true, participation_pct: 0.8 }}
        existingVotes={[]}
      />
    )
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows already voted message when existingVotes contains member vote', () => {
    render(
      <VotingPanel
        proposalId="p1"
        memberId="m1"
        voteSummary={undefined}
        existingVotes={[{ id: 'v1', proposal_id: 'p1', member_id: 'm1', value: 'yes', weight: 1, cast_at: '', delegated_from: null, block_reason: null, is_override: false } as any]}
      />
    )
    expect(screen.getByText(/ya votaste/i)).toBeInTheDocument()
    expect(screen.getByText(/a favor/i)).toBeInTheDocument()
  })

  it('disables buttons when disabled prop is true', () => {
    render(
      <VotingPanel
        proposalId="p1"
        memberId="m1"
        voteSummary={undefined}
        existingVotes={[]}
        disabled
      />
    )
    expect(screen.getByRole('button', { name: /a favor/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /en contra/i })).toBeDisabled()
  })
})
