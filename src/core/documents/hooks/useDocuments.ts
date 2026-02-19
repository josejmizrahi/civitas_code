import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useAuth } from '@/app/providers'
import { getDocuments, createDocument, deleteDocument } from '../services/documents.service'

export function useDocuments() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: ['documents', communityId],
    queryFn: () => getDocuments(communityId!),
    enabled: !!communityId,
  })
}

export function useCreateDocument() {
  const { communityId } = useCommunityContext()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (doc: { title: string; file_url: string; category: string }) => {
      if (!user || !communityId) throw new Error('Not authenticated')
      return createDocument(communityId, { ...doc, uploaded_by: user.id })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', communityId] }),
  })
}

export function useDeleteDocument() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents', communityId] }),
  })
}
