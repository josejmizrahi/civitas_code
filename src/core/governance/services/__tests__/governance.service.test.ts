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
    in: vi.fn().mockReturnThis(),
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
      type: 'ordinary',
      financial_instruction: null,
      execution_status: null,
    }
    mockFrom.mockReturnValue(createBuilder(approvedNoFinancial))

    const { executeProposal } = await import('../governance.service')
    await expect(
      executeProposal('p1', 'comm-1', 'user-1')
    ).rejects.toThrow('no tiene instrucción ejecutable')
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

  it('executes election and records admin term', async () => {
    const approvedElection = {
      id: 'p-election',
      community_id: 'comm-1',
      status: 'approved',
      type: 'election',
      financial_instruction: null,
      execution_status: 'pending',
      title: 'Elección de Administrador',
      description: 'Cargo ID: admin\nVacantes: 1',
      assembly_id: null,
      voting_options: [{ id: 'member-member-1', label: 'Alice' }],
    }

    let proposalsUpdateCalled = false
    let roleUpdateCalled = false
    let termInsertCalled = false

    mockFrom.mockImplementation((table: string) => {
      if (table === 'proposals') {
        let mode: 'select' | 'update' = 'select'
        const builder = createBuilder(approvedElection)
        builder.update = vi.fn(() => { mode = 'update'; proposalsUpdateCalled = true; return builder })
        builder.single = vi.fn().mockImplementation(async () => {
          if (mode === 'update') return { data: { ...approvedElection, status: 'executed', execution_status: 'executed' }, error: null }
          return { data: approvedElection, error: null }
        })
        return builder
      }
      if (table === 'votes') {
        return createBuilder([{ value: 'member-member-1', weight: 3 }])
      }
      if (table === 'members') {
        let isUpdate = false
        const builder = createBuilder({ id: 'member-1', status: 'active', financial_standing: 'good_standing' })
        builder.update = vi.fn(() => { isUpdate = true; roleUpdateCalled = true; return builder })
        builder.single = vi.fn().mockImplementation(async () => {
          if (isUpdate) return { data: { id: 'member-1' }, error: null }
          return { data: { id: 'member-1', status: 'active', financial_standing: 'good_standing' }, error: null }
        })
        return builder
      }
      if (table === 'admin_terms') {
        let isInsert = false
        const builder = createBuilder({ term_number: 1 })
        builder.insert = vi.fn(() => { isInsert = true; termInsertCalled = true; return builder })
        builder.maybeSingle = vi.fn().mockResolvedValue({ data: { term_number: 1 }, error: null })
        builder.single = vi.fn().mockImplementation(async () => {
          if (isInsert) return { data: { id: 'term-1' }, error: null }
          return { data: { term_number: 1 }, error: null }
        })
        return builder
      }
      return createBuilder()
    })

    const { executeProposal } = await import('../governance.service')
    const result = await executeProposal('p-election', 'comm-1', 'user-1')
    expect(result.status).toBe('executed')
    expect(proposalsUpdateCalled).toBe(true)
    expect(roleUpdateCalled).toBe(true)
    expect(termInsertCalled).toBe(true)
  })
})

describe('getVoteSummary', () => {
  it('computes correct vote summary', async () => {
    const proposalBuilder = createBuilder({ id: 'p1', voting_model: 'simple' })
    const votesBuilder = createBuilder([
      { value: 'yes', weight: 2 },
      { value: 'yes', weight: 1 },
      { value: 'no', weight: 1 },
    ])
    const membersBuilder = createBuilder([
      { voting_weight: 2, financial_standing: 'good_standing' },
      { voting_weight: 1, financial_standing: 'good_standing' },
      { voting_weight: 1, financial_standing: 'good_standing' },
      { voting_weight: 1, financial_standing: 'good_standing' },
    ])

    mockFrom.mockImplementation((table: string) => {
      if (table === 'proposals') return proposalBuilder
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
