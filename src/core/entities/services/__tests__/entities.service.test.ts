import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  return { mockFrom }
})

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

function createBuilder(data: any = [], error: any = null) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
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

describe('getEntities', () => {
  it('queries entities table', async () => {
    const { getEntities } = await import('../entities.service')
    await getEntities('comm-1')
    expect(mockFrom).toHaveBeenCalledWith('entities')
  })
})

describe('createEntity', () => {
  it('inserts into entities table', async () => {
    const { createEntity } = await import('../entities.service')
    await createEntity('comm-1', {
      name: 'Test',
      type: 'proveedor',
      rfc: null,
      email: null,
      phone: null,
      address: null,
      clabe: null,
      bank_name: null,
      contact_person: null,
      status: 'active',
      notes: null,
      created_by: 'user-1',
    })
    expect(mockFrom).toHaveBeenCalledWith('entities')
  })
})

describe('getRatings', () => {
  it('queries ratings table', async () => {
    const { getRatings } = await import('../entities.service')
    await getRatings('comm-1', 'entity', 'entity-1')
    expect(mockFrom).toHaveBeenCalledWith('ratings')
  })
})

describe('createRating', () => {
  it('inserts rating', async () => {
    const { createRating } = await import('../entities.service')
    await createRating('comm-1', {
      target_type: 'entity',
      target_id: 'entity-1',
      rated_by: 'member-1',
      overall_score: 4,
      dimensions: { punctuality: 5 },
      comment: 'Good',
    })
    expect(mockFrom).toHaveBeenCalledWith('ratings')
  })
})
