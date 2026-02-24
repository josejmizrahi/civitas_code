import { useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, useCommunityContext } from '@/app/providers'
import { createCommunity, seedCommunityCategories, updateCommunityConfig, isSlugAvailable } from '@/core/identity/services/identity.service'
import { updateCommunityRules } from '@/shared/services/rules.service'
import { DEFAULT_RULES } from '@/shared/types/rules'
import type { CommunityRules } from '@/shared/types/rules'
import type { CommunityType } from '@/shared/types'
import {
  getCommunityConfigPreset,
  type CommunityConfigShape,
  type MembershipAttributeSchemaItem,
} from '@/shared/config/community-config'
import { communityPath } from '@/shared/lib/communityRoutes'
import { useToast } from '@/shared/components/ui/toast'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'
import { isValidCurrencyCode, isValidLocaleCode, normalizeCurrencyCode, normalizeLocaleCode } from '@/shared/lib/locale'
import { getCompliancePreset } from '@/shared/config/compliance-presets'
import { useI18n } from '@/shared/hooks/useI18n'
import { COMMUNITY_TYPE_OPTIONS, getPreset } from '@/engine/rules'
import type { CommunityType as EngineCommunityType } from '@/engine/rules'
import { getLegalFramework, validateCompliance } from '@/engine/compliance'
import {
  Home,
  Users,
  Trophy,
  GraduationCap,
  Church,
  HeartHandshake,
  Handshake,
  Settings,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertTriangle,
  Info,
  XCircle,
  Circle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Community type options — from engine presets
// ---------------------------------------------------------------------------

/** Map preset icon keys to Lucide components */
const ICON_MAP: Record<string, LucideIcon> = {
  'building-2': Home,
  'home': Home,
  'users': Users,
  'trophy': Trophy,
  'graduation-cap': GraduationCap,
  'church': Church,
  'heart-handshake': HeartHandshake,
  'handshake': Handshake,
  'settings': Settings,
}

interface CommunityTypeOption {
  value: CommunityType
  label: string
  description: string
  icon: LucideIcon
}

const COMMUNITY_TYPES: CommunityTypeOption[] = COMMUNITY_TYPE_OPTIONS.map((opt) => ({
  value: opt.type as CommunityType,
  label: opt.displayName,
  description: opt.description,
  icon: ICON_MAP[opt.icon] ?? Settings,
}))

// ---------------------------------------------------------------------------
// Rule presets — derived from engine presets
// ---------------------------------------------------------------------------

function getRulesForType(type: CommunityType): CommunityRules {
  const engineType = type as EngineCommunityType
  const preset = getPreset(engineType)
  const defaultRules = preset.defaultRules

  // Map legal framework to compliance preset
  const compliancePreset = preset.legalFrameworkKey?.startsWith('mx.')
    ? getCompliancePreset('mx')
    : getCompliancePreset('custom')

  return {
    governance: { ...DEFAULT_RULES.governance, ...(defaultRules.governance || {}) },
    treasury: { ...DEFAULT_RULES.treasury, ...(defaultRules.treasury || {}) },
    identity: { ...DEFAULT_RULES.identity, ...(defaultRules.identity || {}) },
    compliance: compliancePreset,
  }
}

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ currentStep, labels }: { currentStep: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {labels.map((label, idx) => {
        const step = idx + 1
        return (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                currentStep > step
                  ? 'border-primary bg-primary text-primary-foreground'
                  : currentStep === step
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground'
              )}
            >
              {currentStep > step ? (
                <Check className="h-4 w-4" />
              ) : (
                step
              )}
            </div>
            <span
              className={cn(
                'mt-1 text-xs font-medium',
                currentStep >= step
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              {label}
            </span>
          </div>
          {idx < labels.length - 1 && (
            <div
              className={cn(
                'mx-2 mb-5 h-0.5 w-10 sm:w-16 transition-colors',
                currentStep > step ? 'bg-primary' : 'bg-muted-foreground/20'
              )}
            />
          )}
        </div>
      )})}
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
  slug,
  description,
  slugError,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
}: {
  name: string
  slug: string
  description: string
  slugError: string
  onNameChange: (v: string) => void
  onSlugChange: (v: string) => void
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
          <Label htmlFor="community-slug">
            Identificador único <span className="text-destructive">*</span>
          </Label>
          <Input
            id="community-slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="residencial-las-palmas"
            required
          />
          <p className="text-xs text-muted-foreground">
            Identificador interno de tu comunidad. Usa solo minúsculas, números y guiones.
          </p>
          {slug.length > 0 && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && (
            <p className="text-sm text-destructive">
              Usa solo minúsculas, números y guiones (sin espacios).
            </p>
          )}
          {slugError && (
            <p className="text-sm text-destructive">{slugError}</p>
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
// Step 3: Member Structure
// ---------------------------------------------------------------------------

function StepMemberStructure({
  config,
  onConfigChange,
}: {
  config: CommunityConfigShape
  onConfigChange: (next: CommunityConfigShape) => void
}) {
  const addAttribute = () => {
    const next: MembershipAttributeSchemaItem = {
      key: `custom_${config.membership_attributes.length + 1}`,
      label: `Campo ${config.membership_attributes.length + 1}`,
      type: 'text',
    }
    onConfigChange({
      ...config,
      membership_attributes: [...config.membership_attributes, next],
    })
  }

  const removeAttribute = (idx: number) => {
    const nextAttributes = config.membership_attributes.filter((_, i) => i !== idx)
    const selectedSource = config.voting_weight.source_field
    const hasSelectedSource = selectedSource
      ? nextAttributes.some((a) => `custom_attributes.${a.key}` === selectedSource)
      : true

    onConfigChange({
      ...config,
      membership_attributes: nextAttributes,
      voting_weight: {
        ...config.voting_weight,
        source_field: hasSelectedSource ? selectedSource : null,
      },
    })
  }

  const updateAttribute = (idx: number, patch: Partial<MembershipAttributeSchemaItem>) => {
    onConfigChange({
      ...config,
      membership_attributes: config.membership_attributes.map((attr, i) =>
        i === idx ? { ...attr, ...patch } : attr
      ),
    })
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Estructura de Miembros</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Define atributos personalizados y la fuente para el peso de voto
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Labels de comunidad</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>Label de miembro</Label>
            <Input
              value={config.member_label}
              onChange={(e) => onConfigChange({ ...config, member_label: e.target.value })}
              placeholder="Miembro"
            />
          </div>
          <div className="space-y-2">
            <Label>Label de entidad</Label>
            <Input
              value={config.entity_label}
              onChange={(e) => onConfigChange({ ...config, entity_label: e.target.value })}
              placeholder="Entidad"
            />
          </div>
          <div className="space-y-2">
            <Label>Label de contribución</Label>
            <Input
              value={config.contribution_label}
              onChange={(e) => onConfigChange({ ...config, contribution_label: e.target.value })}
              placeholder="Contribución"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Atributos personalizados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.membership_attributes.map((attr, idx) => (
            <div key={`${attr.key}-${idx}`} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_140px_auto]">
              <Input
                value={attr.key}
                onChange={(e) => updateAttribute(idx, { key: e.target.value.trim().replace(/\s+/g, '_') })}
                placeholder="clave_interna"
              />
              <Input
                value={attr.label}
                onChange={(e) => updateAttribute(idx, { label: e.target.value })}
                placeholder="Nombre visible"
              />
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={attr.type}
                onChange={(e) => updateAttribute(idx, { type: e.target.value as MembershipAttributeSchemaItem['type'] })}
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="decimal">Decimal</option>
                <option value="date">Fecha</option>
                <option value="enum">Lista</option>
              </select>
              <Button type="button" variant="outline" onClick={() => removeAttribute(idx)}>
                Quitar
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addAttribute}>
            Agregar atributo
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Peso de voto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Fórmula</Label>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={config.voting_weight.formula}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  voting_weight: {
                    ...config.voting_weight,
                    formula: e.target.value as CommunityConfigShape['voting_weight']['formula'],
                    source_field: e.target.value === 'one_person_one_vote' ? null : config.voting_weight.source_field,
                  },
                })
              }
            >
              <option value="one_person_one_vote">Una persona = un voto</option>
              <option value="custom_attribute">Por atributo personalizado</option>
            </select>
          </div>
          {config.voting_weight.formula === 'custom_attribute' && (
            <div className="space-y-2">
              <Label>Atributo fuente del peso</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={config.voting_weight.source_field ?? ''}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    voting_weight: {
                      ...config.voting_weight,
                      source_field: e.target.value || null,
                    },
                  })
                }
              >
                <option value="">Selecciona un atributo</option>
                {config.membership_attributes.map((attr) => (
                  <option key={attr.key} value={`custom_attributes.${attr.key}`}>
                    {attr.label} ({attr.key})
                  </option>
                ))}
              </select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4: Financial categories
// ---------------------------------------------------------------------------

function StepFinancialCategories({
  config,
  onConfigChange,
}: {
  config: CommunityConfigShape
  onConfigChange: (next: CommunityConfigShape) => void
}) {
  const updateCategory = (kind: 'income' | 'expense', idx: number, value: string) => {
    const next = [...config.financial_categories[kind]]
    next[idx] = value
    onConfigChange({
      ...config,
      financial_categories: {
        ...config.financial_categories,
        [kind]: next,
      },
    })
  }

  const addCategory = (kind: 'income' | 'expense') => {
    onConfigChange({
      ...config,
      financial_categories: {
        ...config.financial_categories,
        [kind]: [...config.financial_categories[kind], ''],
      },
    })
  }

  const removeCategory = (kind: 'income' | 'expense', idx: number) => {
    onConfigChange({
      ...config,
      financial_categories: {
        ...config.financial_categories,
        [kind]: config.financial_categories[kind].filter((_, i) => i !== idx),
      },
    })
  }

  const renderCategoryEditor = (kind: 'income' | 'expense', title: string) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {config.financial_categories[kind].map((item, idx) => (
          <div key={`${kind}-${idx}`} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => updateCategory(kind, idx, e.target.value)}
              placeholder="Nombre de categoría"
            />
            <Button type="button" variant="outline" onClick={() => removeCategory(kind, idx)}>
              Quitar
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => addCategory(kind)}>
          Agregar categoría
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Categorías Financieras</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajusta categorías de ingreso y egreso para tu comunidad
        </p>
      </div>
      {renderCategoryEditor('income', 'Categorías de ingreso')}
      {renderCategoryEditor('expense', 'Categorías de egreso')}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 5: Rules Configuration
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
  communityType,
}: {
  rules: CommunityRules
  onRulesChange: (rules: CommunityRules) => void
  communityType: CommunityType | null
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

  const updateCompliance = (key: string, value: unknown) => {
    onRulesChange({
      ...rules,
      compliance: { ...rules.compliance, [key]: value },
    })
  }

  // Real-time compliance validation
  const complianceResult = useMemo(() => {
    if (!communityType) return null
    const engineType = communityType as EngineCommunityType
    const preset = getPreset(engineType)
    const framework = getLegalFramework(preset.legalFrameworkKey)
    if (!framework) return null
    return validateCompliance(rules, framework)
  }, [rules, communityType])

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">Configuración de Reglas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajusta las reglas de gobernanza, tesorería e identidad
        </p>
      </div>

      {/* Compliance validation banner */}
      {complianceResult && !complianceResult.isValid && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-destructive font-medium text-sm">
              <XCircle className="h-4 w-4 shrink-0" />
              Hay reglas que no cumplen con el marco legal aplicable
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

      {/* Compliance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Cumplimiento legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Jurisdicción</Label>
            <select
              value={rules.compliance.jurisdiction}
              onChange={(e) => updateCompliance('jurisdiction', e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="mx">México</option>
              <option value="us">Estados Unidos</option>
              <option value="eu">Unión Europea</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Privacidad</Label>
            <select
              value={rules.compliance.privacy_framework}
              onChange={(e) => updateCompliance('privacy_framework', e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="lfpdppp">LFPDPPP (MX)</option>
              <option value="ccpa">CCPA (US)</option>
              <option value="gdpr">GDPR (EU)</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Treasury */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tesorería</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Locale</Label>
            <Input
              value={rules.treasury.locale}
              onChange={(e) => updateTreasury('locale', normalizeLocaleCode(e.target.value))}
              placeholder="es-MX"
              className="w-32"
            />
            {!isValidLocaleCode(rules.treasury.locale) && (
              <p className="text-xs text-destructive">Usa un locale válido, por ejemplo: `es-MX`, `en-US`, `pt-BR`.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Moneda</Label>
            <Input
              value={rules.treasury.currency}
              onChange={(e) => updateTreasury('currency', normalizeCurrencyCode(e.target.value))}
              placeholder="MXN"
              maxLength={3}
              className="w-24"
            />
            {!isValidCurrencyCode(rules.treasury.currency) && (
              <p className="text-xs text-destructive">Usa un código ISO 4217 válido, por ejemplo: `MXN`, `USD`, `EUR`.</p>
            )}
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

      {/* Advanced governance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gobernanza avanzada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleField
            label="Discusión obligatoria antes de votar"
            description="Las propuestas pasan por una fase de discusión antes de abrir la votación"
            checked={rules.governance.mandatory_discussion_enabled}
            onChange={(v) => updateGovernance('mandatory_discussion_enabled', v)}
          />
          {rules.governance.mandatory_discussion_enabled && (
            <div className="space-y-2">
              <Label className="text-sm">Horas mínimas de discusión</Label>
              <Input
                type="number"
                value={rules.governance.default_discussion_hours}
                onChange={(e) => updateGovernance('default_discussion_hours', Number(e.target.value))}
                min={1}
                max={720}
                className="w-24"
              />
            </div>
          )}
          <SliderField
            label="Avales mínimos para propuesta"
            value={rules.governance.min_endorsements}
            min={0}
            max={10}
            step={1}
            format={(v) => v === 0 ? 'Deshabilitado' : `${v}`}
            onChange={(v) => updateGovernance('min_endorsements', v)}
          />
          <div className="space-y-2">
            <Label className="text-sm">Periodo de enfriamiento (horas)</Label>
            <Input
              type="number"
              value={rules.governance.cool_down_hours}
              onChange={(e) => updateGovernance('cool_down_hours', Number(e.target.value))}
              min={0}
              max={168}
              className="w-24"
            />
            <p className="text-xs text-muted-foreground">
              Horas entre aprobación y ejecución de una propuesta
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
        <p className="font-medium">Configuración adicional disponible</p>
        <p className="mt-1 text-xs opacity-80">
          Quórum diferenciado por tipo de propuesta, restricciones de morosos, términos administrativos,
          y configuración de asambleas se pueden ajustar después en Administración → Reglas.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 6: Confirmation
// ---------------------------------------------------------------------------

function StepConfirmation({
  communityType,
  name,
  slug,
  description,
  config,
  rules,
}: {
  communityType: CommunityType
  name: string
  slug: string
  description: string
  config: CommunityConfigShape
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
                <Badge variant="outline">{slug}</Badge>
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
                  Label miembro
                </p>
                <p className="text-lg font-semibold">
                  {config.member_label}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Label entidad
                </p>
                <p className="text-lg font-semibold">
                  {config.entity_label}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Label contribución
                </p>
                <p className="text-lg font-semibold">
                  {config.contribution_label}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Atributos de miembro
                </p>
                <p className="text-lg font-semibold">
                  {config.membership_attributes.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Categorías ingreso
                </p>
                <p className="text-lg font-semibold">
                  {config.financial_categories.income.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Categorías egreso
                </p>
                <p className="text-lg font-semibold">
                  {config.financial_categories.expense.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Límite admin
                </p>
                <p className="text-lg font-semibold">
                  ${rules.treasury.admin_spending_limit.toLocaleString(rules.treasury.locale)}{' '}
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
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Jurisdicción
                </p>
                <p className="text-lg font-semibold uppercase">
                  {rules.compliance.jurisdiction}
                </p>
              </div>
              {(() => {
                const engineType = communityType as EngineCommunityType
                const preset = getPreset(engineType)
                const framework = getLegalFramework(preset.legalFrameworkKey)
                if (!framework) return null
                return (
                  <div className="rounded-lg bg-muted/50 p-3 col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Marco legal aplicable
                    </p>
                    <p className="text-sm font-semibold mt-1">{framework.displayName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {framework.applicableLaws.map((l) => l.name).join(', ')}
                    </p>
                  </div>
                )
              })()}
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
  const { setCommunityId, refreshCommunities, userCommunities } = useCommunityContext()
  const navigate = useNavigate()
  const toast = useToast()
  const { t } = useI18n()
  const hasCommunities = userCommunities.length > 0
  const stepLabels = [
    t('onboarding.step.type'),
    t('onboarding.step.data'),
    t('onboarding.step.structure'),
    t('onboarding.step.categories'),
    t('onboarding.step.rules'),
    t('onboarding.step.confirm'),
  ]

  const [step, setStep] = useState(1)
  const [communityType, setCommunityType] = useState<CommunityType | null>(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugError, setSlugError] = useState('')
  const [description, setDescription] = useState('')
  const [communityConfig, setCommunityConfig] = useState<CommunityConfigShape>(getCommunityConfigPreset('other'))
  const [rules, setRules] = useState<CommunityRules>({ ...DEFAULT_RULES })
  const [submitting, setSubmitting] = useState(false)

  const slugCheckTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleTypeSelect = (type: CommunityType) => {
    setCommunityType(type)
    setRules(getRulesForType(type))
    setCommunityConfig(getCommunityConfigPreset(type))
  }

  const checkSlug = useCallback((value: string) => {
    if (slugCheckTimer.current) clearTimeout(slugCheckTimer.current)
    if (!value || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) return
    setSlugError('')
    slugCheckTimer.current = setTimeout(async () => {
      const available = await isSlugAvailable(value)
      if (!available) {
        setSlugError('Este identificador ya está en uso. Elige otro.')
      }
    }, 500)
  }, [])

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugEdited) {
      const newSlug = sanitizeSlug(value)
      setSlug(newSlug)
      checkSlug(newSlug)
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugEdited(true)
    const newSlug = sanitizeSlug(value)
    setSlug(newSlug)
    setSlugError('')
    checkSlug(newSlug)
  }

  const isValidSlug = (value: string): boolean =>
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)

  const canGoNext = (): boolean => {
    switch (step) {
      case 1:
        return communityType !== null
      case 2:
        return name.trim().length >= 3 && isValidSlug(slug) && !slugError
      case 3:
        return communityConfig.voting_weight.formula !== 'custom_attribute' ||
          Boolean(communityConfig.voting_weight.source_field)
      case 4:
        return communityConfig.financial_categories.income.some((c) => c.trim().length > 0) &&
          communityConfig.financial_categories.expense.some((c) => c.trim().length > 0)
      case 5:
        return isValidCurrencyCode(rules.treasury.currency) && isValidLocaleCode(rules.treasury.locale)
      case 6:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < 6 && canGoNext()) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCancel = () => {
    if (hasCommunities) {
      navigate('/communities')
    } else {
      navigate('/')
    }
  }

  const handleSubmit = async () => {
    if (!user || !communityType || !name.trim()) return
    setSubmitting(true)
    let createdCommunityId: string | null = null
    try {
      const normalizedConfig: CommunityConfigShape = {
        ...communityConfig,
        member_label: communityConfig.member_label.trim() || 'Miembro',
        entity_label: communityConfig.entity_label.trim() || 'Entidad',
        contribution_label: communityConfig.contribution_label.trim() || 'Contribución',
        membership_attributes: communityConfig.membership_attributes
          .map((attr) => ({
            ...attr,
            key: sanitizeSlug(attr.key).replace(/-/g, '_'),
            label: attr.label.trim(),
          }))
          .filter((attr) => attr.key.length > 0 && attr.label.length > 0),
        financial_categories: {
          income: communityConfig.financial_categories.income.map((c) => c.trim()).filter(Boolean),
          expense: communityConfig.financial_categories.expense.map((c) => c.trim()).filter(Boolean),
        },
      }
      if (
        normalizedConfig.voting_weight.formula === 'custom_attribute' &&
        normalizedConfig.voting_weight.source_field
      ) {
        const validSources = new Set(
          normalizedConfig.membership_attributes.map((attr) => `custom_attributes.${attr.key}`)
        )
        if (!validSources.has(normalizedConfig.voting_weight.source_field)) {
          normalizedConfig.voting_weight = { ...normalizedConfig.voting_weight, source_field: null }
        }
      }

      const community = await createCommunity(user.id, {
        name: name.trim(),
        slug: slug.trim(),
        type: communityType,
        description: description.trim() || undefined,
      })
      createdCommunityId = community.id

      const postCreateSteps = [
        () => updateCommunityConfig(community.id, normalizedConfig as unknown as Record<string, unknown>),
        () => seedCommunityCategories(community.id, normalizedConfig.financial_categories),
        () => updateCommunityRules(community.id, rules),
      ]

      const errors: string[] = []
      for (const stepFn of postCreateSteps) {
        try {
          await stepFn()
        } catch (err) {
          errors.push(err instanceof Error ? err.message : 'Error desconocido')
        }
      }

      setCommunityId(community.id)
      refreshCommunities()

      if (errors.length > 0) {
        toast.success('Comunidad creada. Algunas configuraciones se pueden ajustar en Administración.')
      } else {
        toast.success('Comunidad creada exitosamente')
      }
      navigate(communityPath(community.slug, 'dashboard'))
    } catch (err: unknown) {
      if (!createdCommunityId) {
        toast.error(
          err instanceof Error ? err.message : 'Error al crear la comunidad'
        )
      } else {
        setCommunityId(createdCommunityId)
        refreshCommunities()
        toast.error('Error al configurar la comunidad. Puedes ajustarla en Administración.')
        navigate('/communities')
      }
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
            onClick={handleCancel}
          >
            {t('onboarding.cancel')}
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={step} labels={stepLabels} />
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
              slug={slug}
              description={description}
              slugError={slugError}
              onNameChange={handleNameChange}
              onSlugChange={handleSlugChange}
              onDescriptionChange={setDescription}
            />
          )}
          {step === 3 && (
            <StepMemberStructure
              config={communityConfig}
              onConfigChange={setCommunityConfig}
            />
          )}
          {step === 4 && (
            <StepFinancialCategories
              config={communityConfig}
              onConfigChange={setCommunityConfig}
            />
          )}
          {step === 5 && (
            <StepRulesConfig rules={rules} onRulesChange={setRules} communityType={communityType} />
          )}
          {step === 6 && communityType && (
            <StepConfirmation
              communityType={communityType}
              name={name}
              slug={slug}
              description={description}
              config={communityConfig}
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
            {t('onboarding.back')}
          </Button>

          {step < 6 ? (
            <Button
              onClick={handleNext}
              disabled={!canGoNext()}
              className="gap-2"
            >
              {t('onboarding.next')}
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
                  {t('onboarding.creating')}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t('onboarding.create')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
