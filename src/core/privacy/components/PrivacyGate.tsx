import { useState } from 'react'
import { useAuth } from '@/app/providers'
import { usePrivacyConsent, useGrantConsent } from '../hooks/usePrivacy'
import { PrivacyNoticeModal } from './PrivacyNoticeModal'
import { useToast } from '@/shared/components/ui/toast'

interface PrivacyGateProps {
  children: React.ReactNode
  communityName?: string
}

export function PrivacyGate({ children, communityName }: PrivacyGateProps) {
  const { user } = useAuth()
  const toast = useToast()
  const { data: hasConsent, isLoading } = usePrivacyConsent('privacy_notice')
  const grantConsentMut = useGrantConsent()
  const [dismissed, setDismissed] = useState(false)

  const handleAccept = async () => {
    try {
      await grantConsentMut.mutateAsync({ consentType: 'privacy_notice' })
      toast.success('Aviso de Privacidad aceptado')
      setDismissed(true)
    } catch {
      toast.error('Error al registrar el consentimiento')
    }
  }

  // Still loading consent status — don't block, just render children
  if (isLoading || !user) {
    return <>{children}</>
  }

  // User already has valid consent
  if (hasConsent || dismissed) {
    return <>{children}</>
  }

  // User has NOT accepted the privacy notice — show blocking modal
  return (
    <>
      {children}
      <PrivacyNoticeModal
        open={true}
        onAccept={handleAccept}
        onClose={() => {
          // Don't actually close — this is a blocking gate
          // but we still need the handler for the component API
        }}
        communityName={communityName}
      />
    </>
  )
}
