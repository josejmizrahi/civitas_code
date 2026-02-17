import { useState } from 'react'
import { useCreateMaintenanceRequest } from '../hooks/useMaintenanceRequests'
import { useUnits } from '../hooks/useUnits'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MaintenanceRequestForm({ open, onOpenChange }: Props) {
  const { data: units } = useUnits()
  const createRequest = useCreateMaintenanceRequest()
  const [unitId, setUnitId] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createRequest.mutateAsync({ unit_id: unitId, description, priority })
      onOpenChange(false)
      setUnitId('')
      setDescription('')
      setPriority('medium')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear solicitud')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Mantenimiento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}
            <div className="space-y-2">
              <Label>Unidad</Label>
              <Select value={unitId} onChange={(e) => setUnitId(e.target.value)} required>
                <option value="">Seleccionar unidad</option>
                {units?.map((u) => (
                  <option key={u.id} value={u.id}>{u.unit_number}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prioridad</Label>
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe el problema de mantenimiento"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={createRequest.isPending}>
              {createRequest.isPending ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
