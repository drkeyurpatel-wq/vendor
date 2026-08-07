import '@testing-library/jest-dom'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocaleProvider } from '@/components/ui/LocaleProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { LOCALE_COOKIE } from '@/i18n/config'

function clearLocaleCookie() {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`
}

beforeEach(() => {
  clearLocaleCookie()
  window.localStorage.clear()
})

/** Two independent consumers, mirroring TopBar (switcher) and Sidebar (labels). */
function Switcher() {
  const { locale, setLocale } = useTranslation()
  return (
    <div>
      <span data-testid="switcher-locale">{locale}</span>
      <button onClick={() => setLocale('hi')}>to-hindi</button>
      <button onClick={() => setLocale('gu')}>to-gujarati</button>
    </div>
  )
}

function NavLabels() {
  const { t } = useTranslation()
  return <span data-testid="nav-vendors">{t('nav.vendors')}</span>
}

function renderApp() {
  return render(
    <LocaleProvider>
      <Switcher />
      <NavLabels />
    </LocaleProvider>
  )
}

describe('LocaleProvider', () => {
  it('defaults to English', () => {
    renderApp()
    expect(screen.getByTestId('switcher-locale')).toHaveTextContent('en')
    expect(screen.getByTestId('nav-vendors')).toHaveTextContent('Vendors')
  })

  it('resolves nested keys via dot notation', () => {
    function Deep() {
      const { t } = useTranslation()
      return <span data-testid="deep">{t('common.save')}</span>
    }
    render(
      <LocaleProvider>
        <Deep />
      </LocaleProvider>
    )
    expect(screen.getByTestId('deep').textContent).toBeTruthy()
    expect(screen.getByTestId('deep')).not.toHaveTextContent('common.save')
  })

  it('falls back to the key itself when a translation is missing', () => {
    function Missing() {
      const { t } = useTranslation()
      return <span data-testid="missing">{t('nope.not.here')}</span>
    }
    render(
      <LocaleProvider>
        <Missing />
      </LocaleProvider>
    )
    expect(screen.getByTestId('missing')).toHaveTextContent('nope.not.here')
  })

  // The bug this provider exists to fix: previously every useTranslation() call
  // owned separate state, so switching locale in one component left every other
  // component rendering the old language.
  it('propagates a locale change to every consumer', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'to-hindi' }))

    await waitFor(() => {
      expect(screen.getByTestId('switcher-locale')).toHaveTextContent('hi')
      expect(screen.getByTestId('nav-vendors')).toHaveTextContent('विक्रेता')
    })
  })

  it('switches to Gujarati across consumers', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'to-gujarati' }))

    await waitFor(() => {
      expect(screen.getByTestId('nav-vendors')).toHaveTextContent('વિક્રેતા')
    })
  })

  it('persists the chosen locale to a cookie so the server can read it', async () => {
    const user = userEvent.setup()
    renderApp()

    await user.click(screen.getByRole('button', { name: 'to-hindi' }))

    await waitFor(() => {
      expect(document.cookie).toContain(`${LOCALE_COOKIE}=hi`)
    })
  })

  it('restores the locale from the cookie on mount', async () => {
    document.cookie = `${LOCALE_COOKIE}=gu; path=/`
    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('switcher-locale')).toHaveTextContent('gu')
    })
  })

  it('ignores an unrecognised cookie value and stays on the default', async () => {
    document.cookie = `${LOCALE_COOKIE}=fr; path=/`
    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('switcher-locale')).toHaveTextContent('en')
    })
  })

  it('migrates a legacy localStorage preference to the cookie', async () => {
    window.localStorage.setItem('h1vpms-locale', 'hi')
    renderApp()

    await waitFor(() => {
      expect(screen.getByTestId('switcher-locale')).toHaveTextContent('hi')
      expect(document.cookie).toContain(`${LOCALE_COOKIE}=hi`)
    })
  })
})
