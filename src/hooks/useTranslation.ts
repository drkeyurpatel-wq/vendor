'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Locale, defaultLocale, locales } from '@/i18n/config'

import en from '@/messages/en.json'
import hi from '@/messages/hi.json'
import gu from '@/messages/gu.json'

const messages: Record<Locale, Record<string, unknown>> = { en, hi, gu }

const STORAGE_KEY = 'h1vpms-locale'

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
 * Usage:
 *   const { t, locale, setLocale } = useTranslation()
 *   t('common.save')    // => "Save" (en) | "सहेजें" (hi) | "સાચવો" (gu)
 *   t('po.title')       // => "Purchase Orders"
 *   setLocale('hi')     // switches to Hindi
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [isLoaded, setIsLoaded] = useState(false)

  // Read saved locale from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && locales.includes(saved as Locale)) {
        setLocaleState(saved as Locale)
      }
    } catch {
      // localStorage unavailable (SSR or privacy mode)
    }
    setIsLoaded(true)
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(STORAGE_KEY, newLocale)
    } catch {
      // localStorage unavailable
    }
    // Dispatch a custom event so other components (e.g., LanguageSwitcher) can react
    window.dispatchEvent(new CustomEvent('locale-change', { detail: newLocale }))
  }, [])

  const t = useCallback(
    (key: string): string => {
      return getNestedValue(messages[locale], key)
    },
    [locale]
  )

  return { t, locale, setLocale, isLoaded }
}
