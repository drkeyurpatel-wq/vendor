# i18n — Internationalization for VPMS

The VPMS app supports three languages: **English**, **Hindi** (हिन्दी), and **Gujarati** (ગુજરાતી).

## Architecture

Translation files live in `src/messages/` and are imported statically. Locale preference is stored in a **cookie** (`h1vpms-locale`) rather than `localStorage`, so both client *and* server components can read it — a `localStorage` value is invisible to the server, which would leave server-rendered page bodies in English while the client-rendered navigation switched language. A pre-existing `localStorage` preference is migrated to the cookie automatically on first load.

Locale state lives in a single `LocaleProvider` context mounted in `DashboardShell`. Every `useTranslation()` consumer reads from it, so changing the language anywhere re-renders the whole app at once.

### Key Files

| File | Purpose |
|------|---------|
| `src/messages/en.json` | English translations |
| `src/messages/hi.json` | Hindi translations |
| `src/messages/gu.json` | Gujarati translations |
| `src/i18n/config.ts` | Locale list, default locale, display names |
| `src/i18n/request.ts` | next-intl server config (for future SSR usage) |
| `src/i18n/server.ts` | `getLocale()` / `getTranslations()` for server components |
| `src/components/ui/LocaleProvider.tsx` | Shared locale context (mounted in `DashboardShell`) |
| `src/hooks/useTranslation.ts` | Client-side `useTranslation()` hook |
| `src/components/ui/LanguageSwitcher.tsx` | Language dropdown (mounted in `TopBar`) |

---

## Usage in Client Components

### Step 1: Import the hook

```tsx
'use client'
import { useTranslation } from '@/hooks/useTranslation'
```

### Step 2: Use it in your component

```tsx
export default function VendorListPage() {
  const { t } = useTranslation()

  return (
    <div>
      <h1 className="page-title">{t('vendors.title')}</h1>
      <button className="btn-primary">{t('vendors.addVendor')}</button>

      <table className="data-table">
        <thead>
          <tr>
            <th>{t('vendors.vendorName')}</th>
            <th>{t('vendors.category')}</th>
            <th>{t('common.status')}</th>
            <th>{t('common.actions')}</th>
          </tr>
        </thead>
      </table>
    </div>
  )
}
```

### Before / After Example

**Before (hardcoded English):**
```tsx
<h1>Purchase Orders</h1>
<button>Create Purchase Order</button>
<span>Pending Approval</span>
<p>No data found</p>
```

**After (translated):**
```tsx
const { t } = useTranslation()

<h1>{t('po.title')}</h1>
<button>{t('po.createPO')}</button>
<span>{t('po.pendingApproval')}</span>
<p>{t('common.noData')}</p>
```

---

## Language Switcher

Already mounted in `src/components/layout/TopBar.tsx`, to the left of the
notification bell. No further wiring is needed.

## Navigation labels

`Sidebar` nav entries carry an optional `labelKey` alongside `label`:

```tsx
{ label: 'Vendors', labelKey: 'nav.vendors', icon: <Users size={18} /> }
```

The sidebar resolves `labelKey` and **falls back to the English `label`** when
the key has no translation, so a partially translated menu stays readable
instead of showing raw key paths. To translate a menu entry that is still
English, add its key to all three JSON files and set `labelKey` on the entry.

---

## Available Translation Keys

All keys use dot notation. The top-level sections are:

- `common.*` — Generic UI strings (save, cancel, search, filter, etc.)
- `nav.*` — Navigation labels (dashboard, vendors, items, etc.)
- `dashboard.*` — Dashboard-specific strings
- `vendors.*` — Vendor module strings
- `items.*` — Item/SKU module strings
- `po.*` — Purchase Order module strings
- `grn.*` — GRN module strings
- `finance.*` — Finance/invoice/payment strings
- `reports.*` — Reports module strings
- `settings.*` — Settings module strings
- `errors.*` — Error messages and validation

---

## Adding New Translation Keys

1. Add the key to **all three** JSON files (`en.json`, `hi.json`, `gu.json`)
2. Use the same nested path in all files
3. Use `t('section.key')` in your component

Example — adding a new key:

```json
// en.json
{ "vendors": { "exportCSV": "Export to CSV" } }

// hi.json
{ "vendors": { "exportCSV": "CSV में निर्यात करें" } }

// gu.json
{ "vendors": { "exportCSV": "CSV માં નિકાસ કરો" } }
```

Then use: `t('vendors.exportCSV')`

---

## Listening for Locale Changes

The hook dispatches a `locale-change` CustomEvent on `window` when the locale changes. Other components can listen:

```tsx
useEffect(() => {
  const handler = (e: CustomEvent) => console.log('Locale changed to:', e.detail)
  window.addEventListener('locale-change', handler as EventListener)
  return () => window.removeEventListener('locale-change', handler as EventListener)
}, [])
```

---

## Server Components

Server components read the same cookie via `src/i18n/server.ts`:

```tsx
import { getTranslations } from '@/i18n/server'

export default async function VendorsPage() {
  const t = await getTranslations()
  return <h1 className="page-title">{t('vendors.title')}</h1>
}
```

`getLocale()` is also exported when you only need the active locale. The
dashboard layout already calls it and passes the result to `LocaleProvider` as
`initialLocale`, so the first paint is in the user's language with no flash of
English.

## Current coverage

Wired: the language switcher, top bar, sidebar navigation groups, and the nav
children that have verified translations. Page bodies are still English —
extend coverage by adding keys to all three JSON files and calling `t()` (client)
or `await getTranslations()` (server). Because `t()` returns the key path when a
translation is missing, always add a key to **all three** files at once.
