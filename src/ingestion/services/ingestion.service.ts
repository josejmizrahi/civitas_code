import { supabase } from '@/shared/lib/supabase'
import type { DataSource, ImportJob, CategoryMapping, ColumnMapping } from '../types'

export async function getDataSources(communityId: string): Promise<DataSource[]> {
  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as DataSource[]
}

export async function createDataSource(
  communityId: string,
  source: { name: string; type: string; created_by: string }
): Promise<DataSource> {
  const { data, error } = await (supabase.from('data_sources') as any)
    .insert({ community_id: communityId, ...source, config: {}, status: 'active' })
    .select()
    .single()

  if (error) throw error
  return data as DataSource
}

export async function getImportJobs(communityId: string): Promise<ImportJob[]> {
  const { data, error } = await supabase
    .from('import_jobs')
    .select('*, data_sources(name)')
    .eq('community_id', communityId)
    .order('started_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    source_name: row.data_sources?.name,
    data_sources: undefined,
  }))
}

export async function createImportJob(
  communityId: string,
  job: { source_id: string; rows_total: number }
): Promise<ImportJob> {
  const { data, error } = await (supabase.from('import_jobs') as any)
    .insert({
      community_id: communityId,
      ...job,
      status: 'pending',
      rows_imported: 0,
      rows_skipped: 0,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as ImportJob
}

export async function updateImportJob(
  jobId: string,
  updates: Partial<ImportJob>
): Promise<void> {
  const { error } = await (supabase.from('import_jobs') as any)
    .update(updates)
    .eq('id', jobId)

  if (error) throw error
}

export async function getColumnMappings(communityId: string, sourceId: string): Promise<ColumnMapping[]> {
  const { data, error } = await supabase
    .from('column_mappings')
    .select('*')
    .eq('community_id', communityId)
    .eq('source_id', sourceId)

  if (error) throw error
  return (data ?? []) as ColumnMapping[]
}

export async function saveColumnMappings(
  communityId: string,
  sourceId: string,
  mappings: { external_column: string; internal_field: string }[]
): Promise<void> {
  // Delete existing mappings for this source
  await (supabase.from('column_mappings') as any)
    .delete()
    .eq('community_id', communityId)
    .eq('source_id', sourceId)

  if (mappings.length > 0) {
    const { error } = await (supabase.from('column_mappings') as any)
      .insert(
        mappings.map((m) => ({
          community_id: communityId,
          source_id: sourceId,
          ...m,
        }))
      )
    if (error) throw error
  }
}

export async function getCategoryMappings(communityId: string, sourceId: string): Promise<CategoryMapping[]> {
  const { data, error } = await supabase
    .from('category_mappings')
    .select('*, categories(name)')
    .eq('community_id', communityId)
    .eq('source_id', sourceId)

  if (error) throw error
  return (data ?? []).map((row: any) => ({
    ...row,
    internal_category_name: row.categories?.name,
    categories: undefined,
  }))
}

export async function saveCategoryMapping(
  communityId: string,
  sourceId: string,
  mapping: { external_name: string; internal_category_id: string; auto_matched: boolean }
): Promise<void> {
  // Upsert based on external_name + source_id
  await (supabase.from('category_mappings') as any)
    .delete()
    .eq('community_id', communityId)
    .eq('source_id', sourceId)
    .eq('external_name', mapping.external_name)

  const { error } = await (supabase.from('category_mappings') as any)
    .insert({
      community_id: communityId,
      source_id: sourceId,
      ...mapping,
    })
  if (error) throw error
}

export async function importTransactions(
  communityId: string,
  transactions: {
    type: string
    amount: number
    category_id?: string | null
    description: string | null
    date: string
    source_id: string
    external_ref?: string | null
    import_job_id?: string | null
  }[],
  importJobId?: string
): Promise<{ imported: number; skipped: number }> {
  let imported = 0
  let skipped = 0

  for (const tx of transactions) {
    // Check for duplicates by external_ref + date + amount
    if (tx.external_ref) {
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('community_id', communityId)
        .eq('external_ref', tx.external_ref)
        .eq('date', tx.date)
        .eq('amount', tx.amount)
        .limit(1)

      if (existing && existing.length > 0) {
        skipped++
        continue
      }
    }

    const { error } = await (supabase.from('transactions') as any)
      .insert({
        community_id: communityId,
        ...tx,
        import_job_id: tx.import_job_id || importJobId || null,
        origin: 'import',
      })

    if (error) {
      skipped++
    } else {
      imported++
    }
  }

  return { imported, skipped }
}

export async function updateDataSourceSync(sourceId: string): Promise<void> {
  await (supabase.from('data_sources') as any)
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', sourceId)
}

export async function rollbackImportJob(jobId: string): Promise<void> {
  // Delete all transactions that were created by this import job
  const { error: txError } = await (supabase.from('transactions') as any)
    .delete()
    .eq('import_job_id', jobId)
  if (txError) throw txError

  // Mark the job as rolled back
  const { error: jobError } = await (supabase.from('import_jobs') as any)
    .update({ status: 'rolled_back' })
    .eq('id', jobId)
  if (jobError) throw jobError
}
