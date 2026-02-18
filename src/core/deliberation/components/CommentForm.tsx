import { useState, useRef } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { cn } from '@/shared/lib/utils'
import { Send } from 'lucide-react'
import { SENTIMENT_CONFIG, type Sentiment, type MentionRef } from '../types'
import { MentionAutocomplete, useMentionDetection } from './MentionAutocomplete'

interface MemberOption {
  id: string
  display_name: string
  role?: string
}

interface Props {
  onSubmit: (content: string, sentiment: Sentiment, mentions: MentionRef[]) => void
  members: MemberOption[]
  isPending?: boolean
  placeholder?: string
  autoFocus?: boolean
  compact?: boolean
  onCancel?: () => void
}

const SENTIMENTS: Sentiment[] = ['pro', 'con', 'neutral', 'question']

export function CommentForm({
  onSubmit,
  members,
  isPending,
  placeholder = 'Escribe tu comentario... Usa @nombre para mencionar',
  autoFocus,
  compact,
  onCancel,
}: Props) {
  const [content, setContent] = useState('')
  const [sentiment, setSentiment] = useState<Sentiment>('neutral')
  const [mentions, setMentions] = useState<MentionRef[]>([])
  const [cursorPos, setCursorPos] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { mentionQuery, showAutocomplete, setShowAutocomplete } = useMentionDetection(content, cursorPos)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    onSubmit(content.trim(), sentiment, mentions)
    setContent('')
    setSentiment('neutral')
    setMentions([])
  }

  const handleMentionSelect = (member: MemberOption) => {
    // Replace the @query with @name
    const beforeCursor = content.slice(0, cursorPos)
    const atIndex = beforeCursor.lastIndexOf('@')
    const afterCursor = content.slice(cursorPos)
    const newContent = beforeCursor.slice(0, atIndex) + `@${member.display_name} ` + afterCursor
    setContent(newContent)
    setShowAutocomplete(false)

    // Add to mentions list if not already present
    if (!mentions.find((m) => m.member_id === member.id)) {
      setMentions([...mentions, { member_id: member.id, member_name: member.display_name }])
    }

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = atIndex + member.display_name.length + 2
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPos, newPos)
        setCursorPos(newPos)
      }
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Sentiment selector */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Postura:</span>
        {SENTIMENTS.map((s) => {
          const config = SENTIMENT_CONFIG[s]
          return (
            <button
              key={s}
              type="button"
              onClick={() => setSentiment(s)}
              className={cn(
                'rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all',
                sentiment === s
                  ? `${config.bgColor} ${config.color} ring-1 ring-current`
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Textarea with mention autocomplete */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setCursorPos(e.target.selectionStart ?? 0)
          }}
          onSelect={(e) => setCursorPos((e.target as HTMLTextAreaElement).selectionStart ?? 0)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={compact ? 2 : 3}
          autoFocus={autoFocus}
          className="pr-12"
        />
        <MentionAutocomplete
          members={members}
          query={mentionQuery}
          visible={showAutocomplete}
          onSelect={handleMentionSelect}
        />
      </div>

      {/* Mentioned members */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {mentions.map((m) => (
            <span
              key={m.member_id}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700"
            >
              @{m.member_name}
              <button
                type="button"
                onClick={() => setMentions(mentions.filter((x) => x.member_id !== m.member_id))}
                className="hover:text-blue-900"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Submit row */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Ctrl+Enter para enviar
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" size="sm" disabled={isPending || !content.trim()}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {isPending ? 'Enviando...' : 'Comentar'}
          </Button>
        </div>
      </div>
    </form>
  )
}
