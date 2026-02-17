import { Select } from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'
import { INTERNAL_FIELDS } from '@/shared/config/constants'

interface Props {
  headers: string[]
  mappings: Record<string, string>
  onChange: (mappings: Record<string, string>) => void
}

const FIELD_LABELS: Record<string, string> = {
  amount: 'Monto',
  date: 'Fecha',
  description: 'Descripción',
  category: 'Categoría',
  type: 'Tipo (ingreso/egreso)',
  external_ref: 'Referencia externa',
}

export function ColumnMapper({ headers, mappings, onChange }: Props) {
  const handleChange = (internalField: string, externalColumn: string) => {
    const updated = { ...mappings }
    if (externalColumn === '') {
      delete updated[internalField]
    } else {
      updated[internalField] = externalColumn
    }
    onChange(updated)
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Asigna cada columna de tu archivo a un campo interno. Monto y Fecha son obligatorios.
      </p>
      <div className="grid gap-3">
        {INTERNAL_FIELDS.map((field) => (
          <div key={field} className="flex items-center gap-3">
            <Label className="w-40 shrink-0 text-right text-sm">
              {FIELD_LABELS[field] || field}
              {(field === 'amount' || field === 'date') && (
                <span className="text-destructive"> *</span>
              )}
            </Label>
            <Select
              value={mappings[field] || ''}
              onChange={(e) => handleChange(field, e.target.value)}
              className="flex-1"
            >
              <option value="">— Sin mapear —</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
