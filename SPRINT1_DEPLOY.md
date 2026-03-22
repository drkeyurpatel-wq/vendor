# H1 VPMS — Sprint 1 Deployment Guide

## What's in this drop (17 files)

### New dependencies to install first
```bash
npm install @tanstack/react-table recharts cmdk framer-motion nuqs
```

### File placement map

Replace/add these files in your `vendor` repo folder exactly as listed:

| # | File | Action | What it does |
|---|------|--------|-------------|
| 1 | `tailwind.config.ts` | REPLACE | Full 10-shade Navy/Teal scales, Inter + JetBrains Mono fonts, shadow system, animation keyframes |
| 2 | `src/app/layout.tsx` | REPLACE | Loads Inter (UI) + JetBrains Mono (codes/numbers) via next/font/google |
| 3 | `src/app/(dashboard)/loading.tsx` | REPLACE | Skeleton loading with shimmer animation for dashboard |
| 4 | `src/components/ui/DataTable.tsx` | NEW | TanStack Table — sort, search, paginate, export CSV, column toggle, skeleton loading |
| 5 | `src/components/ui/Skeleton.tsx` | NEW | Shimmer skeleton components — stat cards, tables, charts, full pages |
| 6 | `src/components/ui/EmptyState.tsx` | NEW | Illustrated empty states for each entity type |
| 7 | `src/components/ui/CommandPalette.tsx` | NEW | Cmd+K global search — vendors, items, POs, GRNs, pages |
| 8 | `src/components/layout/Sidebar.tsx` | REPLACE | Collapsible sidebar (icon-only mode), auto-expand active group |
| 9 | `src/components/layout/TopBar.tsx` | REPLACE | Cmd+K search bar trigger, cleaner layout |
| 10 | `src/components/layout/DashboardShell.tsx` | REPLACE | Wires CommandPalette + sidebar collapse with localStorage persist |
| 11 | `src/components/dashboard/DashboardCharts.tsx` | NEW (create folder) | Recharts components — spend by centre, PO pipeline, aging, stat cards with trends |
| 12 | `src/app/(dashboard)/vendors/page.tsx` | REPLACE | Server component feeding DataTable |
| 13 | `src/app/(dashboard)/vendors/VendorListClient.tsx` | NEW | Vendor DataTable with all columns, sort, search, export, row click |
| 14 | `src/app/(dashboard)/vendors/loading.tsx` | REPLACE | Skeleton loading for vendor list |
| 15 | `src/app/(dashboard)/items/page.tsx` | REPLACE | Server component for items using DataTable |
| 16 | `src/app/(dashboard)/items/ItemListClient.tsx` | REPLACE | Item DataTable with flags (cold chain, narcotic, high alert), sort, export |
| 17 | `src/app/(dashboard)/items/loading.tsx` | REPLACE | Skeleton loading for item list |

### Step-by-step deployment

1. **Install new packages:**
   ```
   npm install @tanstack/react-table recharts cmdk framer-motion nuqs
   ```

2. **Create the new folder:**
   ```
   src/components/dashboard/   (if it doesn't exist)
   ```

3. **Copy all 17 files** into your repo at the exact paths listed above

4. **Commit via GitHub Desktop** — you'll see 7 new files (green) and 10 modified files (yellow)

5. **Push** — Vercel auto-deploys

### What you'll see immediately

- **Sidebar**: Click the "Collapse" button at the bottom — sidebar shrinks to icon-only mode. Persists across page loads.
- **Cmd+K**: Press ⌘K (Mac) or Ctrl+K (Windows) anywhere. Type vendor name, item code, PO number — instant fuzzy search across all entities.
- **Vendor table**: Sortable columns (click any header), global search, CSV export button, column toggle, pagination with page numbers.
- **Item table**: Same — handles 5000+ SKUs with client-side pagination at 50/page, sort, search, export.
- **Loading states**: Every page now shows shimmer skeletons while data loads (no blank white screen).
- **Fonts**: Inter for all UI text, JetBrains Mono for vendor codes, item codes, PO numbers.

### DashboardCharts usage

The `DashboardCharts.tsx` file exports reusable chart components. To wire them into your existing dashboard, import and use them:

```tsx
import { SpendByCentreChart, POPipelineChart, CreditAgingChart, StatCard } from '@/components/dashboard/DashboardCharts'

// In your dashboard:
<SpendByCentreChart data={[
  { centre: 'Shilaj', amount: 4500000 },
  { centre: 'Vastral', amount: 1200000 },
  // ...
]} />

<POPipelineChart data={[
  { status: 'pending_approval', count: 12, label: 'Pending Approval' },
  { status: 'approved', count: 8, label: 'Approved' },
  // ...
]} />
```

The existing dashboard page.tsx (1556 lines) was NOT replaced — it has role-based logic that works. The chart components are additive; you can integrate them into the existing dashboard in your next session.

### Known: no breaking changes

- All existing pages continue to work unchanged
- The new vendors/items pages are drop-in replacements with identical Supabase queries
- GlobalSearch component in TopBar is already in the codebase — the new TopBar just triggers CommandPalette instead
- Sidebar nav items are identical to existing — just adds collapse functionality
