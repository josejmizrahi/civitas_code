import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useCommunityContext } from '@/app/providers'
import { getCategories } from '@/core/treasury/services/treasury.service'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Search } from 'lucide-react'

export interface CategoryPickerValue {
  categoryId: string | null
  categoryName: string
}

interface CategoryPickerProps {
  value: CategoryPickerValue
  onChange: (value: CategoryPickerValue) => void
  label?: string
  placeholder?: string
}

export function CategoryPicker({
  value,
  onChange,
  label = 'Categoría',
  placeholder = 'Buscar categoría...',
}: CategoryPickerProps) {
  const { communityId } = useCommunityContext()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const displayValue = value.categoryId
    ? categories?.find((c) => c.id === value.categoryId)?.name ?? value.categoryName
    : value.categoryName || search

  const filtered =
    categories?.filter(
      (c) =>
        !search.trim() ||
        c.name.toLowerCase().includes(search.toLowerCase())
    ) ?? []

  return (
    <div className="space-y-2" ref={ref}>
      <Label>{label}</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={open ? search : displayValue}
          onChange={(e) => {
            setSearch(e.target.value)
            onChange({ categoryId: null, categoryName: e.target.value })
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="pl-9"
        />
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                {categories?.length ? 'Sin resultados' : 'Cargando...'}
              </div>
            ) : (
              filtered.slice(0, 20).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                  onClick={() => {
                    onChange({ categoryId: c.id, categoryName: c.name })
                    setSearch('')
                    setOpen(false)
                  }}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
