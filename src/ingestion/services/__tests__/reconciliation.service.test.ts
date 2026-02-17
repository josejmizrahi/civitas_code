import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  return { mockFrom }
})

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom },
}))

import { markDuplicates } from '../reconciliation.service'
import type { NormalizedTransaction } from '../../types'

const makeTx = (ref: string | null, date: string, amount: number): NormalizedTransaction => ({
  type: 'income',
  amount,
  description: 'Test',
  date,
  external_ref: ref,
  category_hint: null,
  _errors: [],
  _isDuplicate: false,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('markDuplicates', () => {
  it('marks exact duplicates based on ref+date+amount', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({
            data: [{ external_ref: 'REF001', date: '2025-01-15', amount: 500 }],
            error: null,
          }),
        }),
      }),
    })

    const transactions = [
      makeTx('REF001', '2025-01-15', 500),
      makeTx('REF002', '2025-01-15', 500),
    ]

    const result = await markDuplicates('comm-1', transactions)
    expect(result[0]._isDuplicate).toBe(true)
    expect(result[1]._isDuplicate).toBe(false)
  })

  it('does not mark transactions without external_ref', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })

    const transactions = [makeTx(null, '2025-01-15', 500)]
    const result = await markDuplicates('comm-1', transactions)
    expect(result[0]._isDuplicate).toBe(false)
  })

  it('handles empty transaction list', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })

    const result = await markDuplicates('comm-1', [])
    expect(result).toEqual([])
  })
})
