import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getAssemblyProxies,
  grantProxy,
  revokeProxy,
  canRepresent,
} from '../services/proxy.service'

/**
 * Fetch all active proxies for a given assembly.
 */
export function useAssemblyProxies(assemblyId: string | undefined) {
  return useQuery({
    queryKey: ['assembly-proxies', assemblyId],
    queryFn: () => getAssemblyProxies(assemblyId!),
    enabled: !!assemblyId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Grant a proxy (representación) for an assembly.
 */
export function useGrantProxy() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: {
      assembly_id: string
      grantor_id: string
      representative_id: string
    }) => grantProxy(communityId!, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assembly-proxies', variables.assembly_id],
      })
    },
  })
}

/**
 * Revoke a proxy.
 */
export function useRevokeProxy(assemblyId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (proxyId: string) => revokeProxy(proxyId),
    onSuccess: () => {
      if (assemblyId) {
        queryClient.invalidateQueries({
          queryKey: ['assembly-proxies', assemblyId],
        })
      }
    },
  })
}

/**
 * Check whether a representative can receive more proxies.
 */
export function useCanRepresent(
  assemblyId: string | undefined,
  representativeId: string | undefined
) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['can-represent', communityId, assemblyId, representativeId],
    queryFn: () => canRepresent(communityId!, assemblyId!, representativeId!),
    enabled: !!communityId && !!assemblyId && !!representativeId,
    staleTime: 30 * 1000, // 30 seconds
  })
}
