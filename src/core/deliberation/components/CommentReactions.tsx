import { cn } from '@/shared/lib/utils'
import { REACTION_CONFIG, type ReactionType, type ReactionSummary } from '../types'

interface Props {
  commentId: string
  summary: ReactionSummary | undefined
  onAdd: (commentId: string, reaction: ReactionType) => void
  onRemove: (commentId: string, reaction: ReactionType) => void
  disabled?: boolean
}

const REACTION_TYPES: ReactionType[] = ['agree', 'disagree', 'helpful', 'question']

export function CommentReactions({ commentId, summary, onAdd, onRemove, disabled }: Props) {
  const userReactions = summary?.user_reactions ?? []

  const handleClick = (reaction: ReactionType) => {
    if (disabled) return
    if (userReactions.includes(reaction)) {
      onRemove(commentId, reaction)
    } else {
      onAdd(commentId, reaction)
    }
  }

  return (
    <div className="flex items-center gap-1">
      {REACTION_TYPES.map((reaction) => {
        const config = REACTION_CONFIG[reaction]
        const count = summary?.[reaction] ?? 0
        const isActive = userReactions.includes(reaction)

        return (
          <button
            key={reaction}
            onClick={() => handleClick(reaction)}
            disabled={disabled}
            title={config.label}
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span>{config.emoji}</span>
            {count > 0 && <span className="font-medium">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
