export const APP_NAME = 'Ryve'
export const APP_DESCRIPTION = 'Infrastructure for Network States'

export const DEFAULT_QUORUM = 0.5
export const DEFAULT_MAJORITY = 0.5

export const ITEMS_PER_PAGE = 25

export const INTERNAL_FIELDS = [
  'amount',
  'date',
  'description',
  'category',
  'type',
  'external_ref',
] as const

export type InternalField = (typeof INTERNAL_FIELDS)[number]
