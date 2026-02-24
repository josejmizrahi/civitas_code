import { useEffect, useRef } from 'react'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useRefreshOverdueObligations } from '@/core/treasury/hooks/usePaymentStatus'
import { useProcessRecurringSchedules } from '@/core/treasury/hooks/useRecurring'
import { useRefreshOverdueInstallments } from '@/core/treasury/hooks/useContracts'
import { useToast } from '@/shared/components/ui/toast'
import { MemberTreasuryView } from './MemberTreasuryView'
import { AdminTreasuryView } from './AdminTreasuryView'

export function TreasuryPage() {
  const { canManageTreasury } = usePermissions()
  const toast = useToast()
  const hasRun = useRef(false)
  const refreshOverdue = useRefreshOverdueObligations()
  const processRecurring = useProcessRecurringSchedules()
  const refreshInstallments = useRefreshOverdueInstallments()

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    const onError = (label: string) => () => {
      toast.error(`Error al sincronizar: ${label}`)
    }
    refreshOverdue.mutate(undefined, { onError: onError('obligaciones vencidas') })
    processRecurring.mutate(undefined, { onError: onError('cobros recurrentes') })
    refreshInstallments.mutate(undefined, { onError: onError('parcialidades vencidas') })
  }, [toast, refreshOverdue, processRecurring, refreshInstallments])

  if (!canManageTreasury) return <MemberTreasuryView />
  return <AdminTreasuryView />
}
