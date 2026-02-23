import { MyPayments } from '@/core/treasury/components/MyPayments'

export function MyPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Mi Estado de Cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Obligaciones de pago, historial y referencias para pago.
        </p>
      </div>
      <MyPayments />
    </div>
  )
}
