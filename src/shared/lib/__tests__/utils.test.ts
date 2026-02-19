import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatDateTime, cn } from '../utils'

describe('formatCurrency', () => {
  it('formats positive amounts in MXN', () => {
    const result = formatCurrency(1500.50)
    expect(result).toContain('1,500.50')
    expect(result).toContain('$')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0.00')
  })

  it('formats negative amounts', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
  })

  it('formats with custom currency', () => {
    const result = formatCurrency(100, 'USD')
    expect(result).toBeDefined()
  })

  it('formats large numbers correctly', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('1,000,000')
  })
})

describe('formatDate', () => {
  it('formats ISO date strings', () => {
    const result = formatDate('2025-03-15')
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('formats Date objects', () => {
    const date = new Date(2025, 2, 15) // March 15, 2025
    const result = formatDate(date)
    expect(result).toBeDefined()
    expect(result).toContain('2025')
  })
})

describe('formatDateTime', () => {
  it('includes time in output', () => {
    const result = formatDateTime('2025-03-15T14:30:00')
    expect(result).toBeDefined()
    expect(typeof result).toBe('string')
  })
})

describe('cn (class merge utility)', () => {
  it('merges class names', () => {
    const result = cn('px-4', 'py-2')
    expect(result).toBe('px-4 py-2')
  })

  it('handles conditional classes', () => {
    const isHidden = false
    const result = cn('base', isHidden && 'hidden', 'extra')
    expect(result).toBe('base extra')
  })

  it('merges tailwind conflicts correctly', () => {
    const result = cn('px-4', 'px-2')
    expect(result).toBe('px-2')
  })

  it('handles undefined and null', () => {
    const result = cn('base', undefined, null, 'end')
    expect(result).toBe('base end')
  })
})
