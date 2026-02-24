import { useState } from 'react'
import {
  useRecurringSchedules,
  useCreateRecurringSchedule,
  useUpdateRecurringSchedule,
  useDeleteRecurringSchedule,
  useProcessRecurringSchedules,
  useGenerateSingleSchedule,
} from '../hooks/useRecurring'
import { useEntities } from '@/core/entities/hooks/useEntities'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useI18n } from '@/shared/hooks/useI18n'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Card, CardContent } from '@/shared/components/ui/card'
import { formatCurrency, formatDate } from '@/shared/lib/utils'
import { Plus, Play, Pause, Trash2, RefreshCw, CalendarClock, Zap } from 'lucide-react'
import { useToast } from '@/shared/components/ui/toast'
import { useConfirm } from '@/shared/components/ConfirmDialog'

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
  const { t } = useI18n()
  const { data: schedules, isLoading } = useRecurringSchedules()
  const { data: entities } = useEntities()
  const { canManageTreasury } = usePermissions()
  const createSchedule = useCreateRecurringSchedule()
  const updateSchedule = useUpdateRecurringSchedule()
  const deleteSchedule = useDeleteRecurringSchedule()
  const processAll = useProcessRecurringSchedules()
  const runSingle = useGenerateSingleSchedule()
  const toast = useToast()
  const confirm = useConfirm()

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
    if (!form.name || !form.amount) { setError(t('recurring.nameAndAmountRequired' as any)); return }
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
      setError(err instanceof Error ? err.message : t('recurring.errorCreating' as any))
    }
  }

  const handleToggle = (id: string, isActive: boolean) => {
    updateSchedule.mutate({ id, updates: { is_active: !isActive } }, {
      onSuccess: () => toast.success(t('recurring.updated' as any)),
      onError: () => toast.error(t('recurring.errorUpdating' as any)),
    })
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('recurring.deleteRecurring' as any),
      description: t('recurring.confirmDelete' as any),
      confirmLabel: t('common.delete'),
      variant: 'destructive',
    })
    if (!ok) return
    deleteSchedule.mutate(id, {
      onSuccess: () => toast.success(t('recurring.deleted' as any)),
      onError: () => toast.error(t('recurring.errorDeleting' as any)),
    })
  }

  const activeCount = schedules?.filter(s => s.is_active).length ?? 0
  const collectionCount = schedules?.filter(s => s.type === 'collection').length ?? 0
  const paymentCount = schedules?.filter(s => s.type === 'payment').length ?? 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t('recurring.description' as any)}
      </p>
      {/* Summary */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{t('recurring.active' as any)}</div>
            <div className="text-xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{t('recurring.collections' as any)}</div>
            <div className="text-xl font-bold text-green-600">{collectionCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">{t('recurring.payments' as any)}</div>
            <div className="text-xl font-bold text-red-600">{paymentCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {canManageTreasury && (
          <Button variant="outline" onClick={() => processAll.mutate(undefined, {
            onSuccess: () => toast.success(t('recurring.pendingProcessed' as any)),
            onError: () => toast.error(t('recurring.errorProcessing' as any)),
          })} disabled={processAll.isPending} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${processAll.isPending ? 'animate-spin' : ''}`} />
            {t('recurring.processPending' as any)}
          </Button>
        )}
        {canManageTreasury && (
          <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {t('recurring.new' as any)}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('entities.type' as any)}</TableHead>
              <TableHead className="hidden sm:table-cell">{t('recurring.frequency' as any)}</TableHead>
              <TableHead className="text-right">{t('treasury.amount' as any)}</TableHead>
              <TableHead className="hidden md:table-cell">{t('recurring.nextRun' as any)}</TableHead>
              <TableHead>{t('entities.status' as any)}</TableHead>
              {canManageTreasury && <TableHead>{t('entities.actions' as any)}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t('common.loading')}</TableCell></TableRow>
            ) : !schedules || schedules.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">
                {t('recurring.empty' as any)}
              </TableCell></TableRow>
            ) : (
              schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="font-medium">{s.name}</div>
                    {s.description && <div className="text-xs text-muted-foreground">{s.description}</div>}
                    {s.entity_name && (
                      <div className="text-xs text-muted-foreground">{t('contracts.entity' as any)}: {s.entity_name}</div>
                    )}
                    {s.category_name && (
                      <div className="text-xs text-muted-foreground">{t('treasury.category' as any)}: {s.category_name}</div>
                    )}
                    {s.target_type === 'all_members' && s.type === 'collection' && (
                      <div className="text-xs text-blue-600">{t('recurring.allMembers' as any)}</div>
                    )}
                    {s.target_member_names && s.target_member_names.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {t('recurring.members' as any)}: {s.target_member_names.slice(0, 3).join(', ')}
                        {s.target_member_names.length > 3 && ` +${s.target_member_names.length - 3} ${t('recurring.more' as any)}`}
                      </div>
                    )}
                    {s.creator_name && (
                      <div className="text-xs text-muted-foreground">{t('contracts.by' as any)} {s.creator_name}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.type === 'collection' ? 'success' : 'destructive'}>
                      {s.type === 'collection' ? t('recurring.collection' as any) : t('recurring.payment' as any)}
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
                      <div className="text-xs text-muted-foreground">{t('recurring.lastRun' as any)}: {formatDate(s.last_run_date)}</div>
                    )}
                    <div className="text-xs text-muted-foreground">{s.runs_completed} {t('recurring.runs' as any)}</div>
                    {s.end_date && (
                      <div className="text-xs text-muted-foreground">{t('recurring.end' as any)}: {formatDate(s.end_date)}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.is_active ? 'success' : 'secondary'}>
                      {s.is_active ? t('recurring.activeStatus' as any) : t('recurring.paused' as any)}
                    </Badge>
                  </TableCell>
                  {canManageTreasury && (
                    <TableCell>
                      <div className="flex gap-1">
                        {s.is_active && (
                          <Button size="icon" variant="ghost" onClick={() => runSingle.mutate(s.id, {
                            onSuccess: () => toast.success(t('recurring.obligationsGenerated' as any)),
                            onError: () => toast.error(t('recurring.errorRunning' as any)),
                          })} aria-label={t('recurring.runNow' as any)} disabled={runSingle.isPending}>
                            <Zap className="h-4 w-4 text-amber-500" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" onClick={() => handleToggle(s.id, s.is_active)} aria-label={s.is_active ? t('recurring.pause' as any) : t('recurring.activate' as any)}>
                          {s.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)} aria-label={t('common.delete')}>
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
          <DialogHeader><DialogTitle>{t('recurring.newRecurring' as any)}</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              <div className="space-y-2">
                <Label>{t('common.name')} *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('recurring.namePlaceholder' as any)} required />
              </div>
              <div className="space-y-2">
                <Label>{t('recurring.descriptionLabel' as any)}</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('entities.type' as any)}</Label>
                  <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'collection' | 'payment' })}>
                    <option value="collection">{t('recurring.collectionToMembers' as any)}</option>
                    <option value="payment">{t('recurring.paymentToEntity' as any)}</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('recurring.frequency' as any)}</Label>
                  <Select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                    {Object.entries(FREQ_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('treasury.amount' as any)} *</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('recurring.dayOfMonth' as any)}</Label>
                  <Input type="number" min="1" max="28" value={form.day_of_month} onChange={(e) => setForm({ ...form, day_of_month: e.target.value })} />
                </div>
              </div>
              {form.type === 'collection' && (
                <div className="space-y-2">
                  <Label>{t('recurring.target' as any)}</Label>
                  <Select value={form.target_type} onChange={(e) => setForm({ ...form, target_type: e.target.value })}>
                    <option value="all_members">{t('recurring.allActiveMembers' as any)}</option>
                    <option value="specific_members">{t('recurring.specificMembers' as any)}</option>
                  </Select>
                </div>
              )}
              {form.type === 'payment' && (
                <div className="space-y-2">
                  <Label>{t('recurring.entityProviderPartner' as any)}</Label>
                  <Select value={form.target_entity_id} onChange={(e) => setForm({ ...form, target_entity_id: e.target.value, target_type: 'entity' })}>
                    <option value="">{t('recurring.select' as any)}</option>
                    {entities?.map((e) => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('contracts.startDate' as any)}</Label>
                  <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>{t('recurring.endDateOptional' as any)}</Label>
                  <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setShowCreate(false) }}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={createSchedule.isPending}>{createSchedule.isPending ? t('recurring.creating' as any) : t('treasury.create' as any)}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
