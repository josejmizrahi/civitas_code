import { Select } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import type { Category } from '@/core/treasury/types'

interface Props {
  externalCategories: string[]
  categoryMap: Map<string, { categoryId: string | null; autoMatched: boolean }>
  internalCategories: Category[]
  onChange: (externalName: string, categoryId: string | null) => void
}

export function CategoryMapper({ externalCategories, categoryMap, internalCategories, onChange }: Props) {
  if (externalCategories.length === 0) {
    return <p className="text-sm text-muted-foreground">No se detectaron categorías en los datos.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Asigna cada categoría del archivo a una categoría interna. Las coincidencias automáticas se marcan en verde.
      </p>
      <div className="grid gap-2">
        {externalCategories.map((extName) => {
          const match = categoryMap.get(extName)
          return (
            <div key={extName} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 rounded-md border p-2">
              <span className="sm:w-48 sm:shrink-0 truncate text-sm font-medium">{extName}</span>
              <span className="hidden sm:inline text-muted-foreground">→</span>
              <Select
                value={match?.categoryId || ''}
                onChange={(e) => onChange(extName, e.target.value || null)}
                className="flex-1"
              >
                <option value="">Sin categoría</option>
                {internalCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              {match?.autoMatched && (
                <Badge variant="success" className="shrink-0">
                  Auto
                </Badge>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
