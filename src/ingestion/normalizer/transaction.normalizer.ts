import type { ParsedRow, NormalizedTransaction, ColumnMapping } from '../types'

export function normalizeTransaction(
  row: ParsedRow,
  columnMappings: Record<string, string>
): NormalizedTransaction {
  const errors: string[] = []

  const rawAmount = getField(row, columnMappings, 'amount')
  const amount = rawAmount !== null ? parseFloat(String(rawAmount)) : null
  if (amount === null || isNaN(amount)) {
    errors.push('Monto inválido o faltante')
  }

  const rawDate = getField(row, columnMappings, 'date')
  const date = rawDate ? normalizeDate(String(rawDate)) : null
  if (!date) {
    errors.push('Fecha inválida o faltante')
  }

  const description = getField(row, columnMappings, 'description')
  const category = getField(row, columnMappings, 'category')
  const type = getField(row, columnMappings, 'type')
  const externalRef = getField(row, columnMappings, 'external_ref')

  return {
    amount: amount && !isNaN(amount) ? Math.abs(amount) : null,
    date,
    description: description ? String(description) : null,
    category: category ? String(category) : null,
    type: type ? inferType(String(type)) : (amount && amount < 0 ? 'expense' : 'income'),
    external_ref: externalRef ? String(externalRef) : null,
    _raw: row,
    _errors: errors,
  }
}

export function normalizeTransactions(
  rows: ParsedRow[],
  columnMappings: Record<string, string>
): NormalizedTransaction[] {
  return rows.map((row) => normalizeTransaction(row, columnMappings))
}

function getField(row: ParsedRow, mappings: Record<string, string>, field: string): string | number | null {
  const externalColumn = mappings[field]
  if (!externalColumn) return null
  return row[externalColumn] ?? null
}

function normalizeDate(raw: string): string | null {
  // Try ISO format first
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`

  // Try DD/MM/YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`

  // Try MM/DD/YYYY
  const mdyMatch = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/)
  if (mdyMatch) return `${mdyMatch[3]}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`

  // Try Excel serial number
  const num = Number(raw)
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const date = new Date((num - 25569) * 86400000)
    return date.toISOString().split('T')[0]
  }

  return null
}

function inferType(raw: string): string {
  const lower = raw.toLowerCase().trim()
  if (['ingreso', 'income', 'abono', 'depósito', 'deposito', 'credit'].includes(lower)) return 'income'
  if (['egreso', 'expense', 'cargo', 'retiro', 'debit', 'gasto'].includes(lower)) return 'expense'
  return 'expense'
}
