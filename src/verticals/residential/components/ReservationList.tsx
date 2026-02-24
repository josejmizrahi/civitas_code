import { useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { useReservations, useCancelReservation, useCommonAreas, useCreateReservation } from '../hooks/useResidential'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { StatusBadge } from '@/shared/components/ui/status-badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Plus, Calendar, Clock, MapPin, X } from 'lucide-react'
import type { Reservation } from '../types'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
}

const STATUS_VARIANTS: Record<string, 'default' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'default',
  confirmed: 'success',
  cancelled: 'secondary',
}

export function ReservationList() {
  const { currentMember } = useCommunityContext()
  const { data: reservations, isLoading } = useReservations()
  const { data: areas } = useCommonAreas()
  const { data: members } = useMembers()
  const cancelReservation = useCancelReservation()
  const createReservation = useCreateReservation()

  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<string>('upcoming')

  const [formArea, setFormArea] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formStartTime, setFormStartTime] = useState('09:00')
  const [formEndTime, setFormEndTime] = useState('10:00')
  const [formNotes, setFormNotes] = useState('')
  const [formError, setFormError] = useState('')

  const areaMap = new Map((areas ?? []).map((a) => [a.id, a.name]))
  const memberMap = new Map((members ?? []).map((m) => [m.id, m.full_name || m.email || 'Sin nombre']))
  const reservableAreas = (areas ?? []).filter((a) => a.reservation_enabled)

  const now = new Date()
  const enriched = (reservations ?? []).map((r) => ({
    ...r,
    area_name: areaMap.get(r.common_area_id) || 'Área',
    member_name: memberMap.get(r.member_id) || 'Miembro',
  }))

  const filtered = enriched.filter((r) => {
    if (filter === 'upcoming') return new Date(r.end_time) >= now && r.status !== 'cancelled'
    if (filter === 'past') return new Date(r.end_time) < now
    if (filter === 'mine') return r.member_id === currentMember?.id && r.status !== 'cancelled'
    return true
  }).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta reservación?')) return
    await cancelReservation.mutateAsync(id)
  }

  const resetForm = () => {
    setFormArea(reservableAreas[0]?.id || '')
    setFormTitle('')
    setFormDate('')
    setFormStartTime('09:00')
    setFormEndTime('10:00')
    setFormNotes('')
    setFormError('')
  }

  const handleOpenForm = () => {
    resetForm()
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!formArea || !formTitle.trim() || !formDate) {
      setFormError('Completa todos los campos requeridos')
      return
    }
    if (!currentMember) return

    const startTime = `${formDate}T${formStartTime}:00`
    const endTime = `${formDate}T${formEndTime}:00`
    if (endTime <= startTime) {
      setFormError('La hora de fin debe ser después de la hora de inicio')
      return
    }

    try {
      await createReservation.mutateAsync({
        common_area_id: formArea,
        member_id: currentMember.id,
        title: formTitle.trim(),
        start_time: startTime,
        end_time: endTime,
        notes: formNotes.trim() || null,
      })
      setShowForm(false)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error al crear reservación')
    }
  }

  if (isLoading) return <LoadingSpinner message="Cargando reservaciones..." className="py-8" />

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select className="w-full sm:w-48" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="upcoming">Próximas</option>
          <option value="mine">Mis reservaciones</option>
          <option value="past">Pasadas</option>
          <option value="all">Todas</option>
        </Select>
        {reservableAreas.length > 0 && (
          <Button onClick={handleOpenForm} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nueva Reservación
          </Button>
        )}
      </div>

      {reservableAreas.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay áreas comunes con reservaciones habilitadas. Un administrador puede habilitarlas desde la pestaña "Áreas Comunes".
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin reservaciones.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              isOwn={r.member_id === currentMember?.id}
              onCancel={handleCancel}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}

      {/* Create form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent onClose={() => setShowForm(false)}>
          <DialogHeader>
            <DialogTitle>Nueva Reservación</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {formError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{formError}</div>
              )}
              <div className="space-y-2">
                <Label>Área común</Label>
                <Select value={formArea} onChange={(e) => setFormArea(e.target.value)} required>
                  <option value="">Selecciona un área</option>
                  {reservableAreas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Motivo / Título</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej: Reunión familiar" required />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input type="time" value={formStartTime} onChange={(e) => setFormStartTime(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input type="time" value={formEndTime} onChange={(e) => setFormEndTime(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Indicaciones adicionales..." rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createReservation.isPending}>
                {createReservation.isPending ? 'Reservando...' : 'Reservar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReservationCard({
  reservation: r,
  isOwn,
  onCancel,
  formatDate: fmtDate,
  formatTime: fmtTime,
}: {
  reservation: Reservation & { area_name: string; member_name: string }
  isOwn: boolean
  onCancel: (id: string) => void
  formatDate: (iso: string) => string
  formatTime: (iso: string) => string
}) {
  const isPast = new Date(r.end_time) < new Date()

  return (
    <Card className={`rounded-xl transition-colors ${isPast ? 'opacity-60' : ''}`}>
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{r.title}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {r.area_name}
            </p>
          </div>
          <StatusBadge status={r.status} variantMap={STATUS_VARIANTS} labelMap={STATUS_LABELS} className="shrink-0 text-xs" />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> {fmtDate(r.start_time)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {fmtTime(r.start_time)} – {fmtTime(r.end_time)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">Reservó: {r.member_name}</p>
        {r.notes && <p className="text-xs text-muted-foreground italic">{r.notes}</p>}
        {isOwn && r.status !== 'cancelled' && !isPast && (
          <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => onCancel(r.id)}>
            <X className="h-3 w-3" /> Cancelar
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
