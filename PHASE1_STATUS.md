# VPMS Phase 1 — Vendor Outstanding & Payment Planning

**Status file. Updated in every PR.**

Last updated: 2026-08-24 · Stage: **Step 1 (discovery) complete — blocked on Keyur's answers**

---

## 1. Where we are

| | |
|---|---|
| Screens shipped | 0 of 4 |
| Deployed to Vercel | nothing new |
| Blocked on | 8 questions in §5 |
| Next action | Keyur answers §5, then PR 1 (import) |

No code has been written. No PR is open. Per the Phase 1 brief, the first
deliverable is this map, not an implementation.

---

## 2. What exists today

### 2.1 Application surface

Measured, not quoted from the brief:

| Surface | Count | Phase 1 disposition |
|---|---|---|
| Pages under `src/app/(dashboard)` | **76** | 4 kept + Settings; rest hidden |
| Pages under `src/app/vendor` (OTP portal, `vendors.health1.co.in`) | 10 | untouched, unlinked |
| Login page | 1 | kept |
| API routes | 60 | ~6 kept, rest unreachable behind the flag |
| TypeScript LOC | ~60,000 | none deleted |

The brief says 52 pages. The live count is 76 dashboard pages. Nothing is
deleted either way — but the hide list is 24 pages longer than assumed.

### 2.2 What Phase 1 keeps and reuses

| Asset | File | Why it matters |
|---|---|---|
| Auth + role resolution | `src/lib/auth.ts` | `requireAuth` / `requireRole` / `requireApiAuthWithProfile` — reused as-is |
| Nav single source of truth | `src/lib/nav.ts` | already role-capped; the one place to cut the nav to 4 entries |
| Table component | `src/components/ui/DataTable.tsx` | TanStack table with search, sort, column toggle, export, skeleton, empty state — covers the vendor list requirement |
| PDF header + logo | `src/lib/pdf-header.ts`, `src/lib/logo-base64.ts` | navy header, Health1 logo, per-centre address — mandatory on every export |
| Amount in words (INR, lakh/crore) | inline in `src/app/api/pdf/payment-advice/route.ts` | works; needs extracting to `src/lib/` so exports and screens share one implementation |
| Payment advice PDF | `src/app/api/pdf/payment-advice/route.ts` | built on `payment_batches`; the layout is reusable, the data source is not |
| Excel parsing | `xlsx` 0.18.5, used in `src/app/api/import/route.ts` | see risk in §5.8 |
| Design tokens | `tailwind.config.ts` (navy `#1B3A6B`, teal `#0D7E8A`) | conservative already; no second design system |

### 2.3 What is closest to Phase 1 — and why it is not Phase 1

**`/reports/vendor-overdue`** is a vendor-grouped ageing report that already
exists. It cannot be promoted as-is:

- buckets are `Current / 1-30 / 31-60 / 61-90 / >90` — Phase 1 needs
  `0-30 / 31-60 / 61-90 / 91-180 / 181-365 / 365+`
- displays `formatLakhs()` → renders `₹1.89 L`, which Phase 1 forbids outright
- no text search, no sort, no centre filter, no hold flag, no credit-limit state
- reads the P2P `invoices` table, which carries three-way-match columns Phase 1
  has no use for
- pulls `centreId` from the session and never applies it

**`/api/import` with `type=vendor_outstanding`** already imports bill rows. It
also cannot be promoted as-is:

- reads **the first sheet only** (`wb.SheetNames[0]`) — the Sunday sheet is
  multi-tab, one tab per centre
- **not idempotent**: a re-upload of the same week fails every row as
  "Duplicate invoice" rather than reconciling the week
- **hard-fails on an unmatched vendor name** instead of routing it to a review
  queue
- **defaults credit period to 30 days**, not Net 90
- no preview step — parse and commit are the same call
- no `source` column, so a Tally row and a sheet row would be indistinguishable

Both are worth reading before writing the replacements. Neither is a shortcut.

### 2.4 Currency formatting — a codebase-wide defect

`formatLakhs()` in `src/lib/utils.ts` renders `₹1.89 L` / `₹2.00 Cr`. It is used
in **155 places**. Phase 1 bans that format everywhere. `formatCurrency()` is
correct (`en-IN`, 2 decimals, Indian grouping) and already exists.

Most of the 155 sit in pages that are about to be hidden, so this is not 155
edits before PR 1. The rule for Phase 1: **no new screen imports `formatLakhs`**,
and any surviving surface gets swept. Whether to delete the function outright is
a §5 question.

### 2.5 Live database (project `dwukvdtacwvnudqjlwrb`)

Row counts read from the live DB on 2026-08-24:

| Table | Rows | Note |
|---|---|---|
| `items` | 12,713 | P2P; parked |
| `consumption_records` | 704 | P2P; parked |
| **`vendors`** | **309** (307 active) | the Phase 1 asset |
| `centres` | 5 | SHI, VAS, MOD, GAN, **UDA all present** |
| `user_profiles` | 7 | 4 group_admin, 2 group_cao, 1 unit_purchase_manager |
| `purchase_orders` | 13 | P2P; parked |
| **`invoices`** | **3** | there is effectively **no bill data live** |
| `payment_batches` / `payment_batch_items` | 0 / 0 | never used |
| `tally_sync_queue` / `tally_sync_log` | 0 / 0 | never run |

**The vendor load, examined.**

- 276 vendors created 2026-08-24 (`H1V-0200` … `H1V-0475`); 33 pre-existing.
- Payment terms are populated and honestly labelled: 244 at 90 days, 36 at 30,
  17 at 45, 12 at 60. Text carries provenance, e.g.
  `Net 90 (PROVISIONAL - from VAS outstanding sheet 24.08.2026, unverified)`
  vs `Net 90 (confirmed by MD 24.08.2026)` (29 vendors confirmed).
- **Centre attribution is incomplete and unstructured.** `approved_centres` is
  empty (`NULL`/0-length) for **all 309** vendors. Centre lives only in the free
  text of `approval_notes`, and only for 127 of the 276: `VAS` 71, `GAN` 40,
  `MOD` 11, plus 5 multi-centre combos written three different ways
  (`GAN,VAS` / `VAS+GAN` / `GAN,MOD`). The 149 vendors `H1V-0200`–`H1V-0348`
  carry **no source note at all**.
- **No `UDA` (Udaipur) appears anywhere** in the vendor load — consistent with
  "four centre sheets", and the basis for §5.6.
- `credit_limit` is set on **1 of 309** vendors. There is no credit-limit data.
- `gstin` on 30, `bank_ifsc` on 30, `primary_contact_phone` on 31 of 309. Bank
  details are effectively absent — see §5.5.
- **The 13-record review queue does not exist anywhere** — not as a table, not
  as a file, not as a flag on the vendor rows. See §5.7.

**Proposed handling of the centre gap:** do *not* backfill
`vendors.approved_centres`. A vendor's centres are derivable from the centres on
its bills, which the weekly sheet states explicitly per tab. Centre split becomes
self-correcting on every import instead of a one-off guess. `approval_notes`
stays as the provenance record it already is.

### 2.6 RLS — the finding that shapes the roles decision

RLS is on with 4 policies each on `vendors`, `invoices`, `centres`,
`payment_batches`, `payment_batch_items`, `user_profiles`. Policies call
`get_my_role()` and `get_my_centre_id()`. Three consequences for Phase 1:

1. **Every SELECT policy is centre-scoped.** `sel_invoices` is
   `role IN (group_admin, group_cao) OR centre_id = get_my_centre_id()`. A
   `finance_staff` user sees exactly one centre. The Phase 1 accounts owner must
   see all five.
2. **A NULL `centre_id` row is invisible to non-group users** —
   `centre_id = get_my_centre_id()` is NULL, not TRUE. A group-wide weekly
   payment plan would silently vanish for the very person who wrote it.
3. **`finance_staff` cannot update `vendors`.** `upd_vendors` allows
   `group_admin, group_cao, unit_cao, unit_purchase_manager` only. The
   hold/dispute toggle is a vendor-level write, so this blocks the Phase 1
   accounts role as things stand.

Per CLAUDE.md and LESSONS L006/L010: RLS changes go **one table at a time,
each tested against a real user session**. No bulk migration.

### 2.7 Tally — what actually exists

1,530 lines across 5 routes (`config`, `dashboard`, `enqueue`, `push`, `sync`).

- It is a **push** integration: it emits Tally XML to *create* ledgers and
  vouchers in Tally. There is **no pull path** — nothing reads outstanding
  *out* of Tally today.
- `tally_company_config` is keyed **per centre**, and holds exactly **one row**
  (SHI, company "Health1 Neuro1 Super Speciality Hospitals Pvt. Ltd."), with
  `sync_enabled = false`, no agent API key, and `last_sync_at` NULL. It has
  never run.
- The ledger XML sets `<ISBILLWISEON>Yes</ISBILLWISEON>` — but that governs
  ledgers VPMS *would create*, and says nothing about whether the live ledgers
  in Keyur's Tally actually carry bill-wise details.

Nothing here blocks Phase 1, and nothing here answers the two Phase 1.5
questions. Both stay open (§5.3).

---

## 3. What will be hidden

`P2P_MODULES_ENABLED=false`. Code stays; users never see it.

Nav after the cut — **4 entries + Settings**:

```
Dashboard · Vendors · Payment Plan · Import        [Settings]
```

There are **five** surfaces that expose P2P, not one. All five must be gated or
the modules leak:

| # | Surface | File | Action |
|---|---|---|---|
| 1 | Sidebar | `src/lib/nav.ts` | replace `PRIMARY` per role; drop `MANAGE` |
| 2 | Mobile bottom bar | `src/components/layout/MobileBottomNav.tsx` | already derives from `nav.ts` — free |
| 3 | **Command palette** | `src/components/ui/CommandPalette.tsx` | **19 hardcoded hrefs** to `/purchase-orders`, `/grn`, `/items`, … — must be gated separately |
| 4 | **Global search API** | `src/app/api/search/route.ts` | searches 5 entity types (`vendors`, `items`, `purchase_orders`, `grns`, `invoices`) — restrict to vendors + bills |
| 5 | **Direct URL access** | all P2P routes | see below |

**Route gating — recommended approach:** extend `src/middleware.ts` with a P2P
path-prefix list that rewrites to a `/not-enabled` page when the flag is off.
One file, no route churn, covers pages *and* API routes in the same place. The
alternative — a `(p2p)` route group with a guarding layout — means physically
moving 40+ route folders and is not worth the diff. Middleware runs on the edge
and reads the flag from env, which is all it needs.

Also to be handled: `DASHBOARD_MAP` in `src/app/(dashboard)/page.tsx` routes 7
roles to 7 P2P-shaped dashboards. Phase 1 replaces this with the one dashboard
from the brief.

**Explicitly not touched:** the vendor OTP portal (`src/app/vendor/**`,
`vendors.health1.co.in`) keeps working and stays unlinked from the new nav.

---

## 4. Proposed schema changes

Additive only. **No table is dropped, no column is dropped, no P2P data is
migrated.** All new tables get RLS enabled at creation (L010), applied one table
at a time with a real-session test (L006).

### 4.1 `vendor_bills` — the bill ledger, source-agnostic

The centrepiece. A Tally-sourced row and a sheet-sourced row are the same shape,
separated only by `source`.

```sql
create table vendor_bills (
  id                 uuid primary key default gen_random_uuid(),
  vendor_id          uuid not null references vendors(id),
  centre_id          uuid not null references centres(id),
  bill_no            text not null,
  bill_date          date not null,
  due_date           date not null,
  credit_period_days int  not null default 90,
  bill_amount        numeric(14,2) not null,
  paid_amount        numeric(14,2) not null default 0,
  balance_amount     numeric(14,2) generated always as (bill_amount - paid_amount) stored,
  expense_type       text not null default 'opex' check (expense_type in ('capex','opex')),
  source             text not null check (source in ('sheet','tally','manual')),
  source_batch_id    uuid references import_batches(id),
  source_row_ref     text,          -- tab name + row number, for audit
  narration          text,
  status             text not null default 'open'
                       check (status in ('open','settled','written_off')),
  first_seen_week    date not null, -- Sunday this bill first appeared
  last_seen_week     date not null, -- Sunday it last appeared
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (vendor_id, centre_id, bill_no)
);
```

Design notes:

- **Ageing is never stored.** Buckets are derived from `due_date` against today,
  through one SQL view (`v_vendor_bill_ageing`) that the list, the detail, the
  dashboard and both exports all read. One implementation = the dashboard
  reconciles to the sheet to the rupee by construction, which is a stated
  definition-of-done item.
- `capex/opex` is **per bill**, per the brief — not on the vendor.
- `first_seen_week` / `last_seen_week` are what make *"balances that have not
  moved in 4+ weeks"* a query rather than a spreadsheet diff.
- The key is `(vendor_id, centre_id, bill_no)`. Note the existing `invoices`
  table uses `UNIQUE (vendor_id, vendor_invoice_no)` with **no centre** — one
  of several reasons Phase 1 gets its own table rather than overloading
  `invoices` with three-way-match columns it will never fill.
- `numeric(14,2)` throughout, never float (L004).

### 4.2 `import_batches` + `import_batch_rows` — the weekly sheet

```sql
create table import_batches (
  id               uuid primary key default gen_random_uuid(),
  week_ending      date not null,       -- the Sunday the sheet represents
  file_name        text not null,
  file_hash        text not null,       -- sha256 of uploaded bytes
  uploaded_by      uuid references user_profiles(id),
  status           text not null default 'draft'
                     check (status in ('draft','committed','discarded')),
  row_count        int, matched_count int, unmatched_count int,
  sheet_total      numeric(14,2),       -- total as printed in the sheet
  committed_total  numeric(14,2),       -- what we actually wrote
  committed_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (week_ending)
);

create table import_batch_rows (
  id                uuid primary key default gen_random_uuid(),
  batch_id          uuid not null references import_batches(id) on delete cascade,
  row_number        int  not null,
  sheet_tab         text not null,
  raw               jsonb not null,     -- the row exactly as read
  matched_vendor_id uuid references vendors(id),
  match_method      text check (match_method in
                      ('exact_name','normalised_name','gstin','manual','unmatched')),
  resolution        text not null default 'pending'
                     check (resolution in ('pending','accepted','queued_for_review','skipped')),
  error             text
);
```

- **Preview and commit read the same staged rows** — what Keyur approves is
  byte-for-byte what gets written.
- **Idempotency:** commit upserts on `(vendor_id, centre_id, bill_no)` within
  the batch's week. Re-uploading the same week *reconciles that week's snapshot*
  — it never appends. `unique (week_ending)` makes the week the identity.
- **Reconciliation guard:** refuse to commit when
  `committed_total <> sheet_total`. This is the mechanism behind
  "every figure reconciles to the sheet total to the rupee".
- `file_hash` lets the UI say "this is the same file you uploaded on Sunday"
  before anyone clicks anything.

### 4.3 `vendor_review_queue` — never auto-merge

```sql
create table vendor_review_queue (
  id                  uuid primary key default gen_random_uuid(),
  raw_name            text not null,
  source              text not null check (source in ('vendor_load','import')),
  batch_id            uuid references import_batches(id),
  centre_id           uuid references centres(id),
  suggested_vendor_id uuid references vendors(id),
  reason              text not null,   -- 'name not found', 'near-duplicate of …'
  status              text not null default 'open'
                        check (status in ('open','resolved_linked','resolved_created','dismissed')),
  resolved_vendor_id  uuid references vendors(id),
  resolved_by         uuid references user_profiles(id),
  resolved_at         timestamptz,
  notes               text,
  created_at          timestamptz not null default now()
);
```

This is the **only** path from an unknown sheet name to a vendor row. Name
similarity produces a `suggested_vendor_id` and nothing else — R S Surgipharm
(30 days, Keytruda) and R S Surgipharm Pvt Ltd (90 days) stay two vendors unless
a human says otherwise. Surfaced as a small admin list, seeded with the 13
records once Keyur supplies them (§5.7).

### 4.4 `vendors` — three added columns

```sql
alter table vendors add column payment_hold boolean not null default false;
alter table vendors add column hold_reason  text;
alter table vendors add column hold_set_by  uuid references user_profiles(id);
alter table vendors add column hold_set_at  timestamptz;
```

Held vendors are excluded from payment-plan auto-suggestions and stay fully
visible everywhere else. `credit_limit` already exists (and is empty) — §5.4.

### 4.5 `payment_plans` + `payment_plan_lines` — the weekly plan

```sql
create table payment_plans (
  id              uuid primary key default gen_random_uuid(),
  week_ending     date not null,            -- the Saturday of the payment cycle
  envelope_amount numeric(14,2) not null check (envelope_amount >= 0),
  status          text not null default 'draft'
                    check (status in ('draft','approved','exported','cancelled')),
  notes           text,
  created_by      uuid references user_profiles(id),
  created_at      timestamptz not null default now(),
  approved_by     uuid references user_profiles(id),
  approved_at     timestamptz,
  check (extract(dow from week_ending) = 6)  -- Saturday cycle is firm
);

create table payment_plan_lines (
  id                uuid primary key default gen_random_uuid(),
  plan_id           uuid not null references payment_plans(id) on delete cascade,
  bill_id           uuid not null references vendor_bills(id),
  vendor_id         uuid not null references vendors(id),
  centre_id         uuid not null references centres(id),
  allocated_amount  numeric(14,2) not null check (allocated_amount > 0),
  payment_mode      text,
  bank_account      text,
  sequence          int,
  unique (plan_id, bill_id)
);
```

The `dow = 6` CHECK encodes the non-negotiable Saturday cycle in the database,
not in a comment. Week-over-week comparison is `week_ending - 7`. Note the sheet
is anchored on **Sunday** and the payment cycle on **Saturday** — two different
anchors that need confirming (§5.6).

Line-level CHECK constraints are stated up front deliberately: L014 was a
payment batch that failed on every insert because UI status strings did not
match the DB CHECK. Every status value above is one the UI will actually write.

### 4.6 Roles and RLS — two options, one recommendation

Phase 1 wants two roles. Seven already exist, referenced by `get_my_role()`,
`nav.ts`, `DASHBOARD_MAP` and a CHECK on `user_profiles.role`.

**Option A — reuse existing roles.** Accounts → `finance_staff` with
`centre_id = NULL`; Viewer → `group_cao`. Cheapest diff. Two problems: it needs
`upd_vendors` widened to admit `finance_staff` (§2.6.3), and `group_cao` has
*write* access on vendors, invoices and payment batches — so "Viewer" would not
be read-only. It would be a promise the database does not keep.

**Option B — add `accounts` and `viewer` (recommended).** Extend the
`user_profiles.role` CHECK, and write policies for the four new tables against
these two roles only. P2P tables and their policies are not touched at all.
`accounts` gets read+write on the new tables group-wide; `viewer` gets SELECT
only. Cost: one CHECK change, plus `nav.ts` and `DASHBOARD_MAP` entries.

Recommending **B**: Phase 1's authorisation stops depending on the P2P role
matrix, and read-only is enforced by Postgres rather than by the absence of a
button. Keyur's call — §5.1.

Whichever is chosen: the accounts owner's profile must have **`centre_id = NULL`**
and the new policies must be **group-wide by role, never `centre_id =
get_my_centre_id()`** — otherwise the owner sees one centre and every group-wide
plan row disappears (§2.6.1, §2.6.2).

### 4.7 Demo dataset

Seeded as specified: 20 vendors, 150 bills across all five centres, mixed
ageing across all six buckets, 2 held vendors, 1 credit-limit breach. It will be
written **as its own import batch** (`source='sheet'`, a labelled demo week) so
that seeding exercises the real import path rather than bypassing it, and so it
can be removed by discarding one batch.

---

## 5. Blocked on Keyur

Nothing proceeds to code until these are answered. §5.1–§5.6 are the brief's
six; §5.7–§5.8 came out of reading the live data and the dependency list.

**5.1 — Accounts owner, and the roles decision.** Who is the named accounts
owner (name + email for the Supabase Auth user)? And: Option A or Option B in
§4.6? *Recommendation: Option B.* Related: today there are 7 users — 4
group_admin, 2 group_cao, 1 unit_purchase_manager, and **zero finance_staff**.
Who should hold Viewer?

**5.2 — A real Sunday sheet.** One actual multi-tab file, unedited. Not a
description of it, not a cleaned copy. Specifically needed: exact tab names per
centre; where the header row starts on each tab; the column headers verbatim;
how the vendor name is written; whether bill date, due date or both are present;
whether there is a paid/adjustment column; how capex/opex is marked; and whether
a tab total row exists (that total is what §4.2's reconciliation guard checks
against). Every parser decision waits on this file.

**5.3 — Tally, for Phase 1.5 only.** (a) Do the vendor ledgers in the live Tally
carry **bill-wise details**, or only a ledger balance? (b) **One Tally company
for the group, or five?** Evidence from the repo: the config table is keyed per
centre and holds one row (SHI, "Health1 Neuro1 Super Speciality Hospitals Pvt.
Ltd."), sync disabled, never run — so the code assumed per-centre and was never
exercised. Both answers are recorded here and acted on in Phase 1.5, not now.

**5.4 — Credit limits: where do they come from?** `credit_limit` is populated on
**1 of 309** vendors. "Credit-limit breach" is a dashboard requirement, so the
data has to come from somewhere: a column in the Sunday sheet, a separate list,
manual entry per vendor in the app, or a rule (e.g. a multiple of monthly
purchase)? *Recommendation: manual entry on the vendor detail screen, blank
until set, with breach state simply not shown for vendors that have no limit —
no invented default.*

**5.5 — Bank / payment fields on the advice.** What must appear on the payment
advice for accounts to act on it and for a CA to sign it off — beneficiary name,
bank name, account number, IFSC, UPI, payment mode (NEFT/RTGS/cheque), our
paying bank per centre, UTR field? Live data: `bank_ifsc` is set on **30 of 309**
vendors, so most advice lines would print blank today. Does the Sunday sheet
carry bank details, or is there a separate bank master to import? And which of
our bank accounts pays which centre?

**5.6 — Udaipur, and the two week-anchors.** (a) Is Udaipur in the weekly sheets?
`UDA` exists as a centre but appears **nowhere** in the vendor load — consistent
with "four centre sheets". If Udaipur payables are managed elsewhere, Phase 1
shows four centres and says so. (b) The sheet is rebuilt **Sunday**; the payment
cycle is **Saturday**. Confirm that a plan dated Saturday the 29th is built from
the sheet of Sunday the 23rd — the week-over-week comparison depends on getting
this right.

**5.7 — The 13 ambiguous records.** They are not in the database, not in a repo
file, and not flagged on any vendor row — I looked. Please send the list (or
say where it lives) so `vendor_review_queue` can be seeded with it. Related and
larger: **centre attribution is missing for 149 of the 276 loaded vendors**
(`H1V-0200`–`H1V-0348`, no source note; the other 127 carry VAS/GAN/MOD in free
text). §2.5 proposes deriving centre from bills instead of backfilling the
vendor rows — confirm that is acceptable, since it means the vendor list shows
no centre for a vendor until its first sheet import.

**5.8 — Two calls I need signed off, not questions of fact.**
  - **`formatLakhs()` — delete or keep?** It renders `₹1.89 L` in 155 places,
    which Phase 1 bans. Deleting it makes reintroduction impossible; the cost is
    touching parked P2P pages that nobody will see. *Recommendation: keep the
    function untouched for now, ban it on Phase 1 screens, and sweep any surface
    that survives the cut.*
  - **`xlsx` 0.18.5.** Phase 1's core input is an uploaded Excel file from a
    user. That version carries a published prototype-pollution advisory, and the
    fixed line is not distributed through npm. Flagging rather than asserting —
    I will verify against the advisory database before PR 1. If it confirms, the
    options are pinning the vendor-hosted build or parsing in a hardened path.
    Worth a decision before we make Excel upload the primary ingestion route.

---

## 6. Deliberately excluded from Phase 1

Not built, not "small-versioned", not partially wired. If work starts touching
any of these, it stops and asks:

indent · purchase order · GRN · three-way match · item/drug master · consumption ·
stock · rate contracts · RFQ · multi-level approval hierarchies · vendor
self-service portal changes.

Parked, not deleted: the entire P2P schema and its ~60,000 lines stay in the
repo and in the database, behind `P2P_MODULES_ENABLED=false`.

---

## 7. PR order

One screen per PR. Each is deployed to Vercel and verified on the live URL —
opened in a browser, runtime logs read — before the next starts. A green build
is not verification.

| PR | Scope | Status |
|---|---|---|
| 1 | Schema migrations + feature flag + nav cut + import screen | blocked on §5.1, §5.2, §5.6 |
| 2 | Vendor list | not started |
| 3 | Vendor detail | not started |
| 4 | Payment plan + payment advice export | blocked on §5.5 |
| 5 | Dashboard | not started |

Every PR updates this file.

---

## 8. Open for Phase 1.5

- Tally bill-wise details: present on live vendor ledgers, or not? (§5.3a)
- One Tally company for the group, or five? (§5.3b)
- Existing Tally code is push-only; a pull path does not exist and is not built.
- `vendor_bills.source` is already shaped for it — a Tally row and a sheet row
  are the same row shape from day one.
