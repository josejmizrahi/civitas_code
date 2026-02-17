import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/app/providers'
import {
  hasValidConsent,
  grantConsent,
  revokeConsent,
  getUserConsents,
  createARCORequest,
  getARCORequests,
  respondToARCO,
  exportUserData,
  PRIVACY_NOTICE_VERSION,
} from '../services/privacy.service'

export function usePrivacyConsent(consentType: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['privacy-consent', user?.id, consentType],
    queryFn: () => hasValidConsent(user!.id, consentType),
    enabled: !!user?.id,
  })
}

export function useUserConsents() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['privacy-consents', user?.id],
    queryFn: () => getUserConsents(user!.id),
    enabled: !!user?.id,
  })
}

export function useGrantConsent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      consentType,
      version,
    }: {
      consentType: string
      version?: string
    }) => grantConsent(user!.id, consentType, version ?? PRIVACY_NOTICE_VERSION),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-consent', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['privacy-consents', user?.id] })
    },
  })
}

export function useRevokeConsent() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (consentType: string) => revokeConsent(user!.id, consentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-consent', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['privacy-consents', user?.id] })
    },
  })
}

export function useARCORequests(userId?: string) {
  const { user } = useAuth()
  const effectiveUserId = userId ?? user?.id

  return useQuery({
    queryKey: ['arco-requests', effectiveUserId],
    queryFn: () => getARCORequests(effectiveUserId),
    enabled: !!effectiveUserId,
  })
}

export function useAllARCORequests() {
  return useQuery({
    queryKey: ['arco-requests-all'],
    queryFn: () => getARCORequests(),
  })
}

export function useCreateARCORequest() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ type, description }: { type: string; description: string }) =>
      createARCORequest(user!.id, type, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arco-requests'] })
      queryClient.invalidateQueries({ queryKey: ['arco-requests-all'] })
    },
  })
}

export function useRespondToARCO() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      requestId,
      response,
      status,
    }: {
      requestId: string
      response: string
      status: 'completed' | 'denied'
    }) => respondToARCO(requestId, user!.id, response, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['arco-requests'] })
      queryClient.invalidateQueries({ queryKey: ['arco-requests-all'] })
    },
  })
}

export function useExportUserData() {
  const { user } = useAuth()

  return useMutation({
    mutationFn: () => exportUserData(user!.id),
  })
}
