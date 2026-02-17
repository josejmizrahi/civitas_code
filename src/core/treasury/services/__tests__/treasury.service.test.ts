import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockRpc } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn()
  return { mockFrom, mockRpc }
})

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
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
