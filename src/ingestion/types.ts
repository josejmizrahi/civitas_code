import type { ImportJobStatus, DataSourceType } from '@/shared/types'

export interface DataSource {
  id: string
  community_id: string
  name: string
  type: DataSourceType
  config: Record<string, unknown>
  last_sync_at: string | null
  status: string
  created_by: string
  created_at: string
}

export interface ImportJob {
  id: string
  community_id: string
  source_id: string
  status: ImportJobStatus
  file_url: string | null
  rows_total: number
  rows_imported: number
  rows_skipped: number
  error_log: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  // Joined
  source_name?: string
}

export interface CategoryMapping {
  id: string
  community_id: string
  source_id: string
  external_name: string
  internal_category_id: string
  auto_matched: boolean
  // Joined
  internal_category_name?: string
}

export interface ColumnMapping {
  id: string
  community_id: string
  source_id: string
  external_column: string
  internal_field: string
  transform: Record<string, unknown> | null
}

export interface ParsedRow {
  [key: string]: string | number | null
}

export interface ParsedFile {
  headers: string[]
  rows: ParsedRow[]
  fileName: string
}

export interface NormalizedTransaction {
  amount: number | null
  date: string | null
  description: string | null
  category: string | null
  type: string | null
  external_ref: string | null
  _raw: ParsedRow
  _errors: string[]
  _isDuplicate?: boolean
}
