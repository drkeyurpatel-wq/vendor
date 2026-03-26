# H1 VPMS — Engineering Debt Tracker

Per Engineering v2 Task Management: Plan → Verify → Track → Explain → Document → Lessons

Last updated: 2026-03-26

---

## ✅ Completed

- [x] P0: Auth dedup — 53/54 server pages use `requireAuth()`
- [x] P0: Dashboard split — 1,554 → 36 lines + 7 role components
- [x] P1: Error resilience — 45/46 API routes have error handling
- [x] P1: `/api/health` endpoint for uptime monitoring
- [x] P2: Schema sync — 33 missing fields + drift checker
- [x] P3: Business rule tests — 57 tests, 10 rules
- [x] P4: API auth migration — 33 routes to `requireApiAuth`
- [x] P4: Form extraction — 3 god-forms into reusable components
- [x] P4: Business rules wired — constants + `canChangeVendorStatus`
- [x] P5: WCAG AA contrast — 1,026 fixes across 125 files
- [x] P5: PHI/PII tagging — 13 fields annotated in types
- [x] P5: tasks/lessons.md + tasks/todo.md created

## 🔲 Remaining Debt

### High Priority

- [ ] **Enforce Saturday payment rule in code** — `isValidPaymentBatchDate()` exists in business-rules.ts but payment creation route doesn't call it
- [ ] **Enforce credit period from GRN date** — `calculateDueDate()` exists but invoice route doesn't validate `due_date` against it
- [ ] **Wire `isDuplicateInvoice()` into invoice creation** — function exists, not called in route
- [ ] **7 forms use toast-only validation** — migrate to `FieldError` inline errors per UI/UX rules
- [ ] **39 raw `<input>` elements** without `form-input` class or focus ring
- [ ] **28 components with direct Supabase calls** — should use hooks or server-side data fetching
- [ ] **Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel** — Sentry configs wired but DSN not set

### Medium Priority

- [ ] **75 inline `style={{}}` occurrences** — migrate to tailwind classes
- [ ] **61 interactive elements missing `cursor-pointer`**
- [ ] **53 `transition-all` without duration** — add `duration-200`
- [ ] **8 submit buttons without loading/disabled state**
- [ ] **15 gradients outside loading states** — check if decorative or functional
- [ ] **Split import/route.ts** (722 lines) — one handler per import type
- [ ] **Split analytics/route.ts** (600 lines) — one algo per file
- [ ] **Split tally/push/route.ts** (515 lines) — extract XML builder

### Low Priority

- [ ] **Wire remaining business-rules.ts functions** — `matchLineItem`, `computeMatchStatus`, `selectL1Vendor`, `getRequiredApprovalRole`, `generateDocNumber` are tested but not called from live routes
- [ ] **Add `not-found.tsx` to dynamic route groups** — vendors/[id], items/[id], grn/[id], po/[id]
- [ ] **env var centralisation** — 15 files reference `process.env` directly; consider a config module
- [ ] **Increase test coverage** — currently 7 test files for 50K LOC; target: test every API route handler

---

## Metrics

| Metric | Start (P0) | Current | Target |
|--------|-----------|---------|--------|
| Auth boilerplate per page | 8-12 lines | 1 line | 1 line ✅ |
| API routes with error handling | 22/46 | 45/46 | 46/46 |
| Tests | 172 | 229 | 400+ |
| WCAG AA violations | 461 | 0 | 0 ✅ |
| Hardcoded hex in TSX | 553 | ~80 (JS objects) | 0 in className |
| Schema drift fields | 33 | 0 | 0 ✅ |
| Business rules tested | 0 | 57 | 57 ✅ |
| PHI/PII fields tagged | 0 | 13 | all |
| Engineering score | 5.5/10 | 8.5/10 | 9.5/10 |
