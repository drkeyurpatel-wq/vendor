export const locales = ['en', 'hi', 'gu'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

/**
 * Locale preference is stored in a cookie rather than localStorage so that
 * server components can read it too — localStorage is invisible to the server,
 * which would leave server-rendered page bodies in English while the
 * client-rendered navigation switched language.
 */
export const LOCALE_COOKIE = 'h1vpms-locale'

/** Legacy localStorage key, migrated to the cookie on first load. */
export const LEGACY_LOCALE_STORAGE_KEY = 'h1vpms-locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  gu: 'ગુજરાતી'
}
