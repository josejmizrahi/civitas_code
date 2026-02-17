import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useEntity, useUpdateEntity } from '../hooks/useEntities'
import { getEntityContacts } from '../services/entities.service'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { useRatings, useRatingSummary } from '../hooks/useRatings'
import { useContracts } from '@/core/treasury/hooks/useContracts'
import { usePermissions } from '@/shared/hooks/usePermissions'
import { useCommunityContext } from '@/app/providers'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/shared/components/ui/table'
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/utils'
import { ArrowLeft, Building2, Star, FileText, Phone, Mail, MapPin, User, Calendar, Users } from 'lucide-react'
import { ENTITY_TYPE_LABELS, ENTITY_STATUS_LABELS, RATING_DIMENSION_LABELS } from '../types'
import { RatingForm } from './RatingForm'
import type { EntityType, EntityStatus } from '@/shared/types'

interface Props {
  entityId: string
  onBack: () => void
}

export function EntityDetail({ entityId, onBack }: Props) {
  const { data: entity, isLoading } = useEntity(entityId)
  const { data: ratingSummary } = useRatingSummary('entity', entityId)
  const { data: ratings } = useRatings('entity', entityId)
  const { data: contracts } = useContracts({ entity_id: entityId })
  const { data: contacts } = useQuery({
    queryKey: ['entity-contacts', entityId],
    queryFn: () => getEntityContacts(entityId),
    enabled: !!entityId,
  })
  const { canManageTreasury } = usePermissions()
  const updateEntity = useUpdateEntity()
  const [showRatingForm, setShowRatingForm] = useState(false)

  if (isLoading) return <LoadingSpinner message="Cargando entidad..." className="py-12" />
  if (!entity) return <div className="text-muted-foreground">Entidad no encontrada</div>

  const handleStatusChange = (newStatus: string) => {
    updateEntity.mutate({ id: entityId, updates: { status: newStatus as EntityStatus } })
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="gap-1">
        <ArrowLeft className="h-4 w-4" /> Volver al directorio
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-muted p-3 shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{entity.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary">{ENTITY_TYPE_LABELS[entity.type as EntityType] || entity.type}</Badge>
              <Badge variant={entity.status === 'active' ? 'success' : entity.status === 'blacklisted' ? 'destructive' : 'secondary'}>
                {ENTITY_STATUS_LABELS[entity.status as EntityStatus] || entity.status}
              </Badge>
              {entity.rfc && <span className="text-sm text-muted-foreground">RFC: {entity.rfc}</span>}
            </div>
          </div>
        </div>
        {canManageTreasury && (
          <Select value={entity.status} onChange={(e) => handleStatusChange(e.target.value)} className="w-full sm:w-36">
            {Object.entries(ENTITY_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        )}
      </div>

      {/* Metadata row */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {entity.creator_name && (
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" /> Registrado por</div>
              <div className="font-medium text-sm mt-1">{entity.creator_name}</div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> Creado</div>
            <div className="font-medium text-sm mt-1">{formatDate(entity.created_at)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="h-3 w-3" /> Actualizado</div>
            <div className="font-medium text-sm mt-1">{formatDate(entity.updated_at)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="h-3 w-3" /> Contratos</div>
            <div className="font-medium text-sm mt-1">{contracts?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact info */}
        <Card>
          <CardHeader><CardTitle className="text-base">Información de Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {entity.contact_person && (
              <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" />{entity.contact_person}</div>
            )}
            {entity.email && (
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{entity.email}</div>
            )}
            {entity.phone && (
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{entity.phone}</div>
            )}
            {entity.address && (
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{entity.address}</div>
            )}
            {entity.clabe && (
              <div>
                <div className="text-xs text-muted-foreground">CLABE</div>
                <code className="font-mono">{entity.clabe}</code>
                {entity.bank_name && <span className="ml-2 text-sm text-muted-foreground">({entity.bank_name})</span>}
              </div>
            )}
            {entity.notes && (
              <div className="rounded-md bg-muted p-3 text-sm">{entity.notes}</div>
            )}
            {!entity.contact_person && !entity.email && !entity.phone && !entity.address && (
              <p className="text-sm text-muted-foreground">Sin información de contacto registrada.</p>
            )}
          </CardContent>
        </Card>

        {/* Rating Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Rating</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowRatingForm(true)}>
                <Star className="mr-1 h-3 w-3" /> Calificar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ratingSummary ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-bold">{ratingSummary.avg_score}</div>
                  <div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < Math.round(ratingSummary.avg_score) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{ratingSummary.total_ratings} calificaciones</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {(['punctuality', 'quality', 'communication', 'compliance', 'value'] as const).map((dim) => {
                    const val = ratingSummary[`avg_${dim}` as keyof typeof ratingSummary] as number | null
                    if (val == null) return null
                    return (
                      <div key={dim} className="flex items-center justify-between text-sm">
                        <span>{RATING_DIMENSION_LABELS[dim]}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-yellow-500" style={{ width: `${(val / 5) * 100}%` }} />
                          </div>
                          <span className="font-medium w-8 text-right">{val}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin calificaciones todavía.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4" />
            Contratos ({contracts?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!contracts || contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin contratos registrados con esta entidad.</p>
          ) : (
            <div className="space-y-2">
              {contracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.type} · {formatDate(c.start_date)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(c.total_amount)}</div>
                    <Badge variant={c.status === 'active' ? 'success' : c.status === 'defaulted' ? 'destructive' : 'secondary'}>
                      {c.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entity Contacts */}
      {contacts && contacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Contactos ({contacts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden sm:table-cell">Teléfono</TableHead>
                    <TableHead>Principal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.role || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{contact.email || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">{contact.phone || '—'}</TableCell>
                      <TableCell>
                        {contact.is_primary && <Badge variant="success">Sí</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Ratings */}
      {ratings && ratings.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Calificaciones Recientes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ratings.slice(0, 5).map((r) => (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.overall_score ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(r.created_at)}</span>
                  </div>
                  {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <RatingForm
        open={showRatingForm}
        onOpenChange={setShowRatingForm}
        targetType="entity"
        targetId={entityId}
        targetName={entity.name}
      />
    </div>
  )
}
