/**
 * Export service — PDF and Excel export for dashboards and reports.
 * Uses browser print for PDF (no heavy dependencies).
 * Uses existing xlsx dependency for Excel export.
 */

import { downloadAsExcel } from '@/shared/lib/utils'

export interface ExportOptions {
  filename: string
  title?: string
  subtitle?: string
}

/**
 * Export an HTML element as PDF using browser print dialog.
 * This avoids the need for html2canvas + jspdf dependencies.
 */
export function exportToPDF(elementId: string, options: ExportOptions): void {
  const element = document.getElementById(elementId)
  if (!element) {
    console.warn(`Export target element #${elementId} not found`)
    return
  }

  const win = window.open('', '_blank')
  if (!win) {
    console.warn('Could not open print window — popup may be blocked')
    return
  }

  // Clone styles from the current page
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n')

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${options.filename}</title>
      ${styles}
      <style>
        @media print {
          body { padding: 20px; }
          .no-print { display: none !important; }
        }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 32px;
          max-width: 1100px;
          margin: 0 auto;
          color: #333;
        }
        .export-header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #1e40af;
        }
        .export-header h1 { font-size: 22px; margin: 0; color: #1e40af; }
        .export-header p { font-size: 14px; color: #666; margin: 4px 0 0; }
        .export-footer {
          margin-top: 32px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="export-header">
        ${options.title ? `<h1>${options.title}</h1>` : ''}
        ${options.subtitle ? `<p>${options.subtitle}</p>` : ''}
        <p>Generado: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      ${element.innerHTML}
      <div class="export-footer">
        Exportado desde CIVITAS — ${new Date().toISOString()}
      </div>
    </body>
    </html>
  `)
  win.document.close()

  // Small delay to let styles load
  setTimeout(() => win.print(), 500)
}

/**
 * Export structured data to Excel.
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  options: ExportOptions & { sheetName?: string }
): Promise<void> {
  await downloadAsExcel(data, options.filename, options.sheetName || 'Datos')
}
