import { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select } from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/components/ui/dialog'
import { FileText, Plus, Trash2, Upload, Search, File, X, AlertCircle } from 'lucide-react'
import { formatDate } from '@/shared/lib/utils'
import { useDocuments, useCreateDocument, useDeleteDocument } from '@/core/documents/hooks/useDocuments'
import { useToast } from '@/shared/components/ui/toast'
import { uploadFile } from '@/core/documents/services/documents.service'
import { useCommunityContext } from '@/app/providers'
import { hasPermission, type Role } from '@/shared/types'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'acta', label: 'Acta' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'reglamento', label: 'Reglamento' },
  { value: 'financiero', label: 'Financiero' },
  { value: 'otro', label: 'Otro' },
]

const categoryBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  general: 'secondary',
  acta: 'default',
  contrato: 'outline',
  reglamento: 'warning',
  financiero: 'success',
  otro: 'secondary',
}

export function DocumentsPage() {
  const { communityId, currentMember } = useCommunityContext()
  const { data: documents, isLoading } = useDocuments()
  const createDoc = useCreateDocument()
  const deleteDoc = useDeleteDocument()
  const toast = useToast()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('general')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const userRole = (currentMember?.role ?? 'observador') as Role
  const isAdmin = hasPermission(userRole, 'admin')

  const filteredDocs = documents?.filter((doc) => {
    if (!search) return true
    const q = search.toLowerCase()
    return doc.title.toLowerCase().includes(q) || doc.category.toLowerCase().includes(q)
  }) ?? []

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }, [title])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  const resetForm = () => {
    setTitle('')
    setCategory('general')
    setSelectedFile(null)
    setFileUrl('')
    setUploadError('')
    setUploadMode('file')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setUploadError('')
    setUploading(true)

    try {
      let finalUrl = ''

      if (uploadMode === 'file' && selectedFile) {
        finalUrl = await uploadFile(communityId!, selectedFile)
      } else if (uploadMode === 'url' && fileUrl.trim()) {
        finalUrl = fileUrl.trim()
      } else {
        setUploadError('Selecciona un archivo o proporciona una URL')
        setUploading(false)
        return
      }

      await createDoc.mutateAsync({ title: title.trim(), file_url: finalUrl, category })
      resetForm()
      setDialogOpen(false)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir documento')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (docId: string, docTitle: string) => {
    if (confirm(`¿Eliminar "${docTitle}"? Esta acción no se puede deshacer.`)) {
      deleteDoc.mutate(docId, {
        onSuccess: () => toast.success('Documento eliminado'),
        onError: () => toast.error('Error al eliminar documento'),
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Documentos</h1>
          <p className="text-sm text-muted-foreground">Gestión documental de la comunidad</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Subir Documento
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documentos de la comunidad</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar documentos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner message="Cargando documentos..." className="py-8" />
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">
                {search ? 'Sin resultados para tu búsqueda' : 'No hay documentos aún'}
              </p>
              <p className="text-sm mt-1">
                {search ? 'Intenta con otro término' : 'Sube el primero con el botón de arriba'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fecha</TableHead>
                  {isAdmin && <TableHead className="w-16" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {doc.title}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant={categoryBadgeVariant[doc.category] ?? 'secondary'}>
                        {CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(doc.created_at)}</TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(doc.id, doc.title)}
                          disabled={deleteDoc.isPending}
                          title="Eliminar documento"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {uploadError && (
              <div className="rounded-md bg-destructive/10 p-3 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {uploadError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="doc-title">Título</Label>
              <Input
                id="doc-title"
                placeholder="Nombre del documento"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-category">Categoría</Label>
              <Select
                id="doc-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Archivo</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={uploadMode === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('file')}
                >
                  <Upload className="mr-1 h-3 w-3" /> Subir archivo
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('url')}
                >
                  <FileText className="mr-1 h-3 w-3" /> URL externa
                </Button>
              </div>

              {uploadMode === 'file' ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : selectedFile
                      ? 'border-green-300 bg-green-50/50'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.jpg,.jpeg,.png,.gif,.zip"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-8 w-8 text-green-600" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                        aria-label="Cancelar"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium">Arrastra un archivo aquí</p>
                      <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, imágenes, ZIP (máx. 50MB)</p>
                    </>
                  )}
                </div>
              ) : (
                <Input
                  type="url"
                  placeholder="https://ejemplo.com/documento.pdf"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  required={uploadMode === 'url'}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setDialogOpen(false) }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : 'Subir Documento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
