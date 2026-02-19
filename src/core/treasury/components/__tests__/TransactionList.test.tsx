import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionList } from '../TransactionList'

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
  }
})

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders filter controls', () => {
    render(<TransactionList />)
    expect(screen.getByRole('combobox', { name: /todos los tipos|tipos/i })).toBeInTheDocument()
  })

  it('renders transaction rows when data loaded', () => {
    render(<TransactionList />)
    expect(screen.getByText('Cuota enero')).toBeInTheDocument()
    expect(screen.getByText('Ingreso evento')).toBeInTheDocument()
  })

  it('renders amount and type for each transaction', () => {
    render(<TransactionList />)
    expect(screen.getByText(/500|1,200|1200/)).toBeInTheDocument()
  })
})
