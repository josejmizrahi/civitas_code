import { useState } from 'react'
import { useMembers } from '@/core/identity/hooks/useMembers'
import { useCreateObligation, useCreateBulkObligations } from '../hooks/usePaymentStatus'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { useI18n } from '@/shared/hooks/useI18n'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateObligationDialog({ open, onOpenChange }: Props) {
  const { t } = useI18n()
  const { data: members } = useMembers()
  const createSingle = useCreateObligation()
  const createBulk = useCreateBulkObligations()

  const [memberId, setMemberId] = useState('')
  const [forAll, setForAll] = useState(false)
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')

  const activeMembers = members?.filter((m) => m.status === 'active') ?? []

  const reset = () => {
    setMemberId('')
    setForAll(false)
    setConcept('')
    setAmount('')
    setDueDate('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!concept || !amount || !dueDate) {
      setError(t('obligationDialog.error.required'))
      return
    }
    if (!forAll && !memberId) {
      setError(t('obligationDialog.error.memberRequired'))
      return
    }
    const parsedAmount = parseFloat(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('obligationDialog.error.amountPositive'))
      return
    }
    if (parsedAmount > 100_000_000) {
      setError(t('obligationDialog.error.amountLimit'))
      return
    }

    try {
      const obligation = {
        amount: parsedAmount,
        due_date: dueDate,
        concept,
      }

      if (forAll) {
        const memberIds = activeMembers.map((m) => m.id)
        if (memberIds.length === 0) {
          setError(t('obligationDialog.error.noActiveMembers'))
          return
        }
        await createBulk.mutateAsync({ memberIds, obligation })
      } else {
        await createSingle.mutateAsync({ member_id: memberId, ...obligation })
      }

      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('obligationDialog.error.create'))
    }
  }

  const isPending = createSingle.isPending || createBulk.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{t('obligationDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="forAll"
                checked={forAll}
                onChange={(e) => setForAll(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="forAll">{t('obligationDialog.forAll')} ({activeMembers.length})</Label>
            </div>

            {!forAll && (
              <div className="space-y-2">
                <Label>{t('obligationDialog.member')}</Label>
                <Select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                  <option value="">{t('obligationDialog.memberPlaceholder')}</option>
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name || m.email || m.id.slice(0, 8)}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t('obligationDialog.concept')}</Label>
              <Input
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder={t('obligationDialog.conceptPlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t('obligationDialog.amount')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t('obligationDialog.dueDate')}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }}>
              {t('obligationDialog.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('obligationDialog.creating') : forAll ? `${t('obligationDialog.create')} (${activeMembers.length})` : t('obligationDialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
