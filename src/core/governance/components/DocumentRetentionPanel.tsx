import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { useRetentionRecords, useExpiringDocuments } from '../hooks/useRetention'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { AlertTriangle, FileCheck, Archive, Clock, Shield } from 'lucide-react'
import { formatDate } from '@/shared/lib/utils'
import type { RetentionRecord } from '../types'

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  minutes: 'Acta',
  financial_statement: 'Estado financiero',
  convocatoria: 'Convocatoria',
  report: 'Reporte',
}

function getRetentionStatus(
  record: RetentionRecord
): { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' } {
  if (record.archived) {
    return { label: 'Archivado', variant: 'secondary' }
  }
  const now = new Date()
  const expires = new Date(record.expires_at)
  const daysUntilExpiry = Math.ceil(
    (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (daysUntilExpiry < 0) {
    return { label: 'Expirado', variant: 'destructive' }
  }
  if (daysUntilExpiry <= 30) {
    return { label: `Expira en ${daysUntilExpiry}d`, variant: 'warning' }
  }
  return { label: 'Vigente', variant: 'success' }
}

function truncateHash(hash: string | null): string {
  if (!hash) return '---'
  if (hash.length <= 16) return hash
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`
}

export function DocumentRetentionPanel() {
  const { data: records, isLoading } = useRetentionRecords()
  const { data: expiring } = useExpiringDocuments(30)

  const expiringCount = expiring?.length ?? 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Retención Documental
          </CardTitle>
          <div className="flex items-center gap-2">
            {expiringCount > 0 && (
              <Badge variant="warning">
                {expiringCount} por expirar
              </Badge>
            )}
            <Badge variant="secondary">
              {records?.length ?? 0} registros
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legal reference */}
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          <p className="font-medium">Retención conforme a normativa:</p>
          <ul className="list-disc list-inside mt-1 text-xs space-y-0.5">
            <li>Código de Comercio Art. 38-52: conservación mínima 10 años</li>
            <li>NOM-151: integridad mediante hash SHA-256</li>
          </ul>
        </div>

        {/* Expiring documents alert */}
        {expiringCount > 0 && (
          <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">
                {expiringCount} documento{expiringCount > 1 ? 's' : ''} expira{expiringCount > 1 ? 'n' : ''} en los próximos 30 días
              </p>
              <p className="text-xs mt-0.5">Revise y renueve la retención si es necesario.</p>
            </div>
          </div>
        )}

        {/* Retention table */}
        {isLoading ? (
          <LoadingSpinner message="Cargando registros de retención..." className="py-8" />
        ) : !records || records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Sin registros de retención</p>
            <p className="text-sm mt-1">Los documentos se registrarán automáticamente al crear actas</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Hash de integridad</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const status = getRetentionStatus(record)
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {record.archived ? (
                            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : status.variant === 'warning' ? (
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                          ) : (
                            <FileCheck className="h-3.5 w-3.5 text-green-600" />
                          )}
                          <span className="font-medium text-sm">
                            {DOCUMENT_TYPE_LABELS[record.document_type] || record.document_type}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(record.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(record.expires_at)}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                          {truncateHash(record.integrity_hash)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
