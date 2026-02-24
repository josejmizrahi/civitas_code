import { useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useI18n } from '@/shared/hooks/useI18n'
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { ArrowLeft, CreditCard, RefreshCcw, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'
import { FintechOnboarding } from '@/core/fintech/components/FintechOnboarding'
import { PaymentReconciliation } from '@/core/fintech/components/PaymentReconciliation'
import { TransferPanel } from '@/core/fintech/components/TransferPanel'

type PaymentsTab = 'setup' | 'reconciliation' | 'transfers'

export function PaymentsPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const path = useCommunityPath()
  const { community } = useCommunityContext()
  const { isAdmin } = usePermissions()
  const [activeTab, setActiveTab] = useState<PaymentsTab>('setup')

  const fintechStatus = (community as { fintoc_status?: string } | null)?.fintoc_status
  const isActive = fintechStatus === 'active'

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(path('dashboard'))}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t('nav.payments')}</h1>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? 'Gestiona pagos SPEI, conciliación y dispersiones.'
                  : 'Conecta la integración financiera para recibir y gestionar pagos.'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {isActive && isAdmin ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PaymentsTab)}>
          <TabsList className="h-auto flex-wrap gap-1 rounded-xl bg-muted p-1.5">
            <TabsTrigger value="setup" className="gap-1.5 text-xs sm:text-sm">
              <CreditCard className="h-3.5 w-3.5" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="reconciliation" className="gap-1.5 text-xs sm:text-sm">
              <RefreshCcw className="h-3.5 w-3.5" />
              Conciliación
            </TabsTrigger>
            <TabsTrigger value="transfers" className="gap-1.5 text-xs sm:text-sm">
              <Send className="h-3.5 w-3.5" />
              Dispersiones
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {activeTab === 'setup' && <FintechOnboarding />}
            {activeTab === 'reconciliation' && <PaymentReconciliation />}
            {activeTab === 'transfers' && <TransferPanel />}
          </div>
        </Tabs>
      ) : (
        <FintechOnboarding />
      )}
    </div>
  )
}
