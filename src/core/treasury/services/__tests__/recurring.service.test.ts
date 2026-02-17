import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockRpc } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn().mockResolvedValue({ data: 0, error: null })
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

describe('getRecurringSchedules', () => {
  it('queries recurring_schedules table', async () => {
    const { getRecurringSchedules } = await import('../recurring.service')
    await getRecurringSchedules('comm-1')
    expect(mockFrom).toHaveBeenCalledWith('recurring_schedules')
  })
})

describe('createRecurringSchedule', () => {
  it('inserts into recurring_schedules', async () => {
    const { createRecurringSchedule } = await import('../recurring.service')
    await createRecurringSchedule('comm-1', {
      name: 'Cuota Mensual',
      type: 'collection',
      frequency: 'monthly',
      amount: 500,
      target_type: 'all_members',
      start_date: '2025-02-01',
      next_run_date: '2025-02-01',
      created_by: 'user-1',
    })
    expect(mockFrom).toHaveBeenCalledWith('recurring_schedules')
  })
})

describe('deleteRecurringSchedule', () => {
  it('calls delete on recurring_schedules', async () => {
    const { deleteRecurringSchedule } = await import('../recurring.service')
    await deleteRecurringSchedule('schedule-1')
    expect(mockFrom).toHaveBeenCalledWith('recurring_schedules')
  })
})

describe('processRecurringSchedules', () => {
  it('calls RPC with correct parameters', async () => {
    const { processRecurringSchedules } = await import('../recurring.service')
    await processRecurringSchedules('comm-1')
    expect(mockRpc).toHaveBeenCalledWith('process_recurring_schedules', {
      p_community_id: 'comm-1',
    })
  })

  it('returns number of processed schedules', async () => {
    mockRpc.mockResolvedValue({ data: 3, error: null })
    const { processRecurringSchedules } = await import('../recurring.service')
    const result = await processRecurringSchedules('comm-1')
    expect(result).toBe(3)
  })
})

describe('generateSingleSchedule', () => {
  it('calls RPC for single schedule generation', async () => {
    const { generateSingleSchedule } = await import('../recurring.service')
    await generateSingleSchedule('schedule-1')
    expect(mockRpc).toHaveBeenCalledWith('generate_recurring_obligations', {
      p_schedule_id: 'schedule-1',
    })
  })
})
