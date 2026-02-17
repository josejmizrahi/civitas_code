import type { Category } from '@/core/treasury/types'
import type { CategoryMapping } from '../types'

export function matchCategory(
  externalName: string,
  categories: Category[],
  existingMappings: CategoryMapping[]
): { categoryId: string | null; autoMatched: boolean } {
  // Check existing manual mappings first
  const existing = existingMappings.find(
    (m) => m.external_name.toLowerCase() === externalName.toLowerCase()
  )
  if (existing) {
    return { categoryId: existing.internal_category_id, autoMatched: false }
  }

  // Fuzzy match against internal category names
  const normalizedExternal = normalize(externalName)
  for (const cat of categories) {
    const normalizedInternal = normalize(cat.name)
    if (normalizedExternal === normalizedInternal) {
      return { categoryId: cat.id, autoMatched: true }
    }
    if (normalizedExternal.includes(normalizedInternal) || normalizedInternal.includes(normalizedExternal)) {
      return { categoryId: cat.id, autoMatched: true }
    }
  }

  return { categoryId: null, autoMatched: false }
}

export function buildCategoryMap(
  externalNames: string[],
  categories: Category[],
  existingMappings: CategoryMapping[]
): Map<string, { categoryId: string | null; autoMatched: boolean }> {
  const map = new Map<string, { categoryId: string | null; autoMatched: boolean }>()
  const unique = [...new Set(externalNames.filter(Boolean))]
  for (const name of unique) {
    map.set(name, matchCategory(name, categories, existingMappings))
  }
  return map
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}
