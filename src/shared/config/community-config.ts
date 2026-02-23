import type { CommunityType } from '@/shared/types'

export type VotingWeightFormula = 'one_person_one_vote' | 'custom_attribute'

export interface MembershipAttributeSchemaItem {
  key: string
  label: string
  type: 'text' | 'number' | 'decimal' | 'date' | 'enum'
  options?: string[]
}

export interface CommunityConfigShape {
  vertical: CommunityType
  member_label: string
  entity_label: string
  contribution_label: string
  voting_weight: {
    formula: VotingWeightFormula
    source_field: string | null
  }
  membership_attributes: MembershipAttributeSchemaItem[]
  financial_categories: {
    income: string[]
    expense: string[]
  }
  separate_funds?: boolean
  funds?: string[]
  treasury_mode?: 'manual' | 'fintoc' | 'hybrid'
}

const DEFAULT_CONFIG: CommunityConfigShape = {
  vertical: 'other',
  member_label: 'Miembro',
  entity_label: 'Entidad',
  contribution_label: 'Contribución',
  voting_weight: {
    formula: 'one_person_one_vote',
    source_field: null,
  },
  membership_attributes: [],
  financial_categories: {
    income: ['Cuotas', 'Donaciones', 'Otros ingresos'],
    expense: ['Operación', 'Mantenimiento', 'Servicios', 'Otros egresos'],
  },
  separate_funds: false,
  funds: ['general'],
  treasury_mode: 'manual',
}

const PRESETS: Record<CommunityType, CommunityConfigShape> = {
  residential: {
    vertical: 'residential',
    member_label: 'Residente',
    entity_label: 'Unidad',
    contribution_label: 'Cuota de mantenimiento',
    voting_weight: {
      formula: 'custom_attribute',
      source_field: 'custom_attributes.indiviso_pct',
    },
    membership_attributes: [
      { key: 'unit', label: 'Unidad', type: 'text' },
      { key: 'floor', label: 'Piso', type: 'number' },
      { key: 'tower', label: 'Torre', type: 'text' },
      { key: 'indiviso_pct', label: '% Indiviso', type: 'decimal' },
      { key: 'area_m2', label: 'Área (m2)', type: 'decimal' },
    ],
    financial_categories: {
      income: ['Cuota ordinaria', 'Cuota extraordinaria', 'Multas', 'Recargos', 'Otros ingresos'],
      expense: ['Mantenimiento', 'Seguridad', 'Limpieza', 'Servicios', 'Fondo de reserva', 'Otros egresos'],
    },
  },
  religious: {
    vertical: 'religious',
    member_label: 'Miembro',
    entity_label: 'Familia',
    contribution_label: 'Contribución',
    voting_weight: {
      formula: 'one_person_one_vote',
      source_field: null,
    },
    membership_attributes: [
      { key: 'family_name', label: 'Familia', type: 'text' },
      { key: 'membership_tier', label: 'Nivel de membresía', type: 'enum', options: ['full', 'associate', 'youth', 'honorary'] },
    ],
    financial_categories: {
      income: ['Contribuciones', 'Eventos', 'Donaciones', 'Otros ingresos'],
      expense: ['Operación', 'Mantenimiento', 'Eventos', 'Caridad', 'Otros egresos'],
    },
  },
  cooperative: {
    vertical: 'cooperative',
    member_label: 'Socio',
    entity_label: 'Participación',
    contribution_label: 'Aportación',
    voting_weight: {
      formula: 'one_person_one_vote',
      source_field: null,
    },
    membership_attributes: [
      { key: 'share_count', label: 'Participaciones', type: 'number' },
      { key: 'join_date', label: 'Fecha de ingreso', type: 'date' },
    ],
    financial_categories: {
      income: ['Aportaciones', 'Ventas', 'Rendimientos', 'Otros ingresos'],
      expense: ['Operación', 'Materiales', 'Nómina', 'Legal', 'Otros egresos'],
    },
  },
  manufacturing: {
    vertical: 'manufacturing',
    member_label: 'Socio industrial',
    entity_label: 'Empresa',
    contribution_label: 'Aportación',
    voting_weight: {
      formula: 'custom_attribute',
      source_field: 'custom_attributes.production_volume',
    },
    membership_attributes: [
      { key: 'production_volume', label: 'Volumen de producción', type: 'decimal' },
      { key: 'sector', label: 'Sector', type: 'text' },
    ],
    financial_categories: {
      income: ['Aportaciones', 'Servicios', 'Eventos', 'Otros ingresos'],
      expense: ['Operación', 'Negociación', 'Certificaciones', 'Otros egresos'],
    },
  },
  other: DEFAULT_CONFIG,
}

export function getCommunityConfigPreset(type: CommunityType): CommunityConfigShape {
  return PRESETS[type] ?? PRESETS.other
}

export function mergeCommunityConfig(
  rawConfig: unknown,
  type: CommunityType,
): CommunityConfigShape {
  const preset = getCommunityConfigPreset(type)
  const incoming = (rawConfig ?? {}) as Partial<CommunityConfigShape>

  return {
    ...preset,
    ...incoming,
    voting_weight: {
      ...preset.voting_weight,
      ...(incoming.voting_weight ?? {}),
    },
    membership_attributes: Array.isArray(incoming.membership_attributes)
      ? incoming.membership_attributes
      : preset.membership_attributes,
    financial_categories: {
      ...preset.financial_categories,
      ...(incoming.financial_categories ?? {}),
      income: incoming.financial_categories?.income ?? preset.financial_categories.income,
      expense: incoming.financial_categories?.expense ?? preset.financial_categories.expense,
    },
    separate_funds: incoming.separate_funds ?? preset.separate_funds ?? false,
    funds: (incoming.funds ?? preset.funds ?? ['general']).length
      ? (incoming.funds ?? preset.funds ?? ['general'])
      : ['general'],
    treasury_mode: incoming.treasury_mode ?? preset.treasury_mode ?? 'manual',
  }
}
