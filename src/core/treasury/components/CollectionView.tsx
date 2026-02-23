import { useCommunityContext } from '@/app/providers'
import { getCollectionConfig } from '../services/treasury.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { PaymentPlanManager } from './PaymentPlanManager'
import { PaymentReconciliation } from '@/core/fintech/components/PaymentReconciliation'
import { AlertTriangle, CheckCircle2, Building2, Copy } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useState } from 'react'
import type { TreasuryRules } from '@/shared/types/rules'

function ClabeDisplay({ config }: { config: { clabe: string | null; bank_name: string | null; beneficiary_name: string | null; payment_reference_prefix: string | null } }) {
  const [copied, setCopied] = useState(false)

  if (!config.clabe) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Cuenta de Cobranza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 text-center">
            <Building2 className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-2 font-medium text-muted-foreground">CLABE no configurada</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Configura la integración financiera desde la pestaña de Pagos para generar una CLABE única
              para esta comunidad. Los pagos vía SPEI se reconciliarán automáticamente.
            </p>
            <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mr-1 inline h-3 w-3" />
              Mientras tanto, puedes registrar pagos manualmente desde la pestaña Obligaciones.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(config.clabe!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" />
          Cuenta de Cobranza SPEI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div>
            <div className="text-xs text-muted-foreground">CLABE</div>
            <div className="flex items-center gap-2">
              <code className="text-lg font-mono font-bold tracking-wider">{config.clabe}</code>
              <Button size="sm" variant="ghost" onClick={handleCopy} className="h-6 px-2">
                <Copy className="h-3 w-3" />
                {copied ? 'Copiado' : ''}
              </Button>
            </div>
          </div>
          {config.bank_name && (
            <div>
              <div className="text-xs text-muted-foreground">Banco</div>
              <div className="font-medium">{config.bank_name}</div>
            </div>
          )}
          {config.beneficiary_name && (
            <div>
              <div className="text-xs text-muted-foreground">Beneficiario</div>
              <div className="font-medium">{config.beneficiary_name}</div>
            </div>
          )}
        </div>
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mr-1 inline h-3 w-3" />
          Los pagos SPEI a esta CLABE se reconcilian automaticamente con las obligaciones de pago.
        </div>
      </CardContent>
    </Card>
  )
}

export function CollectionView({ onGoToObligations: _onGoToObligations }: { onGoToObligations?: () => void }) {
  const { community } = useCommunityContext()
  const { canManageTreasury } = usePermissions()

  const rules = community?.rules as { treasury?: TreasuryRules } | null
  const collectionConfig = getCollectionConfig(rules)

  return (
    <div className="space-y-6">
      {/* CLABE / Account info */}
      {canManageTreasury && <ClabeDisplay config={collectionConfig} />}

      {/* Payment Reconciliation */}
      {canManageTreasury && (
        <PaymentReconciliation />
      )}

      {/* Payment Plans */}
      <PaymentPlanManager />
    </div>
  )
}
