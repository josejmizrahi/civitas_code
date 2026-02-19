import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { useCreateUnit, useUpdateUnit } from '../hooks/useResidential'
import { useMembers } from '@/core/identity/hooks/useMembers'
import type { Unit } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  unit?: Unit | null
}

export function UnitForm({ open, onOpenChange, unit }: Props) {
  const createUnit = useCreateUnit()
  const updateUnit = useUpdateUnit()
  const { data: members } = useMembers()

  const isEdit = !!unit

  const [unitNumber, setUnitNumber] = useState('')
  const [floor, setFloor] = useState('')
  const [tower, setTower] = useState('')
  const [areaM2, setAreaM2] = useState('')
  const [indivisoPct, setIndivisoPct] = useState('')
  const [memberId, setMemberId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    queueMicrotask(() => {
      if (unit) {
        setUnitNumber(unit.unit_number)
        setFloor(unit.floor != null ? String(unit.floor) : '')
        setTower(unit.tower ?? '')
        setAreaM2(unit.area_m2 != null ? String(unit.area_m2) : '')
        setIndivisoPct(unit.indiviso_pct != null ? String(unit.indiviso_pct) : '')
        setMemberId(unit.member_id ?? '')
      } else {
        setUnitNumber('')
        setFloor('')
        setTower('')
        setAreaM2('')
        setIndivisoPct('')
        setMemberId('')
      }
      setError('')
    })
  }, [unit, open])

  const activeMembers = (members ?? []).filter((m) => m.status === 'active')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const payload = {
      unit_number: unitNumber.trim(),
      floor: floor ? Number(floor) : null,
      tower: tower.trim() || null,
      area_m2: areaM2 ? Number(areaM2) : null,
      indiviso_pct: indivisoPct ? Number(indivisoPct) : null,
      member_id: memberId || null,
    }

    try {
      if (isEdit) {
        await updateUnit.mutateAsync({ unitId: unit.id, updates: payload })
      } else {
        await createUnit.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar unidad')
    }
  }

  const isPending = createUnit.isPending || updateUnit.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Unidad' : 'Nueva Unidad'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-2">
              <Label>Numero de unidad</Label>
              <Input
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                required
                placeholder="Ej: A-101"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Piso</Label>
                <Input
                  type="number"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="Ej: 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Torre</Label>
                <Input
                  value={tower}
                  onChange={(e) => setTower(e.target.value)}
                  placeholder="Ej: A"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Area (m2)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={areaM2}
                  onChange={(e) => setAreaM2(e.target.value)}
                  placeholder="Ej: 85.50"
                />
              </div>
              <div className="space-y-2">
                <Label>Indiviso (%)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={indivisoPct}
                  onChange={(e) => setIndivisoPct(e.target.value)}
                  placeholder="Ej: 1.2345"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Propietario (opcional)</Label>
              <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="">Sin asignar</option>
                {activeMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email || m.id.slice(0, 8)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : isEdit ? 'Guardar Cambios' : 'Crear Unidad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
