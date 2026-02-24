import { MyPayments } from '@/core/treasury/components/MyPayments'
import { PageHeader } from '@/shared/components/ui/page-header'

export function MyPaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Estado de Cuenta"
        subtitle="Obligaciones de pago, historial y referencias para pago."
      />
      <MyPayments />
    </div>
  )
}
