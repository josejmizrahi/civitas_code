import { useState } from 'react'
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from '../hooks/useAnnouncements'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useI18n } from '@/shared/hooks/useI18n'
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

export function AnnouncementManager() {
  const { t } = useI18n()
  const { data: announcements, isLoading } = useAnnouncements()
  const create = useCreateAnnouncement()
  const update = useUpdateAnnouncement()
  const remove = useDeleteAnnouncement()
  const { canManageMembers } = usePermissions()
  const toast = useToast()

  const PRIORITY_LABELS: Record<string, string> = {
    low: t('announcements.priority.low' as any),
    normal: t('announcements.priority.normal' as any),
    urgent: t('announcements.priority.urgent' as any),
  }

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
        toast.success(t('announcements.updated' as any))
      } else {
        await create.mutateAsync(payload)
        toast.success(t('announcements.published' as any))
      }
      setShowForm(false)
    } catch {
      toast.error(t('announcements.errorSaving' as any))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('announcements.confirmDelete' as any))) return
    try {
      await remove.mutateAsync(id)
      toast.success(t('announcements.deleted' as any))
    } catch {
      toast.error(t('announcements.errorDeleting' as any))
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
        <p className="text-sm text-muted-foreground">{announcements?.length ?? 0} {t('announcements.publishedCount' as any)}</p>
        {canManageMembers && (
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" /> {t('announcements.new' as any)}
          </Button>
        )}
      </div>

      {!announcements?.length ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">{t('announcements.empty' as any)}</p>
          {canManageMembers && (
            <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
              {t('announcements.publishFirst' as any)}
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
                      {a.expires_at && ` · ${t('announcements.expires' as any)} ${new Date(a.expires_at).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                  {canManageMembers && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" title={a.pinned ? t('announcements.unpin' as any) : t('announcements.pin' as any)} onClick={() => handleTogglePin(a)}>
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
            <DialogTitle>{editing ? t('announcements.edit' as any) : t('announcements.new' as any)}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{t('announcements.title' as any)}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ej: Aviso de corte de agua" />
              </div>
              <div className="space-y-2">
                <Label>{t('announcements.message' as any)}</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={4} placeholder="Detalle del anuncio..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('announcements.priority' as any)}</Label>
                  <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    <option value="low">{t('announcements.priority.low' as any)}</option>
                    <option value="normal">{t('announcements.priority.normal' as any)}</option>
                    <option value="urgent">{t('announcements.priority.urgent' as any)}</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('announcements.expiresOptional' as any)}</Label>
                  <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input id="pin-toggle" type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 rounded border-input" />
                <Label htmlFor="pin-toggle">{t('announcements.pinToTop' as any)}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isPending}>{isPending ? t('common.saving') : editing ? t('common.save') : t('announcements.publish' as any)}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
