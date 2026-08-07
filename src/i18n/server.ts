import { cookies } from 'next/headers'
import { LOCALE_COOKIE, defaultLocale, isLocale, type Locale } from './config'

import en from '@/messages/en.json'
import hi from '@/messages/hi.json'
import gu from '@/messages/gu.json'

const messages: Record<Locale, Record<string, unknown>> = { en, hi, gu }

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path
    }
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : path
}

/**
 * Read the user's locale in a server component.
 *
 * Pairs with LocaleProvider on the client, which writes the same cookie. Server
 * components can therefore render in the chosen language on the first paint,
 * with no flash of English.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : defaultLocale
}

/**
 * Server-side translator.
 *
 *   const t = await getTranslations()
 *   <h1>{t('vendors.title')}</h1>
 */
export async function getTranslations(): Promise<(key: string) => string> {
  const locale = await getLocale()
  return (key: string) => getNestedValue(messages[locale], key)
}
