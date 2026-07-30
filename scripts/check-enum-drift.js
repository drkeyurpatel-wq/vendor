#!/usr/bin/env node
/**
 * H1 VPMS — CHECK Constraint Drift Audit
 *
 * The generated types make column NAMES safe, but a text column with a CHECK
 * constraint is still just `string` to TypeScript. So code can write a status
 * value the database refuses, and it compiles cleanly and fails at runtime —
 * the same silent-write-failure class as the phantom columns.
 *
 * This scans source for literals assigned to constrained columns and reports
 * any value the database would reject.
 *
 * Usage: node scripts/check-enum-drift.js
 */
const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const ROOT = path.join(__dirname, '..')

// Snapshot of allowed values, per constrained column, from the live schema.
// Columns with the same name on different tables are merged: a literal is
// flagged only if it is invalid for EVERY table carrying that column. That
// keeps false positives down while still catching genuine drift.
const ALLOWED = {
  status: [
    // consignment_deposits
    'active', 'partially_used', 'fully_used', 'returned',
    // consignment_stock
    'available', 'used', 'expired',
    // grns
    'draft', 'submitted', 'verified', 'discrepancy',
    // hmis_import_log / tally_sync_queue
    'processing', 'completed', 'failed', 'partial', 'success', 'skipped',
    // invoices / po_approvals
    'pending', 'approved', 'rejected', 'disputed',
    // payment_batch_items
    'processed',
    // payment_batches
    'proposed', 'pending_approval', 'cancelled',
    // purchase_indents
    'converted_to_po',
    // purchase_orders
    'sent_to_vendor', 'partially_received', 'fully_received', 'closed',
    // rate_contracts
    'terminated',
    // rfq_quotes / rfqs
    'under_evaluation', 'shortlisted', 'awarded', 'open', 'evaluation',
    // vendor_notifications
    'sent', 'delivered', 'read',
    // vendors
    'inactive', 'blacklisted', 'under_review',
  ],
  transaction_type: [
    'grn', 'consumption', 'adjustment', 'transfer_in', 'transfer_out', 'return', 'opening',
    'adjustment_in', 'adjustment_out', 'expiry_acknowledged', 'expired_disposal', 'return_to_vendor',
  ],
  match_status: ['pending', 'matched', 'partial_match', 'mismatch'],
  payment_status: ['unpaid', 'partial', 'paid', 'disputed', 'on_hold'],
  conversion_status: ['pending', 'po_created', 'grn_created', 'invoice_created', 'completed', 'failed'],
  priority: ['low', 'normal', 'high', 'urgent', 'emergency'],
  payment_mode: ['neft', 'rtgs', 'imps', 'cheque', 'upi', 'dd', 'cash'],
  contract_type: ['annual', 'quarterly', 'spot'],
  document_type: ['gstin_certificate', 'pan_card', 'cancelled_cheque', 'drug_license', 'fssai_certificate', 'address_proof', 'other'],
  channel: ['whatsapp', 'sms', 'email'],
  bank_account_type: ['savings', 'current', 'cc', 'od'],
  direction: ['vpms_to_tally', 'tally_to_vpms', 'both'],
  import_type: ['item_master', 'consumption'],
  procedure_location: ['cathlab', 'ot', 'minor_ot', 'other'],
  role: ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager', 'store_staff', 'finance_staff', 'vendor'],
}

// Columns whose values are compared as well as written; reads are harmless
// but a read against an impossible value is dead code worth knowing about.
const WRITE_PATTERNS = (col) => [
  // direct:  status: 'approved'
  new RegExp(`\\b${col}\\s*:\\s*'([a-z_]+)'`, 'g'),
  new RegExp(`\\b${col}\\s*:\\s*"([a-z_]+)"`, 'g'),
  // ternary: status: cond ? 'approved' : 'submitted'   (both branches)
  new RegExp(`\\b${col}\\s*:\\s*[^,\\n]*\\?\\s*'([a-z_]+)'`, 'g'),
  new RegExp(`\\b${col}\\s*:\\s*[^,\\n]*\\?[^:\\n]*:\\s*'([a-z_]+)'`, 'g'),
]

// Files where these words are NOT database values:
//   health routes return {status:'healthy'} as an HTTP payload
//   ocr/invoice builds Anthropic messages with role:'user'
//   business-rules returns a computed match verdict, never written as-is
//   dashboards list status values for UI filter chips
//   approvals/engine returns an API result envelope
const SKIP = [
  'api/health/route.ts',
  'api/bridge/health/route.ts',
  'api/ocr/invoice/route.ts',
  'api/approvals/engine/route.ts',
  'lib/business-rules.ts',
  'components/dashboard/',
]

function sourceFiles() {
  const out = execFileSync('bash', ['-c',
    `find "${ROOT}/src" -type f \\( -name '*.ts' -o -name '*.tsx' \\) | grep -v __tests__`
  ], { encoding: 'utf8' })
  return out.split('\n').filter(Boolean).filter((f) => !SKIP.some((s) => f.includes(s)))
}

const findings = []
for (const file of sourceFiles()) {
  const text = fs.readFileSync(file, 'utf8')
  const lines = text.split('\n')
  for (const [col, allowed] of Object.entries(ALLOWED)) {
    for (const re of WRITE_PATTERNS(col)) {
      let m
      while ((m = re.exec(text)) !== null) {
        const value = m[1]
        if (allowed.includes(value)) continue
        const lineNo = text.slice(0, m.index).split('\n').length
        findings.push({
          file: path.relative(ROOT, file),
          line: lineNo,
          col,
          value,
          snippet: (lines[lineNo - 1] || '').trim().slice(0, 100),
        })
      }
    }
  }
}

if (findings.length === 0) {
  console.log('\u2713 No CHECK constraint drift found')
  process.exit(0)
}

console.error(`\n\u2717 CHECK CONSTRAINT DRIFT — ${findings.length} literal(s) the database will reject:\n`)
for (const f of findings) {
  console.error(`  ${f.file}:${f.line}`)
  console.error(`     ${f.col} = '${f.value}'  <- not permitted`)
  console.error(`     allowed: ${ALLOWED[f.col].join(', ')}`)
  console.error(`     ${f.snippet}\n`)
}
process.exit(1)
