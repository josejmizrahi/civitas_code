import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getApplication,
  createApplication,
  updateApplication,
  submitApplication,
  uploadKybDocument,
} from '../services/kyb.service'
import type { KybApplication } from '../types'

const keys = {
  app: (communityId: string) => ['kyb', communityId] as const,
}

export function useKybApplication() {
  const { communityId } = useCommunityContext()
  return useQuery({
    queryKey: keys.app(communityId!),
    queryFn: () => getApplication(communityId!),
    enabled: !!communityId,
    staleTime: 60_000,
  })
}

export function useCreateApplication() {
  const { communityId, currentMember } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => createApplication(communityId!, currentMember!.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.app(communityId!) }),
  })
}

export function useUpdateApplication() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ appId, updates }: { appId: string; updates: Partial<KybApplication> }) =>
      updateApplication(appId, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.app(communityId!) }),
  })
}

export function useSubmitApplication() {
  const { communityId } = useCommunityContext()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (appId: string) => submitApplication(appId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.app(communityId!) })
      qc.invalidateQueries({ queryKey: ['fintech', 'status', communityId!] })
    },
  })
}

export function useUploadKybDoc() {
  const { communityId } = useCommunityContext()
  return useMutation({
    mutationFn: ({ file, docType }: { file: File; docType: string }) =>
      uploadKybDocument(communityId!, file, docType),
  })
}
