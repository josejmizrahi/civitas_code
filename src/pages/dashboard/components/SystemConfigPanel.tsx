import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { formatCurrency } from '@/shared/lib/utils'
import { Shield, UserCheck, Wallet, Vote, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

interface SystemConfigPanelProps {
  financialStanding: string
  isPaymentToVoteEnabled: boolean
  goodStandingCount: number
  delinquentCount: number
  hasMemberData: boolean
  treasuryMode: string
  currency: string
  adminSpendingLimit: number
  autoExecutionEnabled: boolean
  delegationEnabled: boolean
  coolDownHours: number
  settingsPath: string
  censusPath: string
}

export function SystemConfigPanel({
  financialStanding,
  isPaymentToVoteEnabled,
  goodStandingCount,
  delinquentCount,
  hasMemberData,
  treasuryMode,
  currency,
  adminSpendingLimit,
  autoExecutionEnabled,
  delegationEnabled,
  coolDownHours,
  settingsPath,
  censusPath,
}: SystemConfigPanelProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4" />
          Configuración del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Identity */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-violet-500" />
              <span className="text-sm font-medium">Identidad</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tu standing</span>
                <Badge
                  variant={
                    financialStanding === 'good_standing'
                      ? 'default'
                      : financialStanding === 'grace_period'
                        ? 'secondary'
                        : 'destructive'
                  }
                >
                  {financialStanding === 'good_standing'
                    ? 'Al corriente'
                    : financialStanding === 'grace_period'
                      ? 'Periodo de gracia'
                      : 'Moroso'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pago → Voto</span>
                <Badge variant={isPaymentToVoteEnabled ? 'default' : 'secondary'}>
                  {isPaymentToVoteEnabled ? 'Activo' : 'Desactivado'}
                </Badge>
              </div>
              {hasMemberData && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Al corriente / Morosos</span>
                  <span className="font-medium">
                    {goodStandingCount} / {delinquentCount}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Treasury */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Tesorería</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Modo</span>
                <Badge variant="secondary">{treasuryMode}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Moneda</span>
                <span className="font-medium">{currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Límite admin</span>
                <span className="font-medium">{formatCurrency(adminSpendingLimit)}</span>
              </div>
            </div>
          </div>

          {/* Governance */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Vote className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Gobernanza</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Auto-ejecución</span>
                <Badge variant={autoExecutionEnabled ? 'default' : 'secondary'}>
                  {autoExecutionEnabled ? 'Activa' : 'Manual'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delegación</span>
                <Badge variant={delegationEnabled ? 'default' : 'secondary'}>
                  {delegationEnabled ? 'Activa' : 'Desactivada'}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Enfriamiento</span>
                <span className="font-medium">{coolDownHours}h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link to={settingsPath}>
            <Button variant="outline" size="sm">
              Configurar Reglas
            </Button>
          </Link>
          <Link to={censusPath}>
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-3 w-3" />
              Ver Censo
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
