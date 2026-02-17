import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getImportJobs, createImportJob, updateImportJob, rollbackImportJob } from '../services/ingestion.service'

export function useImportJobs() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['import-jobs', communityId],
    queryFn: () => getImportJobs(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateImportJob() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (job: { source_id: string; rows_total: number }) =>
      createImportJob(communityId!, job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs', communityId] })
    },
  })
}

export function useUpdateImportJob() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ jobId, updates }: { jobId: string; updates: Record<string, unknown> }) =>
      updateImportJob(jobId, updates as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs', communityId] })
    },
  })
}

export function useRollbackImportJob() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (jobId: string) => rollbackImportJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['import-jobs', communityId] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
