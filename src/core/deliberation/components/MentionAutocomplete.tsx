import { useState, useRef, useEffect } from 'react'
import { cn } from '@/shared/lib/utils'

interface MemberOption {
  id: string
  display_name: string
  role?: string
}

interface Props {
  members: MemberOption[]
  onSelect: (member: MemberOption) => void
  query: string
  visible: boolean
  position?: { top: number; left: number }
}

export function MentionAutocomplete({ members, onSelect, query, visible, position }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = members.filter((m) =>
    m.display_name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8)

  useEffect(() => {
    queueMicrotask(() => setSelectedIndex(0))
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.target instanceof HTMLTextAreaElement)) return
      if (!visible || filtered.length === 0) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        onSelect(filtered[selectedIndex])
      } else if (e.key === 'Escape') {
        // Parent handles closing
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, filtered, selectedIndex, onSelect])

  if (!visible || filtered.length === 0) return null

  return (
    <div
      ref={listRef}
      className="absolute z-50 w-64 rounded-md border bg-white shadow-lg"
      style={position ? { top: position.top, left: position.left } : undefined}
    >
      {filtered.map((member, index) => (
        <button
          key={member.id}
          onClick={() => onSelect(member)}
          className={cn(
            'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
            index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          )}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
            {member.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{member.display_name}</p>
            {member.role && (
              <p className="truncate text-[10px] text-muted-foreground">{member.role}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

/**
 * Hook to detect @mention trigger in a textarea.
 * Returns the query string after @ and whether the autocomplete should be visible.
 */
export function useMentionDetection(text: string, cursorPosition: number) {
  const [mentionQuery, setMentionQuery] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)

  useEffect(() => {
    // Look backwards from cursor for an @ that starts a mention
    const beforeCursor = text.slice(0, cursorPosition)
    const atIndex = beforeCursor.lastIndexOf('@')

    if (atIndex === -1) {
      queueMicrotask(() => setShowAutocomplete(false))
      return
    }

    // The @ must be at the start or preceded by whitespace
    if (atIndex > 0 && !/\s/.test(beforeCursor[atIndex - 1])) {
      queueMicrotask(() => setShowAutocomplete(false))
      return
    }

    const query = beforeCursor.slice(atIndex + 1)

    // If there's a space after the query start, the mention is "closed"
    if (query.includes(' ') && query.length > 20) {
      queueMicrotask(() => setShowAutocomplete(false))
      return
    }

    queueMicrotask(() => {
      setMentionQuery(query)
      setShowAutocomplete(true)
    })
  }, [text, cursorPosition])

  return { mentionQuery, showAutocomplete, setShowAutocomplete }
}
