import { useState } from 'react'
import {
  useRecurringSchedules,
  useCreateRecurringSchedule,
  useUpdateRecurringSchedule,
  useDeleteRecurringSchedule,
  useProcessRecurringSchedules,
} from '../hooks/useRecurring'
import { useEntities } from '@/core/entities/hooks/useEntities'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { Plus, Play, Pause, Trash2, RefreshCw, CalendarClock } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'

const FREQ_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quincenal',
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
  custom: 'Personalizado',
}

export function RecurringScheduleList() {
  const { data: schedules, isLoading } = useRecurringSchedules()
  const { data: entities } = useEntities()
  const { canManageTreasury } = usePermissions()
  const createSchedule = useCreateRecurringSchedule()
  const updateSchedule = useUpdateRecurringSchedule()
  const deleteSchedule = useDeleteRecurringSchedule()
  const processAll = useProcessRecurringSchedules()
  const toast = useToast()

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    type: 'collection' as 'collection' | 'payment',
    frequency: 'monthly',
    amount: '',
    target_type: 'all_members',
    target_entity_id: '',
    day_of_month: '1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
  })
  const [error, setError] = useState('')

  const resetForm = () => {
    setForm({
      name: '', description: '', type: 'collection', frequency: 'monthly',
      amount: '', target_type: 'all_members', target_entity_id: '',
      day_of_month: '1', start_date: new Date().toISOString().split('T')[0], end_date: '',
    })
    setError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.amount) { setError('Nombre y monto son obligatorios'); return }
    try {
      await createSchedule.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        frequency: form.frequency,
        amount: parseFloat(form.amount),
        target_type: form.target_type,
        target_entity_id: form.target_entity_id || undefined,
        day_of_month: parseInt(form.day_of_month),
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        next_run_date: form.start_date,
        created_by: '',
      })
      resetForm()
      setShowCreate(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    }
  }

  const handleToggle = (id: string, isActive: boolean) => {
    updateSchedule.mutate({ id, updates: { is_active: !isActive } }, {
      onSuccess: () => toast.success('Recurrente actualizado'),
      onError: () => toast.error('Error al actualizar recurrente'),
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Eliminar este cobro/pago recurrente?')) {
      deleteSchedule.mutate(id, {
        onSuccess: () => toast.success('Recurrente eliminado'),
        onError: () => toast.error('Error al eliminar recurrente'),
      })
    }
  }

  const activeCount = schedules?.filter(s => s.is_active).length ?? 0
  const collectionCount = schedules?.filter(s => s.type === 'collection').length ?? 0
  const paymentCount = schedules?.filter(s => s.type === 'payment').length ?? 0

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Activos</div>
            <div className="text-xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Cobros</div>
            <div className="text-xl font-bold text-green-600">{collectionCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Pagos</div>
            <div className="text-xl font-bold text-red-600">{paymentCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {canManageTreasury && (
          <Button variant="outline" onClick={() => processAll.mutate(undefined, {
            onSuccess: () => toast.success('Pendientes procesados'),
            onError: () => toast.error('Error al procesar pendientes'),
          })} disabled={processAll.isPending} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${processAll.isPending ? 'animate-spin' : ''}`} />
            Procesar Pendientes
          </Button>
        )}
        {canManageTreasury && (
          <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Recurrente
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="hidden sm:table-cell">Frecuencia</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="hidden md:table-cell">Proxima Ejecucion</TableHead>
              <TableHead>Estado</TableHead>
              {canManageTreasury && <TableHead>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : !schedules || schedules.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">
                Sin cobros o pagos recurrentes. Crea uno para automatizar cuotas y pagos a proveedores.
              </TableCell></TableRow>
            ) : (
              schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                    {s.entity_name && (
                      <div className="text-xs text-muted-foreground">Entidad: {s.entity_name}</div>
                    )}
                    {s.category_name && (
                      <div className="text-xs text-muted-foreground">Categoría: {s.category_name}</div>
                    )}
                    {s.target_type === 'all_members' && s.type === 'collection' && (
                      <div className="text-xs text-blue-600">Todos los miembros</div>
                    )}
                    {s.target_member_names && s.target_member_names.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Miembros: {s.target_member_names.slice(0, 3).join(', ')}
                        {s.target_member_names.length > 3 && ` +${s.target_member_names.length - 3} más`}
                      </div>
                    )}
                    {s.creator_name && (
                      <div className="text-xs text-muted-foreground">por {s.creator_name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.type === 'collection' ? 'success' : 'destructive'}>
                      {s.type === 'collection' ? 'Cobro' : 'Pago'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{FREQ_LABELS[s.frequency] || s.frequency}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(s.amount)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1 text-sm">
                      <CalendarClock className="h-3 w-3" />
                      {formatDate(s.next_run_date)}
                    </div>
                    {s.last_run_date && (
                      <div className="text-xs text-muted-foreground">Última: {formatDate(s.last_run_date)}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{s.runs_completed} ejecuciones</div>
                    {s.end_date && (
                      <div className="text-xs text-muted-foreground">Fin: {formatDate(s.end_date)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'success' : 'secondary'}>
                      {s.is_active ? 'Activo' : 'Pausado'}
                    </Badge>
                  </TableCell>
                  {canManageTreasury && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleToggle(s.id, s.is_active)} aria-label={s.is_active ? 'Pausar' : 'Activar'}>
                          {s.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)} aria-label="Eliminar">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent onClose={() => setShowCreate(false)}>
          <DialogHeader><DialogTitle>Nuevo Cobro/Pago Recurrente</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Cuota de mantenimiento mensual" required />
              </div>
              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'collection' | 'payment' })}>
                    <option value="collection">Cobro (a miembros)</option>
                    <option value="payment">Pago (a entidad)</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia</Label>
                  <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                    {Object.entries(FREQ_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monto *</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Dia del mes</Label>
                  <Input type="number" min="1" max="28" value={form.day_of_month} onChange={(e) => setForm({ ...form, day_of_month: e.target.value })} />
                </div>
              </div>
              {form.type === 'collection' && (
                <div className="space-y-2">
                  <Label>Destino</Label>
                  <Select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })}>
                    <option value="all_members">Todos los miembros activos</option>
                    <option value="specific_members">Miembros especificos</option>
                  </Select>
                </div>
              )}
              {form.type === 'payment' && (
                <div className="space-y-2">
                  <Label>Entidad (proveedor/socio)</Label>
                  <Select value={form.target_entity_id} onChange={(e) => setForm({ ...form, target_entity_id: e.target.value, target_type: 'entity' })}>
                    <option value="">Seleccionar...</option>
                    {entities?.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha inicio</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin (opcional)</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setShowCreate(false) }}>Cancelar</Button>
              <Button type="submit" disabled={createSchedule.isPending}>{createSchedule.isPending ? 'Creando...' : 'Crear'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
