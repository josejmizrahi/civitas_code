import { supabase } from '@/shared/lib/supabase'
import type {
  DiscussionComment,
  CommentReaction,
  ReactionSummary,
  ReactionType,
  Sentiment,
  SentimentSummary,
} from '../types'

// ---------------------------------------------------------------------------
// Comments CRUD
// ---------------------------------------------------------------------------

/**
 * Get all comments for a proposal, ordered by creation date.
 * Includes author name via members join.
 * Soft-deleted comments are included but content is masked client-side.
 */
export async function getComments(proposalId: string): Promise<DiscussionComment[]> {
  const { data, error } = await supabase
    .from('discussion_comments')
    .select(`
      *,
      author:members!author_id (
        display_name,
        role
      )
    `)
    .eq('proposal_id', proposalId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return ((data ?? []) as any[]).map((c) => ({
    ...c,
    author_name: c.author?.display_name ?? 'Miembro',
    author_role: c.author?.role ?? 'miembro',
    author: undefined,
  })) as DiscussionComment[]
}

/**
 * Create a new comment on a proposal.
 */
export async function createComment(comment: {
  community_id: string
  proposal_id: string
  author_id: string
  content: string
  content_format?: string
  sentiment?: Sentiment
  parent_comment_id?: string
  mentions?: Array<{ member_id: string; member_name: string }>
}): Promise<DiscussionComment> {
  const { data, error } = await (supabase.from('discussion_comments') as any)
    .insert({
      community_id: comment.community_id,
      proposal_id: comment.proposal_id,
      author_id: comment.author_id,
      content: comment.content,
      content_format: comment.content_format || 'plain',
      sentiment: comment.sentiment || 'neutral',
      parent_comment_id: comment.parent_comment_id || null,
      mentions: comment.mentions || [],
      attachments: [],
    })
    .select()
    .single()

  if (error) throw error

  // Notify mentioned members
  if (comment.mentions && comment.mentions.length > 0) {
    try {
      const { notifyMember } = await import('@/shared/services/notification.service')
      for (const mention of comment.mentions) {
        await notifyMember(
          comment.community_id,
          mention.member_id,
          'comment_mention',
          `Te mencionaron en una discusión`,
          `Alguien te mencionó en un comentario sobre una propuesta`,
          { proposal_id: comment.proposal_id, comment_id: data.id }
        )
      }
    } catch { /* notifications are best-effort */ }
  }

  return data as DiscussionComment
}

/**
 * Update a comment's content (edit).
 */
export async function updateComment(
  commentId: string,
  content: string,
  sentiment?: Sentiment
): Promise<DiscussionComment> {
  const updateData: Record<string, unknown> = {
    content,
    edited_at: new Date().toISOString(),
  }
  if (sentiment) {
    updateData.sentiment = sentiment
  }

  const { data, error } = await (supabase.from('discussion_comments') as any)
    .update(updateData)
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw error
  return data as DiscussionComment
}

/**
 * Soft-delete a comment (sets deleted_at, keeps record for thread integrity).
 */
export async function softDeleteComment(commentId: string): Promise<void> {
  const { error } = await (supabase.from('discussion_comments') as any)
    .update({
      deleted_at: new Date().toISOString(),
      content: '[Comentario eliminado]',
    })
    .eq('id', commentId)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Reactions
// ---------------------------------------------------------------------------

/**
 * Get all reactions for a set of comments.
 */
export async function getReactions(commentIds: string[]): Promise<CommentReaction[]> {
  if (commentIds.length === 0) return []

  const { data, error } = await supabase
    .from('comment_reactions')
    .select('*')
    .in('comment_id', commentIds)

  if (error) throw error
  return (data ?? []) as CommentReaction[]
}

/**
 * Compute reaction summaries for a set of comments, given the current member.
 */
export function computeReactionSummaries(
  reactions: CommentReaction[],
  currentMemberId: string
): Record<string, ReactionSummary> {
  const summaries: Record<string, ReactionSummary> = {}

  for (const r of reactions) {
    if (!summaries[r.comment_id]) {
      summaries[r.comment_id] = {
        agree: 0,
        disagree: 0,
        helpful: 0,
        question: 0,
        user_reactions: [],
      }
    }
    const s = summaries[r.comment_id]
    s[r.reaction as ReactionType]++
    if (r.member_id === currentMemberId) {
      s.user_reactions.push(r.reaction as ReactionType)
    }
  }

  return summaries
}

/**
 * Add a reaction to a comment.
 */
export async function addReaction(
  commentId: string,
  memberId: string,
  reaction: ReactionType
): Promise<CommentReaction> {
  const { data, error } = await (supabase.from('comment_reactions') as any)
    .insert({
      comment_id: commentId,
      member_id: memberId,
      reaction,
    })
    .select()
    .single()

  if (error) throw error
  return data as CommentReaction
}

/**
 * Remove a reaction from a comment.
 */
export async function removeReaction(
  commentId: string,
  memberId: string,
  reaction: ReactionType
): Promise<void> {
  const { error } = await (supabase.from('comment_reactions') as any)
    .delete()
    .eq('comment_id', commentId)
    .eq('member_id', memberId)
    .eq('reaction', reaction)

  if (error) throw error
}

// ---------------------------------------------------------------------------
// Sentiment Summary
// ---------------------------------------------------------------------------

/**
 * Get sentiment summary for a proposal.
 */
export async function getSentimentSummary(proposalId: string): Promise<SentimentSummary> {
  const { data, error } = await supabase
    .from('comment_sentiment_summary')
    .select('*')
    .eq('proposal_id', proposalId)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    return { pro_count: 0, con_count: 0, neutral_count: 0, question_count: 0, total_count: 0 }
  }

  return data as SentimentSummary
}

// ---------------------------------------------------------------------------
// Thread builder (client-side nesting)
// ---------------------------------------------------------------------------

/**
 * Build a threaded tree from a flat list of comments.
 * Top-level comments have parent_comment_id === null.
 * Replies are nested under their parent.
 */
export function buildCommentTree(comments: DiscussionComment[]): DiscussionComment[] {
  const map = new Map<string, DiscussionComment>()
  const roots: DiscussionComment[] = []

  // First pass: initialize all comments with empty replies
  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] })
  }

  // Second pass: build tree
  for (const c of comments) {
    const node = map.get(c.id)!
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id)!.replies!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
