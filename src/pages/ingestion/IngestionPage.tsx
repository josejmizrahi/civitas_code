import { useState, useMemo } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { DataSourceManager } from '@/ingestion/components/DataSourceManager'
import { FileUploader } from '@/ingestion/components/FileUploader'
import { ColumnMapper } from '@/ingestion/components/ColumnMapper'
import { CategoryMapper } from '@/ingestion/components/CategoryMapper'
import { ImportPreview } from '@/ingestion/components/ImportPreview'
import { ImportHistory } from '@/ingestion/components/ImportHistory'
import { normalizeTransactions } from '@/ingestion/normalizer/transaction.normalizer'
import { buildCategoryMap } from '@/ingestion/normalizer/category.normalizer'
import { markDuplicates } from '@/ingestion/services/reconciliation.service'
import { importTransactions, updateImportJob, updateDataSourceSync, createImportJob } from '@/ingestion/services/ingestion.service'
import { getCategories } from '@/core/treasury/services/treasury.service'
import { useCommunityContext } from '@/app/providers'
import { useCategoryMappings } from '@/ingestion/hooks/useMappingRules'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import type { ParsedFile, NormalizedTransaction } from '@/ingestion/types'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'

type WizardStep = 'upload' | 'columns' | 'categories' | 'preview'

export function IngestionPage() {
  const { communityId } = useCommunityContext()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState('sources')

  // Wizard state
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [step, setStep] = useState<WizardStep>('upload')
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null)
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [normalized, setNormalized] = useState<NormalizedTransaction[]>([])
  const [categoryMapState, setCategoryMapState] = useState<Map<string, { categoryId: string | null; autoMatched: boolean }>>(new Map())
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)

  const { data: categories } = useQuery({
    queryKey: ['categories', communityId],
    queryFn: () => getCategories(communityId!),
    enabled: !!communityId,
  })

  const { data: existingCatMappings } = useCategoryMappings(selectedSourceId)

  const externalCategories = useMemo(() => {
    return [...new Set(normalized.map((t) => t.category).filter(Boolean))] as string[]
  }, [normalized])

  const handleSelectSource = (sourceId: string) => {
    setSelectedSourceId(sourceId)
    setStep('upload')
    setParsedFile(null)
    setColumnMappings({})
    setNormalized([])
    setImportResult(null)
    setTab('wizard')
  }

  const handleFileParsed = (parsed: ParsedFile) => {
    setParsedFile(parsed)
    const guessed: Record<string, string> = {}
    for (const header of parsed.headers) {
      const lower = header.toLowerCase()
      if (lower.includes('monto') || lower.includes('amount') || lower.includes('importe') || lower.includes('cargo'))
        guessed['amount'] = header
      else if (lower.includes('fecha') || lower.includes('date'))
        guessed['date'] = header
      else if (lower.includes('descrip') || lower.includes('concepto') || lower.includes('detail'))
        guessed['description'] = header
      else if (lower.includes('categ') || lower.includes('rubro'))
        guessed['category'] = header
      else if (lower.includes('tipo') || lower.includes('type'))
        guessed['type'] = header
      else if (lower.includes('ref') || lower.includes('folio') || lower.includes('numero'))
        guessed['external_ref'] = header
    }
    setColumnMappings(guessed)
    setStep('columns')
  }

  const handleColumnsNext = async () => {
    if (!parsedFile) return
    const txs = normalizeTransactions(parsedFile.rows, columnMappings)
    const cats = categories ?? []
    const catNames = txs.map((t) => t.category).filter(Boolean) as string[]
    const catMap = buildCategoryMap(catNames, cats, existingCatMappings ?? [])
    setCategoryMapState(catMap)
    const withDups = await markDuplicates(communityId!, txs)
    setNormalized(withDups)
    setStep('categories')
  }

  const handleCategoriesNext = () => {
    setStep('preview')
  }

  const handleCategoryChange = (externalName: string, categoryId: string | null) => {
    const updated = new Map(categoryMapState)
    updated.set(externalName, { categoryId, autoMatched: false })
    setCategoryMapState(updated)
  }

  const handleImport = async () => {
    if (!selectedSourceId || !communityId) return
    setImporting(true)
    try {
      const valid = normalized.filter((t) => t._errors.length === 0 && !t._isDuplicate)
      const toImport = valid.map((tx) => {
        const catMapping = tx.category ? categoryMapState.get(tx.category) : null
        return {
          type: tx.type || 'expense',
          amount: tx.amount!,
          category_id: catMapping?.categoryId ?? null,
          description: tx.description,
          date: tx.date!,
          source_id: selectedSourceId,
          external_ref: tx.external_ref,
        }
      })

      const job = await createImportJob(communityId, {
        source_id: selectedSourceId,
        rows_total: normalized.length,
      })

      const result = await importTransactions(communityId, toImport)
      setImportResult(result)

      await updateImportJob(job.id, {
        status: 'completed',
        rows_imported: result.imported,
        rows_skipped: result.skipped + normalized.filter((t) => t._errors.length > 0 || t._isDuplicate).length,
        completed_at: new Date().toISOString(),
      } as any)

      await updateDataSourceSync(selectedSourceId)

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['data-sources'] })
    } catch (err) {
      console.error('Import error:', err)
    } finally {
      setImporting(false)
    }
  }

  const handleReset = () => {
    setParsedFile(null)
    setColumnMappings({})
    setNormalized([])
    setImportResult(null)
    setStep('upload')
    setTab('sources')
    setSelectedSourceId(null)
  }

  const canProceedColumns = columnMappings['amount'] && columnMappings['date']

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Importar Datos</h1>
          <p className="text-sm text-muted-foreground">Conecta tus fuentes de datos financieros</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="gap-1">
          <TabsTrigger value="sources">Fuentes de Datos</TabsTrigger>
          <TabsTrigger value="wizard" disabled={!selectedSourceId}>
            Asistente de Importación
          </TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="sources">
          <DataSourceManager onSelectSource={handleSelectSource} />
        </TabsContent>

        <TabsContent value="wizard">
          {importResult ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Importación Completada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-6 text-lg">
                  <span>Importados: <strong className="text-green-600">{importResult.imported}</strong></span>
                  <span>Omitidos: <strong className="text-yellow-600">{importResult.skipped}</strong></span>
                </div>
                <Button onClick={handleReset}>Nueva Importación</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 'upload' && 'Paso 1: Subir Archivo'}
                  {step === 'columns' && 'Paso 2: Mapear Columnas'}
                  {step === 'categories' && 'Paso 3: Mapear Categorías'}
                  {step === 'preview' && 'Paso 4: Vista Previa y Confirmar'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === 'upload' && <FileUploader onFileParsed={handleFileParsed} />}
                {step === 'columns' && parsedFile && (
                  <>
                    <ColumnMapper
                      headers={parsedFile.headers}
                      mappings={columnMappings}
                      onChange={setColumnMappings}
                    />
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep('upload')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                      </Button>
                      <Button onClick={handleColumnsNext} disabled={!canProceedColumns}>
                        Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
                {step === 'categories' && (
                  <>
                    <CategoryMapper
                      externalCategories={externalCategories}
                      categoryMap={categoryMapState}
                      internalCategories={categories ?? []}
                      onChange={handleCategoryChange}
                    />
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep('columns')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                      </Button>
                      <Button onClick={handleCategoriesNext}>
                        Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
                {step === 'preview' && (
                  <>
                    <ImportPreview transactions={normalized} />
                    <div className="flex justify-between pt-4">
                      <Button variant="outline" onClick={() => setStep('categories')}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Atrás
                      </Button>
                      <Button onClick={handleImport} disabled={importing}>
                        {importing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Importando...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Confirmar Importación
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history">
          <ImportHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
