import { useState, useRef, useEffect } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Search } from 'lucide-react'
import { useI18n } from '@/shared/hooks/useI18n'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  value: string
  onChange: (value: string) => void
  options: SearchableSelectOption[]
  label?: string
  placeholder?: string
  emptyMessage?: string
}

export function SearchableSelect({
  value,
  onChange,
  options,
  label,
  placeholder,
  emptyMessage,
}: SearchableSelectProps) {
  const { t } = useI18n()
  const resolvedPlaceholder = placeholder ?? t('searchableSelect.placeholder')
  const resolvedEmptyMessage = emptyMessage ?? t('searchableSelect.empty')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value
  const filtered = options.filter(
    (o) =>
      !search.trim() ||
      o.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-2" ref={ref}>
      {label && <Label>{label}</Label>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={open ? search : selectedLabel}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={resolvedPlaceholder}
          className="pl-9"
        />
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                {resolvedEmptyMessage}
              </div>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                  onClick={() => {
                    onChange(opt.value)
                    setSearch('')
                    setOpen(false)
                  }}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
