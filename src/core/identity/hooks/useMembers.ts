import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { useAuth } from './useAuth'
import {
  getMembers,
  getMemberProfile,
  updateMemberRole,
  createInvitation,
  deactivateMember,
  reactivateMember,
} from '../services/identity.service'
import type { Role } from '@/shared/types'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const memberKeys = {
  all: ['members'] as const,
  list: (communityId: string) => [...memberKeys.all, 'list', communityId] as const,
  detail: (memberId: string) => [...memberKeys.all, 'detail', memberId] as const,
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useMembers() {
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useQuery({
    queryKey: memberKeys.list(communityId!),
    queryFn: () => getMembers(communityId!, user?.id),
    enabled: !!communityId,
  })
}

export function useMember(memberId: string | undefined) {
  return useQuery({
    queryKey: memberKeys.detail(memberId!),
    queryFn: () => getMemberProfile(memberId!),
    enabled: !!memberId,
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useUpdateMemberRole() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: Role }) =>
      updateMemberRole(memberId, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(communityId!) })
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.memberId) })
    },
  })
}

export function useDeactivateMember() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (memberId: string) => deactivateMember(memberId),
    onSuccess: (_data, memberId) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(communityId!) })
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(memberId) })
    },
  })
}

export function useReactivateMember() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()

  return useMutation({
    mutationFn: (memberId: string) => reactivateMember(memberId),
    onSuccess: (_data, memberId) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(communityId!) })
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(memberId) })
    },
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()
  const { communityId } = useCommunityContext()
  const { user } = useAuth()

  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: Role }) =>
      createInvitation(communityId!, email, role, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(communityId!) })
      queryClient.invalidateQueries({ queryKey: ['invitations', communityId] })
    },
  })
}
