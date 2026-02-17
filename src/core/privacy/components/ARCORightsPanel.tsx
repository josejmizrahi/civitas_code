import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select } from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import { useToast } from '@/shared/components/ui/toast'
import { useARCORequests, useCreateARCORequest, useExportUserData } from '../hooks/usePrivacy'
import { Shield, Download, Send, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { formatDate } from '@/shared/lib/utils'

const ARCO_TYPES = [
  { value: 'access', label: 'Acceso', description: 'Conocer qu\u00e9 datos personales tenemos sobre usted' },
  { value: 'rectification', label: 'Rectificaci\u00f3n', description: 'Corregir datos inexactos o incompletos' },
  { value: 'cancellation', label: 'Cancelaci\u00f3n', description: 'Solicitar la eliminaci\u00f3n de sus datos' },
  { value: 'opposition', label: 'Oposici\u00f3n', description: 'Oponerse al tratamiento de sus datos' },
]

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' }> = {
  pending: { label: 'Pendiente', variant: 'warning' },
  in_review: { label: 'En revisi\u00f3n', variant: 'secondary' },
  completed: { label: 'Completada', variant: 'success' },
  denied: { label: 'Denegada', variant: 'destructive' },
}

export function ARCORightsPanel() {
  const toast = useToast()
  const { data: requests, isLoading } = useARCORequests()
  const createRequest = useCreateARCORequest()
  const exportData = useExportUserData()

  const [type, setType] = useState('access')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error('Por favor describe tu solicitud')
      return
    }
    try {
      await createRequest.mutateAsync({ type, description })
      toast.success('Solicitud ARCO creada exitosamente')
      setDescription('')
      setShowForm(false)
    } catch {
      toast.error('Error al crear la solicitud')
    }
  }

  const handleExport = async () => {
    try {
      const data = await exportData.mutateAsync()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mis-datos-civitas-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Datos exportados exitosamente')
    } catch {
      toast.error('Error al exportar los datos')
    }
  }

  return (
    <div className="space-y-6">
      {/* ARCO Rights Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Derechos ARCO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            De acuerdo con la LFPDPPP, usted tiene los siguientes derechos sobre sus datos personales:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ARCO_TYPES.map((arco) => (
              <div key={arco.value} className="rounded-md border p-3">
                <p className="font-medium text-sm">{arco.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{arco.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setShowForm(!showForm)}>
              <Send className="h-4 w-4 mr-2" />
              Nueva Solicitud ARCO
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={exportData.isPending}>
              {exportData.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar mis datos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* New ARCO Request Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nueva Solicitud ARCO</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="arco-type">Tipo de solicitud</Label>
              <Select
                id="arco-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {ARCO_TYPES.map((arco) => (
                  <option key={arco.value} value={arco.value}>
                    {arco.label} - {arco.description}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="arco-description">Descripci&oacute;n de la solicitud</Label>
              <Textarea
                id="arco-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describa detalladamente su solicitud..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createRequest.isPending}>
                {createRequest.isPending ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing ARCO Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis Solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando solicitudes...
            </div>
          ) : !requests || requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes solicitudes ARCO registradas.</p>
          ) : (
            <div className="space-y-3">
              {requests.map((request: any) => {
                const statusConfig = STATUS_CONFIG[request.status] || STATUS_CONFIG.pending
                const arcoType = ARCO_TYPES.find((t) => t.value === request.type)

                return (
                  <div key={request.id} className="rounded-md border p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{arcoType?.label ?? request.type}</Badge>
                        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(request.created_at)}
                      </div>
                    </div>
                    <p className="text-sm">{request.description}</p>
                    {request.deadline && (
                      <p className="text-xs text-muted-foreground">
                        Fecha l&iacute;mite de respuesta: {formatDate(request.deadline)}
                      </p>
                    )}
                    {request.response && (
                      <div className="rounded-md bg-muted p-3 mt-2">
                        <div className="flex items-center gap-1 mb-1">
                          {request.status === 'completed' ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                          )}
                          <span className="text-xs font-medium">Respuesta:</span>
                        </div>
                        <p className="text-sm">{request.response}</p>
                        {request.responded_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Respondido el {formatDate(request.responded_at)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
