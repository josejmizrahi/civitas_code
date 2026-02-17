import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockRpc } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })
  return { mockFrom, mockRpc }
})

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}))

function createBuilder(data: any = [], error: any = null) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
  }
  const promise = Promise.resolve({ data, error })
  builder.then = promise.then.bind(promise)
  builder.catch = promise.catch.bind(promise)
  return builder
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue(createBuilder())
})

describe('getProposals', () => {
  it('queries proposals table', async () => {
    const { getProposals } = await import('../governance.service')
    await getProposals('comm-1')
    expect(mockFrom).toHaveBeenCalledWith('proposals')
  })

  it('applies status filter when provided', async () => {
    const builder = createBuilder()
    mockFrom.mockReturnValue(builder)
    const { getProposals } = await import('../governance.service')
    await getProposals('comm-1', 'active')
    expect(builder.eq).toHaveBeenCalledWith('status', 'active')
  })
})

describe('castVote', () => {
  it('throws when proposal is not active', async () => {
    const inactiveProposal = {
      id: 'p1',
      status: 'draft',
      voting_end: null,
    }
    mockFrom.mockReturnValue(createBuilder(inactiveProposal))

    const { castVote } = await import('../governance.service')
    await expect(
      castVote({ proposal_id: 'p1', member_id: 'm1', value: 'yes' })
    ).rejects.toThrow('no está activa')
  })
})

describe('executeProposal', () => {
  it('throws when proposal is not approved', async () => {
    const draftProposal = {
      id: 'p1',
      status: 'draft',
      financial_instruction: { type: 'disbursement', amount: 1000 },
      execution_status: 'pending',
    }
    mockFrom.mockReturnValue(createBuilder(draftProposal))

    const { executeProposal } = await import('../governance.service')
    await expect(
      executeProposal('p1', 'comm-1', 'user-1')
    ).rejects.toThrow('Solo se pueden ejecutar propuestas aprobadas')
  })

  it('throws when proposal has no financial instruction', async () => {
    const approvedNoFinancial = {
      id: 'p1',
      status: 'approved',
      financial_instruction: null,
      execution_status: null,
    }
    mockFrom.mockReturnValue(createBuilder(approvedNoFinancial))

    const { executeProposal } = await import('../governance.service')
    await expect(
      executeProposal('p1', 'comm-1', 'user-1')
    ).rejects.toThrow('no tiene instrucción financiera')
  })

  it('throws when proposal already executed', async () => {
    const alreadyExecuted = {
      id: 'p1',
      status: 'approved',
      financial_instruction: { type: 'disbursement', amount: 500 },
      execution_status: 'executed',
    }
    mockFrom.mockReturnValue(createBuilder(alreadyExecuted))

    const { executeProposal } = await import('../governance.service')
    await expect(
      executeProposal('p1', 'comm-1', 'user-1')
    ).rejects.toThrow('ya fue ejecutada')
  })
})

describe('getVoteSummary', () => {
  it('computes correct vote summary', async () => {
    // Mock getVotes: returns votes via proposals -> votes table
    const votesBuilder = createBuilder([
      { value: 'yes', weight: 2 },
      { value: 'yes', weight: 1 },
      { value: 'no', weight: 1 },
    ])
    const membersBuilder = createBuilder([
      { voting_weight: 2 },
      { voting_weight: 1 },
      { voting_weight: 1 },
      { voting_weight: 1 },
    ])

    let callCount = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'votes') return votesBuilder
      if (table === 'members') return membersBuilder
      return createBuilder()
    })

    const { getVoteSummary } = await import('../governance.service')
    const summary = await getVoteSummary('p1', 'comm-1', 0.5, 0.5)

    expect(summary.yes).toBe(3) // 2 + 1
    expect(summary.no).toBe(1)
    expect(summary.abstain).toBe(0)
    expect(summary.total).toBe(4)
    expect(summary.participation_pct).toBe(4 / 5) // 4 voted of 5 total weight
  })
})

describe('getDelegations', () => {
  it('queries delegations table for community', async () => {
    const { getDelegations } = await import('../governance.service')
    await getDelegations('comm-1')
    expect(mockFrom).toHaveBeenCalledWith('delegations')
  })
})

describe('generateMinutes', () => {
  it('creates minutes with correct content', async () => {
    const { generateMinutes } = await import('../governance.service')
    const proposal = {
      id: 'p1',
      title: 'Test Proposal',
      type: 'general',
      description: 'Test Description',
      quorum_required: 0.5,
      majority_required: 0.5,
      result: null,
    } as any

    const voteSummary = {
      yes: 3,
      no: 1,
      abstain: 0,
      total: 4,
      quorum_met: true,
      majority_met: true,
      participation_pct: 0.8,
    }

    await generateMinutes('comm-1', 'p1', proposal, voteSummary)
    expect(mockFrom).toHaveBeenCalledWith('minutes')
  })
})
