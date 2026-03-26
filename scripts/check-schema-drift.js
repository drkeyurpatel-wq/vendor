#!/usr/bin/env node

/**
 * H1 VPMS — Schema Drift Checker
 * 
 * Compares SQL migration files against src/types/database.ts
 * to catch columns that exist in the database but are missing
 * from TypeScript interfaces.
 * 
 * Usage: node scripts/check-schema-drift.js
 * 
 * Run after adding any SQL migration to verify types stay in sync.
 * Add to CI: exits with code 1 if drift is found.
 */

const fs = require('fs')
const path = require('path')

const SQL_DIR = path.join(__dirname, '..', 'sql')
const TYPES_FILE = path.join(__dirname, '..', 'src', 'types', 'database.ts')

// Map SQL table names to TypeScript interface names
const TABLE_TO_INTERFACE = {
  items: 'Item',
  vendors: 'Vendor',
  purchase_orders: 'PurchaseOrder',
  purchase_order_items: 'PurchaseOrderItem',
  grns: 'GRN',
  grn_items: 'GRNItem',
  invoices: 'Invoice',
  invoice_items: 'InvoiceItem',
  centres: 'Centre',
  user_profiles: 'UserProfile',
  item_centre_stock: 'ItemCentreStock',
  payment_batches: 'PaymentBatch',
  purchase_indents: 'PurchaseIndent',
  rate_contracts: 'RateContract',
  rate_contract_items: 'RateContractItem',
  vendor_performance: 'VendorPerformance',
  activity_log: 'ActivityLog',
  stock_transfers: 'StockTransfer',
  stock_transfer_items: 'StockTransferItem',
  debit_notes: 'DebitNote',
  credit_notes: 'CreditNote',
}

// ─── Extract columns from SQL migrations ─────────────────────

function extractSQLColumns(tableName) {
  const columns = new Set()
  const sqlFiles = fs.readdirSync(SQL_DIR).filter(f => f.endsWith('.sql'))
  
  for (const file of sqlFiles) {
    const content = fs.readFileSync(path.join(SQL_DIR, file), 'utf-8')
    const regex = new RegExp(
      `ALTER TABLE ${tableName} ADD COLUMN(?:\\s+IF NOT EXISTS)?\\s+(\\w+)`,
      'gi'
    )
    let match
    while ((match = regex.exec(content)) !== null) {
      columns.add(match[1].toLowerCase())
    }
  }
  return columns
}

// ─── Extract fields from TypeScript interface ────────────────

function extractTypeFields(interfaceName) {
  const content = fs.readFileSync(TYPES_FILE, 'utf-8')
  const fields = new Set()
  
  // Find the interface block
  const regex = new RegExp(`export interface ${interfaceName}\\s*\\{([^}]+)\\}`, 's')
  const match = content.match(regex)
  if (!match) return fields
  
  const body = match[1]
  // Match field names (handles optional ?)
  const fieldRegex = /^\s+(\w+)\??:/gm
  let fieldMatch
  while ((fieldMatch = fieldRegex.exec(body)) !== null) {
    fields.add(fieldMatch[1].toLowerCase())
  }
  return fields
}

// ─── Main ────────────────────────────────────────────────────

let totalDrift = 0
const driftReport = []

for (const [table, iface] of Object.entries(TABLE_TO_INTERFACE)) {
  const sqlCols = extractSQLColumns(table)
  if (sqlCols.size === 0) continue
  
  const typeFields = extractTypeFields(iface)
  if (typeFields.size === 0) {
    console.warn(`⚠️  Interface ${iface} not found in types/database.ts`)
    continue
  }
  
  const missing = [...sqlCols].filter(col => !typeFields.has(col))
  
  if (missing.length > 0) {
    totalDrift += missing.length
    driftReport.push({ table, interface: iface, missing })
    console.log(`❌ ${iface} (${table}): ${missing.length} missing`)
    missing.forEach(col => console.log(`   - ${col}`))
  }
}

if (totalDrift === 0) {
  console.log('✅ No schema drift detected — types match all SQL migrations')
  process.exit(0)
} else {
  console.log(`\n❌ DRIFT DETECTED: ${totalDrift} columns across ${driftReport.length} tables`)
  console.log('   Fix: add missing fields to src/types/database.ts')
  process.exit(1)
}
