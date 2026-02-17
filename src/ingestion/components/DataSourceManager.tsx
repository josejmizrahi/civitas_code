import { useState } from 'react'
import { useDataSources, useCreateDataSource } from '../hooks/useDataSources'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { SyncStatusBadge } from '@/core/treasury/components/SyncStatusBadge'
import { Plus } from 'lucide-react'

interface Props {
  onSelectSource: (sourceId: string) => void
}

export function DataSourceManager({ onSelectSource }: Props) {
  const { data: sources, isLoading } = useDataSources()
  const createSource = useCreateDataSource()
  const [showDialog, setShowDialog] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('csv')

  const handleCreate = async () => {
    await createSource.mutateAsync({ name, type })
    setShowDialog(false)
    setName('')
    setType('csv')
  }

  if (isLoading) return <LoadingSpinner message="Cargando fuentes de datos..." className="py-8" />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Fuente
        </Button>
      </div>

      {sources && sources.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Última sync</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.type.toUpperCase()}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <SyncStatusBadge lastSyncAt={s.last_sync_at} status={s.status} />
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onSelectSource(s.id)}>
                      Importar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-muted-foreground">No hay fuentes de datos configuradas.</p>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent onClose={() => setShowDialog(false)}>
          <DialogHeader>
            <DialogTitle>Nueva Fuente de Datos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Estado de cuenta Banorte"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || createSource.isPending}>
              {createSource.isPending ? 'Creando...' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
