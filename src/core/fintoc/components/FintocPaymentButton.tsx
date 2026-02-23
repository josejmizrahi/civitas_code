import { useState } from 'react'
import { useCreateCheckout } from '../hooks/useFintoc'
import { useFintocStatus } from '../hooks/useFintoc'
import { Button } from '@/shared/components/ui/button'
import { useToast } from '@/shared/components/ui/toast'
import { Banknote, Loader2, ExternalLink } from 'lucide-react'

interface FintocPaymentButtonProps {
  obligationId: string
  amount: number
  concept: string
  memberEmail?: string
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline'
  className?: string
}

export function FintocPaymentButton({
  obligationId,
  amount,
  concept,
  memberEmail,
  disabled,
  size = 'sm',
  variant = 'default',
  className,
}: FintocPaymentButtonProps) {
  const { data: status } = useFintocStatus()
  const checkout = useCreateCheckout()
  const toast = useToast()
  const [redirecting, setRedirecting] = useState(false)

  if (status?.fintoc_status !== 'active') return null

  const handlePay = async () => {
    try {
      const session = await checkout.mutateAsync({
        obligation_id: obligationId,
        amount: Math.round(amount * 100),
        concept,
        member_email: memberEmail,
      })

      if (session.redirect_url) {
        setRedirecting(true)
        window.open(session.redirect_url, '_blank')
        toast.success('Redirigiendo a Fintoc para completar el pago...')
      }
    } catch {
      toast.error('Error al crear sesión de pago')
    }
  }

  const isPending = checkout.isPending || redirecting

  return (
    <Button
      onClick={handlePay}
      disabled={disabled || isPending}
      size={size}
      variant={variant}
      className={className}
    >
      {isPending ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Banknote className="mr-1.5 h-3.5 w-3.5" />
      )}
      {isPending ? 'Procesando...' : 'Pagar con SPEI'}
      {!isPending && <ExternalLink className="ml-1 h-3 w-3" />}
    </Button>
  )
}
