import { describe, it, expect } from 'vitest'
import { csvAdapter } from '../csv.adapter'

function createMockFile(content: string, name = 'test.csv'): File {
  const blob = new Blob([content], { type: 'text/csv' })
  const file = Object.create(blob, {
    name: { value: name },
    type: { value: 'text/csv' },
    text: { value: () => Promise.resolve(content) },
  })
  return file as File
}

describe('csvAdapter', () => {
  describe('canHandle', () => {
    it('handles .csv files', () => {
      expect(csvAdapter.canHandle(createMockFile('', 'data.csv'))).toBe(true)
    })

    it('rejects non-csv files', () => {
      const file = Object.create(new Blob(['']), {
        name: { value: 'data.xlsx' },
        type: { value: 'application/vnd.openxmlformats' },
      })
      expect(csvAdapter.canHandle(file as File)).toBe(false)
    })
  })

  describe('parse', () => {
    it('parses simple CSV', async () => {
      const csv = 'name,amount,date\nAlice,100,2025-01-01\nBob,200,2025-01-02'
      const result = await csvAdapter.parse(createMockFile(csv))
      expect(result.headers).toEqual(['name', 'amount', 'date'])
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0]).toEqual({ name: 'Alice', amount: '100', date: '2025-01-01' })
      expect(result.rows[1]).toEqual({ name: 'Bob', amount: '200', date: '2025-01-02' })
    })

    it('handles empty file', async () => {
      const result = await csvAdapter.parse(createMockFile(''))
      expect(result.headers).toEqual([])
      expect(result.rows).toEqual([])
    })

    it('handles headers only', async () => {
      const result = await csvAdapter.parse(createMockFile('col1,col2,col3'))
      expect(result.headers).toEqual(['col1', 'col2', 'col3'])
      expect(result.rows).toEqual([])
    })

    it('handles quoted fields with commas', async () => {
      const csv = 'desc,amount\n"Pago de luz, agua",500'
      const result = await csvAdapter.parse(createMockFile(csv))
      expect(result.rows[0].desc).toBe('Pago de luz, agua')
      expect(result.rows[0].amount).toBe('500')
    })

    it('handles escaped quotes', async () => {
      const csv = 'desc,amount\n"Said ""hello""",100'
      const result = await csvAdapter.parse(createMockFile(csv))
      expect(result.rows[0].desc).toBe('Said "hello"')
    })

    it('handles Windows line endings', async () => {
      const csv = 'a,b\r\n1,2\r\n3,4'
      const result = await csvAdapter.parse(createMockFile(csv))
      expect(result.rows).toHaveLength(2)
    })

    it('skips empty lines', async () => {
      const csv = 'a,b\n1,2\n\n3,4\n\n'
      const result = await csvAdapter.parse(createMockFile(csv))
      expect(result.rows).toHaveLength(2)
    })

    it('preserves file name', async () => {
      const result = await csvAdapter.parse(createMockFile('a\n1', 'my-data.csv'))
      expect(result.fileName).toBe('my-data.csv')
    })

    it('handles missing values', async () => {
      const csv = 'a,b,c\n1,,3'
      const result = await csvAdapter.parse(createMockFile(csv))
      expect(result.rows[0]).toEqual({ a: '1', b: '', c: '3' })
    })
  })
})
