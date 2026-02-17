import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext, useAuth } from '@/app/providers'
import {
  getStatements,
  getStatement,
  generateStatement,
  approveStatement,
} from '../services/statement.service'

const statementKeys = {
  all: ['financial-statements'] as const,
  list: (communityId: string, fundType?: string) =>
    [...statementKeys.all, 'list', communityId, fundType] as const,
  detail: (statementId: string) =>
    [...statementKeys.all, 'detail', statementId] as const,
}

/**
 * Fetch all financial statements for the current community.
 * Optionally filter by fund type ('mantenimiento' | 'reserva').
 */
export function useStatements(fundType?: string) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: statementKeys.list(communityId!, fundType),
    queryFn: () => getStatements(communityId!, fundType),
    enabled: !!communityId,
  })
}

/**
 * Fetch a single financial statement by ID.
 */
export function useStatement(statementId: string) {
  return useQuery({
    queryKey: statementKeys.detail(statementId),
    queryFn: () => getStatement(statementId),
    enabled: !!statementId,
  })
}

/**
 * Mutation to generate a new monthly financial statement.
 * Calls the generate_monthly_statement SQL function via RPC.
 */
export function useGenerateStatement() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({ period, fundType }: { period: string; fundType: string }) =>
      generateStatement(communityId!, period, fundType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statementKeys.all })
    },
  })
}

/**
 * Mutation to approve a financial statement (admin/tesorero).
 */
export function useApproveStatement() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: (statementId: string) =>
      approveStatement(statementId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statementKeys.all })
    },
  })
}
