import { useState } from 'react'
import { useCommunityContext } from '@/app/providers'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '@/shared/hooks/usePermissions'
import {
  useVigilanciaReports,
  useCreateVigilanciaReport,
  useSubmitVigilanciaReport,
} from '../hooks/useTerms'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import { formatDate } from '@/shared/lib/utils'
import { FileText, Plus, Send, Trash2, Eye } from 'lucide-react'
import type { VigilanciaReport } from '../services/terms.service'

// ---------------------------------------------------------------------------
// Report Form
// ---------------------------------------------------------------------------

interface FindingInput {
  finding: string
  severity: string
}

interface RecommendationInput {
  recommendation: string
  priority: string
}

function ReportForm({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const { currentMember } = useCommunityContext()
  const createReport = useCreateVigilanciaReport()

  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState('')
  const [reportType, setReportType] = useState('quarterly')
  const [content, setContent] = useState('')
  const [findings, setFindings] = useState<FindingInput[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationInput[]>([])

  const addFinding = () => setFindings([...findings, { finding: '', severity: 'low' }])
  const removeFinding = (i: number) => setFindings(findings.filter((_, idx) => idx !== i))
  const updateFinding = (i: number, field: keyof FindingInput, value: string) =>
    setFindings(findings.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)))

  const addRecommendation = () =>
    setRecommendations([...recommendations, { recommendation: '', priority: 'medium' }])
  const removeRecommendation = (i: number) =>
    setRecommendations(recommendations.filter((_, idx) => idx !== i))
  const updateRecommendation = (i: number, field: keyof RecommendationInput, value: string) =>
    setRecommendations(
      recommendations.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    )

  const handleSubmit = () => {
    if (!title.trim() || !period.trim() || !content.trim()) return
    const authorId = currentMember?.id ?? user?.id ?? ''
    createReport.mutate(
      {
        author_id: authorId,
        period,
        report_type: reportType,
        title,
        content,
        findings: findings.filter((f) => f.finding.trim()),
        recommendations: recommendations.filter((r) => r.recommendation.trim()),
      },
      { onSuccess: () => onClose() },
    )
  }

  // Generate period options (current year quarters)
  const year = new Date().getFullYear()
  const periodOptions = [
    `${year}-Q1`,
    `${year}-Q2`,
    `${year}-Q3`,
    `${year}-Q4`,
    `${year}-Anual`,
    `${year}-Especial`,
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Plus className="h-5 w-5 text-green-600" />
          Nuevo Reporte de Vigilancia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Title */}
        <div className="space-y-1">
          <Label htmlFor="report-title">Titulo del reporte</Label>
          <Input
            id="report-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Revision trimestral Q1 2026"
          />
        </div>

        {/* Period & Type row */}
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1 flex-1 min-w-[180px]">
            <Label>Periodo</Label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="">Seleccionar periodo...</option>
              {periodOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1 flex-1 min-w-[180px]">
            <Label>Tipo de reporte</Label>
            <Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="quarterly">Trimestral</option>
              <option value="annual">Anual</option>
              <option value="special">Especial</option>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-1">
          <Label>Contenido del reporte</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe los hallazgos generales de la revision..."
            rows={5}
          />
        </div>

        {/* Findings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Hallazgos</Label>
            <Button variant="ghost" size="sm" onClick={addFinding}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar
            </Button>
          </div>
          {findings.map((f, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                value={f.finding}
                onChange={(e) => updateFinding(i, 'finding', e.target.value)}
                placeholder="Descripcion del hallazgo..."
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={f.severity}
                  onChange={(e) => updateFinding(i, 'severity', e.target.value)}
                  className="w-full sm:w-28"
                >
                  <option value="low">Bajo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                  <option value="critical">Critico</option>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => removeFinding(i)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {findings.length === 0 && (
            <p className="text-xs text-muted-foreground">No se han agregado hallazgos.</p>
          )}
        </div>

        {/* Recommendations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Recomendaciones</Label>
            <Button variant="ghost" size="sm" onClick={addRecommendation}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              Agregar
            </Button>
          </div>
          {recommendations.map((r, i) => (
            <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Input
                value={r.recommendation}
                onChange={(e) => updateRecommendation(i, 'recommendation', e.target.value)}
                placeholder="Descripcion de la recomendacion..."
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Select
                  value={r.priority}
                  onChange={(e) => updateRecommendation(i, 'priority', e.target.value)}
                  className="w-full sm:w-28"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => removeRecommendation(i)} className="shrink-0">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No se han agregado recomendaciones.
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !period || !content.trim() || createReport.isPending}
          >
            {createReport.isPending ? 'Guardando...' : 'Guardar Borrador'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        </div>
        {createReport.isError && (
          <p className="text-sm text-destructive">Error al crear el reporte.</p>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Report Card
// ---------------------------------------------------------------------------

function ReportCard({ report }: { report: VigilanciaReport }) {
  const submitReport = useSubmitVigilanciaReport()
  const [expanded, setExpanded] = useState(false)

  const statusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Borrador</Badge>
      case 'submitted':
        return <Badge variant="success">Enviado</Badge>
      case 'reviewed':
        return <Badge variant="default">Revisado</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const typeBadge = (type: string) => {
    switch (type) {
      case 'quarterly':
        return <Badge variant="outline">Trimestral</Badge>
      case 'annual':
        return <Badge variant="outline">Anual</Badge>
      case 'special':
        return <Badge variant="warning">Especial</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-50'
      case 'high':
        return 'text-orange-700 bg-orange-50'
      case 'medium':
        return 'text-yellow-700 bg-yellow-50'
      default:
        return 'text-gray-700 bg-gray-50'
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium truncate">{report.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{report.period}</span>
            {typeBadge(report.report_type)}
            {statusBadge(report.status)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{formatDate(report.created_at)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            {expanded ? 'Ocultar' : 'Ver'}
          </Button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-3 border-t pt-3">
          <div>
            <p className="text-sm font-medium mb-1">Contenido</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{report.content}</p>
          </div>

          {report.findings && report.findings.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">
                Hallazgos ({report.findings.length})
              </p>
              <div className="space-y-1">
                {report.findings.map((f, i) => (
                  <div
                    key={i}
                    className={`text-sm rounded px-2 py-1 ${severityColor(f.severity)}`}
                  >
                    <span className="font-medium capitalize">[{f.severity}]</span>{' '}
                    {f.finding}
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.recommendations && report.recommendations.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">
                Recomendaciones ({report.recommendations.length})
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Badge
                      variant={
                        r.priority === 'high'
                          ? 'warning'
                          : r.priority === 'medium'
                            ? 'secondary'
                            : 'outline'
                      }
                      className="mt-0.5 text-[10px] shrink-0"
                    >
                      {r.priority}
                    </Badge>
                    <span>{r.recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.submitted_at && (
            <p className="text-xs text-muted-foreground">
              Enviado: {formatDate(report.submitted_at)}
            </p>
          )}
        </div>
      )}

      {/* Submit action for draft reports */}
      {report.status === 'draft' && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => submitReport.mutate(report.id)}
            disabled={submitReport.isPending}
          >
            <Send className="h-3.5 w-3.5 mr-1" />
            {submitReport.isPending ? 'Enviando...' : 'Enviar Reporte'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function VigilanciaPanel() {
  const { currentMember: _currentMember } = useCommunityContext()
  const { isAdmin, role } = usePermissions()
  const { data: reports, isLoading } = useVigilanciaReports()
  const [showForm, setShowForm] = useState(false)

  const canCreateReport = isAdmin || role === 'comite_vigilancia'

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando reportes...</p>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-5 w-5 text-violet-600" />
              Comite de Vigilancia
            </CardTitle>
            {canCreateReport && !showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nuevo Reporte
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            LPCI CDMX Art. 45-46 -- Reportes de supervision del comite de vigilancia.
          </p>
        </CardHeader>
      </Card>

      {/* Create Report Form */}
      {showForm && <ReportForm onClose={() => setShowForm(false)} />}

      {/* Reports List */}
      {(reports ?? []).length === 0 && !showForm ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No hay reportes de vigilancia.</p>
          {canCreateReport && (
            <p className="text-sm mt-1">
              Crea el primer reporte para iniciar la supervision.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {(reports ?? []).map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
