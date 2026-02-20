import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select } from '@/shared/components/ui/select'
import { useCreateAssembly } from '../hooks/useAssemblies'
import { useToast } from '@/shared/components/ui/toast'
import { useCommunityContext } from '@/app/providers'
import { getCommunityRules } from '@/shared/services/rules.service'
import { Plus, Trash2, AlertTriangle, GripVertical } from 'lucide-react'
import type { AgendaItem } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAssemblyDialog({ open, onOpenChange }: Props) {
  const { community } = useCommunityContext()
  const createAssembly = useCreateAssembly()
  const toast = useToast()

  const rules = community
    ? getCommunityRules(community.config, community.rules as any)
    : null
  const minNoticeDays = rules?.governance.minimum_notice_days ?? 7

  const [type, setType] = useState('ordinary')
  const [title, setTitle] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [location, setLocation] = useState('')
  const [agenda, setAgenda] = useState<AgendaItem[]>([
    { order: 1, topic: '', description: '' },
  ])

  const noticeWarning = useMemo(() => {
    if (!scheduledDate) return false
    const diff = Math.ceil(
      // eslint-disable-next-line react-hooks/purity
      (new Date(scheduledDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return diff < minNoticeDays
  }, [scheduledDate, minNoticeDays])

  function addAgendaItem() {
    setAgenda((prev) => [
      ...prev,
      { order: prev.length + 1, topic: '', description: '' },
    ])
  }

  function removeAgendaItem(index: number) {
    setAgenda((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, order: i + 1 }))
    )
  }

  function updateAgendaItem(
    index: number,
    field: 'topic' | 'description',
    value: string
  ) {
    setAgenda((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function moveAgendaItem(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === agenda.length - 1) return

    setAgenda((prev) => {
      const next = [...prev]
      const swapIndex = direction === 'up' ? index - 1 : index + 1
      ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
      return next.map((item, i) => ({ ...item, order: i + 1 }))
    })
  }

  function resetForm() {
    setType('ordinary')
    setTitle('')
    setScheduledDate('')
    setLocation('')
    setAgenda([{ order: 1, topic: '', description: '' }])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('El titulo es requerido')
      return
    }
    if (!scheduledDate) {
      toast.error('La fecha es requerida')
      return
    }
    if (!location.trim()) {
      toast.error('La ubicacion es requerida')
      return
    }
    if (agenda.some((item) => !item.topic.trim())) {
      toast.error('Todos los puntos del orden del dia deben tener un tema')
      return
    }

    try {
      await createAssembly.mutateAsync({
        type,
        title: title.trim(),
        scheduled_date: new Date(scheduledDate).toISOString(),
        location: location.trim(),
        agenda,
      })
      toast.success('Asamblea creada exitosamente. Se genero la convocatoria automaticamente.')
      resetForm()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear asamblea')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-2xl"
        onClose={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>Nueva Asamblea</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="assembly-type">Tipo de Asamblea</Label>
            <Select
              id="assembly-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="ordinary">Ordinaria</option>
              <option value="extraordinary">Extraordinaria</option>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="assembly-title">Titulo</Label>
            <Input
              id="assembly-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Asamblea Ordinaria Q1 2026"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="assembly-date">Fecha y Hora</Label>
            <Input
              id="assembly-date"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            {noticeWarning && (
              <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 rounded-md px-3 py-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  La convocatoria debe emitirse con al menos {minNoticeDays} dias
                  de anticipacion (Art. 34 LPCI). La fecha seleccionada no cumple
                  este requisito.
                </span>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="assembly-location">Ubicacion</Label>
            <Input
              id="assembly-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Salon de usos multiples, Piso 1"
            />
          </div>

          {/* Agenda */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Orden del Dia</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAgendaItem}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar punto
              </Button>
            </div>

            <div className="space-y-3">
              {agenda.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-2 items-start rounded-md border p-3"
                >
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => moveAgendaItem(index, 'up')}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-4 w-4 rotate-180" />
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => moveAgendaItem(index, 'down')}
                      disabled={index === agenda.length - 1}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="mt-1.5 text-sm font-medium text-muted-foreground w-6 shrink-0">
                    {item.order}.
                  </span>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Tema"
                      value={item.topic}
                      onChange={(e) =>
                        updateAgendaItem(index, 'topic', e.target.value)
                      }
                    />
                    <Textarea
                      placeholder="Descripcion (opcional)"
                      value={item.description}
                      onChange={(e) =>
                        updateAgendaItem(index, 'description', e.target.value)
                      }
                      className="min-h-[40px]"
                    />
                  </div>
                  {agenda.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAgendaItem(index)}
                      className="shrink-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createAssembly.isPending}>
              {createAssembly.isPending ? 'Creando...' : 'Crear Asamblea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
