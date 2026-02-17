import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getRetentionRecords,
  registerDocument,
  getExpiringDocuments,
} from '../services/retention.service'

/**
 * Fetch all document retention records for the current community.
 */
export function useRetentionRecords() {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['document-retention', communityId],
    queryFn: () => getRetentionRecords(communityId!),
    enabled: !!communityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Register a new document in the retention system.
 */
export function useRegisterDocument() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      document_type: string
      document_id: string
      integrity_hash: string
      retention_years?: number
    }) => registerDocument(communityId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['document-retention', communityId],
      })
      queryClient.invalidateQueries({
        queryKey: ['expiring-documents', communityId],
      })
    },
  })
}

/**
 * Fetch documents expiring within N days.
 */
export function useExpiringDocuments(withinDays: number) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['expiring-documents', communityId, withinDays],
    queryFn: () => getExpiringDocuments(communityId!, withinDays),
    enabled: !!communityId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
