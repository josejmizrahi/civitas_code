import type { FileAdapter } from './base.adapter'
import type { ParsedFile, ParsedRow } from '../types'

const MAX_EXCEL_ROWS = 50_000
const MAX_EXCEL_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

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
    if (file.size > MAX_EXCEL_SIZE_BYTES) {
      throw new Error(`Archivo demasiado grande (máx. ${MAX_EXCEL_SIZE_BYTES / 1024 / 1024} MB)`)
    }
    const buffer = await file.arrayBuffer()
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as ArrayBuffer)
    const sheet = workbook.worksheets[0]
    if (!sheet) {
      return { headers: [], rows: [], fileName: file.name }
    }
    const rowCount = Math.min(sheet.actualRowCount ?? sheet.rowCount ?? 0, MAX_EXCEL_ROWS)
    if (rowCount === 0) {
      return { headers: [], rows: [], fileName: file.name }
    }
    const firstRow = sheet.getRow(1)
    const headers: string[] = []
    firstRow.eachCell((cell, colNumber) => {
      const val = cell.value
      headers[colNumber - 1] = val == null ? '' : String(val)
    })
    const rows: ParsedRow[] = []
    for (let r = 2; r <= rowCount; r++) {
      const row = sheet.getRow(r)
      const parsed: ParsedRow = {}
      headers.forEach((h, i) => {
        const cell = row.getCell(i + 1)
        const val = cell.value
        parsed[h] = val === null || val === undefined ? null : String(val)
      })
      rows.push(parsed)
    }
    return { headers, rows, fileName: file.name }
  },
}
