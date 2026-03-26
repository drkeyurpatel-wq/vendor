# H1 VPMS — Lessons Learned

Per Engineering v2 Rule 3: "After ANY correction, write rules that prevent the same mistake."

---

## Auth Patterns

- **Never use `!` non-null assertion on `getUser().data.user`** — session can expire at any time. Use `requireAuth()` or `requireApiAuth()` which handle null safely.
- **Page auth redirects, API auth throws.** `requireAuth()` calls `redirect('/login')`. `requireApiAuth()` throws `AuthError` caught by `withApiErrorHandler`. Never mix these.
- **Profile fetch is one extra round-trip.** Only use `requireApiAuthWithProfile()` when the route actually needs `role`, `centreId`, or `isGroupLevel`. Most PDF/DOCX generation routes only need `requireApiAuth()`.

## Schema & Types

- **Run `npm run check:drift` after every SQL migration.** The drift checker compares `ALTER TABLE ADD COLUMN` in `sql/` against `types/database.ts` interfaces. Takes 1 second, catches type mismatches before they hit production.
- **Never trust `types/database.ts` without verifying against the actual DB.** The file had 33 missing fields before P2 fixed it. Always assume drift until proven otherwise.
- **`tenant_id` must be added to every new table interface.** Multi-tenant migration added it to 7 tables; any new table needs it too.

## Business Rules

- **Tolerance constants must come from `business-rules.ts`.** Never define `RATE_TOLERANCE = 0.005` inline in a route. Import from the single source. Three routes had independent copies before P3 fixed it.
- **Saturday payment rule is not enforced in code.** The `paymentBatchSchema` accepts any date. Wire `isValidPaymentBatchDate()` from `business-rules.ts` into the payment creation flow.
- **Credit period clock starts from GRN date.** This is in `business-rules.ts` as `calculateDueDate(grnDate, creditPeriodDays)` but not yet enforced in the invoice creation route.

## UI/UX

- **text-gray-400 fails WCAG AA** (3.03:1 on white). Minimum is `text-gray-500` (5.71:1). This was a 380-occurrence mistake fixed in P5.
- **Never use hardcoded hex in className.** Use tailwind tokens: `text-navy-600` not `text-[#1B3A6B]`. The tailwind config has the full navy/teal ramps.
- **Every `<input>` must use `form-input` class.** Raw inputs have no focus ring, no hover state, no disabled styling. globals.css defines all of these on `.form-input`.
- **toast.error() is not field-level validation.** Use the `FieldError` component for inline errors next to the field. Toast is for server errors and success confirmations only.

## Testing

- **Pure functions are infinitely easier to test than API routes.** The 57 business-rule tests run in 2 seconds with zero mocking. The 3 API route tests need 50+ lines of Supabase mock setup each.
- **When wrapping a route with `withApiErrorHandler`, the auth failure test changes from checking a `return NextResponse.json({...}, { status: 401 })` to checking that the wrapper catches `AuthError` and returns 401.** Update test expectations when migrating.

## Process

- **Commit after each tier, not at the end.** If Tier 3 breaks something, you can revert without losing Tier 1 and 2.
- **TypeScript check + full test suite before every push.** `npx tsc --noEmit && npx jest --no-coverage` — takes 10 seconds, catches everything.
