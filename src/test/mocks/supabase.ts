import { vi } from 'vitest'

function createQueryBuilder(returnData: any = [], returnError: any = null) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(returnData) ? returnData[0] : returnData, error: returnError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(returnData) ? returnData[0] : returnData, error: returnError }),
    then: undefined as any,
  }
  // Make it thenable (default resolution for queries without .single())
  const promise = Promise.resolve({ data: returnData, error: returnError })
  builder.then = promise.then.bind(promise)
  builder.catch = promise.catch.bind(promise)
  return builder
}

export function createMockSupabase(overrides?: {
  fromData?: Record<string, { data?: any; error?: any }>
  rpcData?: Record<string, { data?: any; error?: any }>
}) {
  const mock = {
    from: vi.fn((table: string) => {
      const tableConfig = overrides?.fromData?.[table]
      return createQueryBuilder(tableConfig?.data ?? [], tableConfig?.error ?? null)
    }),
    rpc: vi.fn((fn: string, _args?: any) => {
      const rpcConfig = overrides?.rpcData?.[fn]
      return Promise.resolve({ data: rpcConfig?.data ?? null, error: rpcConfig?.error ?? null })
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  }
  return mock
}
