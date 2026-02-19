import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getOrCreateProfile,
  getLeaderboard,
  getRecentEvents,
  awardXp,
} from '../services/gamification.service'
import type { GamificationAction } from '../types'

/** Get (or auto-create) the current user's gamification profile. */
export function useMyGamification() {
  const { communityId, currentMember } = useCommunityContext()

  return useQuery({
    queryKey: ['gamification', communityId, currentMember?.id],
    queryFn: () => getOrCreateProfile(currentMember!.id, communityId!),
    enabled: !!communityId && !!currentMember?.id,
    staleTime: 30_000, // 30s — profile changes often
  })
}

/** Get the community leaderboard. */
export function useLeaderboard(limit = 10) {
  const { communityId } = useCommunityContext()

  return useQuery({
    queryKey: ['leaderboard', communityId, limit],
    queryFn: () => getLeaderboard(communityId!, limit),
    enabled: !!communityId,
    staleTime: 60_000, // 1 min
  })
}

/** Get recent XP events for the current user. */
export function useMyXpHistory(limit = 20) {
  const { communityId, currentMember } = useCommunityContext()

  return useQuery({
    queryKey: ['xp-history', communityId, currentMember?.id, limit],
    queryFn: () => getRecentEvents(currentMember!.id, communityId!, limit),
    enabled: !!communityId && !!currentMember?.id,
  })
}

/** Mutation to award XP. Returns the result with level-up / badge info. */
export function useAwardXp() {
  const { communityId, currentMember } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ action, metadata }: { action: GamificationAction; metadata?: Record<string, unknown> }) =>
      awardXp(currentMember!.id, communityId!, action, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', communityId, currentMember?.id] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard', communityId] })
      queryClient.invalidateQueries({ queryKey: ['xp-history', communityId, currentMember?.id] })
    },
  })
}
