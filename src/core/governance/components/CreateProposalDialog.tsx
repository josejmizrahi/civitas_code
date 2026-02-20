import { useState, useEffect, useRef } from 'react'
import { useCreateProposal } from '../hooks/useProposals'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { PROPOSAL_TEMPLATES, type ProposalTemplate } from '../services/proposal-templates'
import { TemplateForm } from './proposal-forms'
import type { TemplateFormData } from './proposal-forms'
import type { ProposalTemplateId } from './proposal-forms'
import { getRuleCatalogEntry } from '@/shared/config/rules-catalog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  AlertTriangle,
  Banknote,
  Settings,
  Receipt,
  PieChart,
  UserPlus,
  Crown,
  Hammer,
  FileText,
  MessageSquare,
  Info,
} from 'lucide-react'
import type { FinancialInstruction } from '@/shared/types/rules'
import type { ProposalType, VotingModel } from '@/shared/types'

const TEMPLATE_ICONS: Record<string, typeof Banknote> = {
  Banknote,
  Settings,
  Receipt,
  PieChart,
  UserPlus,
  Crown,
  AlertTriangle,
  Hammer,
  FileText,
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTemplateId?: string
  initialRuleId?: string
  onCreated?: (info: { endorsementsRequired: number }) => void
}

export function CreateProposalDialog({ open, onOpenChange, initialTemplateId, initialRuleId, onCreated }: Props) {
  const createProposal = useCreateProposal()
  const { rules, canPropose } = useRulesEngine()

  // Template selection step
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null)

  // Form data from template-specific form (title, description, financialInstruction, metadata)
  const [templateFormData, setTemplateFormData] = useState<Partial<TemplateFormData>>({})

  // Common form fields
  const [type, setType] = useState<string>('ordinary')
  const [votingStart, setVotingStart] = useState('')
  const [votingEnd, setVotingEnd] = useState('')
  const [error, setError] = useState('')

  // Quorum/majority are derived from rules — NOT user-editable
  const resolvedQuorum = (() => {
    const proposalType = type as ProposalType
    return rules.governance.quorum_by_type?.[proposalType] ?? rules.governance.default_quorum
  })()
  const resolvedMajority = (() => {
    const proposalType = type as ProposalType
    return rules.governance.majority_by_type?.[proposalType] ?? rules.governance.default_majority
  })()

  // Discussion period
  const [includeDiscussion, setIncludeDiscussion] = useState(rules.governance.mandatory_discussion_enabled)
  const [discussionHours, setDiscussionHours] = useState(String(rules.governance.default_discussion_hours))

  // Voting model — GV-012, GV-016
  const [votingModel, setVotingModel] = useState<VotingModel>('simple')
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>(['', ''])

  const appliedInitialRef = useRef(false)
  // When opened with initialTemplateId (e.g. from Settings or Reglamento), preselect template once
  useEffect(() => {
    if (!open) {
      appliedInitialRef.current = false
      return
    }
    if (initialTemplateId && !appliedInitialRef.current) {
      const template = PROPOSAL_TEMPLATES.find((t) => t.id === initialTemplateId)
      if (template) {
        appliedInitialRef.current = true
        queueMicrotask(() => {
          setSelectedTemplate(template)
          setType(template.type)
          if (template.suggestedDiscussionHours) {
            setDiscussionHours(String(template.suggestedDiscussionHours))
            setIncludeDiscussion(true)
          }
          const initial: Partial<TemplateFormData> = { title: template.defaultTitle }
          if (initialRuleId && template.id === 'cambio_regla') {
            const ruleEntry = getRuleCatalogEntry(initialRuleId)
            if (ruleEntry) {
              initial.title = `Cambio de regla: ${ruleEntry.label}`
              initial.description = `Propongo cambiar la regla "${ruleEntry.label}".\n\nValor actual: ${ruleEntry.format(rules)}\nNuevo valor propuesto: [completar]\n\nJustificación: [explicar por qué es necesario el cambio]`
              initial.metadata = { ruleId: initialRuleId }
            }
          }
          setTemplateFormData(initial)
        })
      }
    }
  }, [open, initialTemplateId, initialRuleId, rules])

  const handleSelectTemplate = (template: ProposalTemplate) => {
    setSelectedTemplate(template)
    setType(template.type)
    if (template.suggestedDiscussionHours) {
      setDiscussionHours(String(template.suggestedDiscussionHours))
      setIncludeDiscussion(true)
    }
    setTemplateFormData({ title: template.defaultTitle })
  }

  const handleBack = () => {
    setSelectedTemplate(null)
    setTemplateFormData({})
    setType('ordinary')
    setIncludeDiscussion(rules.governance.mandatory_discussion_enabled)
    setDiscussionHours(String(rules.governance.default_discussion_hours))
    setVotingModel('simple')
    setMultipleChoiceOptions(['', ''])
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!canPropose.allowed) {
      setError(canPropose.reason || 'No tienes permiso para crear propuestas')
      return
    }

    const title = templateFormData.title ?? ''
    const description = templateFormData.description ?? ''

    // Client-side validation
    if (!title.trim()) { setError('El título es obligatorio'); return }
    if (!description.trim()) { setError('La descripción es obligatoria'); return }
    if (!type) { setError('Selecciona un tipo de propuesta'); return }
    if (!resolvedQuorum || resolvedQuorum <= 0 || resolvedQuorum > 1) {
      setError('Error en quórum. Contacta al administrador.'); return
    }
    if (!resolvedMajority || resolvedMajority <= 0 || resolvedMajority > 1) {
      setError('Error en mayoría. Contacta al administrador.'); return
    }
    if (votingEnd) {
      const endDate = new Date(votingEnd)
      if (endDate <= new Date()) {
        setError('La fecha de fin de votación debe ser en el futuro'); return
      }
    }
    if (votingStart && votingEnd && new Date(votingStart) >= new Date(votingEnd)) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin'); return
    }
    if (votingModel === 'multiple_choice') {
      const validOptions = multipleChoiceOptions.filter((opt) => opt.trim())
      if (validOptions.length < 2) {
        setError('Debes agregar al menos 2 opciones para votación de opción múltiple'); return
      }
    }

    try {
      let financialInstruction: FinancialInstruction | undefined = templateFormData.financialInstruction
      if (selectedTemplate?.id === 'cambio_regla' && templateFormData.metadata?.ruleId) {
        financialInstruction = {
          ...financialInstruction,
          type: 'config_change',
          config_key: String(templateFormData.metadata.ruleId),
        }
      }

      // Build voting options for multiple choice
      const votingOptions = votingModel === 'multiple_choice'
        ? multipleChoiceOptions
            .filter((opt) => opt.trim())
            .map((label, idx) => ({ id: `option_${idx + 1}`, label: label.trim() }))
        : undefined

      const created = await createProposal.mutateAsync({
        title,
        description,
        type,
        quorum_required: resolvedQuorum,
        majority_required: resolvedMajority,
        voting_start: votingStart || null,
        voting_end: votingEnd || null,
        financial_instruction: financialInstruction,
        template_id: selectedTemplate?.id,
        discussion_min_hours: includeDiscussion ? parseInt(discussionHours) : undefined,
        voting_model: votingModel,
        voting_options: votingOptions,
      })
      onOpenChange(false)
      onCreated?.({ endorsementsRequired: (created as any)?.endorsements_required ?? 0 })
      // Reset form
      handleBack()
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err && typeof err === 'object' && 'message' in err)
            ? String((err as any).message)
            : 'Error al crear propuesta'
      setError(message)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    handleBack()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedTemplate ? `Nueva Propuesta: ${selectedTemplate.name}` : 'Nueva Propuesta'}
          </DialogTitle>
        </DialogHeader>

        {!canPropose.allowed ? (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-4 my-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">No puedes crear propuestas</p>
              <p className="text-sm text-amber-700 mt-1">{canPropose.reason}</p>
            </div>
          </div>
        ) : !selectedTemplate ? (
          /* Step 1: Template Selection */
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona el tipo de propuesta que quieres crear:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PROPOSAL_TEMPLATES.map((template) => {
                const Icon = TEMPLATE_ICONS[template.icon] || FileText
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-accent/50 hover:border-primary/30"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* Step 2: Proposal Form */
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
              )}

              {/* Template guidance */}
              {selectedTemplate.guidance && (
                <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">{selectedTemplate.guidance}</p>
                </div>
              )}

              {/* Template-specific form (title, description, financial fields, etc.) */}
              <TemplateForm
                templateId={(selectedTemplate.id as ProposalTemplateId) || 'general'}
                rules={rules}
                onFieldsChange={(fields) => setTemplateFormData((prev) => ({ ...prev, ...fields }))}
                initialData={templateFormData}
              />

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="ordinary">Ordinaria</option>
                  <option value="extraordinary">Extraordinaria</option>
                  <option value="budget">Presupuesto</option>
                  <option value="election">Elección</option>
                  <option value="amendment">Enmienda</option>
                </Select>
              </div>

              {type === 'election' && (
                <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">
                    Nota: Los miembros morosos no pueden ser electos para cargos de administración (Art. 2 LPCI).
                    Verifica el estado de pago de los candidatos.
                  </p>
                </div>
              )}

              {/* Quórum y mayoría — definidos por las reglas de la comunidad */}
              <div className="flex items-center gap-4 rounded-lg bg-muted/50 border border-dashed px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Quórum:</span>
                  <Badge variant="secondary">{Math.round(resolvedQuorum * 100)}%</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Mayoría:</span>
                  <Badge variant="secondary">{Math.round(resolvedMajority * 100)}%</Badge>
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  Definido por las reglas de tu comunidad
                </span>
              </div>

              {/* Voting Model — GV-012, GV-016 */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PieChart className="h-4 w-4" />
                    Modelo de Votación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={votingModel} onChange={(e) => setVotingModel(e.target.value as VotingModel)}>
                    <option value="simple">Simple (A favor / En contra / Abstención)</option>
                    <option value="consensus">Consenso (Acuerdo / Desacuerdo / Abstención / Bloqueo)</option>
                    <option value="multiple_choice">Opción Múltiple</option>
                  </Select>
                  {votingModel === 'consensus' && (
                    <p className="text-xs text-muted-foreground">
                      En modelo de consenso, cualquier miembro puede bloquear una propuesta con una razón obligatoria.
                    </p>
                  )}
                  {votingModel === 'multiple_choice' && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Agrega las opciones entre las que los miembros podrán elegir:
                      </p>
                      {multipleChoiceOptions.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const updated = [...multipleChoiceOptions]
                              updated[idx] = e.target.value
                              setMultipleChoiceOptions(updated)
                            }}
                            placeholder={`Opción ${idx + 1}`}
                            className="flex-1"
                          />
                          {multipleChoiceOptions.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMultipleChoiceOptions(multipleChoiceOptions.filter((_, i) => i !== idx))}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      {multipleChoiceOptions.length < 10 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setMultipleChoiceOptions([...multipleChoiceOptions, ''])}
                          className="text-xs"
                        >
                          + Agregar opción
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Discussion Period Section — GV-006 */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Periodo de Discusión
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDiscussion}
                      onChange={(e) => setIncludeDiscussion(e.target.checked)}
                      disabled={rules.governance.mandatory_discussion_enabled}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">
                      Incluir periodo de discusión antes de votar
                      {rules.governance.mandatory_discussion_enabled && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">Obligatorio</Badge>
                      )}
                    </span>
                  </label>

                  {includeDiscussion && (
                    <div className="space-y-2 pl-7">
                      <Label>Duración de la discusión (horas)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="720"
                        value={discussionHours}
                        onChange={(e) => setDiscussionHours(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        La votación no podrá abrirse hasta que termine el periodo de discusión.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Voting dates - only show if not using discussion */}
              {!includeDiscussion && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Inicio de votación</Label>
                    <Input type="datetime-local" value={votingStart} onChange={(e) => setVotingStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin de votación</Label>
                    <Input type="datetime-local" value={votingEnd} onChange={(e) => setVotingEnd(e.target.value)} />
                  </div>
                </div>
              )}

              {selectedTemplate.hasFinancialInstruction && rules.governance.auto_execution_enabled && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                  Auto-ejecución activa: si la propuesta se aprueba, la instrucción financiera se ejecutará automáticamente tras {rules.governance.cool_down_hours}h de enfriamiento.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleBack}>Atrás</Button>
              <Button type="submit" disabled={createProposal.isPending}>
                {createProposal.isPending ? 'Creando...' : 'Crear Propuesta'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
