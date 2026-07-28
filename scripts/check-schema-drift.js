#!/usr/bin/env node
/**
 * H1 VPMS — Schema Drift Gate
 *
 * Verifies that src/types/supabase.ts is exactly what the generator produces
 * from the committed schema snapshot. If someone hand-edits the generated
 * types, or refreshes the snapshot without regenerating, this fails.
 *
 * This is the guard that replaces the old hand-written type file. That file
 * drifted from the database and declared ~90 columns that did not exist,
 * which is how invoice line items, purchase indents, rate contracts and
 * payment batches all ended up silently failing to write in production.
 *
 * Usage:  npm run check:drift
 *
 * To pick up a real schema change:
 *   1. Refresh schema.tsv / schema-fks.tsv from the live database
 *   2. npm run gen:types
 *   3. Commit the snapshot AND the regenerated types together
 */
const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const GENERATED = path.join(ROOT, 'src', 'types', 'supabase.ts')

function fail(msg) {
  console.error(`\n\u2717 SCHEMA DRIFT: ${msg}\n`)
  process.exit(1)
}

if (!fs.existsSync(GENERATED)) fail('src/types/supabase.ts is missing. Run: npm run gen:types')

const before = fs.readFileSync(GENERATED, 'utf8')
try {
  execFileSync('node', [path.join(__dirname, 'gen-db-types.js')], { stdio: 'pipe', cwd: ROOT })
} catch (err) {
  fail(`type generator failed to run:\n${err.stderr || err.message}`)
}
const after = fs.readFileSync(GENERATED, 'utf8')

if (before !== after) {
  fs.writeFileSync(GENERATED, before) // don't leave a dirty tree
  fail(
    'src/types/supabase.ts does not match the schema snapshot.\n' +
      '  Types were hand-edited, or the snapshot changed without regenerating.\n' +
      '  Run `npm run gen:types` and commit the result.'
  )
}

// Guard against the old failure mode returning.
const domainTypes = path.join(ROOT, 'src', 'types', 'database.ts')
if (fs.existsSync(domainTypes)) {
  const src = fs.readFileSync(domainTypes, 'utf8')
  const handWritten = [...src.matchAll(/^export interface (\w+) \{/gm)].map((m) => m[1])
  if (handWritten.length > 0) {
    fail(
      `src/types/database.ts hand-declares table interfaces: ${handWritten.join(', ')}.\n` +
        "  Table shapes must be aliases onto ./supabase.ts (Tables<'table_name'>).\n" +
        '  Hand-written table types are what caused the original schema drift.'
    )
  }
}

const tableCount = (after.match(/\n {6}\w+: \{\n {8}Row: \{/g) || []).length
console.log(`\u2713 Schema in sync \u2014 ${tableCount} tables, generated types match snapshot`)
