import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { useCreateCommonArea, useUpdateCommonArea } from '../hooks/useResidential'
import type { CommonArea } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  area?: CommonArea | null
}

export function CommonAreaForm({ open, onOpenChange, area }: Props) {
  const createArea = useCreateCommonArea()
  const updateArea = useUpdateCommonArea()

  const isEdit = !!area

  const [name, setName] = useState('')
  const [rules, setRules] = useState('')
  const [reservationEnabled, setReservationEnabled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      if (area) {
        setName(area.name)
        setRules(area.rules ?? '')
        setReservationEnabled(area.reservation_enabled)
      } else {
        setName('')
        setRules('')
        setReservationEnabled(false)
      }
      setError('')
    })
  }, [area, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const payload = {
      name: name.trim(),
      rules: rules.trim() || null,
      reservation_enabled: reservationEnabled,
    }

    try {
      if (isEdit) {
        await updateArea.mutateAsync({ areaId: area.id, updates: payload })
      } else {
        await createArea.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar area comun')
    }
  }

  const isPending = createArea.isPending || updateArea.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Area Comun' : 'Nueva Area Comun'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ej: Alberca, Salon de usos multiples"
              />
            </div>

            <div className="space-y-2">
              <Label>Reglas de uso</Label>
              <Textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Reglas y horarios de uso (opcional)"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="reservation-toggle"
                type="checkbox"
                checked={reservationEnabled}
                onChange={(e) => setReservationEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="reservation-toggle">Permitir reservaciones</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Area'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
