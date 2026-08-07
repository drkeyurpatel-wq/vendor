'use client'

import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  LEGACY_LOCALE_STORAGE_KEY,
  LOCALE_COOKIE,
  defaultLocale,
  isLocale,
  type Locale,
} from '@/i18n/config'

export interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  isLoaded: boolean
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

function readLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${LOCALE_COOKIE}=`))
  const value = match?.split('=')[1]
  return isLocale(value) ? value : null
}

function writeLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined') return
  // One year, root path so every route sees it. Not HttpOnly by design — the
  // client needs to read it, and a UI language preference is not a secret.
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
}

function readLegacyLocale(): Locale | null {
  try {
    const saved = window.localStorage.getItem(LEGACY_LOCALE_STORAGE_KEY)
    return isLocale(saved) ? saved : null
  } catch {
    return null
  }
}

/**
 * Single source of truth for the active UI locale.
 *
 * Every useTranslation() consumer reads from this one context, so changing the
 * language in the TopBar switcher re-renders the sidebar, bottom nav and page
 * chrome together. The previous hook-local state meant each consumer kept its
 * own locale and only the switcher itself ever changed.
 */
export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const fromCookie = readLocaleCookie()
    if (fromCookie) {
      setLocaleState(fromCookie)
    } else {
      // Users who set a language before the cookie migration keep their choice.
      const legacy = readLegacyLocale()
      if (legacy) {
        setLocaleState(legacy)
        writeLocaleCookie(legacy)
      }
    }
    setIsLoaded(true)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeLocaleCookie(next)
  }, [])

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, isLoaded }),
    [locale, setLocale, isLoaded]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}
