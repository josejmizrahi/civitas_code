import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import { getTransactions, createTransaction, createCorrectionTransaction, setVigilanceFlag } from '../services/treasury.service'
import { verifyTransaction } from '../services/receipt.service'

const txKeys = {
  all: ['transactions'] as const,
  list: (communityId: string, filters?: any) => [...txKeys.all, 'list', communityId, filters] as const,
}

export function useTransactions(filters?: { dateFrom?: string; dateTo?: string; categoryId?: string; type?: string; fundType?: string }) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: txKeys.list(communityId!, filters),
    queryFn: () => getTransactions(communityId!, filters),
    enabled: !!communityId,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (tx: { type: string; amount: number; category_id?: string; description: string; date: string; emergency?: boolean }) =>
      createTransaction(communityId!, { ...tx, created_by: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: txKeys.all })
    },
  })
}

export function useCreateCorrectionTransaction() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (params: {
      originalTransactionId: string
      type: string
      amount: number
      description: string
      date: string
      category_id?: string
      correction_note: string
    }) =>
      createCorrectionTransaction(communityId!, params.originalTransactionId, {
        ...params,
        created_by: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: txKeys.all })
    },
  })
}

export function useSetVigilanceFlag() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({
      transactionId,
      flag,
      note,
      memberId,
    }: { transactionId: string; flag: boolean; note?: string | null; memberId: string }) =>
      setVigilanceFlag(communityId!, memberId, transactionId, flag, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: txKeys.all })
    },
  })
}

export function useVerifyTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'verified' | 'disputed' }) =>
      verifyTransaction(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: txKeys.all })
    },
  })
}
