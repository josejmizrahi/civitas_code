import { useState } from 'react'
import { useContracts, useCreateContract, useDeleteContract, useInstallments, useMarkInstallmentPaid, useUpdateContract } from '../hooks/useContracts'
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
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/utils'
import { Plus, Trash2, FileText, CheckCircle, ArrowLeft, AlertTriangle, User, Building2, ClipboardCheck } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { useConfirm } from '@/shared/components/ConfirmDialog'
import type { Contract, ContractInstallment } from '../types'
import type { ContractType } from '@/shared/types'

const TYPE_LABELS: Record<string, string> = {
  servicio: 'Servicio',
  obra: 'Obra',
  arrendamiento: 'Arrendamiento',
  mantenimiento: 'Mantenimiento',
  suministro: 'Suministro',
  asesoria: 'Asesoria',
  otro: 'Otro',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  active: 'Activo',
  completed: 'Completado',
  defaulted: 'Incumplido',
  cancelled: 'Cancelado',
  suspended: 'Suspendido',
}

function statusVariant(s: string): 'success' | 'destructive' | 'warning' | 'secondary' {
  switch (s) {
    case 'active': return 'success'
    case 'defaulted': return 'destructive'
    case 'draft': return 'warning'
    default: return 'secondary'
  }
}

function ComplianceBar({ score }: { score: number }) {
  const pct = score * 100
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium">{pct.toFixed(0)}%</span>
    </div>
  )
}

function InstallmentView({ contract }: { contract: Contract }) {
  const { data: installments, isLoading } = useInstallments(contract.id)
  const markPaid = useMarkInstallmentPaid()
  const { canManageTreasury } = usePermissions()
  const toast = useToast()

  const confirmDialog = useConfirm()

  const handleMarkPaid = async (inst: ContractInstallment) => {
    const confirmed = await confirmDialog({
      title: 'Registrar pago',
      description: `Confirmar el pago de parcialidad #${inst.installment_number} por ${formatCurrency(inst.amount)}.`,
      confirmLabel: 'Registrar pago',
    })
    if (confirmed) {
      markPaid.mutate({ installment: inst }, {
        onSuccess: () => toast.success('Pago registrado'),
        onError: () => toast.error('Error al registrar pago'),
      })
    }
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">Cargando parcialidades...</div>

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Plan de Pagos ({installments?.length ?? 0} parcialidades)</h4>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="hidden sm:table-cell">Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden sm:table-cell">Pagado</TableHead>
              {canManageTreasury && <TableHead>Accion</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments?.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell className="font-medium">{inst.installment_number}</TableCell>
                <TableCell className="text-right">{formatCurrency(inst.amount)}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(inst.due_date)}</TableCell>
                <TableCell>
                  <Badge variant={
                    inst.status === 'paid' ? 'success' :
                    inst.status === 'overdue' ? 'destructive' :
                    inst.status === 'pending' ? 'warning' : 'secondary'
                  }>
                    {inst.status === 'paid' ? 'Pagado' : inst.status === 'overdue' ? 'Vencido' : inst.status === 'pending' ? 'Pendiente' : inst.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {inst.paid_at ? formatDate(inst.paid_at) : '—'}
                </TableCell>
                {canManageTreasury && (
                  <TableCell>
                    {(inst.status === 'pending' || inst.status === 'overdue') && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkPaid(inst)} disabled={markPaid.isPending}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Pagar
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function ContractList() {
  const [statusFilter, setStatusFilter] = useState('')
  const { data: contracts, isLoading } = useContracts(statusFilter ? { status: statusFilter } : undefined)
  const { data: entities } = useEntities()
  const { canManageTreasury } = usePermissions()
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const deleteContract = useDeleteContract()
  const toast = useToast()
  const confirmDialog = useConfirm()
  
  const [showCreate, setShowCreate] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)

  const [form, setForm] = useState({
    name: '', description: '', type: 'servicio' as ContractType,
    entity_id: '', total_amount: '', payment_frequency: 'monthly',
    number_of_installments: '1', start_date: new Date().toISOString().split('T')[0], end_date: '',
  })
  const [error, setError] = useState('')

  const resetForm = () => {
    setForm({
      name: '', description: '', type: 'servicio',
      entity_id: '', total_amount: '', payment_frequency: 'monthly',
      number_of_installments: '1', start_date: new Date().toISOString().split('T')[0], end_date: '',
    })
    setError('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.total_amount) { setError('Nombre y monto total son obligatorios'); return }
    try {
      await createContract.mutateAsync({
        name: form.name,
        description: form.description || undefined,
        type: form.type,
        entity_id: form.entity_id || undefined,
        total_amount: parseFloat(form.total_amount),
        payment_frequency: form.payment_frequency,
        number_of_installments: parseInt(form.number_of_installments) || 1,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        created_by: '',
      })
      resetForm()
      setShowCreate(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear contrato')
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: 'Eliminar contrato',
      description: 'Esta accion eliminara el contrato y todas sus parcialidades. No se puede deshacer.',
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    })
    if (confirmed) {
      deleteContract.mutate(id, {
        onSuccess: () => toast.success('Contrato eliminado'),
        onError: () => toast.error('Error al eliminar contrato'),
      })
      setSelectedContract(null)
    }
  }

  const handleStatusChange = (id: string, status: string) => {
    updateContract.mutate({ id, updates: { status: status as any } }, {
      onSuccess: () => toast.success('Estado del contrato actualizado'),
      onError: () => toast.error('Error al actualizar contrato'),
    })
  }

  if (selectedContract) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedContract(null)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Volver a contratos
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">{selectedContract.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary">{TYPE_LABELS[selectedContract.type] || selectedContract.type}</Badge>
              <Badge variant={statusVariant(selectedContract.status)}>
                {STATUS_LABELS[selectedContract.status] || selectedContract.status}
              </Badge>
            </div>
            {selectedContract.description && <p className="mt-2 text-sm text-muted-foreground">{selectedContract.description}</p>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(selectedContract.total_amount)}</div>
            <div className="text-sm text-muted-foreground">
              {selectedContract.number_of_installments} parcialidades
            </div>
            <ComplianceBar score={selectedContract.compliance_score} />
          </div>
        </div>

        {/* Partes involucradas */}
        <Card>
          <CardHeader><CardTitle className="text-base">Partes del Contrato</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedContract.entity_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Entidad / Proveedor</div>
                    <div className="font-medium">{selectedContract.entity_name}</div>
                  </div>
                </div>
              )}
              {selectedContract.member_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Miembro</div>
                    <div className="font-medium">{selectedContract.member_name}</div>
                  </div>
                </div>
              )}
              {selectedContract.creator_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Creado por</div>
                    <div className="font-medium">{selectedContract.creator_name}</div>
                  </div>
                </div>
              )}
              {selectedContract.proposal_title && (
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">Aprobado por propuesta</div>
                    <div className="font-medium">{selectedContract.proposal_title}</div>
                  </div>
                </div>
              )}
              {!selectedContract.entity_name && !selectedContract.member_name && !selectedContract.creator_name && (
                <p className="text-sm text-muted-foreground col-span-2">Sin partes vinculadas.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Inicio</div>
              <div className="font-medium">{formatDate(selectedContract.start_date)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Fin</div>
              <div className="font-medium">{selectedContract.end_date ? formatDate(selectedContract.end_date) : 'Indefinido'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Cumplimiento</div>
              <ComplianceBar score={selectedContract.compliance_score} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">Creado</div>
              <div className="font-medium text-sm">{formatDateTime(selectedContract.created_at)}</div>
            </CardContent>
          </Card>
        </div>
        <InstallmentView contract={selectedContract} />
      </div>
    )
  }

  const activeContracts = contracts?.filter(c => c.status === 'active') ?? []
  const defaultedContracts = contracts?.filter(c => c.status === 'defaulted') ?? []

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Contratos con planes de pago y parcialidades (obra, arrendamiento, servicios, etc.).
      </p>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Contratos Activos</div>
            <div className="text-xl font-bold">{activeContracts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Monto Total</div>
            <div className="text-xl font-bold">{formatCurrency(activeContracts.reduce((s, c) => s + c.total_amount, 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {defaultedContracts.length > 0 && <AlertTriangle className="h-3 w-3 text-red-500" />}
              Incumplidos
            </div>
            <div className={`text-xl font-bold ${defaultedContracts.length > 0 ? 'text-red-600' : ''}`}>{defaultedContracts.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-44">
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        {canManageTreasury && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Contrato
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contrato</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="hidden md:table-cell">Entidad</TableHead>
              <TableHead className="text-right">Monto Total</TableHead>
              <TableHead className="hidden lg:table-cell">Parcialidades</TableHead>
              <TableHead className="hidden md:table-cell">Cumplimiento</TableHead>
              <TableHead>Estado</TableHead>
              {canManageTreasury && <TableHead>Acciones</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Cargando...</TableCell></TableRow>
            ) : !contracts || contracts.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">
                Sin contratos. Crea uno para gestionar acuerdos con proveedores y planes de pago.
              </TableCell></TableRow>
            ) : (
              contracts.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedContract(c)}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(c.start_date)}{c.end_date ? ` — ${formatDate(c.end_date)}` : ''}
                          {c.creator_name && <> · por {c.creator_name}</>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{TYPE_LABELS[c.type] || c.type}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div>{c.entity_name || '—'}</div>
                      {c.member_name && <div className="text-xs text-muted-foreground">Miembro: {c.member_name}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(c.total_amount)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{c.number_of_installments}</TableCell>
                  <TableCell className="hidden md:table-cell"><ComplianceBar score={c.compliance_score} /></TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(c.status)}>{STATUS_LABELS[c.status] || c.status}</Badge>
                  </TableCell>
                  {canManageTreasury && (
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Select value={c.status} onChange={(e) => handleStatusChange(c.id, e.target.value)} className="w-28 text-xs">
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </Select>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} aria-label="Eliminar">
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
          <DialogHeader><DialogTitle>Nuevo Contrato</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ej: Contrato limpieza anual" />
              </div>
              <div className="space-y-2">
                <Label>Descripcion</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContractType })}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Entidad</Label>
                  <Select value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })}>
                    <option value="">Sin entidad</option>
                    {entities?.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monto Total *</Label>
                  <Input type="number" step="0.01" min="0" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Num. Parcialidades</Label>
                  <Input type="number" min="1" value={form.number_of_installments} onChange={(e) => setForm({ ...form, number_of_installments: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia Pago</Label>
                  <Select value={form.payment_frequency} onChange={(e) => setForm({ ...form, payment_frequency: e.target.value })}>
                    <option value="one_time">Pago unico</option>
                    <option value="weekly">Semanal</option>
                    <option value="biweekly">Quincenal</option>
                    <option value="monthly">Mensual</option>
                    <option value="bimonthly">Bimestral</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
              </div>
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                Al crear el contrato se generaran automaticamente las {form.number_of_installments} parcialidades con sus fechas de vencimiento.
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setShowCreate(false) }}>Cancelar</Button>
              <Button type="submit" disabled={createContract.isPending}>{createContract.isPending ? 'Creando...' : 'Crear Contrato'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
