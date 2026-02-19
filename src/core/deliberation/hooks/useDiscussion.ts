import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import {
  getComments,
  createComment,
  updateComment,
  softDeleteComment,
  getReactions,
  addReaction,
  removeReaction,
  getSentimentSummary,
  computeReactionSummaries,
  buildCommentTree,
} from '../services/deliberation.service'
import type { Sentiment, ReactionType, ReactionSummary } from '../types'

/**
 * Fetch all comments for a proposal, threaded.
 */
export function useComments(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['discussion-comments', proposalId],
    queryFn: async () => {
      const flat = await getComments(proposalId!)
      return buildCommentTree(flat)
    },
    enabled: !!proposalId,
    staleTime: 30_000, // 30 seconds
  })
}

/**
 * Fetch flat (non-threaded) comments for reaction computation.
 */
export function useFlatComments(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['discussion-comments-flat', proposalId],
    queryFn: () => getComments(proposalId!),
    enabled: !!proposalId,
    staleTime: 30_000,
  })
}

/**
 * Fetch reactions for all comments of a proposal.
 */
export function useReactions(proposalId: string | undefined, currentMemberId: string | undefined) {
  const { data: flatComments } = useFlatComments(proposalId)

  return useQuery({
    queryKey: ['discussion-reactions', proposalId],
    queryFn: async (): Promise<Record<string, ReactionSummary>> => {
      const commentIds = (flatComments ?? []).map((c) => c.id)
      const reactions = await getReactions(commentIds)
      return computeReactionSummaries(reactions, currentMemberId ?? '')
    },
    enabled: !!proposalId && !!flatComments && flatComments.length > 0,
    staleTime: 30_000,
  })
}

/**
 * Fetch sentiment summary for a proposal.
 */
export function useSentimentSummary(proposalId: string | undefined) {
  return useQuery({
    queryKey: ['sentiment-summary', proposalId],
    queryFn: () => getSentimentSummary(proposalId!),
    enabled: !!proposalId,
    staleTime: 30_000,
  })
}

/**
 * Create a new comment.
 */
export function useCreateComment() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      proposal_id: string
      author_id: string
      content: string
      sentiment?: Sentiment
      parent_comment_id?: string
      mentions?: Array<{ member_id: string; member_name: string }>
    }) =>
      createComment({
        community_id: communityId!,
        ...params,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', variables.proposal_id] })
      queryClient.invalidateQueries({ queryKey: ['discussion-comments-flat', variables.proposal_id] })
      queryClient.invalidateQueries({ queryKey: ['sentiment-summary', variables.proposal_id] })
    },
  })
}

/**
 * Update (edit) a comment.
 */
export function useUpdateComment(proposalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, content, sentiment }: { commentId: string; content: string; sentiment?: Sentiment }) =>
      updateComment(commentId, content, sentiment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', proposalId] })
      queryClient.invalidateQueries({ queryKey: ['discussion-comments-flat', proposalId] })
      queryClient.invalidateQueries({ queryKey: ['sentiment-summary', proposalId] })
    },
  })
}

/**
 * Soft-delete a comment.
 */
export function useDeleteComment(proposalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => softDeleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-comments', proposalId] })
      queryClient.invalidateQueries({ queryKey: ['discussion-comments-flat', proposalId] })
      queryClient.invalidateQueries({ queryKey: ['sentiment-summary', proposalId] })
    },
  })
}

/**
 * Add a reaction to a comment.
 */
export function useAddReaction(proposalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, memberId, reaction }: { commentId: string; memberId: string; reaction: ReactionType }) =>
      addReaction(commentId, memberId, reaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-reactions', proposalId] })
    },
  })
}

/**
 * Remove a reaction from a comment.
 */
export function useRemoveReaction(proposalId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, memberId, reaction }: { commentId: string; memberId: string; reaction: ReactionType }) =>
      removeReaction(commentId, memberId, reaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-reactions', proposalId] })
    },
  })
}
