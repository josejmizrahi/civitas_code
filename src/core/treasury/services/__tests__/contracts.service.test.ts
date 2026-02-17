import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFrom, mockRpc } = vi.hoisted(() => {
  const mockFrom = vi.fn()
  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null })
  return { mockFrom, mockRpc }
})

vi.mock('@/shared/lib/supabase', () => ({
  supabase: { from: mockFrom, rpc: mockRpc },
}))

import { generateInstallments } from '../contracts.service'
import type { Contract } from '../../types'

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom.mockReturnValue({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  })
})

const baseContract: Contract = {
  id: 'contract-1',
  community_id: 'comm-1',
  name: 'Test Contract',
  description: null,
  type: 'servicio',
  entity_id: null,
  member_id: null,
  total_amount: 12000,
  currency: 'MXN',
  payment_frequency: 'monthly',
  number_of_installments: 12,
  start_date: '2025-01-15',
  end_date: null,
  status: 'active',
  compliance_score: 1.0,
  terms: {},
  document_ids: [],
  approved_by_proposal_id: null,
  created_by: null,
  created_at: '2025-01-01',
  updated_at: '2025-01-01',
}

describe('generateInstallments', () => {
  it('inserts correct number of records', async () => {
    await generateInstallments(baseContract, 'comm-1')
    const fromResult = mockFrom.mock.results[0].value
    const records = fromResult.insert.mock.calls[0][0]
    expect(records).toHaveLength(12)
  })

  it('distributes amount evenly', async () => {
    await generateInstallments(baseContract, 'comm-1')
    const fromResult = mockFrom.mock.results[0].value
    const records = fromResult.insert.mock.calls[0][0]
    const total = records.reduce((s: number, r: any) => s + r.amount, 0)
    expect(total).toBeCloseTo(12000, 2)
  })

  it('numbers installments starting from 1', async () => {
    await generateInstallments(baseContract, 'comm-1')
    const fromResult = mockFrom.mock.results[0].value
    const records = fromResult.insert.mock.calls[0][0]
    expect(records[0].installment_number).toBe(1)
    expect(records[11].installment_number).toBe(12)
  })

  it('sets correct monthly due dates', async () => {
    await generateInstallments(baseContract, 'comm-1')
    const fromResult = mockFrom.mock.results[0].value
    const records = fromResult.insert.mock.calls[0][0]
    expect(records[0].due_date).toBe('2025-01-15')
    expect(records[1].due_date).toBe('2025-02-15')
    expect(records[11].due_date).toBe('2025-12-15')
  })

  it('sets all installments as pending', async () => {
    await generateInstallments(baseContract, 'comm-1')
    const fromResult = mockFrom.mock.results[0].value
    const records = fromResult.insert.mock.calls[0][0]
    for (const record of records) {
      expect(record.status).toBe('pending')
    }
  })

  it('handles single installment', async () => {
    const oneTime = { ...baseContract, number_of_installments: 1, total_amount: 5000 }
    await generateInstallments(oneTime, 'comm-1')
    const fromResult = mockFrom.mock.results[0].value
    const records = fromResult.insert.mock.calls[0][0]
    expect(records).toHaveLength(1)
    expect(records[0].amount).toBe(5000)
  })

  it('handles quarterly frequency', async () => {
    const quarterly = { ...baseContract, payment_frequency: 'quarterly', number_of_installments: 4, total_amount: 40000 }
    await generateInstallments(quarterly, 'comm-1')
    const fromResult = mockFrom.mock.results[0].value
    const records = fromResult.insert.mock.calls[0][0]
    expect(records).toHaveLength(4)
    expect(records[0].due_date).toBe('2025-01-15')
    expect(records[1].due_date).toBe('2025-04-15')
    expect(records[2].due_date).toBe('2025-07-15')
    expect(records[3].due_date).toBe('2025-10-15')
  })
})
