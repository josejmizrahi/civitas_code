import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getRatings, getRatingSummary, getAllRatingSummaries, createRating, updateRating } from '../services/entities.service'

const ratingKeys = {
  all: ['ratings'] as const,
  list: (communityId: string, targetType: string, targetId: string) =>
    [...ratingKeys.all, communityId, targetType, targetId] as const,
  summary: (communityId: string, targetType: string, targetId: string) =>
    [...ratingKeys.all, 'summary', communityId, targetType, targetId] as const,
  allSummaries: (communityId: string, targetType?: string) =>
    [...ratingKeys.all, 'summaries', communityId, targetType] as const,
}

export function useRatings(targetType: string, targetId: string) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ratingKeys.list(communityId!, targetType, targetId),
    queryFn: () => getRatings(communityId!, targetType, targetId),
    enabled: !!communityId && !!targetId,
  })
}

export function useRatingSummary(targetType: string, targetId: string) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ratingKeys.summary(communityId!, targetType, targetId),
    queryFn: () => getRatingSummary(communityId!, targetType, targetId),
    enabled: !!communityId && !!targetId,
  })
}

export function useAllRatingSummaries(targetType?: string) {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ratingKeys.allSummaries(communityId!, targetType),
    queryFn: () => getAllRatingSummaries(communityId!, targetType),
    enabled: !!communityId,
  })
}

export function useCreateRating() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (rating: {
      target_type: string
      target_id: string
      rated_by: string
      overall_score: number
      dimensions?: Record<string, number>
      comment?: string
      contract_id?: string
    }) => createRating(communityId!, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all })
    },
  })
}

export function useUpdateRating() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateRating>[1] }) =>
      updateRating(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ratingKeys.all })
    },
  })
}
