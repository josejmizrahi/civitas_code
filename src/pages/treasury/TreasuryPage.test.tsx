/**
 * Smoke and critical-path tests for TreasuryPage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TreasuryPage } from './TreasuryPage'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
function Wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

vi.mock('@/shared/hooks/usePermissions', () => ({
  usePermissions: () => ({ canManageTreasury: true, canImportData: true }),
}))
vi.mock('@/app/providers', () => ({
  useCommunityContext: () => ({
    communityId: 'c1',
    community: { name: 'Test Community', rules: { treasury: { mode: 'import' } } },
  }),
}))
vi.mock('@/core/treasury/hooks/usePaymentStatus', () => ({
  useRefreshOverdueObligations: () => ({ mutate: vi.fn() }),
  useCollectionStats: () => ({ data: null }),
}))
vi.mock('@/core/treasury/hooks/useRecurring', () => ({
  useProcessRecurringSchedules: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/core/treasury/hooks/useContracts', () => ({
  useRefreshOverdueInstallments: () => ({ mutate: vi.fn() }),
}))
vi.mock('@/core/treasury/hooks/useTransactions', () => ({
  useTransactions: () => ({ data: [], isLoading: false }),
  useCreateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTransaction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteTransaction: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))
vi.mock('@/shared/services/export.service', () => ({
  exportToPDF: vi.fn(),
  exportToExcel: vi.fn(),
}))

describe('TreasuryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders treasury title and main sections', () => {
    render(<TreasuryPage />, { wrapper: Wrapper })
    expect(screen.getByRole('heading', { name: /Tesorería/i })).toBeInTheDocument()
    expect(screen.getByText(/Resumen, cobro y movimientos/)).toBeInTheDocument()
  })

  it('shows Resumen section by default when user can manage treasury', () => {
    render(<TreasuryPage />, { wrapper: Wrapper })
    expect(screen.getByRole('button', { name: /Resumen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cobro/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Programación/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Datos e informes/i })).toBeInTheDocument()
  })

  it('shows export PDF and Excel buttons', () => {
    render(<TreasuryPage />, { wrapper: Wrapper })
    const pdfBtn = screen.getByRole('button', { name: /PDF/i })
    const excelBtn = screen.getByRole('button', { name: /Excel/i })
    expect(pdfBtn).toBeInTheDocument()
    expect(excelBtn).toBeInTheDocument()
  })
})
