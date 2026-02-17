import * as XLSX from 'xlsx'
import type { FileAdapter } from './base.adapter'
import type { ParsedFile, ParsedRow } from '../types'

export const excelAdapter: FileAdapter = {
  canHandle(file: File): boolean {
    return (
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'application/vnd.ms-excel'
    )
  },

  async parse(file: File): Promise<ParsedFile> {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })

    if (jsonData.length === 0) {
      return { headers: [], rows: [], fileName: file.name }
    }

    const headers = Object.keys(jsonData[0])
    const rows: ParsedRow[] = jsonData.map((row) => {
      const parsed: ParsedRow = {}
      headers.forEach((h) => {
        const val = row[h]
        parsed[h] = val === null || val === undefined ? null : String(val)
      })
      return parsed
    })

    return { headers, rows, fileName: file.name }
  },
}
