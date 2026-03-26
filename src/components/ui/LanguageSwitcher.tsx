'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from '@/hooks/useTranslation'
import { locales, localeNames, type Locale } from '@/i18n/config'

const localeFlags: Record<Locale, string> = {
  en: 'EN',
  hi: 'हि',
  gu: 'ગુ'
}

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm border border-gray-200 hover:border-teal-500 hover:bg-teal-50 transition-colors"
        title="Change language"
      >
        <Globe size={15} className="text-teal-500" />
        <span className="text-gray-700 font-medium text-xs">
          {localeFlags[locale]}
        </span>
        <ChevronDown size={13} className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => {
                setLocale(loc)
                setOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-navy-50 transition-colors ${
                locale === loc ? 'bg-navy-50 text-navy-600 font-semibold' : 'text-gray-700'
              }`}
            >
              <span className="w-6 text-center font-medium text-xs text-teal-500">
                {localeFlags[loc]}
              </span>
              <span className="flex-1 text-left">{localeNames[loc]}</span>
              {locale === loc && <Check size={14} className="text-teal-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
