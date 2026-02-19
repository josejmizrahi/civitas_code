import { vi } from 'vitest'

type MockData = unknown
type MockError = { message: string } | null

/**
 * Chainable mock for Supabase client used in tests.
 * Usage:
 *   createSupabaseMock()
 *     .from('members').select('*').eq('id', 'x').single()  -> { data: null, error: null }
 *   createSupabaseMock({ data: mockMember })
 *     .from('members').select('*').eq('id', 'x').single()  -> { data: mockMember, error: null }
 */
function chain() {
  let data: MockData = null
  let error: MockError = null

  const from = vi.fn((_table: string) => ({
    select: vi.fn((_columns = '*') => ({
      eq: vi.fn((_column: string, _value: unknown) => ({
        single: vi.fn(() => Promise.resolve({ data, error })),
        maybeSingle: vi.fn(() => Promise.resolve({ data, error })),
        order: vi.fn((_column: string, _opts?: { ascending?: boolean }) => ({
          limit: vi.fn((_n: number) => Promise.resolve({ data: Array.isArray(data) ? data : [], error })),
          then: (resolve: (r: { data: unknown[]; error: MockError }) => void) =>
            Promise.resolve({ data: Array.isArray(data) ? data : [], error }).then(resolve),
        })),
        then: (resolve: (r: { data: unknown[]; error: MockError }) => void) =>
          Promise.resolve({ data: Array.isArray(data) ? data : [], error }).then(resolve),
      })),
      order: vi.fn((_column: string, _opts?: { ascending?: boolean }) => ({
        limit: vi.fn((_n: number) => Promise.resolve({ data: Array.isArray(data) ? data : [], error })),
        then: (resolve: (r: { data: unknown[]; error: MockError }) => void) =>
          Promise.resolve({ data: Array.isArray(data) ? data : [], error }).then(resolve),
      })),
      single: vi.fn(() => Promise.resolve({ data, error })),
      maybeSingle: vi.fn(() => Promise.resolve({ data, error })),
    })),
    insert: vi.fn((_payload: unknown) => ({
      select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data, error })) })),
    })),
    update: vi.fn((_payload: unknown) => ({
      eq: vi.fn((_column: string, _value: unknown) => ({
        select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data, error })) })),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
    in: vi.fn((_column: string, _values: unknown[]) => ({
      order: vi.fn(() => ({ then: (resolve: (r: { data: unknown[]; error: MockError }) => void) => Promise.resolve({ data: [], error }).then(resolve) })),
    })),
  }))

  return {
    from,
    setData(d: MockData) {
      data = d
      return this
    },
    setError(e: MockError) {
      error = e
      return this
    },
  }
}

export function createSupabaseMock(initial?: { data?: MockData; error?: MockError }) {
  const c = chain()
  if (initial?.data != null) c.setData(initial.data)
  if (initial?.error != null) c.setError(initial.error)
  return c
}

/** Helper to build a mock supabase client that returns the given data from .from().select().eq().single() */
export function mockSupabaseSingle<T>(data: T) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data, error: null })),
        })),
      })),
    })),
  }
}
