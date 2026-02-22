import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockRpc } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  return { mockFrom, mockRpc }
})

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}))
vi.mock('@/shared/services/rules.service', () => ({
  assertCanPerformAction: vi.fn(async () => undefined),
  getCommunityRules: vi.fn((_config, rules) => ({
    governance: {
      default_quorum: 0.5,
      default_majority: 0.5,
      delegation_enabled: true,
      proposal_rights: ['admin', 'tesorero', 'miembro', 'comite_vigilancia'],
      cool_down_hours: 48,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
      mandatory_discussion_enabled: false,
      default_discussion_hours: 48,
      grace_period_hours: 0,
      quorum_by_type: { ordinary: 0.5, extraordinary: 0.75, budget: 0.5, election: 0.5, amendment: 0.75 },
      majority_by_type: { ordinary: 0.5, extraordinary: 0.66, budget: 0.5, election: 0.5, amendment: 0.66 },
      min_endorsements: 0,
      endorsement_bypass_roles: ['admin', 'tesorero'],
      quorum_first_call: 0.75,
      quorum_second_call: 0.5001,
      quorum_third_call: 0,
      minimum_notice_days: 7,
      quarterly_assembly_required: true,
      extraordinary_quorum: 0.75,
    },
    treasury: {
      mode: 'import',
      locale: 'es-MX',
      currency: 'MXN',
      admin_spending_limit: 50000,
      require_vote_above: 50000,
      clabe: null,
      bank_name: null,
      beneficiary_name: null,
      payment_reference_prefix: null,
      auto_reconciliation: false,
      collection_reminder_days: 5,
      reserva_fund_percentage: 0,
      monthly_statement_auto: true,
      ...((rules as any)?.treasury ?? {}),
    },
    identity: {
      payment_to_vote_enabled: false,
      grace_period_months: 2,
      auto_restore_on_payment: true,
      delinquent_restrictions: ['vote', 'propose'],
      moroso_threshold_ordinary: 2,
      moroso_threshold_extraordinary: 1,
      moroso_notice_days: 7,
      moroso_restrictions: ['vote', 'be_elected', 'quorum_excluded'],
      admin_max_consecutive_terms: 2,
      admin_term_months: 12,
    },
    compliance: {
      jurisdiction: 'mx',
      privacy_framework: 'lfpdppp',
      property_framework: 'lpci_cdmx',
    },
  })),
}))
vi.mock('@/shared/services/notification.service', () => ({
  notifyCommunity: vi.fn(async () => 0),
  notifyMember: vi.fn(async () => undefined),
}))
vi.mock('@/shared/services/email.service', () => ({
  sendEmailToMembers: vi.fn(async () => undefined),
}))
vi.mock('@/shared/services/push-notification.service', () => ({
  sendPushToMembers: vi.fn(async () => undefined),
}))

import { getCollectionConfig, generatePaymentReference } from '../treasury.service'

function createQueryBuilder(data: any = [], error: any = null) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
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
  mockFrom.mockReturnValue(createQueryBuilder())
})

describe('getCollectionConfig', () => {
  it('returns null fields when rules is null', () => {
    const config = getCollectionConfig(null)
    expect(config.clabe).toBeNull()
    expect(config.bank_name).toBeNull()
    expect(config.beneficiary_name).toBeNull()
    expect(config.payment_reference_prefix).toBeNull()
  })

  it('returns null fields when treasury rules missing', () => {
    const config = getCollectionConfig({ governance: {} })
    expect(config.clabe).toBeNull()
  })

  it('extracts CLABE from rules', () => {
    const rules = {
      treasury: {
        clabe: '012345678901234567',
        bank_name: 'STP',
        beneficiary_name: 'Mi Comunidad',
        payment_reference_prefix: 'MC-',
      },
    }
    const config = getCollectionConfig(rules)
    expect(config.clabe).toBe('012345678901234567')
    expect(config.bank_name).toBe('STP')
    expect(config.beneficiary_name).toBe('Mi Comunidad')
    expect(config.payment_reference_prefix).toBe('MC-')
  })
})

describe('generatePaymentReference', () => {
  it('generates reference with default prefix when null', () => {
    const ref = generatePaymentReference(null, '550e8400-e29b-41d4-a716-446655440000')
    expect(ref).toMatch(/^CIV-[A-F0-9]{8}$/)
  })

  it('generates reference with custom prefix', () => {
    const ref = generatePaymentReference('RLP', '550e8400-e29b-41d4-a716-446655440000')
    expect(ref).toMatch(/^RLP-[A-F0-9]{8}$/)
  })

  it('produces consistent output for same input', () => {
    const ref1 = generatePaymentReference('X', 'abc12345-1234-1234-1234-123456789abc')
    const ref2 = generatePaymentReference('X', 'abc12345-1234-1234-1234-123456789abc')
    expect(ref1).toBe(ref2)
  })

  it('produces different output for different IDs', () => {
    const ref1 = generatePaymentReference('X', '11111111-1111-1111-1111-111111111111')
    const ref2 = generatePaymentReference('X', '22222222-2222-2222-2222-222222222222')
    expect(ref1).not.toBe(ref2)
  })
})

describe('getTransactions', () => {
  it('calls supabase.from with transactions table', async () => {
    const { getTransactions } = await import('../treasury.service')
    await getTransactions('community-1')
    expect(mockFrom).toHaveBeenCalledWith('transactions')
  })
})

describe('getCategories', () => {
  it('calls supabase.from with categories table', async () => {
    const { getCategories } = await import('../treasury.service')
    await getCategories('community-1')
    expect(mockFrom).toHaveBeenCalledWith('categories')
  })
})

describe('getPaymentObligations', () => {
  it('calls supabase.from with payment_obligations table', async () => {
    const { getPaymentObligations } = await import('../treasury.service')
    await getPaymentObligations('community-1')
    expect(mockFrom).toHaveBeenCalledWith('payment_obligations')
  })
})

describe('getDiscretionaryApprovals', () => {
  it('calls supabase.from with discretionary_approvals table', async () => {
    const { getDiscretionaryApprovals } = await import('../treasury.service')
    await getDiscretionaryApprovals('community-1')
    expect(mockFrom).toHaveBeenCalledWith('discretionary_approvals')
  })
})

describe('respondDiscretionaryApproval', () => {
  it('approves request and links created transaction', async () => {
    const approval = {
      id: 'approval-1',
      community_id: 'community-1',
      requested_by: 'member-requester',
      amount: 1234,
      description: 'Pago discrecional prueba',
      category_id: 'cat-1',
      status: 'pending',
    }

    let membersCall = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'discretionary_approvals') {
        let mode: 'select' | 'update' = 'select'
        const builder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          update: vi.fn(() => { mode = 'update'; return builder }),
          single: vi.fn().mockImplementation(async () => {
            if (mode === 'update') {
              return {
                data: {
                  ...approval,
                  status: 'approved',
                  approved_by: 'vigil-1',
                  transaction_id: 'tx-1',
                },
                error: null,
              }
            }
            return { data: approval, error: null }
          }),
          then: Promise.resolve({ data: [approval], error: null }).then.bind(Promise.resolve({ data: [approval], error: null })),
          catch: Promise.resolve({ data: [approval], error: null }).catch.bind(Promise.resolve({ data: [approval], error: null })),
        }
        const promise = Promise.resolve({ data: [approval], error: null })
        builder.then = promise.then.bind(promise)
        builder.catch = promise.catch.bind(promise)
        return builder
      }

      if (table === 'members') {
        membersCall += 1
        if (membersCall === 1) {
          return createQueryBuilder([{ user_id: 'requester-user-1' }])
        }
        return createQueryBuilder([{ id: 'vigil-1', role: 'comite_vigilancia' }])
      }

      if (table === 'transactions') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'tx-1' }, error: null }),
          then: Promise.resolve({ data: [{ id: 'tx-1' }], error: null }).then.bind(Promise.resolve({ data: [{ id: 'tx-1' }], error: null })),
          catch: Promise.resolve({ data: [{ id: 'tx-1' }], error: null }).catch.bind(Promise.resolve({ data: [{ id: 'tx-1' }], error: null })),
        } as any
      }

      return createQueryBuilder()
    })

    const { respondDiscretionaryApproval } = await import('../treasury.service')
    const result = await respondDiscretionaryApproval('approval-1', 'vigil-1', 'approved')
    expect(result.status).toBe('approved')
    expect(result.transaction_id).toBe('tx-1')
    expect(mockFrom).toHaveBeenCalledWith('transactions')
    expect(mockFrom).toHaveBeenCalledWith('discretionary_approvals')
  })
})

describe('flujo discrecional end-to-end (servicio)', () => {
  it('crea solicitud, aprueba y genera transacción ligada', async () => {
    const approvalState: any = {
      id: 'approval-e2e-1',
      community_id: 'community-1',
      requested_by: 'member-requester',
      amount: 2500,
      description: 'Compra urgente de material',
      category_id: 'cat-1',
      status: 'pending',
      approved_by: null,
      response_note: null,
      transaction_id: null,
    }

    let membersCall = 0
    mockFrom.mockImplementation((table: string) => {
      if (table === 'discretionary_approvals') {
        let mode: 'select' | 'insert' | 'update' = 'select'
        const builder: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          insert: vi.fn(() => { mode = 'insert'; return builder }),
          update: vi.fn((updates: Record<string, unknown>) => {
            mode = 'update'
            Object.assign(approvalState, updates)
            return builder
          }),
          single: vi.fn().mockImplementation(async () => {
            if (mode === 'insert') return { data: { ...approvalState }, error: null }
            if (mode === 'update') return { data: { ...approvalState }, error: null }
            return { data: { ...approvalState }, error: null }
          }),
        }
        const promise = Promise.resolve({ data: [{ ...approvalState }], error: null })
        builder.then = promise.then.bind(promise)
        builder.catch = promise.catch.bind(promise)
        return builder
      }

      if (table === 'members') {
        membersCall += 1
        if (membersCall === 1) return createQueryBuilder([{ id: 'comite-1', role: 'comite_vigilancia' }]) // recipients create
        if (membersCall === 2) return createQueryBuilder([{ user_id: 'requester-user-1' }]) // requester user for tx
        return createQueryBuilder([{ id: 'comite-1', role: 'comite_vigilancia' }]) // recipients decision
      }

      if (table === 'transactions') {
        return {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: 'tx-e2e-1' }, error: null }),
          then: Promise.resolve({ data: [{ id: 'tx-e2e-1' }], error: null }).then.bind(Promise.resolve({ data: [{ id: 'tx-e2e-1' }], error: null })),
          catch: Promise.resolve({ data: [{ id: 'tx-e2e-1' }], error: null }).catch.bind(Promise.resolve({ data: [{ id: 'tx-e2e-1' }], error: null })),
        } as any
      }

      return createQueryBuilder()
    })

    const { createDiscretionaryApproval, respondDiscretionaryApproval } = await import('../treasury.service')
    const created = await createDiscretionaryApproval('community-1', {
      requested_by_member_id: 'member-requester',
      amount: 2500,
      description: 'Compra urgente de material',
      category_id: 'cat-1',
      beneficiary_entity_id: null,
    })
    expect(created.status).toBe('pending')

    const resolved = await respondDiscretionaryApproval('approval-e2e-1', 'comite-1', 'approved', 'ok')
    expect(resolved.status).toBe('approved')
    expect(resolved.transaction_id).toBe('tx-e2e-1')
  })
})

describe('createTransaction - niveles autorización', () => {
  it('bloquea egreso cuando rebasa presupuesto disponible', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'communities') {
        return createQueryBuilder({ id: 'community-1', config: {}, rules: {} })
      }
      if (table === 'members') {
        return createQueryBuilder({ id: 'member-1' })
      }
      if (table === 'budgets') {
        return createQueryBuilder({ id: 'budget-1', amount: 1000 })
      }
      if (table === 'transactions') {
        return createQueryBuilder([{ amount: 900 }])
      }
      return createQueryBuilder()
    })

    const { createTransaction } = await import('../treasury.service')
    await expect(
      createTransaction('community-1', {
        type: 'expense',
        amount: 200,
        category_id: 'cat-1',
        description: 'Compra de pruebas',
        date: '2026-02-10',
        created_by: 'user-1',
      }),
    ).rejects.toThrow(/Presupuesto insuficiente/)
  })

  it('permite emergencia y crea propuesta de ratificación 72h', async () => {
    let txInserted = false
    let proposalInserted = false

    mockFrom.mockImplementation((table: string) => {
      if (table === 'communities') {
        return createQueryBuilder({
          id: 'community-1',
          config: {},
          rules: { treasury: { admin_spending_limit: 50000, require_vote_above: 50000 } },
        })
      }
      if (table === 'members') {
        return createQueryBuilder({ id: 'member-1' })
      }
      if (table === 'transactions') {
        const builder: any = createQueryBuilder({ id: 'tx-1' })
        builder.insert = vi.fn(() => { txInserted = true; return builder })
        return builder
      }
      if (table === 'proposals') {
        const builder: any = createQueryBuilder([])
        builder.insert = vi.fn(() => { proposalInserted = true; return builder })
        return builder
      }
      return createQueryBuilder()
    })

    const { createTransaction } = await import('../treasury.service')
    const tx = await createTransaction('community-1', {
      type: 'expense',
      amount: 60000,
      category_id: 'cat-1',
      description: 'Reparación urgente',
      date: '2026-02-10',
      created_by: 'user-1',
      emergency: true,
    })

    expect(tx.id).toBe('tx-1')
    expect(txInserted).toBe(true)
    expect(proposalInserted).toBe(true)
  })
})
