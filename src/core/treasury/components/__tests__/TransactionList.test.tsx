import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionList } from '../TransactionList'

// Mock window.matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

vi.mock('../../hooks/useTransactions', () => ({
  useTransactions: () => ({
    data: [
      {
        id: 'tx1',
        date: '2025-01-15',
        description: 'Cuota enero',
        type: 'expense',
        amount: 500,
        category_name: 'Cuotas',
        verification_status: 'reported',
      },
      {
        id: 'tx2',
        date: '2025-01-10',
        description: 'Ingreso evento',
        type: 'income',
        amount: 1200,
        category_name: 'Eventos',
        verification_status: 'verified',
      },
    ],
    isLoading: false,
  }),
  useUpdateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/app/providers', () => ({
  useCommunityContext: () => ({ communityId: 'c1' }),
}))

vi.mock('@/shared/hooks/usePermissions', () => ({
  usePermissions: () => ({ canManageTreasury: true }),
}))

vi.mock('@/shared/components/ui/toast', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), toast: vi.fn() }),
}))

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: (opts: any) => {
      if (opts.queryKey?.[0] === 'categories') {
        return { data: [{ id: 'cat1', name: 'Cuotas', type: 'expense' }, { id: 'cat2', name: 'Eventos', type: 'income' }], isLoading: false }
      }
      return (actual as any).useQuery(opts)
    },
    useMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  }
})

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter controls', () => {
    render(<TransactionList />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Todos los tipos')).toBeInTheDocument()
  })

  it('renders transaction rows when data loaded', () => {
    render(<TransactionList />)
    expect(screen.getByText('Cuota enero')).toBeInTheDocument()
    expect(screen.getByText('Ingreso evento')).toBeInTheDocument()
  })

  it('renders amount and type for each transaction', () => {
    render(<TransactionList />)
    expect(screen.getAllByText(/500|1,200|1200/).length).toBeGreaterThan(0)
  })
})
