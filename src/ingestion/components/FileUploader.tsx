import { useCallback, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { csvAdapter } from '../adapters/csv.adapter'
import { excelAdapter } from '../adapters/excel.adapter'
import type { ParsedFile } from '../types'

interface Props {
  onFileParsed: (parsed: ParsedFile) => void
}

const adapters = [csvAdapter, excelAdapter]

export function FileUploader({ onFileParsed }: Props) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = useCallback(
    async (file: File) => {
      setError('')
      const adapter = adapters.find((a) => a.canHandle(file))
      if (!adapter) {
        setError('Formato no soportado. Usa archivos CSV o Excel (.xlsx, .xls).')
        return
      }
      setLoading(true)
      try {
        const parsed = await adapter.parse(file)
        if (parsed.rows.length === 0) {
          setError('El archivo está vacío o no contiene datos.')
          return
        }
        onFileParsed(parsed)
      } catch {
        setError('Error al leer el archivo. Verifica que no esté dañado.')
      } finally {
        setLoading(false)
      }
    },
    [onFileParsed]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
          dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
      >
        <Upload className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="mb-1 text-sm font-medium">
          {loading ? 'Procesando archivo...' : 'Arrastra un archivo CSV o Excel aquí'}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">o haz clic para seleccionar</p>
        <label className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Seleccionar archivo
          <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleChange} />
        </label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
