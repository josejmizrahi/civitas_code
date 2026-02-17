import { useState } from 'react'
import { useUnitsWithMembers, useDeleteUnit } from '../hooks/useResidential'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Button } from '@/shared/components/ui/button'
import { UnitForm } from './UnitForm'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { Unit } from '../types'

export function UnitDirectory() {
  const { data: units, isLoading } = useUnitsWithMembers()
  const deleteUnit = useDeleteUnit()
  const { isAdmin } = usePermissions()

  const [showForm, setShowForm] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingUnit(null)
    setShowForm(true)
  }

  const handleDelete = async (unitId: string) => {
    if (!confirm('¿Eliminar esta unidad?')) return
    await deleteUnit.mutateAsync(unitId)
  }

  const totalIndiviso = (units ?? []).reduce(
    (sum, u) => sum + (u.indiviso_pct ?? 0),
    0,
  )

  if (isLoading) return <LoadingSpinner message="Cargando unidades..." className="py-8" />

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Unidad
          </Button>
        </div>
      )}

      {!units || units.length === 0 ? (
        <p className="text-muted-foreground">No hay unidades registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unidad</TableHead>
                <TableHead>Piso</TableHead>
                <TableHead>Torre</TableHead>
                <TableHead>Propietario</TableHead>
                <TableHead className="text-right">Indiviso (%)</TableHead>
                <TableHead className="text-right">Area (m2)</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.unit_number}</TableCell>
                  <TableCell>{u.floor ?? '\u2014'}</TableCell>
                  <TableCell>{u.tower ?? '\u2014'}</TableCell>
                  <TableCell>{u.member_name ?? <span className="text-muted-foreground">Sin asignar</span>}</TableCell>
                  <TableCell className="text-right">{u.indiviso_pct?.toFixed(4) ?? '\u2014'}</TableCell>
                  <TableCell className="text-right">{u.area_m2 ?? '\u2014'}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(u)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(u.id)}
                          disabled={deleteUnit.isPending}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {units.length} unidad{units.length !== 1 ? 'es' : ''}
            </span>
            <span className="font-medium">
              Total indiviso: {totalIndiviso.toFixed(4)}%
            </span>
          </div>
        </div>
      )}

      <UnitForm
        open={showForm}
        onOpenChange={setShowForm}
        unit={editingUnit}
      />
    </div>
  )
}
