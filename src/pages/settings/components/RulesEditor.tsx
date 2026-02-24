import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Shield, Wallet, UserCheck, Building2, CheckCircle2, AlertTriangle, Info, XCircle, Vote, BookOpen } from 'lucide-react'
import { isValidCurrencyCode, isValidLocaleCode, normalizeCurrencyCode, normalizeLocaleCode } from '@/shared/lib/locale'
import { validateCompliance } from '@/engine/compliance'
import type { CommunityRules } from '@/shared/types/rules'

interface RulesEditorProps {
  rules: CommunityRules
  rulesSaved: boolean
  isSaving: boolean
  saveError: boolean
  legalFramework: { displayName: string } | null
  fintocStatus: string | undefined
  onUpdateGovernance: <K extends keyof CommunityRules['governance']>(key: K, value: CommunityRules['governance'][K]) => void
  onUpdateTreasury: <K extends keyof CommunityRules['treasury']>(key: K, value: CommunityRules['treasury'][K]) => void
  onUpdateIdentity: <K extends keyof CommunityRules['identity']>(key: K, value: CommunityRules['identity'][K]) => void
  onUpdateCompliance: <K extends keyof CommunityRules['compliance']>(key: K, value: CommunityRules['compliance'][K]) => void
  onToggleRestriction: (restriction: string) => void
  onToggleProposalRight: (role: string) => void
  onSave: () => void
  onNavigatePayments: () => void
  onNavigateGovernance: () => void
  onNavigateRules: () => void
}

export function RulesEditor({
  rules,
  rulesSaved,
  isSaving,
  saveError,
  legalFramework,
  fintocStatus,
  onUpdateGovernance,
  onUpdateTreasury,
  onUpdateIdentity,
  onUpdateCompliance,
  onToggleRestriction,
  onToggleProposalRight,
  onSave,
  onNavigatePayments,
  onNavigateGovernance,
  onNavigateRules,
}: RulesEditorProps) {
  const rulesCurrencyValid = isValidCurrencyCode(rules.treasury.currency)
  const rulesLocaleValid = isValidLocaleCode(rules.treasury.locale)
  const rulesFormValid = rulesCurrencyValid && rulesLocaleValid

  const complianceResult = useMemo(() => {
    if (!legalFramework) return null
    return validateCompliance(rules, legalFramework as Parameters<typeof validateCompliance>[1])
  }, [rules, legalFramework])

  return (
    <div className="space-y-6">
      {rulesSaved && (
        <div className="rounded-md bg-muted border px-4 py-3 text-sm text-foreground">
          Reglas guardadas exitosamente.
        </div>
      )}

      {/* Governance Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Gobernanza
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <RangeField
            label={`Quórum por defecto: ${Math.round(rules.governance.default_quorum * 100)}%`}
            value={Math.round(rules.governance.default_quorum * 100)}
            onChange={(v) => onUpdateGovernance('default_quorum', v / 100)}
          />
          <RangeField
            label={`Mayoría por defecto: ${Math.round(rules.governance.default_majority * 100)}%`}
            value={Math.round(rules.governance.default_majority * 100)}
            onChange={(v) => onUpdateGovernance('default_majority', v / 100)}
          />

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.governance.delegation_enabled}
              onChange={(e) => onUpdateGovernance('delegation_enabled', e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm">Delegación habilitada</span>
          </label>

          <div className="space-y-2">
            <Label>Derechos de propuesta</Label>
            <div className="flex flex-wrap gap-2">
              {['admin', 'tesorero', 'miembro'].map((role) => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.governance.proposal_rights.includes(role)}
                    onChange={() => onToggleProposalRight(role)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  <span className="text-sm capitalize">{role}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cool_down_hours">Horas de enfriamiento</Label>
            <Input
              id="cool_down_hours"
              type="number"
              min={0}
              value={rules.governance.cool_down_hours}
              onChange={(e) => onUpdateGovernance('cool_down_hours', Number(e.target.value))}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Tiempo entre que se aprueba una votación y se ejecuta.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_endorsements">Avales requeridos para propuestas</Label>
            <Input
              id="min_endorsements"
              type="number"
              min={0}
              max={50}
              value={rules.governance.min_endorsements ?? 3}
              onChange={(e) => onUpdateGovernance('min_endorsements', Number(e.target.value))}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Cantidad de avales que necesita una propuesta antes de notificar a todos. 0 = sin avales (notificación inmediata).
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.governance.auto_execution_enabled}
              onChange={(e) => onUpdateGovernance('auto_execution_enabled', e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            <span className="text-sm">Auto-ejecución habilitada</span>
          </label>

          {rules.governance.auto_execution_enabled && (
            <div className="space-y-2 ml-7">
              <Label htmlFor="auto_execution_threshold">Umbral de auto-ejecución</Label>
              <Input
                id="auto_execution_threshold"
                type="number"
                min={0}
                value={rules.governance.auto_execution_threshold}
                onChange={(e) => onUpdateGovernance('auto_execution_threshold', Number(e.target.value))}
                className="max-w-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Solo auto-ejecutar montos menores a este valor. 0 = sin límite.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Treasury Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            Tesorería
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border bg-muted p-4 space-y-3">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Pagos electrónicos
            </p>
            <p className="text-xs text-muted-foreground">
              Recibe SPEI, concilia cuotas automáticamente y dispersa pagos con gobernanza.
            </p>
            {fintocStatus === 'active' ? (
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                <span>Integración activa. Gestiona desde la sección de Pagos.</span>
              </div>
            ) : fintocStatus === 'pending' ? (
              <p className="text-sm text-muted-foreground">Solicitud en revisión. Te notificaremos cuando esté lista.</p>
            ) : (
              <Button type="button" variant="default" size="sm" onClick={onNavigatePayments}>
                Configurar pagos
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale">Locale</Label>
            <Input
              id="locale"
              value={rules.treasury.locale}
              onChange={(e) => onUpdateTreasury('locale', normalizeLocaleCode(e.target.value))}
              className="max-w-[200px]"
              placeholder="es-MX"
            />
            {!rulesLocaleValid && (
              <p className="text-xs text-destructive">Locale inválido. Ejemplos: es-MX, en-US, pt-BR.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Input
              id="currency"
              value={rules.treasury.currency}
              onChange={(e) => onUpdateTreasury('currency', normalizeCurrencyCode(e.target.value))}
              className="max-w-[200px]"
              placeholder="MXN"
            />
            {!rulesCurrencyValid && (
              <p className="text-xs text-destructive">Moneda inválida. Usa código ISO 4217 (MXN, USD, EUR).</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_spending_limit">Límite de gasto del admin</Label>
            <Input
              id="admin_spending_limit"
              type="number"
              min={0}
              value={rules.treasury.admin_spending_limit}
              onChange={(e) => onUpdateTreasury('admin_spending_limit', Number(e.target.value))}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              El admin puede gastar hasta este monto sin votación.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="require_vote_above">Requerir votación arriba de</Label>
            <Input
              id="require_vote_above"
              type="number"
              min={0}
              value={rules.treasury.require_vote_above}
              onChange={(e) => onUpdateTreasury('require_vote_above', Number(e.target.value))}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Montos superiores a este valor requieren aprobación por votación.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Identity Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCheck className="h-5 w-5 text-muted-foreground" />
            Identidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-md border bg-muted p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.identity.payment_to_vote_enabled}
                onChange={(e) => onUpdateIdentity('payment_to_vote_enabled', e.target.checked)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <div>
                <span className="text-sm font-medium">Pago condiciona voto</span>
                <p className="text-xs text-muted-foreground">
                  Si está activo, los miembros morosos pierden derechos de participación.
                </p>
              </div>
            </label>
          </div>

          {rules.identity.payment_to_vote_enabled && (
            <div className="ml-4 space-y-5 border-l-2 border-border pl-4">
              <div className="space-y-2">
                <Label htmlFor="grace_period_months">Periodo de gracia (meses)</Label>
                <Input
                  id="grace_period_months"
                  type="number"
                  min={0}
                  value={rules.identity.grace_period_months}
                  onChange={(e) => onUpdateIdentity('grace_period_months', Number(e.target.value))}
                  className="max-w-[200px]"
                />
                <p className="text-xs text-muted-foreground">
                  Meses que el miembro puede estar moroso antes de perder derechos.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.identity.auto_restore_on_payment}
                  onChange={(e) => onUpdateIdentity('auto_restore_on_payment', e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm">Restaurar derechos automáticamente al pagar</span>
              </label>

              <div className="space-y-2">
                <Label>Restricciones para morosos</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 'vote', label: 'Votar' },
                    { value: 'propose', label: 'Proponer' },
                    { value: 'delegate', label: 'Delegar' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rules.identity.delinquent_restrictions.includes(opt.value)}
                        onChange={() => onToggleRestriction(opt.value)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Cumplimiento legal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compliance_jurisdiction">Jurisdicción</Label>
            <select
              id="compliance_jurisdiction"
              value={rules.compliance.jurisdiction}
              onChange={(e) => onUpdateCompliance('jurisdiction', e.target.value as CommunityRules['compliance']['jurisdiction'])}
              className="h-10 max-w-[260px] rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="mx">México</option>
              <option value="us">Estados Unidos</option>
              <option value="eu">Unión Europea</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="compliance_privacy">Marco de privacidad</Label>
            <select
              id="compliance_privacy"
              value={rules.compliance.privacy_framework}
              onChange={(e) => onUpdateCompliance('privacy_framework', e.target.value as CommunityRules['compliance']['privacy_framework'])}
              className="h-10 max-w-[260px] rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="lfpdppp">LFPDPPP (MX)</option>
              <option value="ccpa">CCPA (US)</option>
              <option value="gdpr">GDPR (EU)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="compliance_property">Marco patrimonial / comunidad</Label>
            <select
              id="compliance_property"
              value={rules.compliance.property_framework}
              onChange={(e) => onUpdateCompliance('property_framework', e.target.value as CommunityRules['compliance']['property_framework'])}
              className="h-10 max-w-[260px] rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="lpci_cdmx">LPCI CDMX (MX)</option>
              <option value="hoa_us">HOA (US)</option>
              <option value="none">No aplica</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Compliance validation banners */}
      {complianceResult && !complianceResult.isValid && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-destructive font-medium text-sm">
              <XCircle className="h-4 w-4 shrink-0" />
              Estas reglas no cumplen con el marco legal aplicable ({legalFramework?.displayName})
            </div>
            {complianceResult.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-destructive/90 pl-6">
                <span>- {err.message}</span>
                {err.reference && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">{err.reference}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {complianceResult && complianceResult.warnings.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 font-medium text-sm">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Recomendaciones de cumplimiento
            </div>
            {complianceResult.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-yellow-700/90 dark:text-yellow-400/80 pl-6">
                <span>- {w.message}</span>
                {w.reference && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">{w.reference}</Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {complianceResult && complianceResult.info.length > 0 && (
        <Card className="border-blue-500/30 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-medium text-sm">
              <Info className="h-4 w-4 shrink-0" />
              Información legal
            </div>
            {complianceResult.info.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-blue-700/90 dark:text-blue-400/80 pl-6">
                <span>- {item.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Save button + shortcuts */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={onSave} disabled={isSaving || !rulesFormValid}>
          {isSaving ? 'Guardando...' : 'Guardar Reglas'}
        </Button>
        <Button variant="outline" onClick={onNavigateGovernance}>
          <Vote className="h-3.5 w-3.5 mr-1" />
          Cambiar Regla via Propuesta
        </Button>
        <Button variant="ghost" size="sm" onClick={onNavigateRules}>
          <BookOpen className="h-3.5 w-3.5 mr-1" />
          Ver Reglas Vigentes
        </Button>
        {saveError && (
          <span className="text-sm text-destructive">
            Error al guardar. Intenta de nuevo.
          </span>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small helper: range slider with min/max labels
// ---------------------------------------------------------------------------

function RangeField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary h-2 cursor-pointer rounded-lg appearance-none bg-muted"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}
