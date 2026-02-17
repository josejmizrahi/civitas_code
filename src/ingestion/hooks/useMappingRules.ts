import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getColumnMappings,
  saveColumnMappings,
  getCategoryMappings,
  saveCategoryMapping,
} from '../services/ingestion.service'

export function useColumnMappings(sourceId: string | null) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['column-mappings', communityId, sourceId],
    queryFn: () => getColumnMappings(communityId!, sourceId!),
    enabled: !!communityId && !!sourceId,
  })
}

export function useSaveColumnMappings() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sourceId,
      mappings,
    }: {
      sourceId: string
      mappings: { external_column: string; internal_field: string }[]
    }) => saveColumnMappings(communityId!, sourceId, mappings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['column-mappings'] })
    },
  })
}

export function useCategoryMappings(sourceId: string | null) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['category-mappings', communityId, sourceId],
    queryFn: () => getCategoryMappings(communityId!, sourceId!),
    enabled: !!communityId && !!sourceId,
  })
}

export function useSaveCategoryMapping() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sourceId,
      mapping,
    }: {
      sourceId: string
      mapping: { external_name: string; internal_category_id: string; auto_matched: boolean }
    }) => saveCategoryMapping(communityId!, sourceId, mapping),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-mappings'] })
    },
  })
}
