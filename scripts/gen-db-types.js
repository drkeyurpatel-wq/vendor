#!/usr/bin/env node
/**
 * Generates src/types/supabase.ts from a live-schema snapshot (schema.tsv).
 *
 * Snapshot format, one table per line:
 *   table_name<TAB>col|udt|R|D;col|udt|N|-;...
 *     field 3: R = NOT NULL, N = nullable
 *     field 4: D = has default / identity / generated, - = none
 *
 * Regenerate the snapshot with scripts/dump-schema.sql, then run this.
 * Do NOT hand-edit src/types/supabase.ts.
 */
const fs = require('fs')
const path = require('path')

const SNAPSHOT = process.argv[2] || path.join(__dirname, '..', 'schema.tsv')
const FKS = process.argv[3] || path.join(__dirname, '..', 'schema-fks.tsv')
const OUT = path.join(__dirname, '..', 'src', 'types', 'supabase.ts')

const TYPE_MAP = {
  uuid: 'string', text: 'string', varchar: 'string', bpchar: 'string',
  numeric: 'number', int2: 'number', int4: 'number', int8: 'number',
  float4: 'number', float8: 'number',
  bool: 'boolean',
  timestamptz: 'string', timestamp: 'string', date: 'string', time: 'string',
  jsonb: 'Json', json: 'Json',
  _uuid: 'string[]', _text: 'string[]',
}

function tsType(udt) {
  if (TYPE_MAP[udt]) return TYPE_MAP[udt]
  if (udt.startsWith('_')) return (TYPE_MAP[udt.slice(1)] || 'unknown') + '[]'
  return 'unknown'
}

// FK map: table -> [{ name, columns, refTable, refColumns }]
const fkMap = {}
if (fs.existsSync(FKS)) {
  for (const line of fs.readFileSync(FKS, 'utf8').split('\n').filter(Boolean)) {
    const [tbl, spec] = line.split('\t')
    fkMap[tbl] = spec.split(';').map((f) => {
      const [name, cols, refTable, refCols] = f.split('~')
      return {
        name,
        columns: cols.split(','),
        // strip schema qualifier: auth.users -> users
        refTable: refTable.includes('.') ? refTable.split('.')[1] : refTable,
        refColumns: refCols.split(','),
        isOneToOne: false,
      }
    })
  }
}

const rels = (t) =>
  (fkMap[t] || [])
    .map(
      (f) => `          {
            foreignKeyName: '${f.name}'
            columns: [${f.columns.map((c) => `'${c}'`).join(', ')}]
            isOneToOne: ${f.isOneToOne}
            referencedRelation: '${f.refTable}'
            referencedColumns: [${f.refColumns.map((c) => `'${c}'`).join(', ')}]
          }`
    )
    .join(',\n')


// Callable RPCs (pg_proc, prokind='f', excluding triggers).
const FUNCTIONS = `
cleanup_vendor_sessions||void
get_my_centre_id||string
get_my_role||string
next_sequence_number|seq_name:string,seq_type:string,centre_code?:string|string
update_stock_from_grn|p_grn_id:string,p_user_id:string|void
validate_vendor_session|p_token:string|Json
verify_vendor_otp|p_phone:string,p_otp:string,p_user_agent?:string,p_ip_address?:string|Json
`.trim().split('\n')

const fnBlock = FUNCTIONS.map((line) => {
  const [name, args, ret] = line.split('|')
  const argEntries = args
    ? args.split(',').map((a) => {
        const [k, t] = a.split(':')
        return `          ${k}: ${t}`
      }).join('\n')
    : ''
  return `      ${name}: {
        Args: ${args ? `{\n${argEntries}\n        }` : 'Record<string, never>'}
        Returns: ${ret === 'void' ? 'undefined' : ret}
      }`
}).join('\n')

const lines = fs.readFileSync(SNAPSHOT, 'utf8').split('\n').filter(Boolean)
const tables = lines.map((line) => {
  const [name, colspec] = line.split('\t')
  const cols = colspec.split(';').map((c) => {
    const [col, udt, nullable, def] = c.split('|')
    return { col, ts: tsType(udt), nullable: nullable === 'N', hasDefault: def === 'D' }
  })
  return { name, cols }
})

const block = (cols, mode) =>
  cols
    .map(({ col, ts, nullable, hasDefault }) => {
      // Row: exact shape returned by the DB.
      // Insert: optional when nullable or defaulted.
      // Update: everything optional.
      const optional =
        mode === 'Update' ? true : mode === 'Insert' ? nullable || hasDefault : false
      return `          ${col}${optional ? '?' : ''}: ${ts}${nullable ? ' | null' : ''}`
    })
    .join(',\n')

const body = tables
  .map(
    (t) => `      ${t.name}: {
        Row: {
${block(t.cols, 'Row')}
        }
        Insert: {
${block(t.cols, 'Insert')}
        }
        Update: {
${block(t.cols, 'Update')}
        }
        Relationships: [
${rels(t.name)}
        ]
      }`
  )
  .join('\n')

const out = `// ============================================================
// AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source of truth: the live Supabase schema.
// Regenerate: npm run gen:types  (see scripts/gen-db-types.js)
//
// Generated from a snapshot of ${tables.length} tables.
// If you change the database, regenerate this file in the same
// commit, or CI (npm run check:drift) will fail the build.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
${body}
    }
    Views: { [_ in never]: never }
    Functions: {
${fnBlock}
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// ─── Convenience aliases ────────────────────────────────────
type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']
`

fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(OUT, out)
console.log(
  `Generated ${OUT}\n  ${tables.length} tables, ${tables.reduce((n, t) => n + t.cols.length, 0)} columns`
)
