import type { CommunityRules } from '@/shared/types/rules'
import type { TemplateFormData } from './types'
import { GastoFields } from './GastoFields'
import { CambioReglaFields } from './CambioReglaFields'
import { CuotaFields } from './CuotaFields'
import { PresupuestoFields } from './PresupuestoFields'
import { AdmisionFields } from './AdmisionFields'
import { EleccionFields } from './EleccionFields'
import { EmergenciaFields } from './EmergenciaFields'
import { ObraFields } from './ObraFields'
import { RemocionFields } from './RemocionFields'
import { GeneralFields } from './GeneralFields'

export type ProposalTemplateId =
  | 'gasto'
  | 'cambio_regla'
  | 'cuota'
  | 'presupuesto'
  | 'admision'
  | 'eleccion'
  | 'emergencia'
  | 'remocion'
  | 'obra'
  | 'general'

export interface TemplateFormProps {
  templateId: ProposalTemplateId
  rules: CommunityRules
  onFieldsChange: (fields: Partial<TemplateFormData>) => void
  initialData?: Partial<TemplateFormData>
}

const formProps = (rules: CommunityRules, onFieldsChange: TemplateFormProps['onFieldsChange'], initialData?: Partial<TemplateFormData>) => ({
  rules,
  onFieldsChange,
  initialData,
})

export function TemplateForm({ templateId, rules, onFieldsChange, initialData }: TemplateFormProps) {
  const common = formProps(rules, onFieldsChange, initialData)
  switch (templateId) {
    case 'gasto':
      return <GastoFields {...common} />
    case 'cambio_regla':
      return <CambioReglaFields {...common} />
    case 'cuota':
      return <CuotaFields {...common} />
    case 'presupuesto':
      return <PresupuestoFields {...common} />
    case 'admision':
      return <AdmisionFields {...common} />
    case 'eleccion':
      return <EleccionFields {...common} />
    case 'emergencia':
      return <EmergenciaFields {...common} />
    case 'obra':
      return <ObraFields {...common} />
    case 'remocion':
      return <RemocionFields {...common} />
    case 'general':
      return <GeneralFields {...common} />
    default:
      return <GeneralFields {...formProps(rules, onFieldsChange, initialData)} />
  }
}
