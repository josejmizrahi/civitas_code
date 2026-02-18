import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale/es'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { CommentReactions } from './CommentReactions'
import { CommentForm } from './CommentForm'
import {
  SENTIMENT_CONFIG,
  type DiscussionComment,
  type ReactionSummary,
  type ReactionType,
  type Sentiment,
  type MentionRef,
} from '../types'

interface MemberOption {
  id: string
  display_name: string
  role?: string
}

interface Props {
  comment: DiscussionComment
  reactionSummary: ReactionSummary | undefined
  currentMemberId: string | undefined
  members: MemberOption[]
  depth?: number
  onReply: (parentId: string, content: string, sentiment: Sentiment, mentions: MentionRef[]) => void
  onEdit: (commentId: string, content: string, sentiment?: Sentiment) => void
  onDelete: (commentId: string) => void
  onAddReaction: (commentId: string, reaction: ReactionType) => void
  onRemoveReaction: (commentId: string, reaction: ReactionType) => void
  reactionSummaries: Record<string, ReactionSummary>
  isPending?: boolean
}

export function CommentCard({
  comment,
  reactionSummary,
  currentMemberId,
  members,
  depth = 0,
  onReply,
  onEdit,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  reactionSummaries,
  isPending,
}: Props) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)

  const isAuthor = currentMemberId === comment.author_id
  const isDeleted = !!comment.deleted_at
  const sentimentConfig = SENTIMENT_CONFIG[comment.sentiment]
  const maxDepth = 3

  const handleReply = (content: string, sentiment: Sentiment, mentions: MentionRef[]) => {
    onReply(comment.id, content, sentiment, mentions)
    setShowReplyForm(false)
  }

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent.trim())
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    if (window.confirm('¿Eliminar este comentario? Esta acción no se puede deshacer.')) {
      onDelete(comment.id)
    }
  }

  // Render content with @mentions highlighted
  const renderContent = (text: string) => {
    const parts = text.split(/(@\w+(?:\s\w+)?)/g)
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-medium text-blue-600">
            {part}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className={cn('group', depth > 0 && 'ml-6 border-l-2 border-muted pl-4')}>
      <div className={cn('rounded-lg p-3', isDeleted ? 'opacity-50' : 'hover:bg-muted/30')}>
        {/* Header */}
        <div className="flex items-center gap-2 text-xs">
          {/* Avatar */}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {(comment.author_name ?? 'M').charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-foreground">{comment.author_name ?? 'Miembro'}</span>
          {comment.author_role && comment.author_role !== 'miembro' && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {comment.author_role}
            </span>
          )}
          {/* Sentiment badge */}
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', sentimentConfig.bgColor, sentimentConfig.color)}>
            {sentimentConfig.label}
          </span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
          </span>
          {comment.edited_at && (
            <span className="text-muted-foreground/60">(editado)</span>
          )}
        </div>

        {/* Content */}
        <div className="mt-1.5 text-sm">
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={!editContent.trim()}>
                  Guardar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setIsEditing(false); setEditContent(comment.content) }}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{isDeleted ? comment.content : renderContent(comment.content)}</p>
          )}
        </div>

        {/* Actions */}
        {!isDeleted && !isEditing && (
          <div className="mt-2 flex items-center gap-3">
            <CommentReactions
              commentId={comment.id}
              summary={reactionSummary}
              onAdd={onAddReaction}
              onRemove={onRemoveReaction}
              disabled={!currentMemberId}
            />

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                >
                  <MessageSquare className="mr-1 h-3 w-3" />
                  Responder
                </Button>
              )}
              {isAuthor && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => { setIsEditing(true); setEditContent(comment.content) }}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Eliminar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-6 mt-2 border-l-2 border-primary/20 pl-4">
          <CommentForm
            onSubmit={(content, sentiment, mentions) => handleReply(content, sentiment, mentions)}
            members={members}
            isPending={isPending}
            placeholder="Escribe tu respuesta..."
            compact
            autoFocus
            onCancel={() => setShowReplyForm(false)}
          />
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              reactionSummary={reactionSummaries[reply.id]}
              currentMemberId={currentMemberId}
              members={members}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddReaction={onAddReaction}
              onRemoveReaction={onRemoveReaction}
              reactionSummaries={reactionSummaries}
              isPending={isPending}
            />
          ))}
        </div>
      )}
    </div>
  )
}
