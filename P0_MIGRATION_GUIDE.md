# VPMS P0 Refactor: Auth Dedup + Dashboard Split

## Status: IN PROGRESS

## What Was Done

### 1. `src/lib/auth.ts` — NEW (shared auth utility)
Eliminates the 12-line auth + profile block duplicated across 54 pages.

**Before** (repeated in every server page):
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*, centre:centres(*)')
  .eq('id', user.id)
  .single()
```

**After** (one line):
```ts
const { supabase, user, profile, role, isGroupLevel, centreId } = await requireAuth()
```

Returns typed `AuthSession` — no more `profile?.role || 'store_staff'` fallbacks.
Also provides `requireRole(['group_admin'])` for restricted pages.

### 2. Dashboard split (1,554 lines → 7 files)

| File | Lines | Description |
|------|-------|-------------|
| `page.tsx` (new) | 36 | Thin router using requireAuth() + DASHBOARD_MAP |
| `DashboardHelpers.tsx` | 171 | StatCard, QuickAction, SectionHeader, PORow, etc. |
| `GroupAdminDashboard.tsx` | 241 | Full group visibility |
| `GroupCAODashboard.tsx` | 208 | Group finance view |
| `UnitCAODashboard.tsx` | 204 | Unit finance view |
| `PurchaseManagerDashboard.tsx` | 242 | PO/indent focus |
| `StoreStaffDashboard.tsx` | 268 | GRN/stock focus |
| `FinanceStaffDashboard.tsx` | 226 | Invoice/payment focus |

### 3. Missing loading.tsx skeletons — 6 created
- `finance/invoices/loading.tsx`
- `finance/payments/loading.tsx`
- `inventory/loading.tsx`
- `settings/loading.tsx`
- `vendor-portal/loading.tsx`
- `consignment/loading.tsx`

### 4. Example refactored pages (3 done)
- `vendors/page.tsx.new`
- `purchase-orders/page.tsx.new`
- `finance/invoices/page.tsx.new`

---

## Migration Guide: Remaining 51 Pages

### Pattern A: Server pages with explicit auth block (31 pages)

**Find** this block:
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
const { data: profile } = await supabase
  .from('user_profiles')
  .select('...')
  .eq('id', user.id)
  .single()
```

**Replace with:**
```ts
const { supabase, role, isGroupLevel, centreId } = await requireAuth()
```

**Then update:**
- `import { createClient } from '@/lib/supabase/server'` → `import { requireAuth } from '@/lib/auth'`
- `profile?.role` → `role`
- `['group_admin', 'group_cao'].includes(profile.role)` → `isGroupLevel`
- `profile?.centre_id` → `centreId`
- Remove `import { redirect } from 'next/navigation'` if no other redirects

**Pages (31):**
```
consignment/deposits/page.tsx
consignment/page.tsx
consignment/stock/page.tsx
finance/debit-notes/[id]/page.tsx
finance/invoices/[id]/page.tsx
finance/payments/schedule/page.tsx
inventory/forecasting/page.tsx
inventory/transfers/new/page.tsx
items/consumption/page.tsx
purchase-orders/[id]/page.tsx
purchase-orders/indents/[id]/page.tsx
reports/centre-wise-spend/page.tsx
reports/gst-summary/page.tsx
reports/item-purchase-history/page.tsx
reports/po-aging/page.tsx
reports/vendor-overdue/page.tsx
reports/vendor-performance/page.tsx
settings/api-docs/page.tsx
settings/approvals/page.tsx
settings/audit-log/page.tsx
settings/audit-trail/page.tsx
settings/centres/page.tsx
settings/document-alerts/page.tsx
settings/users/page.tsx
vendor-portal/invoices/page.tsx
vendor-portal/orders/[id]/page.tsx
vendor-portal/orders/page.tsx
vendor-portal/outstanding/page.tsx
vendor-portal/page.tsx
vendor-portal/payments/page.tsx
```

### Pattern B: Server pages with inline auth (9 pages)

**Find** this pattern:
```ts
const supabase = await createClient()
const { data: profile } = await supabase
  .from('user_profiles').select('role')
  .eq('id', (await supabase.auth.getUser()).data.user!.id).single()
```

**Same replacement** as Pattern A. These are higher priority because the `!` non-null assertion will crash if the session expires.

**Pages (9):**
```
finance/debit-notes/page.tsx
finance/invoices/page.tsx ← DONE (.new file)
finance/payments/page.tsx
grn/page.tsx
inventory/transfers/page.tsx
items/stock/page.tsx
purchase-orders/indents/page.tsx
purchase-orders/page.tsx ← DONE (.new file)
vendors/page.tsx ← DONE (.new file)
```

### Pattern C: Server pages with NO auth (11 pages)

These use `createClient()` but never check auth. They work because middleware protects the route, but they can't access role/centre for filtering.

**Add** `requireAuth()` to get typed role access:
```ts
// Before
const supabase = await createClient()
// After
const { supabase, role } = await requireAuth()
```

**Pages (11):**
```
analytics/page.tsx (CLIENT — skip, uses supabase/client)
consignment/usage/page.tsx
finance/credit/page.tsx
finance/payments/[id]/page.tsx
inventory/expiry-alerts/page.tsx
inventory/reorder/page.tsx
items/categories/page.tsx
items/page.tsx
reports/page.tsx
settings/data-import/page.tsx
settings/rate-contracts/page.tsx
```

### Pattern D: Client-side pages (skip — 10 pages)

These use `'use client'` with `createClient()` from `@/lib/supabase/client`. They don't need `requireAuth()` because that's a server-only function. Auth is handled by the middleware.

```
analytics/page.tsx
consignment/deposits/new/page.tsx
consignment/usage/new/page.tsx
finance/invoices/new/page.tsx
items/[id]/edit/page.tsx
items/new/page.tsx
purchase-orders/[id]/edit/page.tsx
purchase-orders/indents/new/page.tsx
settings/rate-contracts/new/page.tsx
vendors/new/page.tsx
```

---

## Activation Steps

1. Rename `.new` files to replace originals:
   ```bash
   mv src/app/(dashboard)/page.tsx.new src/app/(dashboard)/page.tsx
   mv src/app/(dashboard)/vendors/page.tsx.new src/app/(dashboard)/vendors/page.tsx
   mv src/app/(dashboard)/purchase-orders/page.tsx.new src/app/(dashboard)/purchase-orders/page.tsx
   mv src/app/(dashboard)/finance/invoices/page.tsx.new src/app/(dashboard)/finance/invoices/page.tsx
   ```

2. Verify build:
   ```bash
   npm run build
   ```

3. Test auth flow: logout → login → check each role dashboard loads.

4. Migrate remaining pages using the patterns above (recommend 10 at a time, build after each batch).

---

## Impact Summary

| Metric | Before | After |
|--------|--------|-------|
| Dashboard page.tsx | 1,554 lines | 36 lines |
| Auth boilerplate per page | 8-12 lines | 1 line |
| Total auth LOC saved | ~540 lines (54 × 10) | — |
| Loading skeletons | 8 | 14 |
| Type safety on role | `profile?.role \|\| 'store_staff'` | Typed `UserRole` |
| isGroupLevel checks | Manual array check | `isGroupLevel` boolean |
