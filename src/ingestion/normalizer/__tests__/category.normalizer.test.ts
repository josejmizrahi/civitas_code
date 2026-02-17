import { describe, it, expect } from 'vitest'

// Test the normalizer pure logic directly
describe('category normalization logic', () => {
  function normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
  }

  it('normalizes accented characters', () => {
    expect(normalize('Mantención')).toBe('mantencion')
    expect(normalize('Energía')).toBe('energia')
    expect(normalize('Nómina')).toBe('nomina')
  })

  it('converts to lowercase', () => {
    expect(normalize('SERVICIOS')).toBe('servicios')
    expect(normalize('Agua Potable')).toBe('agua potable')
  })

  it('trims whitespace', () => {
    expect(normalize('  Limpieza  ')).toBe('limpieza')
  })

  it('handles empty string', () => {
    expect(normalize('')).toBe('')
  })
})
