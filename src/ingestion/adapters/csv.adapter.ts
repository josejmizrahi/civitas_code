import type { FileAdapter } from './base.adapter'
import type { ParsedFile, ParsedRow } from '../types'

export const csvAdapter: FileAdapter = {
  canHandle(file: File): boolean {
    return file.name.endsWith('.csv') || file.type === 'text/csv'
  },

  async parse(file: File): Promise<ParsedFile> {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '')
    if (lines.length === 0) {
      return { headers: [], rows: [], fileName: file.name }
    }

    const headers = parseCsvLine(lines[0])
    const rows: ParsedRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i])
      const row: ParsedRow = {}
      headers.forEach((header, idx) => {
        row[header] = values[idx] ?? null
      })
      rows.push(row)
    }

    return { headers, rows, fileName: file.name }
  },
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }
  result.push(current.trim())
  return result
}
