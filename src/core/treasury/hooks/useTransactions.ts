import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import { getTransactions, createTransaction } from '../services/treasury.service'

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
