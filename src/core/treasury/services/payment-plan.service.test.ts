import { describe, it, expect } from 'vitest'
import { generateInstallmentDates } from './payment-plan.service'

describe('generateInstallmentDates', () => {
  it('returns correct count of installments', () => {
    const result = generateInstallmentDates('2025-01-15', 6, 100, 'monthly', 600)
    expect(result).toHaveLength(6)
  })

  it('weekly: advances by 7 days per installment', () => {
    const result = generateInstallmentDates('2025-01-15', 3, 100, 'weekly', 300)
    expect(result[0].dueDate).toBe('2025-01-15')
    expect(result[1].dueDate).toBe('2025-01-22')
    expect(result[2].dueDate).toBe('2025-01-29')
  })

  it('biweekly: advances by 14 days per installment', () => {
    const result = generateInstallmentDates('2025-01-15', 2, 50, 'biweekly', 100)
    expect(result[0].dueDate).toBe('2025-01-15')
    expect(result[1].dueDate).toBe('2025-01-29')
  })

  it('monthly: advances by one month per installment', () => {
    const result = generateInstallmentDates('2025-01-15', 3, 100, 'monthly', 300)
    expect(result[0].dueDate).toBe('2025-01-15')
    expect(result[1].dueDate).toBe('2025-02-15')
    expect(result[2].dueDate).toBe('2025-03-15')
  })

  it('last installment amount rounds to total debt (fixes rounding)', () => {
    const result = generateInstallmentDates('2025-01-01', 3, 33.33, 'monthly', 100)
    expect(result[0].amount).toBe(33.33)
    expect(result[1].amount).toBe(33.33)
    expect(result[2].amount).toBeCloseTo(33.34, 2)
    const total = result.reduce((s, r) => s + r.amount, 0)
    expect(total).toBeCloseTo(100, 2)
  })

  it('unknown frequency defaults to monthly', () => {
    const result = generateInstallmentDates('2025-06-10', 2, 50, 'quarterly' as any, 100)
    expect(result[0].dueDate).toBe('2025-06-10')
    expect(result[1].dueDate).toBe('2025-07-10')
  })
})
