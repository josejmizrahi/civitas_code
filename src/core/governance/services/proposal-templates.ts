// Proposal Templates — GV-003
// Pre-defined templates for common proposal types in Mexican community governance

import type { ProposalType } from '@/shared/types'
import type { FinancialInstruction } from '@/shared/types/rules'

export interface ProposalTemplate {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  type: ProposalType
  defaultTitle: string
  descriptionPlaceholder: string
  suggestedQuorum?: number
  suggestedMajority?: number
  suggestedDiscussionHours?: number
  hasFinancialInstruction: boolean
  defaultInstructionType?: FinancialInstruction['type']
  // Guidance text shown below the template selector
  guidance: string
}

export const PROPOSAL_TEMPLATES: ProposalTemplate[] = [
  {
    id: 'gasto',
    name: 'Gasto / Desembolso',
    description: 'Aprobar un gasto o pago a proveedor',
    icon: 'Banknote',
    type: 'ordinary',
    defaultTitle: 'Aprobación de gasto: ',
    descriptionPlaceholder: 'Describe el gasto propuesto, el proveedor, el concepto y la justificación. Incluye cotizaciones si aplica.',
    suggestedDiscussionHours: 48,
    hasFinancialInstruction: true,
    defaultInstructionType: 'disbursement',
    guidance: 'Se recomienda incluir al menos 3 cotizaciones para montos mayores a $10,000 MXN. El monto será ejecutado automáticamente si la comunidad tiene auto-ejecución habilitada.',
  },
  {
    id: 'cambio_regla',
    name: 'Cambio de Regla',
    description: 'Modificar una regla de la comunidad',
    icon: 'Settings',
    type: 'amendment',
    defaultTitle: 'Cambio de regla: ',
    descriptionPlaceholder: 'Describe qué regla quieres cambiar, el valor actual y el nuevo valor propuesto. Explica por qué es necesario el cambio.',
    suggestedQuorum: 0.75,
    suggestedMajority: 0.66,
    suggestedDiscussionHours: 72,
    hasFinancialInstruction: true,
    defaultInstructionType: 'config_change',
    guidance: 'Los cambios de regla requieren mayoría calificada (⅔). Se recomienda un periodo de discusión mínimo de 72 horas para que todos los miembros puedan opinar.',
  },
  {
    id: 'cuota',
    name: 'Cambio de Cuota',
    description: 'Modificar el monto de las cuotas',
    icon: 'Receipt',
    type: 'extraordinary',
    defaultTitle: 'Modificación de cuota: ',
    descriptionPlaceholder: 'Describe el cambio propuesto en la cuota, el monto actual, el nuevo monto y la fecha de entrada en vigor.',
    suggestedQuorum: 0.75,
    suggestedMajority: 0.66,
    suggestedDiscussionHours: 72,
    hasFinancialInstruction: true,
    defaultInstructionType: 'quota_change',
    guidance: 'Los cambios de cuota son considerados temas extraordinarios (Art. 31 LPCI CDMX). Requieren quórum y mayoría calificada.',
  },
  {
    id: 'presupuesto',
    name: 'Asignación de Presupuesto',
    description: 'Aprobar presupuesto para una categoría',
    icon: 'PieChart',
    type: 'budget',
    defaultTitle: 'Presupuesto: ',
    descriptionPlaceholder: 'Describe la categoría de gasto, el monto solicitado, el periodo y la justificación.',
    suggestedDiscussionHours: 48,
    hasFinancialInstruction: true,
    defaultInstructionType: 'budget_allocation',
    guidance: 'El presupuesto se asignará a la categoría seleccionada y quedará visible en el tablero financiero.',
  },
  {
    id: 'admision',
    name: 'Admisión de Miembro',
    description: 'Solicitud de ingreso de nuevo miembro',
    icon: 'UserPlus',
    type: 'ordinary',
    defaultTitle: 'Admisión: ',
    descriptionPlaceholder: 'Nombre completo del candidato, unidad/departamento, documentación presentada y motivo de ingreso.',
    suggestedDiscussionHours: 48,
    hasFinancialInstruction: false,
    guidance: 'La admisión de nuevos condóminos debe ser aprobada en asamblea ordinaria.',
  },
  {
    id: 'eleccion',
    name: 'Elección de Mesa Directiva',
    description: 'Elegir administrador o comité de vigilancia',
    icon: 'Crown',
    type: 'election',
    defaultTitle: 'Elección: ',
    descriptionPlaceholder: 'Cargo a elegir, candidatos propuestos, periodo del cargo y responsabilidades.',
    suggestedQuorum: 0.75,
    suggestedMajority: 0.5,
    suggestedDiscussionHours: 72,
    hasFinancialInstruction: false,
    guidance: 'Los miembros morosos no pueden ser electos para cargos de administración (Art. 2 LPCI). El periodo máximo es de 1 año con posibilidad de 2 reelecciones consecutivas (Art. 42).',
  },
  {
    id: 'emergencia',
    name: 'Gasto de Emergencia',
    description: 'Aprobar un gasto urgente (mantenimiento, seguridad)',
    icon: 'AlertTriangle',
    type: 'extraordinary',
    defaultTitle: 'Emergencia: ',
    descriptionPlaceholder: 'Describe la emergencia, las acciones inmediatas necesarias, el costo estimado y la urgencia.',
    suggestedDiscussionHours: 24,
    hasFinancialInstruction: true,
    defaultInstructionType: 'disbursement',
    guidance: 'Las emergencias tienen periodo de discusión reducido (24h). Si el monto excede el límite de gasto del administrador, requiere votación.',
  },
  {
    id: 'remocion',
    name: 'Remoción de Cargo',
    description: 'Remover a un miembro de su cargo (admin, tesorero, comité de vigilancia)',
    icon: 'UserMinus',
    type: 'extraordinary',
    defaultTitle: 'Remoción: ',
    descriptionPlaceholder: 'Indica el miembro a remover, el cargo del que se le remueve y la justificación.',
    suggestedQuorum: 0.75,
    suggestedMajority: 0.66,
    suggestedDiscussionHours: 72,
    hasFinancialInstruction: true,
    defaultInstructionType: 'removal',
    guidance: 'La remoción de cargos requiere mayoría calificada. El miembro pasará a rol miembro tras la ejecución.',
  },
  {
    id: 'obra',
    name: 'Obra / Mantenimiento Mayor',
    description: 'Aprobar un proyecto de construcción o mantenimiento',
    icon: 'Hammer',
    type: 'extraordinary',
    defaultTitle: 'Obra: ',
    descriptionPlaceholder: 'Describe la obra propuesta, las cotizaciones obtenidas, el contratista seleccionado, el cronograma y el presupuesto detallado.',
    suggestedQuorum: 0.75,
    suggestedMajority: 0.66,
    suggestedDiscussionHours: 120,
    hasFinancialInstruction: true,
    defaultInstructionType: 'disbursement',
    guidance: 'Para obras mayores se recomienda un periodo de discusión amplio (5 días). Incluye mínimo 3 cotizaciones y un cronograma de pagos.',
  },
  {
    id: 'general',
    name: 'Propuesta General',
    description: 'Propuesta sin plantilla predefinida',
    icon: 'FileText',
    type: 'ordinary',
    defaultTitle: '',
    descriptionPlaceholder: 'Describe tu propuesta en detalle.',
    hasFinancialInstruction: false,
    guidance: 'Usa esta opción si ninguna de las plantillas se ajusta a tu propuesta.',
  },
]

/**
 * Get a template by ID
 */
export function getProposalTemplate(templateId: string): ProposalTemplate | undefined {
  return PROPOSAL_TEMPLATES.find((t) => t.id === templateId)
}

/**
 * Get template by proposal type
 */
export function getTemplatesForType(type: ProposalType): ProposalTemplate[] {
  return PROPOSAL_TEMPLATES.filter((t) => t.type === type)
}
