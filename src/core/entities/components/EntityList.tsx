import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntities, useCreateEntity, useDeleteEntity } from '../hooks/useEntities'
import { useAllRatingSummaries } from '../hooks/useRatings'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Plus, Trash2, Star, Building2, Phone, Mail, Search } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { useConfirm } from '@/shared/components/ConfirmDialog'
import { ENTITY_TYPE_LABELS, ENTITY_STATUS_LABELS } from '../types'
import type { EntityType, EntityStatus } from '@/shared/types'

export function EntityList() {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const { data: entities, isLoading } = useEntities({
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  })
  const { data: ratingSummaries } = useAllRatingSummaries('entity')
  const { canManageTreasury } = usePermissions()
  const createEntity = useCreateEntity()
  const deleteEntity = useDeleteEntity()
  const toast = useToast()

  const ratingMap = new Map(
    ratingSummaries?.map(r => [r.target_id, r]) ?? []
  )

  const filteredEntities = entities?.filter((e) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return e.name.toLowerCase().includes(q) || e.contact_person?.toLowerCase().includes(q) || e.email?.toLowerCase().includes(q) || e.rfc?.toLowerCase().includes(q)
  }) ?? []

  // Create form state
  const [form, setForm] = useState({
    name: '', type: 'proveedor' as EntityType, rfc: '', email: '', phone: '',
    address: '', contact_person: '', notes: '', status: 'active' as EntityStatus,
    clabe: null as string | null, bank_name: null as string | null, created_by: null as string | null,
  })
  const [error, setError] = useState('')

  const resetForm = () => {
    setForm({
      name: '', type: 'proveedor', rfc: '', email: '', phone: '',
      address: '', contact_person: '', notes: '', status: 'active',
      clabe: null, bank_name: null, created_by: null,
    })
    setError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { setError('El nombre es obligatorio'); return }
    try {
      await createEntity.mutateAsync(form)
      resetForm()
      setShowCreate(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear entidad')
    }
  }

  const confirmDialog = useConfirm()

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar entidad',
      description: `Se eliminara "${name}" permanentemente. Esta accion no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    })
    if (confirmed) {
      deleteEntity.mutate(id, {
        onSuccess: () => toast.success('Entidad eliminada'),
        onError: () => toast.error('Error al eliminar entidad'),
      })
    }
  }

  function statusVariant(status: string): 'success' | 'secondary' | 'destructive' {
    switch (status) {
      case 'active': return 'success'
      case 'blacklisted': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, RFC, contacto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="flex-1 sm:w-44">
              <option value="">Todos los tipos</option>
              {Object.entries(ENTITY_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex-1 sm:w-36">
              <option value="">Todos</option>
              {Object.entries(ENTITY_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </div>
        </div>
        {canManageTreasury && (
          <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Entidad
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Contacto</TableHead>
              <TableHead className="hidden sm:table-cell">Rating</TableHead>
              <TableHead>Estado</TableHead>
              {canManageTreasury && <TableHead className="w-20">Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManageTreasury ? 6 : 5} className="text-center text-muted-foreground">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : !entities || filteredEntities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManageTreasury ? 6 : 5} className="text-center text-muted-foreground">
                  No hay entidades registradas. Agrega proveedores, socios y contratistas.
                </TableCell>
              </TableRow>
            ) : (
              filteredEntities.map((entity) => {
                const rating = ratingMap.get(entity.id)
                return (
                  <TableRow key={entity.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/entities/${entity.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{entity.name}</div>
                          {entity.rfc && <div className="text-xs text-muted-foreground">RFC: {entity.rfc}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ENTITY_TYPE_LABELS[entity.type as EntityType] || entity.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="space-y-0.5 text-sm">
                        {entity.contact_person && <div>{entity.contact_person}</div>}
                        {entity.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />{entity.email}
                          </div>
                        )}
                        {entity.phone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />{entity.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{rating.avg_score}</span>
                          <span className="text-xs text-muted-foreground">({rating.total_ratings})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin calificar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(entity.status)}>
                        {ENTITY_STATUS_LABELS[entity.status as EntityStatus] || entity.status}
                      </Badge>
                    </TableCell>
                    {canManageTreasury && (
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); handleDelete(entity.id, entity.name) }}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Entity Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader>
            <DialogTitle>Nueva Entidad</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nombre *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nombre de la entidad" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as EntityType })}>
                    {Object.entries(ENTITY_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>RFC</Label>
                  <Input value={form.rfc} onChange={(e) => setForm({ ...form, rfc: e.target.value })} placeholder="Opcional" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contacto@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+52 ..." />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Persona de Contacto</Label>
                  <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} placeholder="Nombre del contacto principal" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Dirección</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Dirección fiscal o comercial" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Notas</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notas internas" rows={2} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setShowCreate(false) }}>Cancelar</Button>
              <Button type="submit" disabled={createEntity.isPending}>
                {createEntity.isPending ? 'Creando...' : 'Crear Entidad'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
