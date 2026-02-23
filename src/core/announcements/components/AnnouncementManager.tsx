import { useState } from 'react'
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Plus, Pin, Trash2, Pencil, Megaphone, Eye } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import type { Announcement } from '../types'

const PRIORITY_LABELS: Record<string, string> = { low: 'Baja', normal: 'Normal', urgent: 'Urgente' }

export function AnnouncementManager() {
  const { data: announcements, isLoading } = useAnnouncements()
  const create = useCreateAnnouncement()
  const update = useUpdateAnnouncement()
  const remove = useDeleteAnnouncement()
  const { canManageMembers } = usePermissions()
  const toast = useToast()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [priority, setPriority] = useState('normal')
  const [pinned, setPinned] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')

  const openCreate = () => {
    setEditing(null)
    setTitle('')
    setBody('')
    setPriority('normal')
    setPinned(false)
    setExpiresAt('')
    setShowForm(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setTitle(a.title)
    setBody(a.body)
    setPriority(a.priority)
    setPinned(a.pinned)
    setExpiresAt(a.expires_at ? a.expires_at.split('T')[0] : '')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      title: title.trim(),
      body: body.trim(),
      priority,
      pinned,
      expires_at: expiresAt ? `${expiresAt}T23:59:59` : null,
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, updates: payload })
        toast.success('Anuncio actualizado')
      } else {
        await create.mutateAsync(payload)
        toast.success('Anuncio publicado')
      }
      setShowForm(false)
    } catch {
      toast.error('Error al guardar anuncio')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio?')) return
    try {
      await remove.mutateAsync(id)
      toast.success('Anuncio eliminado')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleTogglePin = (a: Announcement) => {
    update.mutate({ id: a.id, updates: { pinned: !a.pinned } })
  }

  if (isLoading) return <LoadingSpinner className="py-8" />

  const isPending = create.isPending || update.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{announcements?.length ?? 0} anuncios publicados</p>
        {canManageMembers && (
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> Nuevo Anuncio
          </Button>
        )}
      </div>

      {!announcements?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Sin anuncios publicados.</p>
          {canManageMembers && (
            <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
              Publicar el primero
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card key={a.id} className="rounded-xl">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.pinned && <Pin className="h-3 w-3 text-amber-500" />}
                      <p className="text-sm font-semibold">{a.title}</p>
                      <Badge variant={a.priority === 'urgent' ? 'destructive' : a.priority === 'low' ? 'secondary' : 'default'} className="text-[10px]">
                        {PRIORITY_LABELS[a.priority]}
                      </Badge>
                      {a.read && <Eye className="h-3 w-3 text-green-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.published_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {a.expires_at && ` · Expira ${new Date(a.expires_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  {canManageMembers && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" title={a.pinned ? 'Desfijar' : 'Fijar'} onClick={() => handleTogglePin(a)}>
                        <Pin className={`h-4 w-4 ${a.pinned ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} disabled={remove.isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent onClose={() => setShowForm(false)}>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Anuncio' : 'Nuevo Anuncio'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Aviso de corte de agua" />
              </div>
              <div className="space-y-2">
                <Label>Mensaje</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} placeholder="Detalle del anuncio..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgente</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Expira (opcional)</Label>
                  <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input id="pin-toggle" type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 rounded border-input" />
                <Label htmlFor="pin-toggle">Fijar en la parte superior</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'Guardando...' : editing ? 'Guardar' : 'Publicar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
