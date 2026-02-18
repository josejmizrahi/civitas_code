import { useState } from 'react'
import { useCreateProposal } from '../hooks/useProposals'
import { useRulesEngine } from '@/shared/hooks/useRulesEngine'
import { PROPOSAL_TEMPLATES, type ProposalTemplate } from '../services/proposal-templates'
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
} from 'lucide-react'
import type { FinancialInstruction } from '@/shared/types/rules'
import type { ProposalType } from '@/shared/types'

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
}

export function CreateProposalDialog({ open, onOpenChange }: Props) {
  const createProposal = useCreateProposal()
  const { rules, canPropose } = useRulesEngine()

  // Template selection step
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<string>('ordinary')
  const [quorum, setQuorum] = useState(String(rules.governance.default_quorum * 100))
  const [majority, setMajority] = useState(String(rules.governance.default_majority * 100))
  const [votingStart, setVotingStart] = useState('')
  const [votingEnd, setVotingEnd] = useState('')
  const [error, setError] = useState('')

  // Discussion period
  const [includeDiscussion, setIncludeDiscussion] = useState(rules.governance.mandatory_discussion_enabled)
  const [discussionHours, setDiscussionHours] = useState(String(rules.governance.default_discussion_hours))

  // Financial instruction fields
  const [hasFinancialInstruction, setHasFinancialInstruction] = useState(false)
  const [instrType, setInstrType] = useState<FinancialInstruction['type']>('disbursement')
  const [instrAmount, setInstrAmount] = useState('')
  const [instrRecipient, setInstrRecipient] = useState('')
  const [instrDescription, setInstrDescription] = useState('')

  const handleSelectTemplate = (template: ProposalTemplate) => {
    setSelectedTemplate(template)
    setTitle(template.defaultTitle)
    setType(template.type)
    setHasFinancialInstruction(template.hasFinancialInstruction)
    if (template.defaultInstructionType) {
      setInstrType(template.defaultInstructionType)
    }
    // Apply suggested quorum/majority from template or differentiated rules
    const proposalType = template.type as ProposalType
    const typeQuorum = rules.governance.quorum_by_type?.[proposalType]
    const typeMajority = rules.governance.majority_by_type?.[proposalType]
    setQuorum(String((template.suggestedQuorum ?? typeQuorum ?? rules.governance.default_quorum) * 100))
    setMajority(String((template.suggestedMajority ?? typeMajority ?? rules.governance.default_majority) * 100))
    // Set discussion hours from template suggestion
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
    setQuorum(String(rules.governance.default_quorum * 100))
    setMajority(String(rules.governance.default_majority * 100))
    setHasFinancialInstruction(false)
    setInstrAmount('')
    setInstrRecipient('')
    setInstrDescription('')
    setIncludeDiscussion(rules.governance.mandatory_discussion_enabled)
    setDiscussionHours(String(rules.governance.default_discussion_hours))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!canPropose.allowed) {
      setError(canPropose.reason || 'No tienes permiso para crear propuestas')
      return
    }

    try {
      const financialInstruction: FinancialInstruction | undefined = hasFinancialInstruction
        ? {
            type: instrType,
            amount: instrAmount ? parseFloat(instrAmount) : undefined,
            recipient_name: instrRecipient || undefined,
            description: instrDescription || undefined,
          }
        : undefined

      await createProposal.mutateAsync({
        title,
        description,
        type,
        quorum_required: parseFloat(quorum) / 100,
        majority_required: parseFloat(majority) / 100,
        voting_start: votingStart || null,
        voting_end: votingEnd || null,
        financial_instruction: financialInstruction,
        template_id: selectedTemplate?.id,
        discussion_min_hours: includeDiscussion ? parseInt(discussionHours) : undefined,
      })
      onOpenChange(false)
      // Reset form
      handleBack()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear propuesta')
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quórum requerido (%)</Label>
                  <Input type="number" min="1" max="100" value={quorum} onChange={(e) => setQuorum(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Mayoría requerida (%)</Label>
                  <Input type="number" min="1" max="100" value={majority} onChange={(e) => setMajority(e.target.value)} />
                </div>
              </div>

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
                          <Input value={instrRecipient} onChange={(e) => setInstrRecipient(e.target.value)} placeholder="Nombre del proveedor o beneficiario" />
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
