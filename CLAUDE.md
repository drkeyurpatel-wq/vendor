# H1 VPMS — Claude Code Instructions

## What This Is
Vendor & Purchase Management System for Health1 Super Speciality Hospitals Pvt. Ltd.
Built by Keyur Patel (MD, Health1) with Claude. This file tells Claude Code everything it needs to know.

---

## Project Owner
- **Name:** Keyur Patel — Managing Director
- **GitHub:** drkeyurpatel-wq | drkeyurpatel@gmail.com
- **Repo:** https://github.com/drkeyurpatel-wq/vendor.git
- **Live URL:** https://vendor-rm26gxmw2-drkeyurpatel-6272s-projects.vercel.app
- **Supabase Project ID:** dwukvdtacwvnudqjlwrb
- **Supabase URL:** https://dwukvdtacwvnudqjlwrb.supabase.co

---

## Tech Stack
- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind CSS
- **Database:** PostgreSQL via Supabase (RLS enabled on all tables)
- **Auth:** Supabase Auth
- **Hosting:** Vercel (auto-deploy on GitHub push)
- **Forms:** react-hook-form + zod
- **Notifications:** react-hot-toast
- **Dates:** date-fns

---

## Brand Colors — NEVER deviate from these
- Navy: `#1B3A6B` — sidebar, headings, primary buttons, table headers
- Teal: `#0D7E8A` — links, secondary buttons, accent highlights
- Light Navy: `#EEF2F9` — card/stat backgrounds
- Light Teal: `#E6F5F6` — info boxes

---

## Business Context
- 6 hospital centres: Shilaj (SHI), Vastral (VAS), Modasa (MOD), Udaipur (UDA), Gandhinagar (GAN)
- 5,000+ SKUs, hundreds of vendors
- 90% purchasing is unit-level, 10% central
- Saturday payment cycle — all vendor payments on Saturdays only
- Credit period clock starts from **GRN date**, NOT invoice date
- Integrations needed: Tally (accounting) + eClinicalworks (EMR)

---

## User Roles (RBAC via Supabase RLS)
| Role | Who | Access |
|------|-----|--------|
| group_admin | Keyur | Full access all centres |
| group_cao | Tinabhai | Group finance, approve POs >2L |
| unit_cao | Nileshbhai | Unit finance, approve POs 50K-2L |
| unit_purchase_manager | Centre PO staff | Create POs, approve <50K |
| store_staff | Store staff | GRN entry only |
| finance_staff | Finance | Invoice verification |
| vendor | External | Own portal only |

---

## PO Approval Thresholds
- Up to ₹10,000 → auto-approved
- ₹10,001–50,000 → unit_purchase_manager
- ₹50,001–2,00,000 → unit_cao
- ₹2,00,001–10,00,000 → group_cao
- Above ₹10,00,000 → group_admin (Keyur)

---

## Auto-Numbering Formats
- Vendors: `H1V-0001`
- Items: `H1I-00001`
- PO: `H1-SHI-PO-2603-001` (centre code + YYMM + sequence)
- GRN: `H1-SHI-GRN-2603-001`
- Indent: `H1-SHI-IND-2603-001`
- Invoice ref: `H1-SHI-INV-2603-001`
- Payment batch: `H1-BATCH-2603-001`

---

## Database Tables (19 total — all exist in Supabase)
```
centres                 — 6 hospital centres
user_profiles           — extends auth.users with role + centre_id
vendor_categories       — Pharma / Surgical / Equipment etc
vendors                 — vendor master (core table)
vendor_documents        — KYC files in Supabase Storage
item_categories         — hierarchical (parent + sub)
items                   — 5000+ SKU master
item_centre_stock       — per-centre stock ledger
vendor_items            — vendor-item mapping with L1/L2/L3 rank
purchase_indents        — internal purchase requests
purchase_indent_items   — indent line items
purchase_orders         — POs (core transactional table)
purchase_order_items    — PO line items
po_approvals            — approval trail per PO
grns                    — goods receipt notes
grn_items               — GRN line items with batch/expiry
invoices                — vendor invoices + 3-way match status
payment_batches         — Saturday payment batches
payment_batch_items     — individual payments in a batch
rate_contracts          — annual/quarterly rate contracts
rate_contract_items     — items + rates + L-rank per contract
stock_ledger            — full audit trail of stock movements
vendor_performance      — monthly vendor scorecards
activity_log            — system-wide audit log
```

---

## File Structure
```
src/
├── app/
│   ├── (auth)/login/page.tsx              ✅ DONE
│   ├── (dashboard)/
│   │   ├── layout.tsx                     ✅ DONE — sidebar + topbar
│   │   ├── page.tsx                       ✅ DONE — dashboard stats
│   │   ├── vendors/page.tsx               ✅ DONE — list + filters
│   │   ├── vendors/new/page.tsx           ✅ DONE — add form
│   │   ├── vendors/[id]/page.tsx          ❌ TODO — vendor detail + edit
│   │   ├── items/page.tsx                 ✅ DONE — list
│   │   ├── items/new/page.tsx             ✅ DONE — add form
│   │   ├── items/[id]/page.tsx            ❌ TODO
│   │   ├── items/stock/page.tsx           ❌ TODO — stock levels
│   │   ├── purchase-orders/page.tsx       ✅ DONE — list
│   │   ├── purchase-orders/new/page.tsx   ❌ TODO — full PO form
│   │   ├── purchase-orders/[id]/page.tsx  ❌ TODO — detail + approve
│   │   ├── purchase-orders/indents/page.tsx ❌ TODO
│   │   ├── grn/page.tsx                   ❌ TODO — list
│   │   ├── grn/new/page.tsx               ❌ TODO — create GRN
│   │   ├── grn/[id]/page.tsx              ❌ TODO — GRN detail
│   │   ├── finance/invoices/page.tsx      ❌ TODO
│   │   ├── finance/credit/page.tsx        ✅ DONE — aging dashboard
│   │   ├── finance/payments/page.tsx      ❌ TODO — payment batches
│   │   ├── reports/page.tsx               ❌ TODO
│   │   └── settings/users/page.tsx        ❌ TODO
│   └── api/
│       ├── auth/callback/route.ts         ✅ DONE
│       ├── po/approve/route.ts            ❌ TODO
│       ├── grn/submit/route.ts            ❌ TODO
│       └── invoices/match/route.ts        ❌ TODO
├── components/
│   ├── layout/Sidebar.tsx                 ✅ DONE
│   ├── layout/TopBar.tsx                  ✅ DONE
│   └── ui/
│       ├── VendorSearch.tsx               ❌ TODO — autocomplete
│       ├── ItemSearch.tsx                 ❌ TODO — autocomplete
│       ├── POLineItems.tsx                ❌ TODO — dynamic line items
│       └── ApprovalTimeline.tsx           ❌ TODO
├── lib/
│   ├── supabase/client.ts                 ✅ DONE
│   ├── supabase/server.ts                 ✅ DONE
│   ├── supabase/middleware.ts             ✅ DONE
│   └── utils.ts                           ✅ DONE
├── types/database.ts                      ✅ DONE
└── middleware.ts                          ✅ DONE
```

---

## CSS Classes — Always Use These (defined in globals.css)
```css
.btn-primary      /* teal filled button */
.btn-secondary    /* white outlined button */
.btn-navy         /* navy filled button */
.btn-danger       /* red filled button */
.card             /* white card with border + shadow */
.stat-card        /* dashboard stat card */
.form-input       /* text input */
.form-select      /* select dropdown */
.form-label       /* field label */
.data-table       /* full-width table with navy header */
.badge            /* status pill */
.page-header      /* flex row: title left, actions right */
.page-title       /* large navy heading */
.page-subtitle    /* small gray subtitle */
.empty-state      /* centered empty state */
.spinner          /* loading animation */
```

---

## Status Color Maps (from utils.ts)
```ts
VENDOR_STATUS_COLORS   // pending=yellow, active=green, inactive=gray, blacklisted=red
PO_STATUS_COLORS       // draft=gray, pending_approval=yellow, approved=blue, sent_to_vendor=purple, fully_received=green
MATCH_STATUS_COLORS    // matched=green, partial_match=yellow, mismatch=red
PAYMENT_STATUS_COLORS  // unpaid=red, partial=yellow, paid=green, disputed=orange
```

---

## Code Patterns — Follow Exactly

### Server Component (list/detail pages)
```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, centre:centres(*)')
    .eq('id', user.id)
    .single()

  const { data } = await supabase.from('table').select('*')
  return <div>...</div>
}
```

### Client Component (forms)
```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
```

### Auto-numbering
```ts
const { count } = await supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
const po_number = `H1-${centreCode}-PO-${format(new Date(), 'yyMM')}-${String((count ?? 0) + 1).padStart(3, '0')}`
```

---

## Build Order (Remaining)

### Phase 1 — Core Transaction Flow (build first)
1. `vendors/[id]/page.tsx` — vendor profile + edit + documents + PO history
2. `components/ui/VendorSearch.tsx` — debounced autocomplete
3. `components/ui/ItemSearch.tsx` — debounced autocomplete
4. `components/ui/POLineItems.tsx` — dynamic line items with GST calc
5. `purchase-orders/new/page.tsx` — full PO form
6. `purchase-orders/[id]/page.tsx` — PO detail + approve/reject
7. `api/po/approve/route.ts` — approval action server route
8. `grn/new/page.tsx` — GRN creation from PO
9. `grn/[id]/page.tsx` — GRN detail
10. `api/grn/submit/route.ts` — stock update on GRN submit

### Phase 2 — Finance
11. `finance/invoices/page.tsx` — invoice list + upload
12. `api/invoices/match/route.ts` — 3-way matching engine
13. `finance/payments/page.tsx` — Saturday payment batch

### Phase 3 — Inventory & Analytics
14. `items/stock/page.tsx` — stock levels across centres
15. `reports/page.tsx` — spend analysis, aging, PO status
16. `purchase-orders/indents/page.tsx` — indent management

### Phase 4 — Admin & Portal
17. `settings/users/page.tsx` — user management
18. Rate contracts module
19. Vendor performance scorecard
20. Vendor self-service portal

---

## Critical Business Rules
1. **3-way match** (PO qty = GRN qty = Invoice qty AND PO rate = Invoice rate) must BLOCK payment on mismatch
2. **Credit period** starts from GRN date — never invoice date
3. **Saturday payment cycle** — batch all due invoices, CAO approves, then release
4. **No PO = No Payment** — invoices without linked PO must be flagged
5. **Rate contract** — if active contract exists, PO rate must match (tolerance ±0.5%)
6. **Duplicate invoice check** — vendor_id + vendor_invoice_no must be unique
7. **L1 vendor auto-selection** — reorder triggers must select L1 from rate contract
8. **Approval chain** — never skip levels, always record approver + timestamp + comments
9. **Blacklist requires group_admin** — only Keyur can blacklist a vendor
10. **Never ALTER or DROP production tables** — only ADD COLUMN or CREATE TABLE

---

## Deployment
- Keyur uses **GitHub Desktop** — no terminal
- Workflow: files dropped into folder → GitHub Desktop commit → push → Vercel auto-deploys
- Always provide code as individual files, NOT zips (GitHub Desktop handles diffs better)
- Vercel root directory: repo root (no subfolder)
- Never commit `.env.local` or secrets

---

## When Claude Code Starts a Session
1. Read this file completely
2. Run `ls src/app/\(dashboard\)/` to see current state
3. Check which files are placeholders vs complete
4. Ask Keyur which module to build today
5. Build complete, production-ready files — no TODOs, no placeholders
6. Show exact file paths for every file created/modified
