import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementRead,
} from '../services/announcement.service'

const keys = {
  all: ['announcements'] as const,
  list: (communityId: string) => [...keys.all, communityId] as const,
}

export function useAnnouncements() {
  const { communityId, currentMember } = useCommunityContext()

  return useQuery({
    queryKey: keys.list(communityId!),
    queryFn: () => getAnnouncements(communityId!, currentMember?.id),
    enabled: !!communityId,
    staleTime: 60_000,
  })
}

export function useCreateAnnouncement() {
  const { communityId, currentMember } = useCommunityContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (input: { title: string; body: string; priority?: string; pinned?: boolean; expires_at?: string | null }) =>
      createAnnouncement(communityId!, currentMember!.id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list(communityId!) }),
  })
}

export function useUpdateAnnouncement() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateAnnouncement>[1] }) =>
      updateAnnouncement(id, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list(communityId!) }),
  })
}

export function useDeleteAnnouncement() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteAnnouncement(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list(communityId!) }),
  })
}

export function useMarkRead() {
  const { communityId, currentMember } = useCommunityContext()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (announcementId: string) => markAnnouncementRead(announcementId, currentMember!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.list(communityId!) }),
  })
}
