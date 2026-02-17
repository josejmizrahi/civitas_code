import { useState } from 'react'
import { useCommonAreas, useDeleteCommonArea } from '../hooks/useResidential'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { CommonAreaForm } from './CommonAreaForm'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { CommonArea } from '../types'

export function CommonAreaList() {
  const { data: areas, isLoading } = useCommonAreas()
  const deleteArea = useDeleteCommonArea()
  const { isAdmin } = usePermissions()

  const [showForm, setShowForm] = useState(false)
  const [editingArea, setEditingArea] = useState<CommonArea | null>(null)

  const handleEdit = (area: CommonArea) => {
    setEditingArea(area)
    setShowForm(true)
  }

  const handleCreate = () => {
    setEditingArea(null)
    setShowForm(true)
  }

  const handleDelete = async (areaId: string) => {
    if (!confirm('¿Eliminar esta área común?')) return
    await deleteArea.mutateAsync(areaId)
  }

  if (isLoading) return <LoadingSpinner message="Cargando áreas comunes..." className="py-8" />

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Area Comun
          </Button>
        </div>
      )}

      {!areas || areas.length === 0 ? (
        <p className="text-muted-foreground">No hay areas comunes registradas.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Reglas</TableHead>
                <TableHead>Reservaciones</TableHead>
                {isAdmin && <TableHead className="text-right">Acciones</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">
                    {area.rules || '\u2014'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={area.reservation_enabled ? 'success' : 'secondary'}>
                      {area.reservation_enabled ? 'Habilitadas' : 'No disponible'}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(area)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(area.id)}
                          disabled={deleteArea.isPending}
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
        </div>
      )}

      <CommonAreaForm
        open={showForm}
        onOpenChange={setShowForm}
        area={editingArea}
      />
    </div>
  )
}
