import { useState } from 'react'
import { useContracts, useCreateContract, useDeleteContract, useInstallments, useMarkInstallmentPaid, useUpdateContract } from '../hooks/useContracts'
import { useEntities } from '@/core/entities/hooks/useEntities'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useI18n } from '@/shared/hooks/useI18n'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { StatusBadge } from '@/shared/components/ui/status-badge'
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

const CONTRACT_VARIANTS: Record<string, 'success' | 'destructive' | 'warning'> = {
  active: 'success',
  defaulted: 'destructive',
  draft: 'warning',
}

const INSTALLMENT_VARIANTS: Record<string, 'success' | 'destructive' | 'warning'> = {
  paid: 'success',
  overdue: 'destructive',
  pending: 'warning',
}

const INSTALLMENT_LABELS: Record<string, string> = {
  paid: 'Pagado',
  overdue: 'Vencido',
  pending: 'Pendiente',
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
  const { t } = useI18n()
  const { data: installments, isLoading } = useInstallments(contract.id)
  const markPaid = useMarkInstallmentPaid()
  const { canManageTreasury } = usePermissions()
  const toast = useToast()
  const confirm = useConfirm()

  const handleMarkPaid = async (inst: ContractInstallment) => {
    const ok = await confirm({
      title: t('contracts.registerPayment' as any),
      description: `${t('contracts.confirmRegisterPayment' as any)} #${inst.installment_number} (${formatCurrency(inst.amount)})`,
      confirmLabel: t('contracts.registerPayment' as any),
    })
    if (!ok) return
    markPaid.mutate({ installment: inst }, {
      onSuccess: () => toast.success(t('contracts.paymentRegistered' as any)),
      onError: () => toast.error(t('contracts.errorRegisteringPayment' as any)),
    })
  }

  if (isLoading) return <div className="text-muted-foreground text-sm">{t('contracts.loadingInstallments' as any)}</div>

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{t('contracts.paymentPlan' as any)} ({installments?.length ?? 0} {t('contracts.installments' as any)})</h4>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead className="text-right">{t('treasury.amount' as any)}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('contracts.dueDate' as any)}</TableHead>
              <TableHead>{t('entities.status' as any)}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('contracts.paidDate' as any)}</TableHead>
              {canManageTreasury && <TableHead>{t('contracts.action' as any)}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {installments?.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell className="font-medium">{inst.installment_number}</TableCell>
                <TableCell className="text-right">{formatCurrency(inst.amount)}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(inst.due_date)}</TableCell>
                <TableCell>
                  <StatusBadge status={inst.status} variantMap={INSTALLMENT_VARIANTS} labelMap={INSTALLMENT_LABELS} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {inst.paid_at ? formatDate(inst.paid_at) : '\u2014'}
                </TableCell>
                {canManageTreasury && (
                  <TableCell>
                    {(inst.status === 'pending' || inst.status === 'overdue') && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkPaid(inst)} disabled={markPaid.isPending}>
                        <CheckCircle className="mr-1 h-3 w-3" /> {t('contracts.pay' as any)}
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
  const { t } = useI18n()
  const [statusFilter, setStatusFilter] = useState('')
  const { data: contracts, isLoading } = useContracts(statusFilter ? { status: statusFilter } : undefined)
  const { data: entities } = useEntities()
  const { canManageTreasury } = usePermissions()
  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const deleteContract = useDeleteContract()
  const toast = useToast()
  const confirm = useConfirm()

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
    if (!form.name || !form.total_amount) { setError(t('contracts.nameAndAmountRequired' as any)); return }
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
      setError(err instanceof Error ? err.message : t('contracts.errorCreating' as any))
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('contracts.deleteContract' as any),
      description: t('contracts.confirmDelete' as any),
      confirmLabel: t('common.delete'),
      variant: 'destructive',
    })
    if (!ok) return
    deleteContract.mutate(id, {
      onSuccess: () => toast.success(t('contracts.deleted' as any)),
      onError: () => toast.error(t('contracts.errorDeleting' as any)),
    })
    setSelectedContract(null)
  }

  const handleStatusChange = (id: string, status: string) => {
    updateContract.mutate({ id, updates: { status: status as any } }, {
      onSuccess: () => toast.success(t('contracts.statusUpdated' as any)),
      onError: () => toast.error(t('contracts.errorUpdatingStatus' as any)),
    })
  }

  if (selectedContract) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedContract(null)} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> {t('contracts.backToContracts' as any)}
        </Button>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">{selectedContract.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary">{TYPE_LABELS[selectedContract.type] || selectedContract.type}</Badge>
              <StatusBadge status={selectedContract.status} variantMap={CONTRACT_VARIANTS} labelMap={STATUS_LABELS} />
            </div>
            {selectedContract.description && <p className="mt-2 text-sm text-muted-foreground">{selectedContract.description}</p>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrency(selectedContract.total_amount)}</div>
            <div className="text-sm text-muted-foreground">
              {selectedContract.number_of_installments} {t('contracts.installments' as any)}
            </div>
            <ComplianceBar score={selectedContract.compliance_score} />
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('contracts.contractParties' as any)}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {selectedContract.entity_name && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t('contracts.entityProvider' as any)}</div>
                    <div className="font-medium">{selectedContract.entity_name}</div>
                  </div>
                </div>
              )}
              {selectedContract.member_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t('contracts.member' as any)}</div>
                    <div className="font-medium">{selectedContract.member_name}</div>
                  </div>
                </div>
              )}
              {selectedContract.creator_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t('contracts.createdBy' as any)}</div>
                    <div className="font-medium">{selectedContract.creator_name}</div>
                  </div>
                </div>
              )}
              {selectedContract.proposal_title && (
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground">{t('contracts.approvedByProposal' as any)}</div>
                    <div className="font-medium">{selectedContract.proposal_title}</div>
                  </div>
                </div>
              )}
              {!selectedContract.entity_name && !selectedContract.member_name && !selectedContract.creator_name && (
                <p className="text-sm text-muted-foreground col-span-2">{t('contracts.noLinkedParties' as any)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{t('contracts.startDate' as any)}</div>
              <div className="font-medium">{formatDate(selectedContract.start_date)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{t('contracts.endDate' as any)}</div>
              <div className="font-medium">{selectedContract.end_date ? formatDate(selectedContract.end_date) : t('contracts.indefinite' as any)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{t('contracts.compliance' as any)}</div>
              <ComplianceBar score={selectedContract.compliance_score} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{t('contracts.created' as any)}</div>
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
        {t('contracts.description' as any)}
      </p>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{t('contracts.activeContracts' as any)}</div>
            <div className="text-xl font-bold">{activeContracts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{t('contracts.totalAmount' as any)}</div>
            <div className="text-xl font-bold">{formatCurrency(activeContracts.reduce((s, c) => s + c.total_amount, 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              {defaultedContracts.length > 0 && <AlertTriangle className="h-3 w-3 text-red-500" />}
              {t('contracts.defaulted' as any)}
            </div>
            <div className={`text-xl font-bold ${defaultedContracts.length > 0 ? 'text-red-600' : ''}`}>{defaultedContracts.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-44">
          <option value="">{t('contracts.allStatuses' as any)}</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        {canManageTreasury && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t('contracts.new' as any)}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('contracts.contract' as any)}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('entities.type' as any)}</TableHead>
              <TableHead className="hidden md:table-cell">{t('contracts.entity' as any)}</TableHead>
              <TableHead className="text-right">{t('contracts.totalAmount' as any)}</TableHead>
              <TableHead className="hidden lg:table-cell">{t('contracts.installments' as any)}</TableHead>
              <TableHead className="hidden md:table-cell">{t('contracts.compliance' as any)}</TableHead>
              <TableHead>{t('entities.status' as any)}</TableHead>
              {canManageTreasury && <TableHead>{t('entities.actions' as any)}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
            ) : !contracts || contracts.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">
                {t('contracts.empty' as any)}
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
                          {formatDate(c.start_date)}{c.end_date ? ` \u2014 ${formatDate(c.end_date)}` : ''}
                          {c.creator_name && <> · {t('contracts.by' as any)} {c.creator_name}</>}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{TYPE_LABELS[c.type] || c.type}</Badge></TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div>{c.entity_name || '\u2014'}</div>
                      {c.member_name && <div className="text-xs text-muted-foreground">{t('contracts.member' as any)}: {c.member_name}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(c.total_amount)}</TableCell>
                  <TableCell className="hidden lg:table-cell">{c.number_of_installments}</TableCell>
                  <TableCell className="hidden md:table-cell"><ComplianceBar score={c.compliance_score} /></TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} variantMap={CONTRACT_VARIANTS} labelMap={STATUS_LABELS} />
                  </TableCell>
                  {canManageTreasury && (
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Select value={c.status} onChange={(e) => handleStatusChange(c.id, e.target.value)} className="w-28 text-xs">
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </Select>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(c.id)} aria-label={t('common.delete')}>
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
          <DialogHeader><DialogTitle>{t('contracts.new' as any)}</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label>{t('common.name')} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder={t('contracts.namePlaceholder' as any)} />
              </div>
              <div className="space-y-2">
                <Label>{t('contracts.descriptionLabel' as any)}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('entities.type' as any)}</Label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ContractType })}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('contracts.entity' as any)}</Label>
                  <Select value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })}>
                    <option value="">{t('contracts.noEntity' as any)}</option>
                    {entities?.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('contracts.totalAmount' as any)} *</Label>
                  <Input type="number" step="0.01" min="0" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('contracts.numInstallments' as any)}</Label>
                  <Input type="number" min="1" value={form.number_of_installments} onChange={(e) => setForm({ ...form, number_of_installments: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('contracts.paymentFrequency' as any)}</Label>
                  <Select value={form.payment_frequency} onChange={(e) => setForm({ ...form, payment_frequency: e.target.value })}>
                    <option value="one_time">{t('contracts.freq.oneTime' as any)}</option>
                    <option value="weekly">{t('contracts.freq.weekly' as any)}</option>
                    <option value="biweekly">{t('contracts.freq.biweekly' as any)}</option>
                    <option value="monthly">{t('contracts.freq.monthly' as any)}</option>
                    <option value="bimonthly">{t('contracts.freq.bimonthly' as any)}</option>
                    <option value="quarterly">{t('contracts.freq.quarterly' as any)}</option>
                    <option value="semiannual">{t('contracts.freq.semiannual' as any)}</option>
                    <option value="annual">{t('contracts.freq.annual' as any)}</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('contracts.startDate' as any)}</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
              </div>
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                {`${t('contracts.installmentAutoGenNote' as any)}: ${form.number_of_installments}`}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setShowCreate(false) }}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createContract.isPending}>{createContract.isPending ? t('contracts.creating' as any) : t('contracts.create' as any)}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
