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
