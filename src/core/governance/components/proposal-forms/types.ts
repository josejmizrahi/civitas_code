import type { CommunityRules } from '@/shared/types/rules'
import type { FinancialInstruction } from '@/shared/types/rules'

export interface TemplateFormData {
  title: string
  description: string
  financialInstruction?: FinancialInstruction
  /** Template-specific data stored in proposal.metadata */
  metadata?: Record<string, unknown>
}

export interface TemplateFieldsProps {
  rules: CommunityRules
  onFieldsChange: (fields: Partial<TemplateFormData>) => void
  initialData?: Partial<TemplateFormData>
}
