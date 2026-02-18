import { useCommunityContext } from '@/app/providers'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { getCommunityRules } from '@/shared/services/rules.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { formatDate } from '@/shared/lib/utils'
import {
  BookOpen,
  Shield,
  Wallet,
  UserCheck,
  History,
  ExternalLink,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface RuleVersion {
  id: string
  version_number: number
  change_reason: string | null
  created_at: string
}

function BoolBadge({ value, yes = 'Sí', no = 'No' }: { value: boolean; yes?: string; no?: string }) {
  return (
    <Badge variant={value ? 'success' : 'secondary'}>
      {value ? yes : no}
    </Badge>
  )
}

function RuleRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-sm font-medium">{children}</div>
    </div>
  )
}

export function RulesPage() {
  const { communityId, community } = useCommunityContext()
  const { isAdmin } = usePermissions()
  const navigate = useNavigate()

  const rules = getCommunityRules(null, (community as any)?.rules)

  const { data: versions } = useQuery({
    queryKey: ['rule-versions', communityId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('rule_versions') as any)
        .select('id, version_number, change_reason, created_at')
        .eq('community_id', communityId!)
        .order('version_number', { ascending: false })
        .limit(10)
      if (error) throw error
      return (data ?? []) as RuleVersion[]
    },
    enabled: !!communityId,
  })

  const pct = (n: number) => `${Math.round(n * 100)}%`

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Reglas de la Comunidad
          </h1>
          <p className="text-sm text-muted-foreground">
            Configuracion vigente — visible para todos los miembros
          </p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Editar en Configuracion
          </Button>
        )}
      </div>

      {/* Governance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-blue-600" />
            Gobernanza
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RuleRow label="Quorum por defecto">{pct(rules.governance.default_quorum)}</RuleRow>
          <RuleRow label="Mayoria por defecto">{pct(rules.governance.default_majority)}</RuleRow>
          <RuleRow label="Delegacion habilitada">
            <BoolBadge value={rules.governance.delegation_enabled} />
          </RuleRow>
          <RuleRow label="Roles con derecho a proponer">
            <div className="flex gap-1">
              {rules.governance.proposal_rights.map((r) => (
                <Badge key={r} variant="outline" className="capitalize">{r}</Badge>
              ))}
            </div>
          </RuleRow>
          <RuleRow label="Horas de enfriamiento">{rules.governance.cool_down_hours}h</RuleRow>
          <RuleRow label="Auto-ejecucion">
            <BoolBadge value={rules.governance.auto_execution_enabled} />
          </RuleRow>
          <RuleRow label="Discusion obligatoria">
            <BoolBadge value={rules.governance.mandatory_discussion_enabled} />
          </RuleRow>
          {rules.governance.mandatory_discussion_enabled && (
            <RuleRow label="Horas de discusion por defecto">
              {rules.governance.default_discussion_hours}h
            </RuleRow>
          )}
          <RuleRow label="Periodo de gracia (apelaciones)">
            {rules.governance.grace_period_hours > 0 ? `${rules.governance.grace_period_hours}h` : 'Deshabilitado'}
          </RuleRow>

          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quorum por Tipo de Propuesta</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-sm">
              {Object.entries(rules.governance.quorum_by_type).map(([type, val]) => (
                <div key={type} className="rounded-md border px-2 py-1 text-center">
                  <span className="capitalize text-muted-foreground text-xs">{type}</span>
                  <p className="font-medium">{pct(val)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Mayoria por Tipo de Propuesta</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-sm">
              {Object.entries(rules.governance.majority_by_type).map(([type, val]) => (
                <div key={type} className="rounded-md border px-2 py-1 text-center">
                  <span className="capitalize text-muted-foreground text-xs">{type}</span>
                  <p className="font-medium">{pct(val)}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treasury */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-5 w-5 text-emerald-600" />
            Tesoreria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RuleRow label="Modo">
            <Badge variant="secondary">
              {{ import: 'Importacion', connector: 'Conector', fintech_rail: 'Rail IFPE', hybrid: 'Hibrido' }[rules.treasury.mode]}
            </Badge>
          </RuleRow>
          <RuleRow label="Moneda">{rules.treasury.currency}</RuleRow>
          <RuleRow label="Limite de gasto del admin">
            ${rules.treasury.admin_spending_limit.toLocaleString()} {rules.treasury.currency}
          </RuleRow>
          <RuleRow label="Votacion requerida arriba de">
            ${rules.treasury.require_vote_above.toLocaleString()} {rules.treasury.currency}
          </RuleRow>
          <RuleRow label="Fondo de reserva">{pct(rules.treasury.reserva_fund_percentage)}</RuleRow>
          <RuleRow label="Estado financiero mensual automatico">
            <BoolBadge value={rules.treasury.monthly_statement_auto} />
          </RuleRow>
        </CardContent>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5 text-violet-600" />
            Identidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RuleRow label="Pago condiciona voto">
            <BoolBadge value={rules.identity.payment_to_vote_enabled} />
          </RuleRow>
          {rules.identity.payment_to_vote_enabled && (
            <>
              <RuleRow label="Periodo de gracia">{rules.identity.grace_period_months} meses</RuleRow>
              <RuleRow label="Restaurar al pagar">
                <BoolBadge value={rules.identity.auto_restore_on_payment} />
              </RuleRow>
              <RuleRow label="Restricciones para morosos">
                <div className="flex gap-1 flex-wrap">
                  {rules.identity.delinquent_restrictions.map((r) => (
                    <Badge key={r} variant="outline" className="capitalize">{r}</Badge>
                  ))}
                </div>
              </RuleRow>
            </>
          )}
          <RuleRow label="Terminos consecutivos max">{rules.identity.admin_max_consecutive_terms}</RuleRow>
          <RuleRow label="Duracion del termino">{rules.identity.admin_term_months} meses</RuleRow>
        </CardContent>
      </Card>

      {/* Version History */}
      {versions && versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-5 w-5 text-muted-foreground" />
              Historial de Cambios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">Version {v.version_number}</span>
                    {v.change_reason && (
                      <span className="text-muted-foreground ml-2">— {v.change_reason}</span>
                    )}
                  </div>
                  <span className="text-muted-foreground text-xs">{formatDate(v.created_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
