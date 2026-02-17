import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { useToast } from '@/shared/components/ui/toast'
import { useAllARCORequests, useRespondToARCO } from '../hooks/usePrivacy'
import { Shield, Clock, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { formatDate } from '@/shared/lib/utils'

const ARCO_TYPE_LABELS: Record<string, string> = {
  access: 'Acceso',
  rectification: 'Rectificaci\u00f3n',
  cancellation: 'Cancelaci\u00f3n',
  opposition: 'Oposici\u00f3n',
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  in_review: { label: 'En revisi\u00f3n', variant: 'secondary' },
  completed: { label: 'Completada', variant: 'success' },
  denied: { label: 'Denegada', variant: 'destructive' },
}

function getDaysUntilDeadline(deadline: string): number {
  const now = new Date()
  const dl = new Date(deadline)
  return Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function ARCOAdminPanel() {
  const toast = useToast()
  const { data: requests, isLoading } = useAllARCORequests()
  const respondToARCO = useRespondToARCO()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  const handleRespond = async (requestId: string, status: 'completed' | 'denied') => {
    if (!responseText.trim()) {
      toast.error('Por favor escribe una respuesta')
      return
    }
    try {
      await respondToARCO.mutateAsync({ requestId, response: responseText, status })
      toast.success(status === 'completed' ? 'Solicitud completada' : 'Solicitud denegada')
      setResponseText('')
      setExpandedId(null)
    } catch {
      toast.error('Error al responder la solicitud')
    }
  }

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setResponseText('')
    } else {
      setExpandedId(id)
      setResponseText('')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Solicitudes ARCO
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando solicitudes...
          </div>
        ) : !requests || requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay solicitudes ARCO registradas.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((request: any) => {
              const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending
              const daysLeft = getDaysUntilDeadline(request.deadline)
              const isUrgent = daysLeft <= 5 && daysLeft > 0 && request.status !== 'completed' && request.status !== 'denied'
              const isOverdue = daysLeft <= 0 && request.status !== 'completed' && request.status !== 'denied'
              const isExpanded = expandedId === request.id
              const canRespond = request.status === 'pending' || request.status === 'in_review'

              return (
                <div
                  key={request.id}
                  className={`rounded-md border p-4 space-y-2 ${
                    isOverdue ? 'border-red-300 bg-red-50/50' : isUrgent ? 'border-amber-300 bg-amber-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {ARCO_TYPE_LABELS[request.type] ?? request.type}
                      </Badge>
                      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      {isOverdue && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Vencida
                        </Badge>
                      )}
                      {isUrgent && !isOverdue && (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {daysLeft} d&iacute;as restantes
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(request.created_at)}
                      </div>
                      {canRespond && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(request.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-sm">{request.description}</p>

                  <p className="text-xs text-muted-foreground">
                    L&iacute;mite: {formatDate(request.deadline)}
                    {daysLeft > 0 && ` (${daysLeft} d\u00edas restantes)`}
                  </p>

                  {/* Existing response */}
                  {request.response && (
                    <div className="rounded-md bg-muted p-3">
                      <p className="text-xs font-medium mb-1">Respuesta:</p>
                      <p className="text-sm">{request.response}</p>
                      {request.responded_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Respondido el {formatDate(request.responded_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Response form */}
                  {isExpanded && canRespond && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="space-y-2">
                        <Label>Respuesta</Label>
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Escribe tu respuesta a la solicitud..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRespond(request.id, 'completed')}
                          disabled={respondToARCO.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRespond(request.id, 'denied')}
                          disabled={respondToARCO.isPending}
                        >
                          Denegar
                        </Button>
                        <Button variant="outline" onClick={() => toggleExpand(request.id)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
