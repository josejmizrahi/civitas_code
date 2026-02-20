import { useState, useRef, useEffect } from 'react'
import { useEntities, useCreateEntity } from '@/core/entities/hooks/useEntities'
import type { Entity } from '@/core/entities/types'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Select } from '@/shared/components/ui/select'
import { Search, Plus } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'

export interface EntityPickerValue {
  entityId: string | null
  recipientName: string
}

interface EntityPickerProps {
  value: EntityPickerValue
  onChange: (value: EntityPickerValue) => void
  placeholder?: string
  label?: string
  onError?: (message: string) => void
}

export function EntityPicker({
  value,
  onChange,
  placeholder = 'Buscar proveedor o beneficiario...',
  label = 'Beneficiario',
  onError,
}: EntityPickerProps) {
  const { data: entities } = useEntities({ status: 'active' })
  const createEntityMut = useCreateEntity()
  const [entitySearch, setEntitySearch] = useState('')
  const [showEntityDropdown, setShowEntityDropdown] = useState(false)
  const [showNewEntityForm, setShowNewEntityForm] = useState(false)
  const [newEntityName, setNewEntityName] = useState('')
  const [newEntityType, setNewEntityType] = useState<string>('proveedor')
  const [newEntityPhone, setNewEntityPhone] = useState('')
  const entityDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (entityDropdownRef.current && !entityDropdownRef.current.contains(e.target as Node)) {
        setShowEntityDropdown(false)
      }
    }
    if (showEntityDropdown) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEntityDropdown])

  const displayValue = value.entityId
    ? entities?.find((e) => e.id === value.entityId)?.name ?? value.recipientName
    : value.recipientName || entitySearch

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {!showNewEntityForm ? (
        <div className="relative" ref={entityDropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={showEntityDropdown ? entitySearch : displayValue}
              onChange={(e) => {
                setEntitySearch(e.target.value)
                onChange({ entityId: null, recipientName: e.target.value })
                setShowEntityDropdown(true)
              }}
              onFocus={() => setShowEntityDropdown(true)}
              placeholder={placeholder}
              className="pl-9"
            />
          </div>
          {showEntityDropdown && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-48 overflow-y-auto">
              {entities
                ?.filter(
                  (e) =>
                    !entitySearch ||
                    e.name.toLowerCase().includes(entitySearch.toLowerCase()) ||
                    (e.contact_person && e.contact_person.toLowerCase().includes(entitySearch.toLowerCase()))
                )
                .slice(0, 8)
                .map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                    onClick={() => {
                      onChange({ entityId: entity.id, recipientName: entity.name })
                      setEntitySearch('')
                      setShowEntityDropdown(false)
                    }}
                  >
                    <span className="font-medium">{entity.name}</span>
                    <Badge variant="secondary" className="text-[10px] ml-auto">
                      {entity.type === 'proveedor' ? 'Proveedor' : entity.type === 'contratista' ? 'Contratista' : entity.type}
                    </Badge>
                  </button>
                ))}
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-left text-primary hover:bg-accent transition-colors border-t"
                onClick={() => {
                  setShowEntityDropdown(false)
                  setShowNewEntityForm(true)
                  setNewEntityName(entitySearch)
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Crear nuevo proveedor{entitySearch ? `: "${entitySearch}"` : ''}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Nuevo proveedor</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewEntityForm(false)}
              className="h-6 text-xs"
            >
              Cancelar
            </Button>
          </div>
          <div className="space-y-2">
            <Input
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              placeholder="Nombre del proveedor"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={newEntityType} onChange={(e) => setNewEntityType(e.target.value)}>
              <option value="proveedor">Proveedor</option>
              <option value="contratista">Contratista</option>
              <option value="socio_comercial">Socio Comercial</option>
              <option value="otro">Otro</option>
            </Select>
            <Input
              value={newEntityPhone}
              onChange={(e) => setNewEntityPhone(e.target.value)}
              placeholder="Teléfono (opcional)"
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!newEntityName.trim() || createEntityMut.isPending}
            onClick={async () => {
              try {
                const created = await createEntityMut.mutateAsync({
                  name: newEntityName.trim(),
                  type: newEntityType as Entity['type'],
                  status: 'active',
                  rfc: null,
                  email: null,
                  phone: newEntityPhone || null,
                  address: null,
                  clabe: null,
                  bank_name: null,
                  contact_person: null,
                  notes: null,
                  created_by: null,
                })
                onChange({ entityId: created.id, recipientName: created.name })
                setShowNewEntityForm(false)
                setNewEntityName('')
                setNewEntityPhone('')
              } catch {
                onError?.('Error al crear el proveedor')
              }
            }}
          >
            {createEntityMut.isPending ? 'Creando...' : 'Crear y seleccionar'}
          </Button>
        </div>
      )}
    </div>
  )
}
