import { useCommunityContext } from '@/app/providers'
import { MESSAGES, type I18nKey } from '@/shared/i18n/messages'

function getLangFromLocale(locale: string): string {
  return locale.split('-')[0].toLowerCase()
}

export function useI18n() {
  const { community } = useCommunityContext()
  const locale = (
    (community?.rules as { treasury?: { locale?: string } } | undefined)?.treasury?.locale
    ?? navigator.language
    ?? 'es-MX'
  )
  const lang = getLangFromLocale(locale)
  const dict = MESSAGES[lang] ?? MESSAGES.es

  const t = (key: I18nKey): string => dict[key] ?? MESSAGES.es[key] ?? key

  return { t, locale, lang }
}
