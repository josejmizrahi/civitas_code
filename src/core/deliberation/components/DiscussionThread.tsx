import { useMemo, useCallback } from 'react'
import { useComments, useReactions, useSentimentSummary, useCreateComment, useUpdateComment, useDeleteComment, useAddReaction, useRemoveReaction } from '../hooks/useDiscussion'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useAuth } from '@/app/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { MessageSquare } from 'lucide-react'
import { CommentCard } from './CommentCard'
import { CommentForm } from './CommentForm'
import { ProConSummary } from './ProConSummary'
import type { Sentiment, MentionRef, ReactionType } from '../types'

interface Props {
  proposalId: string
  /** If true, the comment form is visible (proposal is in discussion or active status) */
  canComment: boolean
}

export function DiscussionThread({ proposalId, canComment }: Props) {
  const { user } = useAuth()
  const { data: members } = useMembers()
  const { data: comments, isLoading: commentsLoading } = useComments(proposalId)
  const { data: sentimentSummary } = useSentimentSummary(proposalId)

  const currentMember = members?.find((m) => m.user_id === user?.id)
  const { data: reactionSummaries } = useReactions(proposalId, currentMember?.id)

  const createCommentMut = useCreateComment()
  const updateCommentMut = useUpdateComment(proposalId)
  const deleteCommentMut = useDeleteComment(proposalId)
  const addReactionMut = useAddReaction(proposalId)
  const removeReactionMut = useRemoveReaction(proposalId)

  const memberOptions = useMemo(() => (members ?? []).map((m) => ({
    id: m.id,
    display_name: (m as any).display_name ?? (m as any).name ?? 'Miembro',
    role: (m as any).role,
  })), [members])

  const handleCreateComment = useCallback((content: string, sentiment: Sentiment, mentions: MentionRef[]) => {
    if (!currentMember) return
    createCommentMut.mutate({
      proposal_id: proposalId,
      author_id: currentMember.id,
      content,
      sentiment,
      mentions,
    })
  }, [currentMember, proposalId, createCommentMut])

  const handleReply = useCallback((parentId: string, content: string, sentiment: Sentiment, mentions: MentionRef[]) => {
    if (!currentMember) return
    createCommentMut.mutate({
      proposal_id: proposalId,
      author_id: currentMember.id,
      content,
      sentiment,
      parent_comment_id: parentId,
      mentions,
    })
  }, [currentMember, proposalId, createCommentMut])

  const handleEdit = useCallback((commentId: string, content: string, sentiment?: Sentiment) => {
    updateCommentMut.mutate({ commentId, content, sentiment })
  }, [updateCommentMut])

  const handleDelete = useCallback((commentId: string) => {
    deleteCommentMut.mutate(commentId)
  }, [deleteCommentMut])

  const handleAddReaction = useCallback((commentId: string, reaction: ReactionType) => {
    if (!currentMember) return
    addReactionMut.mutate({ commentId, memberId: currentMember.id, reaction })
  }, [currentMember, addReactionMut])

  const handleRemoveReaction = useCallback((commentId: string, reaction: ReactionType) => {
    if (!currentMember) return
    removeReactionMut.mutate({ commentId, memberId: currentMember.id, reaction })
  }, [currentMember, removeReactionMut])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4" />
          Discusión
          {comments && comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({sentimentSummary?.total_count ?? 0} comentarios)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sentiment summary bar */}
        <ProConSummary summary={sentimentSummary} />

        {/* Comments list */}
        {commentsLoading ? (
          <LoadingSpinner message="Cargando discusión..." className="py-6" />
        ) : comments && comments.length > 0 ? (
          <div className="space-y-1 divide-y divide-muted/50">
            {comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                reactionSummary={reactionSummaries?.[comment.id]}
                currentMemberId={currentMember?.id}
                members={memberOptions}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddReaction={handleAddReaction}
                onRemoveReaction={handleRemoveReaction}
                reactionSummaries={reactionSummaries ?? {}}
                isPending={createCommentMut.isPending}
              />
            ))}
          </div>
        ) : null}

        {/* New comment form */}
        {canComment && currentMember && (
          <div className="border-t pt-4">
            <CommentForm
              onSubmit={handleCreateComment}
              members={memberOptions}
              isPending={createCommentMut.isPending}
            />
          </div>
        )}

        {!canComment && (
          <p className="text-xs text-muted-foreground text-center py-2">
            La discusión está cerrada para nuevos comentarios.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
