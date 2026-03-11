import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, type Locale, locales } from './config'

export default getRequestConfig(async () => {
  // In a non-routed i18n setup, we default to 'en'.
  // The client-side useTranslation hook handles locale switching via localStorage.
  // For server components, you can pass locale as a prop or read from cookies.
  const locale: Locale = defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
})
