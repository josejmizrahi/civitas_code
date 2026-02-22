import { useState, useEffect, useRef } from 'react'
import { useCreateProposal } from '../hooks/useProposals'
import type { Proposal } from '../types'
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
import { useI18n } from '@/shared/hooks/useI18n'

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
  const { t } = useI18n()
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
      setError(canPropose.reason || t('proposalDialog.error.noPermission'))
      return
    }

    const title = templateFormData.title ?? ''
    const description = templateFormData.description ?? ''

    // Client-side validation
    if (!title.trim()) { setError(t('proposalDialog.error.titleRequired')); return }
    if (!description.trim()) { setError(t('proposalDialog.error.descriptionRequired')); return }
    if (!type) { setError(t('proposalDialog.error.typeRequired')); return }
    if (!resolvedQuorum || resolvedQuorum <= 0 || resolvedQuorum > 1) {
      setError(t('proposalDialog.error.quorum')); return
    }
    if (!resolvedMajority || resolvedMajority <= 0 || resolvedMajority > 1) {
      setError(t('proposalDialog.error.majority')); return
    }
    if (votingEnd) {
      const endDate = new Date(votingEnd)
      if (endDate <= new Date()) {
        setError(t('proposalDialog.error.endFuture')); return
      }
    }
    if (votingStart && votingEnd && new Date(votingStart) >= new Date(votingEnd)) {
      setError(t('proposalDialog.error.startBeforeEnd')); return
    }
    if (votingModel === 'multiple_choice') {
      const validOptions = multipleChoiceOptions.filter((opt) => opt.trim())
      if (validOptions.length < 2) {
        setError(t('proposalDialog.error.multipleChoiceMin')); return
      }
    }
    const fi = templateFormData.financialInstruction
    if (fi?.amount != null && (Number.isNaN(Number(fi.amount)) || Number(fi.amount) < 0)) {
      setError(t('proposalDialog.error.fiAmount')); return
    }
    if (fi?.new_amount != null && (Number.isNaN(Number(fi.new_amount)) || Number(fi.new_amount) < 0)) {
      setError(t('proposalDialog.error.fiNewAmount')); return
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
      onCreated?.({ endorsementsRequired: (created as Proposal).endorsements_required ?? 0 })
      // Reset form
      handleBack()
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err && typeof err === 'object' && 'message' in err)
            ? String((err as { message: unknown }).message)
            : t('proposalDialog.error.create')
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
            {selectedTemplate ? `${t('proposalDialog.titleWithTemplate')}: ${selectedTemplate.name}` : t('proposalDialog.title')}
          </DialogTitle>
        </DialogHeader>

        {!canPropose.allowed ? (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-4 my-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">{t('proposalDialog.noPermissionTitle')}</p>
              <p className="text-sm text-amber-700 mt-1">{canPropose.reason}</p>
            </div>
          </div>
        ) : !selectedTemplate ? (
          /* Step 1: Template Selection */
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {t('proposalDialog.selectTemplate')}
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
                <Label>{t('proposalDialog.type')}</Label>
                <Select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="ordinary">{t('proposals.type.ordinary')}</option>
                  <option value="extraordinary">{t('proposals.type.extraordinary')}</option>
                  <option value="budget">{t('proposals.type.budget')}</option>
                  <option value="election">{t('proposals.type.election')}</option>
                  <option value="amendment">{t('proposals.type.amendment')}</option>
                </Select>
              </div>

              {type === 'election' && (
                <div className="flex items-start gap-2 rounded-md bg-blue-50 border border-blue-200 p-3">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-blue-800">
                    {t('proposalDialog.note.election')}
                  </p>
                </div>
              )}

              {/* Quórum y mayoría — definidos por las reglas de la comunidad */}
              <div className="flex items-center gap-4 rounded-lg bg-muted/50 border border-dashed px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('proposalDialog.quorum')}:</span>
                  <Badge variant="secondary">{Math.round(resolvedQuorum * 100)}%</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('proposalDialog.majority')}:</span>
                  <Badge variant="secondary">{Math.round(resolvedMajority * 100)}%</Badge>
                </div>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {t('proposalDialog.rulesDefined')}
                </span>
              </div>

              {/* Voting Model — GV-012, GV-016 */}
              <Card className="border-dashed">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PieChart className="h-4 w-4" />
                    {t('proposalDialog.votingModel')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={votingModel} onChange={(e) => setVotingModel(e.target.value as VotingModel)}>
                    <option value="simple">{t('proposalDialog.voting.simple')}</option>
                    <option value="consensus">{t('proposalDialog.voting.consensus')}</option>
                    <option value="multiple_choice">{t('proposalDialog.voting.multiple')}</option>
                  </Select>
                  {votingModel === 'consensus' && (
                    <p className="text-xs text-muted-foreground">
                      {t('proposalDialog.voting.consensusHelp')}
                    </p>
                  )}
                  {votingModel === 'multiple_choice' && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {t('proposalDialog.voting.multipleHelp')}
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
                            placeholder={`${t('proposalDialog.voting.option')} ${idx + 1}`}
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
                          + {t('proposalDialog.voting.addOption')}
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
                    {t('proposalDialog.discussion.title')}
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
                      {t('proposalDialog.discussion.include')}
                      {rules.governance.mandatory_discussion_enabled && (
                        <Badge variant="secondary" className="ml-2 text-[10px]">{t('proposalDialog.discussion.required')}</Badge>
                      )}
                    </span>
                  </label>

                  {includeDiscussion && (
                    <div className="space-y-2 pl-7">
                      <Label>{t('proposalDialog.discussion.duration')}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="720"
                        value={discussionHours}
                        onChange={(e) => setDiscussionHours(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('proposalDialog.discussion.help')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Voting dates - only show if not using discussion */}
              {!includeDiscussion && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('proposalDialog.votingStart')}</Label>
                    <Input type="datetime-local" value={votingStart} onChange={(e) => setVotingStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('proposalDialog.votingEnd')}</Label>
                    <Input type="datetime-local" value={votingEnd} onChange={(e) => setVotingEnd(e.target.value)} />
                  </div>
                </div>
              )}

              {selectedTemplate.hasFinancialInstruction && rules.governance.auto_execution_enabled && (
                <p className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                  {t('proposalDialog.autoExecution').replace('{hours}', String(rules.governance.cool_down_hours))}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleBack}>{t('proposalDialog.back')}</Button>
              <Button type="submit" disabled={createProposal.isPending}>
                {createProposal.isPending ? t('proposalDialog.creating') : t('proposalDialog.create')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
