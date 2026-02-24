import { useState, useMemo } from 'react'

interface UsePaginationOptions {
  pageSize?: number
}

export function usePagination<T>(items: T[] | undefined, { pageSize = 20 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(1)

  const totalItems = items?.length ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  // Reset to page 1 when items change drastically (e.g. filter applied)
  const safePage = Math.min(page, totalPages)

  const paginatedItems = useMemo(() => {
    if (!items) return []
    const start = (safePage - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, safePage, pageSize])

  return {
    page: safePage,
    totalPages,
    totalItems,
    pageSize,
    paginatedItems,
    setPage,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
  }
}
