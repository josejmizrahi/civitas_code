import { useState, useEffect, useRef } from 'react'
import { useCreateProposal } from '../hooks/useProposals'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { PROPOSAL_TEMPLATES, type ProposalTemplate } from '../services/proposal-templates'
import { useEntities, useCreateEntity } from '@/core/entities/hooks/useEntities'
import type { Entity } from '@/core/entities/types'
import {
  RULES_CATALOG,
  getRuleCatalogEntry,
  CATEGORY_LABELS,
  type RuleCatalogEntry,
} from '@/shared/config/rules-catalog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
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
  Plus,
  Search,
  BookOpen,
  ChevronDown,
  Scale,
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
  const { data: entities } = useEntities({ status: 'active' })
  const createEntityMut = useCreateEntity()

  // Template selection step
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
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

  // Financial instruction fields
  const [hasFinancialInstruction, setHasFinancialInstruction] = useState(false)
  const [instrType, setInstrType] = useState<FinancialInstruction['type']>('disbursement')
  const [instrAmount, setInstrAmount] = useState('')
  const [instrRecipient, setInstrRecipient] = useState('')
  const [instrDescription, setInstrDescription] = useState('')

  // Entity selector (for beneficiario)
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [entitySearch, setEntitySearch] = useState('')
  const [showEntityDropdown, setShowEntityDropdown] = useState(false)
  const [showNewEntityForm, setShowNewEntityForm] = useState(false)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityType, setNewEntityType] = useState<string>('proveedor')
  const [newEntityPhone, setNewEntityPhone] = useState('')
  const entityDropdownRef = useRef<HTMLDivElement>(null)

  // Rule picker (for cambio_regla template)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [ruleSearch, setRuleSearch] = useState('')
  const [showRulePicker, setShowRulePicker] = useState(false)
  const rulePickerRef = useRef<HTMLDivElement>(null)

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
          setTitle(template.defaultTitle)
          setType(template.type)
          setHasFinancialInstruction(template.hasFinancialInstruction)
          if (template.defaultInstructionType) setInstrType(template.defaultInstructionType)
          if (template.suggestedDiscussionHours) {
            setDiscussionHours(String(template.suggestedDiscussionHours))
            setIncludeDiscussion(true)
          }
          // Pre-select rule if coming from Reglamento
          if (initialRuleId) {
            const ruleEntry = getRuleCatalogEntry(initialRuleId)
            if (ruleEntry) {
              setSelectedRuleId(initialRuleId)
              setTitle(`Cambio de regla: ${ruleEntry.label}`)
              setDescription(
                `Propongo cambiar la regla "${ruleEntry.label}".\n\nValor actual: ${ruleEntry.format(rules)}\nNuevo valor propuesto: [completar]\n\nJustificación: [explicar por qué es necesario el cambio]`
              )
            }
          }
        })
      }
    }
  }, [open, initialTemplateId, initialRuleId, rules])

  // Close entity dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(e.target as Node)) {
        setShowEntityDropdown(false)
      }
    }
    if (showEntityDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEntityDropdown])

  // Close rule picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (rulePickerRef.current && !rulePickerRef.current.contains(e.target as Node)) {
        setShowRulePicker(false)
      }
    }
    if (showRulePicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showRulePicker])

  const handleSelectTemplate = (template: ProposalTemplate) => {
    setSelectedTemplate(template)
    setTitle(template.defaultTitle)
    setType(template.type)
    setHasFinancialInstruction(template.hasFinancialInstruction)
    if (template.defaultInstructionType) {
      setInstrType(template.defaultInstructionType)
    }
    if (template.suggestedDiscussionHours) {
      setDiscussionHours(String(template.suggestedDiscussionHours))
      setIncludeDiscussion(true)
    }
  }

  const handleBack = () => {
    setSelectedTemplate(null)
    setTitle('')
    setDescription('')
    setType('ordinary')
    setHasFinancialInstruction(false)
    setInstrAmount('')
    setInstrRecipient('')
    setInstrDescription('')
    setIncludeDiscussion(rules.governance.mandatory_discussion_enabled)
    setDiscussionHours(String(rules.governance.default_discussion_hours))
    setVotingModel('simple')
    setMultipleChoiceOptions(['', ''])
    setSelectedEntityId(null)
    setEntitySearch('')
    setShowNewEntityForm(false)
    setNewEntityName('')
    setNewEntityType('proveedor')
    setNewEntityPhone('')
    setSelectedRuleId(null)
    setRuleSearch('')
    setShowRulePicker(false)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!canPropose.allowed) {
      setError(canPropose.reason || 'No tienes permiso para crear propuestas')
      return
    }

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
      // Resolve beneficiary name from selected entity or manual input
      const recipientName = selectedEntityId
        ? entities?.find((e) => e.id === selectedEntityId)?.name ?? instrRecipient
        : instrRecipient

      const financialInstruction: FinancialInstruction | undefined = hasFinancialInstruction
        ? {
            type: instrType,
            amount: instrAmount ? parseFloat(instrAmount) : undefined,
            recipient_name: recipientName || undefined,
            description: instrDescription || undefined,
            config_key: selectedRuleId || undefined,
          }
        : undefined

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

              {/* Rule Picker — shown for cambio_regla template */}
              {selectedTemplate.id === 'cambio_regla' && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    Regla a modificar
                  </Label>
                  <div className="relative" ref={rulePickerRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={selectedRuleId ? (getRuleCatalogEntry(selectedRuleId)?.label ?? ruleSearch) : ruleSearch}
                        onChange={(e) => {
                          setRuleSearch(e.target.value)
                          setSelectedRuleId(null)
                          setShowRulePicker(true)
                        }}
                        onFocus={() => setShowRulePicker(true)}
                        placeholder="Buscar regla que quieres cambiar..."
                        className="pl-9"
                      />
                    </div>
                    {showRulePicker && (
                      <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-y-auto">
                        {(['governance', 'treasury', 'identity'] as const).map((cat) => {
                          const catRules = RULES_CATALOG.filter(
                            (r) =>
                              r.category === cat &&
                              (!ruleSearch ||
                                r.label.toLowerCase().includes(ruleSearch.toLowerCase()) ||
                                r.description.toLowerCase().includes(ruleSearch.toLowerCase()))
                          )
                          if (catRules.length === 0) return null
                          return (
                            <div key={cat}>
                              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50 sticky top-0">
                                {CATEGORY_LABELS[cat]}
                              </div>
                              {catRules.map((rule) => (
                                <button
                                  key={rule.id}
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                                  onClick={() => {
                                    setSelectedRuleId(rule.id)
                                    setRuleSearch('')
                                    setShowRulePicker(false)
                                    // Pre-fill title and description
                                    setTitle(`Cambio de regla: ${rule.label}`)
                                    if (!description || description.startsWith('Propongo cambiar la regla')) {
                                      setDescription(
                                        `Propongo cambiar la regla "${rule.label}".\n\nValor actual: ${rule.format(rules)}\nNuevo valor propuesto: [completar]\n\nJustificación: [explicar por qué es necesario el cambio]`
                                      )
                                    }
                                  }}
                                >
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">{rule.label}</span>
                                    <p className="text-xs text-muted-foreground truncate">{rule.description}</p>
                                  </div>
                                  <Badge variant="secondary" className="text-[10px] shrink-0 font-mono">
                                    {rule.format(rules)}
                                  </Badge>
                                </button>
                              ))}
                            </div>
                          )
                        })}
                        {RULES_CATALOG.filter(
                          (r) =>
                            !ruleSearch ||
                            r.label.toLowerCase().includes(ruleSearch.toLowerCase()) ||
                            r.description.toLowerCase().includes(ruleSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                            No se encontraron reglas
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedRuleId && (() => {
                    const rule = getRuleCatalogEntry(selectedRuleId)
                    if (!rule) return null
                    return (
                      <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{rule.label}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {CATEGORY_LABELS[rule.category]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-xs text-muted-foreground">Valor actual:</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {rule.format(rules)}
                          </Badge>
                        </div>
                        {rule.legalRef && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 pt-1">
                            <Scale className="h-3 w-3" />
                            {rule.legalRef}
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Título de la propuesta" />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder={selectedTemplate.descriptionPlaceholder}
                  rows={4}
                />
              </div>
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

              {/* Financial Instruction Section */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Banknote className="h-4 w-4" />
                    Instrucción Financiera
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasFinancialInstruction}
                      onChange={(e) => setHasFinancialInstruction(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Esta propuesta incluye una acción financiera</span>
                  </label>

                  {hasFinancialInstruction && (
                    <div className="space-y-3 pl-7">
                      <div className="space-y-2">
                        <Label>Tipo de instrucción</Label>
                        <Select value={instrType} onChange={(e) => setInstrType(e.target.value as FinancialInstruction['type'])}>
                          <option value="disbursement">Desembolso / Pago a proveedor</option>
                          <option value="budget_allocation">Asignación de presupuesto</option>
                          <option value="quota_change">Cambio de cuota</option>
                          <option value="config_change">Cambio de configuración</option>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Monto ({rules.treasury.currency})</Label>
                        <Input type="number" min="0" step="0.01" value={instrAmount} onChange={(e) => setInstrAmount(e.target.value)} placeholder="0.00" />
                      </div>
                      {instrType === 'disbursement' && (
                        <div className="space-y-2">
                          <Label>Beneficiario</Label>
                          {!showNewEntityForm ? (
                            <div className="relative" ref={entityDropdownRef}>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  value={selectedEntityId ? entities?.find((e) => e.id === selectedEntityId)?.name ?? entitySearch : entitySearch}
                                  onChange={(e) => {
                                    setEntitySearch(e.target.value)
                                    setSelectedEntityId(null)
                                    setInstrRecipient(e.target.value)
                                    setShowEntityDropdown(true)
                                  }}
                                  onFocus={() => setShowEntityDropdown(true)}
                                  placeholder="Buscar proveedor o beneficiario..."
                                  className="pl-9"
                                />
                              </div>
                              {showEntityDropdown && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
                                  {entities
                                    ?.filter((e) =>
                                      !entitySearch ||
                                      e.name.toLowerCase().includes(entitySearch.toLowerCase()) ||
                                      (e.contact_person && e.contact_person.toLowerCase().includes(entitySearch.toLowerCase()))
                                    )
                                    .slice(0, 8)
                                    .map((entity) => (
                                      <button
                                        key={entity.id}
                                        type="button"
                                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                                        onClick={() => {
                                          setSelectedEntityId(entity.id)
                                          setInstrRecipient(entity.name)
                                          setEntitySearch('')
                                          setShowEntityDropdown(false)
                                        }}
                                      >
                                        <span className="font-medium">{entity.name}</span>
                                        <Badge variant="secondary" className="text-[10px] ml-auto">
                                          {entity.type === 'proveedor' ? 'Proveedor' : entity.type === 'contratista' ? 'Contratista' : entity.type}
                                        </Badge>
                                      </button>
                                    ))}
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left text-primary hover:bg-accent transition-colors border-t"
                                    onClick={() => {
                                      setShowEntityDropdown(false)
                                      setShowNewEntityForm(true)
                                      setNewEntityName(entitySearch)
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span>Crear nuevo proveedor{entitySearch ? `: "${entitySearch}"` : ''}</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            /* Inline new entity creation */
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Nuevo proveedor</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowNewEntityForm(false)}
                                  className="h-6 text-xs"
                                >
                                  Cancelar
                                </Button>
                              </div>
                              <div className="space-y-2">
                                <Input
                                  value={newEntityName}
                                  onChange={(e) => setNewEntityName(e.target.value)}
                                  placeholder="Nombre del proveedor"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Select value={newEntityType} onChange={(e) => setNewEntityType(e.target.value)}>
                                  <option value="proveedor">Proveedor</option>
                                  <option value="contratista">Contratista</option>
                                  <option value="socio_comercial">Socio Comercial</option>
                                  <option value="otro">Otro</option>
                                </Select>
                                <Input
                                  value={newEntityPhone}
                                  onChange={(e) => setNewEntityPhone(e.target.value)}
                                  placeholder="Teléfono (opcional)"
                                />
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                disabled={!newEntityName.trim() || createEntityMut.isPending}
                                onClick={async () => {
                                  try {
                                    const created = await createEntityMut.mutateAsync({
                                      name: newEntityName.trim(),
                                      type: newEntityType as Entity['type'],
                                      status: 'active',
                                      rfc: null,
                                      email: null,
                                      phone: newEntityPhone || null,
                                      address: null,
                                      clabe: null,
                                      bank_name: null,
                                      contact_person: null,
                                      notes: null,
                                      created_by: null,
                                    })
                                    setSelectedEntityId(created.id)
                                    setInstrRecipient(created.name)
                                    setShowNewEntityForm(false)
                                    setNewEntityName('')
                                    setNewEntityPhone('')
                                  } catch {
                                    setError('Error al crear el proveedor')
                                  }
                                }}
                              >
                                {createEntityMut.isPending ? 'Creando...' : 'Crear y seleccionar'}
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Concepto</Label>
                        <Input value={instrDescription} onChange={(e) => setInstrDescription(e.target.value)} placeholder="Descripción del movimiento financiero" />
                      </div>
                      {rules.governance.auto_execution_enabled && (
                        <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                          Auto-ejecución activa: si la propuesta se aprueba, la instrucción financiera se ejecutará automáticamente tras {rules.governance.cool_down_hours}h de enfriamiento.
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
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
