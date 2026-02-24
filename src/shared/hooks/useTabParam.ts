import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Manages tab state via URL search params so it persists on back/reload.
 *
 * @param key       The query param name (default: "tab")
 * @param fallback  The default tab value when the param is absent
 * @param validTabs Optional whitelist — invalid values fall back to `fallback`
 */
export function useTabParam<T extends string>(
  fallback: T,
  validTabs?: readonly T[],
  key = 'tab',
): [T, (next: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const raw = searchParams.get(key) as T | null
  const tab: T =
    raw && (!validTabs || (validTabs as readonly string[]).includes(raw))
      ? raw
      : fallback

  const setTab = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev)
          if (next === fallback) {
            p.delete(key)
          } else {
            p.set(key, next)
          }
          return p
        },
        { replace: true },
      )
    },
    [setSearchParams, fallback, key],
  )

  return [tab, setTab]
}
