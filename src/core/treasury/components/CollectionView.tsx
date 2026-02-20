import { useCommunityContext } from '@/app/providers'
import { getCollectionConfig } from '../services/treasury.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { PaymentPlanManager } from './PaymentPlanManager'
import { IfpeReconciliationPanel } from './IfpeReconciliationPanel'
import {
  AlertTriangle,
  CheckCircle2,
  Building2,
  CreditCard,
  Copy,
  Receipt,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useState } from 'react'
import type { TreasuryRules } from '@/shared/types/rules'

function TreasuryModeBanner({ mode }: { mode: string }) {
  const labels: Record<string, { label: string; color: string; description: string }> = {
    import: {
      label: 'Modo Importacion',
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      description: 'Los datos financieros se ingresan manualmente o se importan desde archivos CSV/Excel.',
    },
    fintech_rail: {
      label: 'Fintech Rail (SPEI)',
      color: 'bg-green-50 border-green-200 text-green-800',
      description: 'Cobranza automatica via SPEI. Los pagos se reconcilian automaticamente al recibir transferencias a la CLABE.',
    },
    connector: {
      label: 'Conector Bancario',
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      description: 'Los datos se sincronizan automaticamente desde una cuenta bancaria conectada.',
    },
    hybrid: {
      label: 'Hibrido',
      color: 'bg-amber-50 border-amber-200 text-amber-800',
      description: 'Combina captura manual con sincronizacion automatica para diferentes tipos de transacciones.',
    },
  }

  const info = labels[mode] || labels.import

  return (
    <div className={`rounded-lg border p-4 ${info.color}`}>
      <div className="flex items-center gap-2 font-semibold">
        <CreditCard className="h-4 w-4" />
        {info.label}
      </div>
      <p className="mt-1 text-sm opacity-80">{info.description}</p>
    </div>
  )
}

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
              Cuando se integre el socio IFPE (Institucion de Fondos de Pago Electronico), se generara
              una CLABE unica para esta comunidad. Los pagos via SPEI se reconciliaran automaticamente.
            </p>
            <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mr-1 inline h-3 w-3" />
              Mientras tanto, puedes registrar pagos manualmente desde la pestaña Obligaciones o importar datos desde CSV/Excel.
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
              <div className="text-xs text-muted-foreground">Banco / IFPE</div>
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

export function CollectionView({ onGoToObligations }: { onGoToObligations?: () => void }) {
  const { community } = useCommunityContext()
  const { canManageTreasury } = usePermissions()

  const rules = community?.rules as { treasury?: TreasuryRules } | null
  const treasuryMode = rules?.treasury?.mode || 'import'
  const collectionConfig = getCollectionConfig(rules)

  return (
    <div className="space-y-6">
      <TreasuryModeBanner mode={treasuryMode} />

      {/* Resumen de cobranza está en Dashboard; detalle en Obligaciones */}
      {canManageTreasury && onGoToObligations && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
              <Receipt className="h-4 w-4 shrink-0" />
              El resumen de cobranza (por cobrar, vencido, cobrado) está en el <strong>Dashboard</strong>.
              Para crear obligaciones y registrar pagos, usa la pestaña <strong>Obligaciones</strong>.
              {onGoToObligations && (
                <Button variant="link" className="h-auto p-0 text-primary" onClick={onGoToObligations}>
                  Ir a Obligaciones →
                </Button>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* CLABE / Account info */}
      {canManageTreasury && <ClabeDisplay config={collectionConfig} />}

      {/* IFPE Reconciliation — visible when fintech_rail or hybrid */}
      {canManageTreasury && (treasuryMode === 'fintech_rail' || treasuryMode === 'hybrid') && (
        <IfpeReconciliationPanel />
      )}

      {/* Payment Plans */}
      <PaymentPlanManager />

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Flujo de Cobranza</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {/* Current flow (MVP) */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium">
                <Badge variant="secondary">Actual</Badge>
                Registro Manual / Importacion
              </h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>Admin crea obligaciones de pago (cuotas, mantenimiento, etc.)</li>
                <li>Miembros pagan por el medio que acuerden (transferencia, efectivo, etc.)</li>
                <li>Tesorero registra el pago en <strong>Obligaciones → Registrar Pago</strong></li>
                <li>Se crea automaticamente la transaccion de ingreso vinculada</li>
                <li>El estatus financiero del miembro se actualiza</li>
              </ol>
              <div className="text-xs text-muted-foreground">
                Tambien puedes importar transacciones desde CSV/Excel en <strong>Ingestion de Datos</strong>.
              </div>
            </div>

            {/* Future flow (Fintech) */}
            <div className="space-y-3">
              <h4 className="flex items-center gap-2 font-medium">
                <Badge variant="success">Proximamente</Badge>
                Rail Fintech (SPEI)
              </h4>
              <ol className="ml-4 list-decimal space-y-1 text-sm text-muted-foreground">
                <li>IFPE genera una CLABE unica para la comunidad</li>
                <li>Admin configura cuotas y genera obligaciones con referencia de pago</li>
                <li>Miembros realizan transferencia SPEI a la CLABE con su referencia</li>
                <li>IFPE notifica a Civitas via webhook</li>
                <li>La obligacion se marca como pagada automaticamente</li>
                <li>Transaccion registrada, dashboard actualizado, identidad refrescada</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
