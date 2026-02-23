import { useAnnouncements, useMarkRead } from '../hooks/useAnnouncements'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Megaphone, Pin, Eye, ChevronRight } from 'lucide-react'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { Link } from 'react-router-dom'
import type { Announcement } from '../types'

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'border-red-200 bg-red-50/50 dark:bg-red-950/20',
  normal: '',
  low: 'opacity-80',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `hace ${days}d`
  return new Date(dateStr).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })
}

export function AnnouncementFeed({ limit = 5, compact = false }: { limit?: number; compact?: boolean }) {
  const { data: announcements, isLoading } = useAnnouncements()
  const markRead = useMarkRead()
  const path = useCommunityPath()

  if (isLoading || !announcements?.length) return null

  const now = new Date()
  const active = announcements
    .filter((a) => !a.expires_at || new Date(a.expires_at) > now)
    .slice(0, limit)

  if (active.length === 0) return null

  const unreadCount = active.filter((a) => !a.read).length

  const handleMarkRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    markRead.mutate(id)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground px-1">
          <Megaphone className="h-4 w-4" />
          Anuncios
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 justify-center text-[10px]">{unreadCount}</Badge>
          )}
        </h3>
        {announcements.length > limit && (
          <Link to={path('announcements')}>
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              Ver todos <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
      {active.map((a) => (
        <AnnouncementCard key={a.id} announcement={a} compact={compact} onMarkRead={handleMarkRead} />
      ))}
    </div>
  )
}

function AnnouncementCard({
  announcement: a,
  compact,
  onMarkRead,
}: {
  announcement: Announcement
  compact: boolean
  onMarkRead: (e: React.MouseEvent, id: string) => void
}) {
  return (
    <Card className={`rounded-xl transition-colors ${PRIORITY_STYLES[a.priority] || ''} ${!a.read ? 'ring-1 ring-primary/20' : ''}`}>
      <CardContent className={compact ? 'py-3 px-4' : 'pt-4 pb-4'}>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {a.pinned && <Pin className="h-3 w-3 text-amber-500 shrink-0" />}
              <p className={`text-sm font-semibold truncate ${!a.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                {a.title}
              </p>
              {a.priority === 'urgent' && <Badge variant="destructive" className="text-[10px]">Urgente</Badge>}
            </div>
            {!compact && (
              <p className="text-sm text-muted-foreground line-clamp-2">{a.body}</p>
            )}
            <p className="text-xs text-muted-foreground">{timeAgo(a.published_at)}</p>
          </div>
          {!a.read && (
            <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-xs text-muted-foreground" onClick={(e) => onMarkRead(e, a.id)}>
              <Eye className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
