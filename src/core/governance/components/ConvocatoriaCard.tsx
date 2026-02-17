import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { formatDateTime } from '@/shared/lib/utils'
import { Calendar, MapPin, User, FileText, CheckCircle, AlertTriangle, Send } from 'lucide-react'
import type { Convocatoria } from '../types'

interface Props {
  convocatoria: Convocatoria
}

const TYPE_LABELS: Record<string, string> = {
  ordinary: 'Ordinaria',
  extraordinary: 'Extraordinaria',
}

export function ConvocatoriaCard({ convocatoria }: Props) {
  const issuedDate = new Date(convocatoria.issued_at)
  const scheduledDate = new Date(convocatoria.scheduled_date)
  const diffDays = Math.ceil(
    (scheduledDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  const meetsNotice = diffDays >= convocatoria.minimum_notice_days
  const deliveredCount = (convocatoria.delivery_log || []).length

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Convocatoria - {convocatoria.call_number}a Llamada
          </CardTitle>
          {meetsNotice ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Aviso valido
            </Badge>
          ) : (
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Aviso insuficiente
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Art. 34 required fields */}
        <div className="grid gap-3 text-sm">
          <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
            <span className="font-medium text-muted-foreground w-full sm:w-32 shrink-0">
              Tipo de Asamblea:
            </span>
            <span>{TYPE_LABELS[convocatoria.type] || convocatoria.type}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
            <span className="font-medium text-muted-foreground w-full sm:w-32 shrink-0">
              <MapPin className="inline h-3.5 w-3.5 mr-1" />
              Ubicacion:
            </span>
            <span>{convocatoria.location || 'No especificada'}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
            <span className="font-medium text-muted-foreground w-full sm:w-32 shrink-0">
              <Calendar className="inline h-3.5 w-3.5 mr-1" />
              Fecha y Hora:
            </span>
            <span>{formatDateTime(convocatoria.scheduled_date)}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
            <span className="font-medium text-muted-foreground w-full sm:w-32 shrink-0">
              <User className="inline h-3.5 w-3.5 mr-1" />
              Convocado por:
            </span>
            <span>{convocatoria.caller_name || 'Administrador'}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
            <span className="font-medium text-muted-foreground w-full sm:w-32 shrink-0">
              Fecha de emision:
            </span>
            <span>{formatDateTime(convocatoria.issued_at)}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
            <span className="font-medium text-muted-foreground w-full sm:w-32 shrink-0">
              Aviso minimo:
            </span>
            <span>
              {diffDays} dias ({convocatoria.minimum_notice_days} requeridos)
            </span>
          </div>
        </div>

        {/* Agenda */}
        {convocatoria.agenda && convocatoria.agenda.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Orden del Dia</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              {convocatoria.agenda.map((item, index) => (
                <li key={index} className="text-muted-foreground">
                  <span className="text-foreground font-medium">
                    {item.topic}
                  </span>
                  {item.description && (
                    <p className="ml-5 text-muted-foreground text-xs mt-0.5">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Delivery status */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
          <Send className="h-3.5 w-3.5" />
          <span>
            {deliveredCount} notificaciones entregadas
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
