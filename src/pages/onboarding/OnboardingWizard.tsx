import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useCommunityContext } from '@/app/providers'
import { createCommunity } from '@/core/identity/services/identity.service'
import { updateCommunityRules } from '@/shared/services/rules.service'
import { DEFAULT_RULES } from '@/shared/types/rules'
import type { CommunityRules } from '@/shared/types/rules'
import type { CommunityType } from '@/shared/types'
import { useToast } from '@/shared/components/ui/toast'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import {
  Building2,
  Church,
  Factory,
  Handshake,
  Circle,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Community type options
// ---------------------------------------------------------------------------

interface CommunityTypeOption {
  value: CommunityType
  label: string
  description: string
  icon: LucideIcon
}

const COMMUNITY_TYPES: CommunityTypeOption[] = [
  {
    value: 'residential',
    label: 'Residencial',
    description: 'Condominios, fraccionamientos, edificios',
    icon: Building2,
  },
  {
    value: 'religious',
    label: 'Religioso',
    description: 'Templos, parroquias, congregaciones',
    icon: Church,
  },
  {
    value: 'manufacturing',
    label: 'Manufactura',
    description: 'Asociaciones industriales, cooperativas de producción',
    icon: Factory,
  },
  {
    value: 'cooperative',
    label: 'Cooperativa',
    description: 'Cooperativas, asociaciones civiles',
    icon: Handshake,
  },
  {
    value: 'other',
    label: 'Otro',
    description: 'Otro tipo de organización',
    icon: Circle,
  },
]

// ---------------------------------------------------------------------------
// Rule presets by community type
// ---------------------------------------------------------------------------

const RULE_PRESETS: Record<string, Partial<CommunityRules>> = {
  residential: {
    governance: {
      ...DEFAULT_RULES.governance,
      default_quorum: 0.5,
      default_majority: 0.5,
      delegation_enabled: true,
      proposal_rights: ['admin', 'tesorero', 'miembro'],
      cool_down_hours: 48,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
    },
    treasury: {
      ...DEFAULT_RULES.treasury,
      admin_spending_limit: 50000,
      require_vote_above: 50000,
    },
    identity: {
      ...DEFAULT_RULES.identity,
      payment_to_vote_enabled: true,
      grace_period_months: 2,
      delinquent_restrictions: ['vote', 'propose'],
    },
  },
  religious: {
    governance: {
      ...DEFAULT_RULES.governance,
      default_quorum: 0.33,
      default_majority: 0.5,
      delegation_enabled: false,
      proposal_rights: ['admin'],
      cool_down_hours: 24,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
    },
    treasury: {
      ...DEFAULT_RULES.treasury,
      admin_spending_limit: 20000,
      require_vote_above: 20000,
    },
    identity: {
      ...DEFAULT_RULES.identity,
      payment_to_vote_enabled: false,
      grace_period_months: 3,
      delinquent_restrictions: [],
    },
  },
  manufacturing: {
    governance: {
      ...DEFAULT_RULES.governance,
      default_quorum: 0.66,
      default_majority: 0.66,
      delegation_enabled: true,
      proposal_rights: ['admin', 'tesorero'],
      cool_down_hours: 72,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
    },
    treasury: {
      ...DEFAULT_RULES.treasury,
      admin_spending_limit: 100000,
      require_vote_above: 100000,
    },
    identity: {
      ...DEFAULT_RULES.identity,
      payment_to_vote_enabled: true,
      grace_period_months: 1,
      delinquent_restrictions: ['vote', 'propose', 'delegate'],
    },
  },
  cooperative: {
    governance: {
      ...DEFAULT_RULES.governance,
      default_quorum: 0.5,
      default_majority: 0.5,
      delegation_enabled: true,
      proposal_rights: ['admin', 'tesorero', 'miembro'],
      cool_down_hours: 48,
      auto_execution_enabled: false,
      auto_execution_threshold: 0,
    },
    treasury: {
      ...DEFAULT_RULES.treasury,
      admin_spending_limit: 30000,
      require_vote_above: 30000,
    },
    identity: {
      ...DEFAULT_RULES.identity,
      payment_to_vote_enabled: true,
      grace_period_months: 2,
      delinquent_restrictions: ['vote'],
    },
  },
}

function getRulesForType(type: CommunityType): CommunityRules {
  const preset = RULE_PRESETS[type]
  if (!preset) return { ...DEFAULT_RULES }
  return {
    governance: { ...DEFAULT_RULES.governance, ...(preset.governance || {}) },
    treasury: { ...DEFAULT_RULES.treasury, ...(preset.treasury || {}) },
    identity: { ...DEFAULT_RULES.identity, ...(preset.identity || {}) },
  }
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

const STEPS = [
  { number: 1, label: 'Tipo' },
  { number: 2, label: 'Datos' },
  { number: 3, label: 'Reglas' },
  { number: 4, label: 'Confirmar' },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, idx) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                currentStep > step.number
                  ? 'border-primary bg-primary text-primary-foreground'
                  : currentStep === step.number
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {currentStep > step.number ? (
                <Check className="h-4 w-4" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={cn(
                'mt-1 text-xs font-medium',
                currentStep >= step.number
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={cn(
                'mx-2 mb-5 h-0.5 w-10 sm:w-16 transition-colors',
                currentStep > step.number ? 'bg-primary' : 'bg-muted-foreground/20'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 1: Community Type
// ---------------------------------------------------------------------------

function StepCommunityType({
  selected,
  onSelect,
}: {
  selected: CommunityType | null
  onSelect: (type: CommunityType) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Tipo de Comunidad</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Selecciona el tipo que mejor describe tu organización
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COMMUNITY_TYPES.map((ct) => {
          const Icon = ct.icon
          const isSelected = selected === ct.value
          return (
            <button
              key={ct.value}
              type="button"
              onClick={() => onSelect(ct.value)}
              className={cn(
                'flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all hover:shadow-sm',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-primary/40'
              )}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{ct.label}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {ct.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2: Community Data
// ---------------------------------------------------------------------------

function StepCommunityData({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: {
  name: string
  description: string
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Datos de la Comunidad</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ingresa la información básica de tu comunidad
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="community-name">
            Nombre de la comunidad <span className="text-destructive">*</span>
          </Label>
          <Input
            id="community-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej: Residencial Las Palmas"
            required
          />
          {name.length > 0 && name.trim().length < 3 && (
            <p className="text-sm text-destructive">
              El nombre debe tener al menos 3 caracteres
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="community-description">
            Descripción <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
          <Textarea
            id="community-description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe brevemente tu comunidad..."
            rows={3}
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3: Rules Configuration
// ---------------------------------------------------------------------------

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-semibold text-primary">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-muted-foreground/30'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[18px] mt-0.5' : 'translate-x-0.5 mt-0.5'
          )}
        />
      </button>
    </label>
  )
}

function StepRulesConfig({
  rules,
  onRulesChange,
}: {
  rules: CommunityRules
  onRulesChange: (rules: CommunityRules) => void
}) {
  const updateGovernance = (key: string, value: unknown) => {
    onRulesChange({
      ...rules,
      governance: { ...rules.governance, [key]: value },
    })
  }

  const updateTreasury = (key: string, value: unknown) => {
    onRulesChange({
      ...rules,
      treasury: { ...rules.treasury, [key]: value },
    })
  }

  const updateIdentity = (key: string, value: unknown) => {
    onRulesChange({
      ...rules,
      identity: { ...rules.identity, [key]: value },
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Configuración de Reglas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajusta las reglas de gobernanza, tesorería e identidad
        </p>
      </div>

      {/* Governance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gobernanza</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SliderField
            label="Quórum mínimo"
            value={rules.governance.default_quorum}
            min={0.1}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => updateGovernance('default_quorum', v)}
          />
          <SliderField
            label="Mayoría requerida"
            value={rules.governance.default_majority}
            min={0.5}
            max={1}
            step={0.05}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => updateGovernance('default_majority', v)}
          />
          <ToggleField
            label="Delegación de voto"
            description="Permitir que miembros deleguen su voto a otro miembro"
            checked={rules.governance.delegation_enabled}
            onChange={(v) => updateGovernance('delegation_enabled', v)}
          />
        </CardContent>
      </Card>

      {/* Treasury */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tesorería</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Moneda</Label>
            <Input
              value={rules.treasury.currency}
              onChange={(e) => updateTreasury('currency', e.target.value.toUpperCase())}
              placeholder="MXN"
              maxLength={3}
              className="w-24"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">
              Límite de gasto del administrador (sin votación)
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={rules.treasury.admin_spending_limit}
                onChange={(e) =>
                  updateTreasury('admin_spending_limit', Number(e.target.value))
                }
                min={0}
                className="w-40"
              />
              <span className="text-sm text-muted-foreground">
                {rules.treasury.currency}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Identidad y Pagos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleField
            label="Pago condiciona voto"
            description="Miembros morosos pierden derechos de voto"
            checked={rules.identity.payment_to_vote_enabled}
            onChange={(v) => updateIdentity('payment_to_vote_enabled', v)}
          />
          <div className="space-y-2">
            <Label className="text-sm">Periodo de gracia (meses)</Label>
            <Input
              type="number"
              value={rules.identity.grace_period_months}
              onChange={(e) =>
                updateIdentity('grace_period_months', Number(e.target.value))
              }
              min={0}
              max={12}
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Confirmation
// ---------------------------------------------------------------------------

function StepConfirmation({
  communityType,
  name,
  description,
  rules,
}: {
  communityType: CommunityType
  name: string
  description: string
  rules: CommunityRules
}) {
  const typeOption = COMMUNITY_TYPES.find((ct) => ct.value === communityType)
  const Icon = typeOption?.icon ?? Circle

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Confirmación</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa los datos antes de crear tu comunidad
        </p>
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          {/* Community info */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold">{name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary">{typeOption?.label}</Badge>
              </div>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          <div className="border-t" />

          {/* Rules summary */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Reglas configuradas
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Quórum</p>
                <p className="text-lg font-semibold">
                  {Math.round(rules.governance.default_quorum * 100)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Mayoría</p>
                <p className="text-lg font-semibold">
                  {Math.round(rules.governance.default_majority * 100)}%
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">Delegación</p>
                <p className="text-lg font-semibold">
                  {rules.governance.delegation_enabled ? 'Habilitada' : 'Deshabilitada'}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Límite admin
                </p>
                <p className="text-lg font-semibold">
                  ${rules.treasury.admin_spending_limit.toLocaleString('es-MX')}{' '}
                  {rules.treasury.currency}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Pago condiciona voto
                </p>
                <p className="text-lg font-semibold">
                  {rules.identity.payment_to_vote_enabled ? 'Sí' : 'No'}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Periodo de gracia
                </p>
                <p className="text-lg font-semibold">
                  {rules.identity.grace_period_months}{' '}
                  {rules.identity.grace_period_months === 1 ? 'mes' : 'meses'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export function OnboardingWizard() {
  const { user } = useAuth()
  const { setCommunityId, refreshCommunities } = useCommunityContext()
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState(1)
  const [communityType, setCommunityType] = useState<CommunityType | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState<CommunityRules>({ ...DEFAULT_RULES })
  const [submitting, setSubmitting] = useState(false)

  // When community type changes, update rules preset
  const handleTypeSelect = (type: CommunityType) => {
    setCommunityType(type)
    setRules(getRulesForType(type))
  }

  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        return communityType !== null
      case 2:
        return name.trim().length >= 3
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < 4 && canGoNext()) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (!user || !communityType || !name.trim()) return
    setSubmitting(true)
    try {
      const community = await createCommunity(user.id, {
        name: name.trim(),
        type: communityType,
        description: description.trim() || undefined,
      })
      await updateCommunityRules(community.id, rules)
      setCommunityId(community.id)
      refreshCommunities()
      toast.success('Comunidad creada exitosamente')
      navigate('/dashboard')
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Error al crear la comunidad'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <h1 className="text-lg font-bold text-primary">Civitas</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={step} />
        </div>

        {/* Step content */}
        <div className="mb-8">
          {step === 1 && (
            <StepCommunityType
              selected={communityType}
              onSelect={handleTypeSelect}
            />
          )}
          {step === 2 && (
            <StepCommunityData
              name={name}
              description={description}
              onNameChange={setName}
              onDescriptionChange={setDescription}
            />
          )}
          {step === 3 && (
            <StepRulesConfig rules={rules} onRulesChange={setRules} />
          )}
          {step === 4 && communityType && (
            <StepConfirmation
              communityType={communityType}
              name={name}
              description={description}
              rules={rules}
            />
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Atrás
          </Button>

          {step < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canGoNext()}
              className="gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Crear Comunidad
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
