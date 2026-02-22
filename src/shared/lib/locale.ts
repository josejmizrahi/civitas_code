const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/
const LOCALE_CODE_REGEX = /^[a-z]{2,3}(-[A-Z]{2})?$/

export function normalizeCurrencyCode(value: string): string {
  return value.trim().toUpperCase()
}

export function normalizeLocaleCode(value: string): string {
  return value.trim().replace('_', '-')
}

export function isValidCurrencyCode(value: string): boolean {
  const code = normalizeCurrencyCode(value)
  if (!CURRENCY_CODE_REGEX.test(code)) return false
  try {
    new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(1)
    return true
  } catch {
    return false
  }
}

export function isValidLocaleCode(value: string): boolean {
  const locale = normalizeLocaleCode(value)
  if (!LOCALE_CODE_REGEX.test(locale)) return false
  try {
    new Intl.DateTimeFormat(locale).format(new Date())
    return true
  } catch {
    return false
  }
}

export function getFallbackLocale(): string {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language
  }
  return 'es-MX'
}
