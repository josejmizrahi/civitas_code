import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  getInstallments,
  generateInstallments,
  markInstallmentPaid,
  refreshOverdueInstallments,
} from '../services/contracts.service'
import type { ContractInstallment } from '../types'

const contractKeys = {
  all: ['contracts'] as const,
  list: (communityId: string, filters?: any) => [...contractKeys.all, communityId, filters] as const,
  detail: (id: string) => [...contractKeys.all, 'detail', id] as const,
  installments: (contractId: string) => [...contractKeys.all, 'installments', contractId] as const,
}

export function useContracts(filters?: { status?: string; entity_id?: string }) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: contractKeys.list(communityId!, filters),
    queryFn: () => getContracts(communityId!, filters),
    enabled: !!communityId,
  })
}

export function useContract(contractId: string | null) {
  return useQuery({
    queryKey: contractKeys.detail(contractId!),
    queryFn: () => getContract(contractId!),
    enabled: !!contractId,
  })
}

export function useCreateContract() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (contract: Parameters<typeof createContract>[1]) => {
      const created = await createContract(communityId!, { ...contract, created_by: user!.id })
      if (created.number_of_installments > 0) {
        await generateInstallments(created, communityId!)
      }
      return created
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
    },
  })
}

export function useUpdateContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateContract>[1] }) =>
      updateContract(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
    },
  })
}

export function useDeleteContract() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteContract(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
    },
  })
}

export function useInstallments(contractId: string | null) {
  return useQuery({
    queryKey: contractKeys.installments(contractId!),
    queryFn: () => getInstallments(contractId!),
    enabled: !!contractId,
  })
}

export function useMarkInstallmentPaid() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ installment, reference }: { installment: ContractInstallment; reference?: string }) =>
      markInstallmentPaid(installment, communityId!, user!.id, reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useRefreshOverdueInstallments() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: () => refreshOverdueInstallments(communityId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contractKeys.all })
    },
  })
}
