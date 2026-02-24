import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAssemblies } from '@/core/governance/hooks/useAssemblies'
import { useProposals } from '@/core/governance/hooks/useProposals'
import { usePaymentObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useCommunityContext } from '@/app/providers'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/utils'
import { useI18n } from '@/shared/hooks/useI18n'
import { Calendar, ChevronLeft, ChevronRight, Vote, Landmark, Receipt, Megaphone } from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: 'assembly' | 'proposal' | 'payment' | 'announcement'
  href: string
  meta?: string
}

const TYPE_CONFIG: Record<string, { icon: typeof Calendar; color: string; label: string }> = {
  assembly: { icon: Landmark, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30', label: 'Asamblea' },
  proposal: { icon: Vote, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', label: 'Propuesta' },
  payment: { icon: Receipt, color: 'text-red-600 bg-red-100 dark:bg-red-900/30', label: 'Pago' },
  announcement: { icon: Megaphone, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30', label: 'Anuncio' },
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function CalendarPage() {
  const { t } = useI18n()
  const path = useCommunityPath()
  const { currentMember } = useCommunityContext()
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const { data: assemblies } = useAssemblies()
  const { data: proposals } = useProposals(undefined)
  const { data: obligations } = usePaymentObligations(currentMember?.id)

  const events = useMemo<CalendarEvent[]>(() => {
    const items: CalendarEvent[] = []

    for (const a of assemblies ?? []) {
      if (a.scheduled_date) {
        items.push({
          id: `asm-${a.id}`,
          title: a.title,
          date: new Date(a.scheduled_date),
          type: 'assembly',
          href: path(`governance/assemblies/${a.id}`),
          meta: a.status,
        })
      }
    }

    for (const p of proposals ?? []) {
      if (p.voting_end) {
        items.push({
          id: `prop-${p.id}`,
          title: p.title,
          date: new Date(p.voting_end),
          type: 'proposal',
          href: path(`governance/${p.id}`),
          meta: `Cierra votación`,
        })
      }
    }

    for (const o of obligations ?? []) {
      if (o.due_date && (o.status === 'pending' || o.status === 'overdue')) {
        items.push({
          id: `pay-${o.id}`,
          title: o.concept || 'Pago pendiente',
          date: new Date(o.due_date),
          type: 'payment',
          href: path('my-payments'),
          meta: o.status === 'overdue' ? 'Vencido' : 'Pendiente',
        })
      }
    }

    return items.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [assemblies, proposals, obligations, path])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const totalDays = lastDay.getDate()
  const today = new Date()

  const weeks: (number | null)[][] = []
  let week: (number | null)[] = Array(startOffset).fill(null)
  for (let d = 1; d <= totalDays; d++) {
    week.push(d)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null)
    weeks.push(week)
  }

  const eventsForDay = (day: number) => {
    const date = new Date(year, month, day)
    return events.filter((e) => sameDay(e.date, date))
  }

  const selectedEvents = selectedDate
    ? events.filter((e) => sameDay(e.date, selectedDate))
    : events.filter((e) => {
        const d = e.date
        return d.getFullYear() === year && d.getMonth() === month
      }).slice(0, 10)

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToday = () => {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(now)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <Calendar className="h-6 w-6 text-blue-600" />
          {t('calendar.title')}
        </h1>
        <p className="text-sm text-muted-foreground">{t('calendar.subtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <Card className="rounded-xl">
          <CardContent className="pt-4 pb-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
                <Button variant="outline" size="sm" className="text-xs" onClick={goToday}>{t('calendar.today')}</Button>
              </div>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
            </div>

            {/* Weeks */}
            <div className="grid grid-cols-7 gap-px">
              {weeks.flat().map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="aspect-square" />
                const dayEvents = eventsForDay(day)
                const isToday = sameDay(new Date(year, month, day), today)
                const isSelected = selectedDate && sameDay(new Date(year, month, day), selectedDate)
                return (
                  <button
                    key={`day-${day}`}
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-start rounded-lg p-1 text-sm transition-colors hover:bg-muted',
                      isToday && 'ring-2 ring-primary',
                      isSelected && 'bg-primary/10',
                    )}
                  >
                    <span className={cn('text-xs font-medium', isToday && 'text-primary font-bold')}>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                        {dayEvents.slice(0, 3).map((e) => {
                          const cfg = TYPE_CONFIG[e.type]
                          return <div key={e.id} className={cn('h-1.5 w-1.5 rounded-full', cfg.color.split(' ')[0].replace('text-', 'bg-'))} />
                        })}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={cn('h-2 w-2 rounded-full', cfg.color.split(' ')[0].replace('text-', 'bg-'))} />
                  {cfg.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {selectedDate
              ? selectedDate.toLocaleDateString('es-MX', { weekday: 'long', month: 'long', day: 'numeric' })
              : `${t('calendar.eventsFor')} ${MONTHS[month]}`}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('calendar.noEvents')}</p>
          ) : (
            selectedEvents.map((e) => {
              const cfg = TYPE_CONFIG[e.type]
              const Icon = cfg.icon
              return (
                <Link key={e.id} to={e.href}>
                  <Card className="rounded-xl transition-colors hover:bg-muted/50">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-lg p-1.5', cfg.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <p className="text-sm font-medium truncate">{e.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}
                            {' · '}
                            {e.date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {e.meta && <Badge variant="secondary" className="text-[10px]">{e.meta}</Badge>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
