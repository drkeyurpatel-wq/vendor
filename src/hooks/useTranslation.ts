'use client'

import { useCallback, useContext } from 'react'
import { type Locale, defaultLocale } from '@/i18n/config'
import { LocaleContext } from '@/components/ui/LocaleProvider'

import en from '@/messages/en.json'
import hi from '@/messages/hi.json'
import gu from '@/messages/gu.json'

const messages: Record<Locale, Record<string, unknown>> = { en, hi, gu }

/**
 * Get a nested value from an object using dot notation.
 * e.g., getNestedValue({ common: { save: "Save" } }, "common.save") => "Save"
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return path // Return the key itself as fallback
    }
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === 'string' ? current : path
}

/**
 * Client-side translation hook for VPMS.
 *
 * Locale state lives in LocaleProvider, so a change made anywhere updates every
 * consumer at once. Outside a provider the hook degrades to the default locale
 * rather than throwing, which keeps isolated components and tests renderable.
 *
 *   const { t, locale, setLocale } = useTranslation()
 *   t('common.save')    // => "Save" (en) | "सहेजें" (hi) | "સાચવો" (gu)
 *   setLocale('hi')     // switches the whole app to Hindi
 */
export function useTranslation() {
  const ctx = useContext(LocaleContext)
  const locale = ctx?.locale ?? defaultLocale

  const t = useCallback(
    (key: string): string => getNestedValue(messages[locale], key),
    [locale]
  )

  const setLocale = useCallback(
    (next: Locale) => {
      ctx?.setLocale(next)
    },
    [ctx]
  )

  return { t, locale, setLocale, isLoaded: ctx?.isLoaded ?? false }
}
