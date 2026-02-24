import { useParams, useNavigate } from 'react-router-dom'
import { EntityDetail } from '@/core/entities/components/EntityDetail'
import { PageHeader } from '@/shared/components/ui/page-header'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'

export function EntityDetailPage() {
  const { entityId } = useParams<{ entityId: string }>()
  const navigate = useNavigate()
  const path = useCommunityPath()

  if (!entityId) return <div className="p-8 text-center text-muted-foreground">Entidad no encontrada</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalle de Entidad"
        subtitle="Información completa del proveedor o parte relacionada"
      />
      <EntityDetail entityId={entityId} onBack={() => navigate(path('entities'))} />
    </div>
  )
}
