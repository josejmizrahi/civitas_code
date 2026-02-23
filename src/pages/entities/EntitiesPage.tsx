import { EntityList } from '@/core/entities/components/EntityList'

export function EntitiesPage({ embedded = false }: { embedded?: boolean } = {}) {
  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Partes Relacionadas</h1>
            <p className="text-sm text-muted-foreground">
              Proveedores, socios comerciales, contratistas y entidades vinculadas a la comunidad
            </p>
          </div>
        </div>
      )}
      <EntityList />
    </div>
  )
}
