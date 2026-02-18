import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getPaymentPlans,
  getMemberPaymentPlans,
  getPaymentPlan,
  getInstallments,
  proposePaymentPlan,
  approvePaymentPlan,
  cancelPaymentPlan,
  markInstallmentPaid,
} from '../services/payment-plan.service'

export function usePaymentPlans() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['payment-plans', communityId],
    queryFn: () => getPaymentPlans(communityId!),
    enabled: !!communityId,
  })
}

export function useMemberPaymentPlans(memberId: string | undefined) {
  return useQuery({
    queryKey: ['payment-plans', 'member', memberId],
    queryFn: () => getMemberPaymentPlans(memberId!),
    enabled: !!memberId,
  })
}

export function usePaymentPlan(planId: string | undefined) {
  return useQuery({
    queryKey: ['payment-plan', planId],
    queryFn: () => getPaymentPlan(planId!),
    enabled: !!planId,
  })
}

export function useInstallments(planId: string | undefined) {
  return useQuery({
    queryKey: ['installments', planId],
    queryFn: () => getInstallments(planId!),
    enabled: !!planId,
  })
}

export function useProposePaymentPlan() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (plan: {
      member_id: string
      total_debt: number
      number_of_installments: number
      frequency: string
      start_date: string
      notes?: string
      proposed_by: string
    }) => proposePaymentPlan(communityId!, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}

export function useApprovePaymentPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, approvedBy }: { planId: string; approvedBy: string }) =>
      approvePaymentPlan(planId, approvedBy),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
      queryClient.invalidateQueries({ queryKey: ['payment-plan', variables.planId] })
      queryClient.invalidateQueries({ queryKey: ['installments', variables.planId] })
    },
  })
}

export function useCancelPaymentPlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ planId, reason }: { planId: string; reason: string }) =>
      cancelPaymentPlan(planId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
      queryClient.invalidateQueries({ queryKey: ['payment-plan', variables.planId] })
    },
  })
}

export function useMarkInstallmentPaid() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ installmentId, paidAmount }: { installmentId: string; paidAmount: number }) =>
      markInstallmentPaid(installmentId, paidAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-plans'] })
    },
  })
}
