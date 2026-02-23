import { useParams, useNavigate } from 'react-router-dom'
import { EntityDetail } from '@/core/entities/components/EntityDetail'
import { useCommunityPath } from '@/shared/hooks/useCommunityPath'

export function EntityDetailPage() {
  const { entityId } = useParams<{ entityId: string }>()
  const navigate = useNavigate()
  const path = useCommunityPath()

  if (!entityId) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Detalle de Entidad</h1>
        <p className="text-sm text-muted-foreground">Información completa del proveedor o parte relacionada</p>
      </div>
      <EntityDetail entityId={entityId} onBack={() => navigate(path('entities'))} />
    </div>
  )
}
