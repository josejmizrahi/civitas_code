import type { ParsedFile } from '../types'

export interface FileAdapter {
  canHandle(file: File): boolean
  parse(file: File): Promise<ParsedFile>
}
