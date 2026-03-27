# H1 VPMS — Vendor Portal Phase 1: Deployment Guide

## Overview

The vendor portal is a standalone section within the existing VPMS Next.js app.
Vendors access it via `vendors.health1.co.in` or directly at `/vendor/*`.
Auth is separate from admin (phone + OTP, session cookies — no Supabase Auth for vendors).

---

## Step 1: Run SQL Migration

Run `sql/004_vendor_portal.sql` in Supabase SQL Editor (project `dwukvdtacwvnudqjlwrb`).

This creates:
- `vendor_sessions` — OTP + session management
- `rfqs`, `rfq_items` — Request for quotation
- `rfq_quotes`, `rfq_quote_items` — Vendor quotes
- `vendor_notifications` — WhatsApp/SMS/email log
- `portal_phone`, `portal_last_login`, `portal_login_count` columns on `vendors`
- `verify_vendor_otp()`, `validate_vendor_session()` RPCs
- `cleanup_vendor_sessions()` for cron

---

## Step 2: Copy Files Into Repo

From `vpms-portal/` into your `vendor` repo:

```
# New files — copy these directories/files:
src/lib/whatsapp.ts                              → src/lib/whatsapp.ts
src/lib/vendor-auth.ts                           → src/lib/vendor-auth.ts
src/components/vendor/VendorPortalShell.tsx       → src/components/vendor/VendorPortalShell.tsx
src/components/vendor/VendorPOActions.tsx         → src/components/vendor/VendorPOActions.tsx
src/app/vendor/                                  → src/app/vendor/ (entire directory)
src/app/api/vendor-auth/                         → src/app/api/vendor-auth/ (entire directory)
src/app/api/vendor/                              → src/app/api/vendor/ (entire directory)

# REPLACE these files (merge carefully):
src/middleware.ts                                 → src/middleware.ts
```

---

## Step 3: Middleware Merge

The new `middleware.ts` adds vendor subdomain routing BEFORE existing CSRF + Supabase logic.
If you've modified middleware since, merge the vendor-specific blocks:
- Vendor subdomain detection + rewrite
- Skip Supabase session for `/vendor/*` paths
- Allow vendor subdomain in CSRF origin check

---

## Step 4: Vercel Config

### Subdomain Setup

1. **Vercel Dashboard → vendor project → Settings → Domains**
2. Add: `vendors.health1.co.in`
3. In your DNS (likely Cloudflare): add CNAME `vendors` → `cname.vercel-dns.com`

### Environment Variables

Add these to Vercel:

```
# WhatsApp (leave blank to use console logging during testing)
WHATSAPP_PROVIDER=console
# WHATSAPP_PROVIDER=gupshup
# GUPSHUP_API_KEY=
# GUPSHUP_APP_NAME=
# GUPSHUP_SOURCE_NUMBER=

# SUPABASE_SERVICE_ROLE_KEY should already exist
```

---

## Step 5: Create a Test Vendor Account

In Supabase → `vendors` table, for any active vendor:
1. Set `portal_access = true`
2. Set `portal_phone` to a phone number you control (10 digits, no +91)
3. Ensure `primary_contact_phone` has the same number

---

## Step 6: Test Login Flow

1. Go to `vendors.health1.co.in` (or `your-vercel-url.vercel.app/vendor/login`)
2. Enter the phone number
3. Check server logs for the OTP (console mode prints it)
4. Or in dev mode, the API returns `_dev_otp` in the response
5. Enter OTP → should land on vendor dashboard

---

## Step 7: Set Up Session Cleanup Cron

In Supabase → Database → Extensions → enable `pg_cron` if not already.

Then run:
```sql
SELECT cron.schedule(
  'cleanup-vendor-sessions',
  '0 3 * * *',  -- Daily at 3 AM UTC
  $$SELECT cleanup_vendor_sessions()$$
);
```

---

## File Inventory (27 files)

### SQL
- `sql/004_vendor_portal.sql` — Full migration

### Lib (2 files)
- `src/lib/whatsapp.ts` — WhatsApp abstraction (Gupshup/Wati/Interakt/console)
- `src/lib/vendor-auth.ts` — Session cookie auth for vendor portal

### Components (2 files)
- `src/components/vendor/VendorPortalShell.tsx` — Layout shell with nav
- `src/components/vendor/VendorPOActions.tsx` — Acknowledge/dispute modals

### Pages (9 files)
- `src/app/vendor/login/page.tsx` — Phone + OTP login
- `src/app/vendor/(portal)/layout.tsx` — Auth wrapper + shell
- `src/app/vendor/(portal)/loading.tsx` — Skeleton loader
- `src/app/vendor/(portal)/page.tsx` — Dashboard
- `src/app/vendor/(portal)/orders/page.tsx` — PO list
- `src/app/vendor/(portal)/orders/[id]/page.tsx` — PO detail
- `src/app/vendor/(portal)/invoices/page.tsx` — Invoice list
- `src/app/vendor/(portal)/invoices/upload/page.tsx` — Multi-step upload wizard
- `src/app/vendor/(portal)/payments/page.tsx` — Payment ledger
- `src/app/vendor/(portal)/outstanding/page.tsx` — Aging analysis
- `src/app/vendor/(portal)/rfqs/page.tsx` — RFQ list
- `src/app/vendor/(portal)/rfqs/[id]/page.tsx` — Quote submission form

### API Routes (8 files)
- `src/app/api/vendor-auth/send-otp/route.ts`
- `src/app/api/vendor-auth/verify-otp/route.ts`
- `src/app/api/vendor-auth/logout/route.ts`
- `src/app/api/vendor/po/acknowledge/route.ts`
- `src/app/api/vendor/po/dispute/route.ts`
- `src/app/api/vendor/invoices/eligible-pos/route.ts`
- `src/app/api/vendor/invoices/upload-file/route.ts`
- `src/app/api/vendor/invoices/submit/route.ts`
- `src/app/api/vendor/rfq/[id]/route.ts`
- `src/app/api/vendor/rfq/[id]/submit/route.ts`

### Config (1 file)
- `src/middleware.ts` — Updated with vendor subdomain routing

---

## What Exists vs. What's New

The old `src/app/(dashboard)/vendor-portal/` pages (9 files) were built for admin-side viewing.
They remain untouched — the admin can still see vendor data through those pages.

The new `src/app/vendor/` pages are the actual vendor-facing portal with:
- Separate auth (phone OTP, no admin login needed)
- Clean layout (no admin sidebar)
- Subdomain access
- WhatsApp-ready notification layer
- RFQ/Quote submission (new feature)

---

## Phase 2 Scope (next sprint)

- WhatsApp provider integration (once you pick Gupshup/Wati/Interakt)
- Email notifications (Resend or SMTP — templates for PO/payment/invoice)
- Vendor KYC self-update (bank details, GST cert upload)
- Dispute response flow (document upload, conversation thread)
- Monthly vendor statement PDF auto-generation
- Downloadable reports (payment ledger Excel, GST summary)
