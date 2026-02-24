import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getAdminTerms,
  getCurrentTerm,
  startTerm,
  endTerm,
  getVigilanciaReports,
  createVigilanciaReport,
  submitVigilanciaReport,
} from '../services/terms.service'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const termKeys = {
  all: ['admin-terms'] as const,
  list: (communityId: string) => [...termKeys.all, 'list', communityId] as const,
  current: (communityId: string, memberId: string) =>
    [...termKeys.all, 'current', communityId, memberId] as const,
}

const vigilanciaKeys = {
  all: ['vigilancia-reports'] as const,
  list: (communityId: string) => [...vigilanciaKeys.all, 'list', communityId] as const,
}

// ---------------------------------------------------------------------------
// Admin Terms
// ---------------------------------------------------------------------------

export function useAdminTerms() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: termKeys.list(communityId!),
    queryFn: () => getAdminTerms(communityId!),
    enabled: !!communityId,
  })
}

export function useCurrentTerm(memberId: string) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: termKeys.current(communityId!, memberId),
    queryFn: () => getCurrentTerm(communityId!, memberId),
    enabled: !!communityId && !!memberId,
  })
}

export function useStartTerm() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({
      memberId,
      role,
      assemblyId,
    }: {
      memberId: string
      role: string
      assemblyId?: string
    }) => startTerm(communityId!, memberId, role, assemblyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termKeys.all })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

export function useEndTerm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (termId: string) => endTerm(termId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: termKeys.all })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })
}

// ---------------------------------------------------------------------------
// Vigilancia Reports
// ---------------------------------------------------------------------------

export function useVigilanciaReports() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: vigilanciaKeys.list(communityId!),
    queryFn: () => getVigilanciaReports(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateVigilanciaReport() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (data: {
      author_id: string
      period: string
      report_type: string
      title: string
      content: string
      findings: Array<{ finding: string; severity: string }>
      recommendations: Array<{ recommendation: string; priority: string }>
    }) => createVigilanciaReport(communityId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vigilanciaKeys.list(communityId!) })
    },
  })
}

export function useSubmitVigilanciaReport() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (reportId: string) => submitVigilanciaReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vigilanciaKeys.list(communityId!) })
    },
  })
}
