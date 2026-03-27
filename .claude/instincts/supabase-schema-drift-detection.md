---
pattern: "supabase-schema-drift-detection"
confidence: 0.9
source: "2026-03-27"
tags: ["supabase", "vpms", "schema", "typescript"]
---

# Pattern: Supabase Schema Drift Detection

## Trigger
When TypeScript build fails with "Property does not exist on type" errors referencing Supabase table columns, OR when a query returns unexpected null values for columns that should exist.

## Action
1. Regenerate types: `npx supabase gen types typescript --project-id dwukvdtacwvnudqjlwrb > src/types/supabase.ts`
2. Diff against existing types to find mismatches
3. If columns are missing in DB: run the ALTER TABLE migration script
4. If columns are missing in types: regenerate types
5. Never assume a column exists just because it's in the TypeScript type

## Evidence
VPMS had multiple columns in TypeScript types that were missing from the actual database. This caused runtime errors that only appeared when specific code paths were executed. The migration script was provided to add missing columns. Discovered March 2026.

## Anti-pattern
Do NOT manually edit the generated Supabase types to add columns. Always fix the source of truth (either the DB schema or regenerate types from DB).
