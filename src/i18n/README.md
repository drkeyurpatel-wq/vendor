# i18n — Internationalization for VPMS

The VPMS app supports three languages: **English**, **Hindi** (हिन्दी), and **Gujarati** (ગુજરાતી).

## Architecture

This is a **client-side i18n** system. Translation files live in `src/messages/` and are imported statically. Locale preference is stored in `localStorage` under the key `h1vpms-locale`.

### Key Files

| File | Purpose |
|------|---------|
| `src/messages/en.json` | English translations |
| `src/messages/hi.json` | Hindi translations |
| `src/messages/gu.json` | Gujarati translations |
| `src/i18n/config.ts` | Locale list, default locale, display names |
| `src/i18n/request.ts` | next-intl server config (for future SSR usage) |
| `src/hooks/useTranslation.ts` | Client-side `useTranslation()` hook |
| `src/components/ui/LanguageSwitcher.tsx` | Language dropdown component |

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

## Adding the Language Switcher to TopBar

In `src/components/layout/TopBar.tsx`, add the LanguageSwitcher next to the notification bell:

```tsx
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

// Inside the TopBar JSX, in the right-side actions div:
<div className="flex items-center gap-3 ml-auto">
  <span className="text-sm text-gray-500 hidden md:block">{formatDate(new Date())}</span>
  <LanguageSwitcher />                          {/* <-- ADD THIS */}
  <RealtimeNotificationBell userId={user.id} />
  {/* ... user avatar ... */}
</div>
```

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

For server components, translations are not yet automatically wired. Options:

1. **Pass translations as props** from a client wrapper
2. **Use `next-intl`'s server APIs** — the `src/i18n/request.ts` file is configured for this. To enable, add `NextIntlClientProvider` to your layout and configure `next.config.mjs` per the [next-intl docs](https://next-intl-docs.vercel.app/).

For now, the recommended approach is to convert pages that need translation to client components (`'use client'`) and use the `useTranslation()` hook.
