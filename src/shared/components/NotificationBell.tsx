import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale/es'
import {
  Bell,
  Vote,
  Clock,
  XCircle,
  CheckCircle,
  DollarSign,
  AlertTriangle,
  Receipt,
  UserPlus,
  Zap,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import {
  useNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from '@/shared/hooks/useNotifications'

const typeConfig: Record<string, { icon: typeof Bell; colorClass: string }> = {
  proposal_opened: { icon: Vote, colorClass: 'text-blue-500' },
  proposal_closing_soon: { icon: Clock, colorClass: 'text-orange-500' },
  proposal_closed: { icon: XCircle, colorClass: 'text-gray-500' },
  proposal_approved: { icon: CheckCircle, colorClass: 'text-green-500' },
  payment_due: { icon: DollarSign, colorClass: 'text-yellow-500' },
  payment_overdue: { icon: AlertTriangle, colorClass: 'text-red-500' },
  obligation_created: { icon: Receipt, colorClass: 'text-blue-500' },
  member_joined: { icon: UserPlus, colorClass: 'text-green-500' },
  execution_completed: { icon: Zap, colorClass: 'text-purple-500' },
}

function getNotificationRoute(notification: Notification): string | null {
  const meta = notification.metadata
  switch (notification.type) {
    case 'proposal_opened':
    case 'proposal_closing_soon':
    case 'proposal_closed':
    case 'proposal_approved':
      return meta?.proposalId ? `/governance/${meta.proposalId}` : '/governance'
    case 'payment_due':
    case 'payment_overdue':
    case 'obligation_created':
      return '/treasury'
    case 'member_joined':
      return '/members'
    case 'execution_completed':
      return meta?.proposalId ? `/governance/${meta.proposalId}` : '/governance'
    default:
      return null
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { data: notifications = [] } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadCount()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id)
    }
    const route = getNotificationRoute(notification)
    if (route) {
      navigate(route)
    }
    setOpen(false)
  }

  const handleMarkAllRead = () => {
    markAllAsRead.mutate()
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border bg-white shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todas como leidas
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No tienes notificaciones
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig[notification.type] ?? {
                  icon: Bell,
                  colorClass: 'text-gray-500',
                }
                const Icon = config.icon

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50',
                      !notification.read && 'bg-blue-50/50'
                    )}
                  >
                    <div className={cn('mt-0.5 shrink-0', config.colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'text-sm',
                          notification.read
                            ? 'text-muted-foreground'
                            : 'font-medium text-foreground'
                        )}
                      >
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {notification.body}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
