import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getBudgets, createBudget, updateBudget, deleteBudget } from '../services/treasury.service'

const budgetKeys = {
  all: ['budgets'] as const,
  list: (communityId: string, fundType?: string) => [...budgetKeys.all, 'list', communityId, fundType] as const,
}

export function useBudgets(fundType?: string) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: budgetKeys.list(communityId!, fundType),
    queryFn: () => getBudgets(communityId!, fundType),
    enabled: !!communityId,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (budget: { category_id: string; period: string; amount: number }) =>
      createBudget(communityId!, budget),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: { amount?: number; period?: string } }) =>
      updateBudget(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all })
    },
  })
}
