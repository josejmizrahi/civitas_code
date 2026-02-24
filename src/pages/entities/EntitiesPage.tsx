import { EntityList } from '@/core/entities/components/EntityList'
import { PageHeader } from '@/shared/components/ui/page-header'

export function EntitiesPage({ embedded = false }: { embedded?: boolean } = {}) {
  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title="Partes Relacionadas"
          subtitle="Proveedores, socios comerciales, contratistas y entidades vinculadas a la comunidad"
        />
      )}
      <EntityList />
    </div>
  )
}
