# Health1 VPMS — Vendor & Purchase Management System

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (project: dwukvdtacwvnudqjlwrb)
- Vercel deployment
- Repo: drkeyurpatel-wq/vendor

## Architecture

- 52 pages live
- Supabase RLS enabled
- PDF reports use `renderPDFHeader()` from `src/lib/pdf-header.ts`
- Logo embedded as base64 in `src/lib/logo-base64.ts`
- Logo files: `public/logo.png`, `logo.jpg`, `logo-pdf.jpg`
- Tally integration routes already built (830 lines)
- Notification triggers wired into all business flows

## Business Rules — NON-NEGOTIABLE

- Saturday payment cycle is firm — all payment logic must respect this
- Credit period tracking starts from **GRN date**, not PO date
- Health1 logo MUST appear on every report/document (use `renderPDFHeader()`)
- Sankalp income always included in H1N1 calculations
- Mondeal rental always excluded from H1N1 calculations

## Database

- Known schema drift: multiple columns in TypeScript types are missing from actual DB
- ALTER TABLE migration script exists — run before assuming column availability
- NEVER apply RLS or DB schema changes in bulk — test each against a real user session first

## Development Rules

- TDD: RED → GREEN → REFACTOR — no code without a failing test first
- Delete pre-test code after writing proper tests
- 80%+ coverage target
- Brainstorm BEFORE code: context-prime → questions → approaches → spec → sign-off
- Decompose big asks: spec → plan → implement per sub-project
- Verify: proof, not claims. YAGNI. 1 file = 1 job.
- Debug: reproduce → evidence → root-cause → test-fix; 3+ fails = rethink architecture
- Zero-error policy on mathematics and grammar — absolute, no exceptions

## Security

- Tag PHI/PII at schema level
- Audit PHI/PII exposure before every delivery
- No neon/AI gradients/gamification on medical data
- No PHI/PII in error messages, logs, or console output

## UI/UX Rules

- Healthcare = Accessible style
- Lucide SVG icons only (no emoji)
- cursor-pointer on clickable elements, hover 150-300ms transitions
- 4.5:1 contrast minimum (WCAG AA), focus states on all interactive elements
- Responsive: 375/768/1024/1440 breakpoints
- Skeleton loading, empty states with guidance, errors near field
- Charts: visible legends, tooltips, axis labels with units
- Disable button + show spinner on async operations

## ECC v4 Additions (Apr 2026)

13. **Spec-First Flow**: /brainstorm → /write-plan → /execute-plan before coding.
14. **Error-to-Lesson Pipeline**: Every bug fix → LESSONS.md entry. Read LESSONS.md on session start.
15. **Progressive Skill Disclosure**: Load P2P skills for procurement, Portal skills for vendor portal.
16. **Injection Scanning**: All tool I/O scanned for secrets and injection patterns.
17. **Safe Bash**: Auto-approve reads, prompt for destructive ops.
18. **Drift Detection**: Weekly schema/security/dead-code checks.
19. **Multi-Agent Review**: db-reviewer + security-reviewer in parallel on PRs.

## Security Update (Apr 11, 2026)

- RLS enabled on all 6 previously-unprotected tables (vendor_sessions, rfqs, rfq_items, rfq_quotes, rfq_quote_items, vendor_notifications)
- vendor_sessions locked to service_role only (session_token exposure closed)
- v_expiry_alerts view converted to security_invoker
- update_updated_at() search_path hardened

## Deploy Rules

1. `npx next build` before EVERY push. Build fail = DO NOT push.
2. One fix, one push, one verify. Never batch.
3. Never declare "✅ Fixed" without verifying on live URL.
