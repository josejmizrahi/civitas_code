import { describe, it, expect } from 'vitest'
import {
  ENTITY_TYPE_LABELS,
  ENTITY_STATUS_LABELS,
  RATING_DIMENSION_LABELS,
} from '../types'
import type { EntityType, EntityStatus } from '@/shared/types'

describe('ENTITY_TYPE_LABELS', () => {
  const types: EntityType[] = ['proveedor', 'socio_comercial', 'contratista', 'arrendador', 'gobierno', 'institucion', 'otro']

  it('has a label for every entity type', () => {
    for (const type of types) {
      expect(ENTITY_TYPE_LABELS[type]).toBeDefined()
      expect(typeof ENTITY_TYPE_LABELS[type]).toBe('string')
      expect(ENTITY_TYPE_LABELS[type].length).toBeGreaterThan(0)
    }
  })

  it('has correct Spanish labels', () => {
    expect(ENTITY_TYPE_LABELS.proveedor).toBe('Proveedor')
    expect(ENTITY_TYPE_LABELS.contratista).toBe('Contratista')
    expect(ENTITY_TYPE_LABELS.gobierno).toBe('Gobierno')
  })
})

describe('ENTITY_STATUS_LABELS', () => {
  const statuses: EntityStatus[] = ['active', 'inactive', 'blacklisted']

  it('has a label for every status', () => {
    for (const status of statuses) {
      expect(ENTITY_STATUS_LABELS[status]).toBeDefined()
    }
  })

  it('has correct Spanish labels', () => {
    expect(ENTITY_STATUS_LABELS.active).toBe('Activo')
    expect(ENTITY_STATUS_LABELS.inactive).toBe('Inactivo')
    expect(ENTITY_STATUS_LABELS.blacklisted).toBe('Lista Negra')
  })
})

describe('RATING_DIMENSION_LABELS', () => {
  const dimensions = ['punctuality', 'quality', 'communication', 'compliance', 'value']

  it('has a label for every dimension', () => {
    for (const dim of dimensions) {
      expect(RATING_DIMENSION_LABELS[dim]).toBeDefined()
      expect(typeof RATING_DIMENSION_LABELS[dim]).toBe('string')
    }
  })

  it('has 5 dimensions', () => {
    expect(Object.keys(RATING_DIMENSION_LABELS)).toHaveLength(5)
  })
})
