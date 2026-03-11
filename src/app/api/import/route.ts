import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

type ImportType = 'vendors' | 'items' | 'vendor_items' | 'opening_stock' | 'vendor_outstanding'

interface ImportResult {
  total: number
  success: number
  failed: number
  errors: { row: number; field?: string; message: string }[]
  created_codes?: string[]
}

// ─── Helpers ──────────────────────────────────────────────
function parseYesNo(val: string | undefined | null): boolean {
  if (!val) return false
  return ['yes', 'y', 'true', '1'].includes(String(val).toLowerCase().trim())
}

function clean(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

function cleanNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

const VALID_CATEGORIES = ['pharma', 'surgical', 'equipment', 'consumable', 'lab', 'housekeeping', 'it', 'other']
const VALID_UNITS = ['strip', 'tablet', 'vial', 'bottle', 'box', 'nos', 'kg', 'litre', 'pair', 'set', 'roll', 'pack', 'ea']
const VALID_BANK_TYPES = ['savings', 'current', 'cc', 'od']
const VALID_CENTRE_CODES = ['SHI', 'VAS', 'MOD', 'UDA', 'GAN']

// ─── Parse uploaded file ──────────────────────────────────
async function parseFile(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = wb.SheetNames[0] // Always use first sheet
  const sheet = wb.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  return rows
}

// ─── VENDOR IMPORT ────────────────────────────────────────
async function importVendors(
  rows: Record<string, string>[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ImportResult> {
  const result: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [], created_codes: [] }

  // Load centres for mapping
  const { data: centres } = await supabase.from('centres').select('id, code')
  const centreMap = new Map(centres?.map(c => [c.code, c.id]) || [])

  // Load vendor categories
  const { data: categories } = await supabase.from('vendor_categories').select('id, name, code')

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // Excel row number (header=1)

    try {
      const legalName = clean(row.legal_name)
      if (!legalName) {
        result.errors.push({ row: rowNum, field: 'legal_name', message: 'Legal name is required' })
        result.failed++
        continue
      }

      const categoryName = clean(row.category).toLowerCase()
      if (!categoryName) {
        result.errors.push({ row: rowNum, field: 'category', message: 'Category is required' })
        result.failed++
        continue
      }

      // Find or create category
      let categoryId: string | null = null
      const existingCat = categories?.find(c =>
        c.name.toLowerCase() === categoryName || c.code.toLowerCase() === categoryName
      )
      if (existingCat) {
        categoryId = existingCat.id
      } else if (VALID_CATEGORIES.includes(categoryName)) {
        const code = categoryName.toUpperCase().slice(0, 4)
        const { data: newCat } = await supabase
          .from('vendor_categories')
          .insert({ name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1), code, description: 'Auto-created during import' })
          .select('id')
          .single()
        if (newCat) {
          categoryId = newCat.id
          categories?.push({ id: newCat.id, name: categoryName, code })
        }
      }

      // GSTIN validation
      const gstin = clean(row.gstin)
      if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
        result.errors.push({ row: rowNum, field: 'gstin', message: `Invalid GSTIN format: ${gstin}` })
        result.failed++
        continue
      }

      // PAN validation
      const pan = clean(row.pan)
      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
        result.errors.push({ row: rowNum, field: 'pan', message: `Invalid PAN format: ${pan}` })
        result.failed++
        continue
      }

      // Check duplicate GSTIN
      if (gstin) {
        const { data: existing } = await supabase
          .from('vendors')
          .select('id, vendor_code')
          .eq('gstin', gstin)
          .maybeSingle()
        if (existing) {
          result.errors.push({ row: rowNum, field: 'gstin', message: `Duplicate GSTIN — already exists as ${existing.vendor_code}` })
          result.failed++
          continue
        }
      }

      // Parse centres served
      const centresServed = clean(row.centres_served)
      let approvedCentres: string[] | null = null
      if (centresServed && centresServed.toUpperCase() !== 'ALL') {
        const codes = centresServed.split(',').map(c => c.trim().toUpperCase())
        const ids = codes.map(c => centreMap.get(c)).filter(Boolean) as string[]
        if (ids.length > 0) approvedCentres = ids
      }

      // Bank account type
      const bankType = clean(row.bank_account_type).toLowerCase()
      const validBankType = VALID_BANK_TYPES.includes(bankType) ? bankType : 'current'

      // Generate vendor code
      const { data: seqData } = await supabase.rpc('next_sequence_number', {
        seq_name: 'vendor_code_seq',
        seq_type: 'vendor',
        centre_code: 'XXX'
      })
      const vendorCode = seqData || `H1V-${String(Date.now()).slice(-4)}`

      const { error } = await supabase.from('vendors').insert({
        vendor_code: vendorCode,
        legal_name: legalName,
        trade_name: clean(row.trade_name) || null,
        category_id: categoryId,
        gstin: gstin || null,
        pan: pan || null,
        drug_license_no: clean(row.drug_license_no) || null,
        primary_contact_name: clean(row.primary_contact_name) || null,
        primary_contact_phone: clean(row.primary_contact_phone) || null,
        primary_contact_email: clean(row.primary_contact_email) || null,
        address: clean(row.address) || null,
        city: clean(row.city) || null,
        state: clean(row.state) || null,
        pincode: clean(row.pincode) || null,
        bank_name: clean(row.bank_name) || null,
        bank_account_no: clean(row.bank_account_no) || null,
        bank_ifsc: clean(row.bank_ifsc) || null,
        bank_account_type: clean(row.bank_name) ? validBankType : null,
        credit_period_days: cleanNumber(row.credit_period_days) ?? 30,
        credit_limit: cleanNumber(row.credit_limit),
        approved_centres: approvedCentres,
        status: 'active',
      })

      if (error) {
        result.errors.push({ row: rowNum, message: error.message })
        result.failed++
      } else {
        result.success++
        result.created_codes?.push(vendorCode)
      }
    } catch (err) {
      result.errors.push({ row: rowNum, message: String(err) })
      result.failed++
    }
  }

  return result
}

// ─── ITEM IMPORT ──────────────────────────────────────────
async function importItems(
  rows: Record<string, string>[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ImportResult> {
  const result: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [], created_codes: [] }

  // Load item categories
  const { data: categories } = await supabase.from('item_categories').select('id, name, code, parent_id')

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    try {
      const genericName = clean(row.generic_name)
      if (!genericName) {
        result.errors.push({ row: rowNum, field: 'generic_name', message: 'Generic name is required' })
        result.failed++
        continue
      }

      const unit = clean(row.unit).toUpperCase()
      if (!unit) {
        result.errors.push({ row: rowNum, field: 'unit', message: 'Unit is required' })
        result.failed++
        continue
      }
      if (!VALID_UNITS.includes(unit.toLowerCase())) {
        result.errors.push({ row: rowNum, field: 'unit', message: `Invalid unit: ${unit}. Valid: ${VALID_UNITS.join(', ')}` })
        result.failed++
        continue
      }

      // Check duplicate
      const { data: existing } = await supabase
        .from('items')
        .select('id, item_code')
        .eq('generic_name', genericName)
        .maybeSingle()
      if (existing) {
        result.errors.push({ row: rowNum, field: 'generic_name', message: `Duplicate item — already exists as ${existing.item_code}` })
        result.failed++
        continue
      }

      // Find or create category
      let categoryId: string | null = null
      const catName = clean(row.category)
      if (catName) {
        const existingCat = categories?.find(c =>
          c.name.toLowerCase() === catName.toLowerCase() && !c.parent_id
        )
        if (existingCat) {
          categoryId = existingCat.id

          // Check for sub-category
          const subCatName = clean(row.sub_category)
          if (subCatName) {
            const existingSub = categories?.find(c =>
              c.name.toLowerCase() === subCatName.toLowerCase() && c.parent_id === existingCat.id
            )
            if (existingSub) {
              categoryId = existingSub.id
            } else {
              const code = subCatName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
              const { data: newSub } = await supabase
                .from('item_categories')
                .insert({ name: subCatName, code: code + '_' + Date.now().toString(36).slice(-3), parent_id: existingCat.id })
                .select('id')
                .single()
              if (newSub) {
                categoryId = newSub.id
                categories?.push({ id: newSub.id, name: subCatName, code, parent_id: existingCat.id })
              }
            }
          }
        } else {
          const code = catName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
          const { data: newCat } = await supabase
            .from('item_categories')
            .insert({ name: catName, code: code + '_' + Date.now().toString(36).slice(-3) })
            .select('id')
            .single()
          if (newCat) {
            categoryId = newCat.id
            categories?.push({ id: newCat.id, name: catName, code, parent_id: null })
          }
        }
      }

      const gstPercent = cleanNumber(row.gst_percent) ?? 12

      // Generate item code
      const { data: seqData } = await supabase.rpc('next_sequence_number', {
        seq_name: 'item_code_seq',
        seq_type: 'item',
        centre_code: 'XXX'
      })
      const itemCode = seqData || `H1I-${String(Date.now()).slice(-5)}`

      const { error } = await supabase.from('items').insert({
        item_code: itemCode,
        generic_name: genericName,
        brand_name: clean(row.brand_name) || null,
        category_id: categoryId,
        unit: unit,
        hsn_code: clean(row.hsn_code) || null,
        gst_percent: gstPercent,
        shelf_life_days: cleanNumber(row.shelf_life_days),
        is_cold_chain: parseYesNo(row.is_cold_chain),
        is_narcotic: parseYesNo(row.is_narcotic),
        is_high_alert: parseYesNo(row.is_high_alert),
        ecw_item_code: clean(row.ecw_item_code) || null,
        tally_item_name: clean(row.tally_item_name) || null,
        notes: clean(row.notes) || null,
      })

      if (error) {
        result.errors.push({ row: rowNum, message: error.message })
        result.failed++
      } else {
        result.success++
        result.created_codes?.push(itemCode)
      }
    } catch (err) {
      result.errors.push({ row: rowNum, message: String(err) })
      result.failed++
    }
  }

  return result
}

// ─── VENDOR-ITEM MAPPING IMPORT ───────────────────────────
async function importVendorItems(
  rows: Record<string, string>[],
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ImportResult> {
  const result: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [] }

  // Pre-load vendors and items for lookup
  const { data: vendors } = await supabase.from('vendors').select('id, vendor_code, gstin, legal_name').is('deleted_at', null)
  const { data: items } = await supabase.from('items').select('id, item_code, generic_name').is('deleted_at', null)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    try {
      const vendorRef = clean(row.vendor_gstin_or_name)
      const itemName = clean(row.item_generic_name)

      if (!vendorRef) {
        result.errors.push({ row: rowNum, field: 'vendor_gstin_or_name', message: 'Vendor reference is required' })
        result.failed++
        continue
      }
      if (!itemName) {
        result.errors.push({ row: rowNum, field: 'item_generic_name', message: 'Item name is required' })
        result.failed++
        continue
      }

      // Find vendor
      const vendor = vendors?.find(v =>
        v.gstin === vendorRef || v.legal_name?.toLowerCase() === vendorRef.toLowerCase()
      )
      if (!vendor) {
        result.errors.push({ row: rowNum, field: 'vendor_gstin_or_name', message: `Vendor not found: ${vendorRef}` })
        result.failed++
        continue
      }

      // Find item
      const item = items?.find(it => it.generic_name?.toLowerCase() === itemName.toLowerCase())
      if (!item) {
        result.errors.push({ row: rowNum, field: 'item_generic_name', message: `Item not found: ${itemName}` })
        result.failed++
        continue
      }

      const lRank = cleanNumber(row.l_rank)
      if (lRank && ![1, 2, 3].includes(lRank)) {
        result.errors.push({ row: rowNum, field: 'l_rank', message: 'L-rank must be 1, 2, or 3' })
        result.failed++
        continue
      }

      const { error } = await supabase.from('vendor_items').upsert({
        vendor_id: vendor.id,
        item_id: item.id,
        l_rank: lRank,
        last_quoted_rate: cleanNumber(row.last_quoted_rate),
        is_preferred: parseYesNo(row.is_preferred),
      }, { onConflict: 'vendor_id,item_id' })

      if (error) {
        result.errors.push({ row: rowNum, message: error.message })
        result.failed++
      } else {
        result.success++
      }
    } catch (err) {
      result.errors.push({ row: rowNum, message: String(err) })
      result.failed++
    }
  }

  return result
}

// ─── OPENING STOCK IMPORT ─────────────────────────────────
async function importOpeningStock(
  rows: Record<string, string>[],
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [] }

  const { data: centres } = await supabase.from('centres').select('id, code')
  const centreMap = new Map(centres?.map(c => [c.code, c.id]) || [])
  const { data: items } = await supabase.from('items').select('id, item_code, generic_name').is('deleted_at', null)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    try {
      const itemName = clean(row.item_generic_name)
      const centreCode = clean(row.centre_code).toUpperCase()
      const currentStock = cleanNumber(row.current_stock)

      if (!itemName) {
        result.errors.push({ row: rowNum, field: 'item_generic_name', message: 'Item name is required' })
        result.failed++
        continue
      }
      if (!centreCode || !VALID_CENTRE_CODES.includes(centreCode)) {
        result.errors.push({ row: rowNum, field: 'centre_code', message: `Invalid centre code: ${centreCode}` })
        result.failed++
        continue
      }
      if (currentStock === null || currentStock < 0) {
        result.errors.push({ row: rowNum, field: 'current_stock', message: 'Valid stock quantity is required' })
        result.failed++
        continue
      }

      const centreId = centreMap.get(centreCode)
      if (!centreId) {
        result.errors.push({ row: rowNum, field: 'centre_code', message: `Centre not found: ${centreCode}` })
        result.failed++
        continue
      }

      const item = items?.find(it => it.generic_name?.toLowerCase() === itemName.toLowerCase())
      if (!item) {
        result.errors.push({ row: rowNum, field: 'item_generic_name', message: `Item not found: ${itemName}` })
        result.failed++
        continue
      }

      // Upsert stock
      const { error } = await supabase.from('item_centre_stock').upsert({
        item_id: item.id,
        centre_id: centreId,
        current_stock: currentStock,
        reorder_level: cleanNumber(row.reorder_level) ?? 0,
        max_level: cleanNumber(row.max_level) ?? 0,
        last_grn_rate: cleanNumber(row.last_grn_rate),
        avg_daily_consumption: cleanNumber(row.avg_daily_consumption),
      }, { onConflict: 'item_id,centre_id' })

      if (error) {
        result.errors.push({ row: rowNum, message: error.message })
        result.failed++
        continue
      }

      // Write opening balance to stock ledger
      await supabase.from('stock_ledger').insert({
        centre_id: centreId,
        item_id: item.id,
        transaction_type: 'opening',
        quantity: currentStock,
        balance_after: currentStock,
        reference_number: 'OPENING-IMPORT',
        notes: 'Opening stock imported from bulk upload',
        created_by: userId,
      })

      result.success++
    } catch (err) {
      result.errors.push({ row: rowNum, message: String(err) })
      result.failed++
    }
  }

  return result
}

// ─── VENDOR OUTSTANDING IMPORT ────────────────────────────
async function importVendorOutstanding(
  rows: Record<string, string>[],
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = { total: rows.length, success: 0, failed: 0, errors: [] }

  const { data: centres } = await supabase.from('centres').select('id, code')
  const centreMap = new Map(centres?.map(c => [c.code, c.id]) || [])
  const { data: vendors } = await supabase.from('vendors').select('id, vendor_code, gstin, legal_name, credit_period_days').is('deleted_at', null)

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    try {
      const vendorRef = clean(row.vendor_gstin_or_name)
      const invoiceNo = clean(row.vendor_invoice_no)
      const centreCode = clean(row.centre_code).toUpperCase()
      const totalAmount = cleanNumber(row.total_amount)
      const invoiceDateStr = clean(row.vendor_invoice_date)

      if (!vendorRef) {
        result.errors.push({ row: rowNum, field: 'vendor_gstin_or_name', message: 'Vendor reference is required' })
        result.failed++
        continue
      }
      if (!invoiceNo) {
        result.errors.push({ row: rowNum, field: 'vendor_invoice_no', message: 'Invoice number is required' })
        result.failed++
        continue
      }
      if (!centreCode || !VALID_CENTRE_CODES.includes(centreCode)) {
        result.errors.push({ row: rowNum, field: 'centre_code', message: `Invalid centre code: ${centreCode}` })
        result.failed++
        continue
      }
      if (!totalAmount || totalAmount <= 0) {
        result.errors.push({ row: rowNum, field: 'total_amount', message: 'Valid total amount is required' })
        result.failed++
        continue
      }
      if (!invoiceDateStr) {
        result.errors.push({ row: rowNum, field: 'vendor_invoice_date', message: 'Invoice date is required' })
        result.failed++
        continue
      }

      const centreId = centreMap.get(centreCode)
      if (!centreId) {
        result.errors.push({ row: rowNum, field: 'centre_code', message: `Centre not found: ${centreCode}` })
        result.failed++
        continue
      }

      const vendor = vendors?.find(v =>
        v.gstin === vendorRef || v.legal_name?.toLowerCase() === vendorRef.toLowerCase()
      )
      if (!vendor) {
        result.errors.push({ row: rowNum, field: 'vendor_gstin_or_name', message: `Vendor not found: ${vendorRef}` })
        result.failed++
        continue
      }

      // Check duplicate vendor_id + vendor_invoice_no
      const { data: existing } = await supabase
        .from('invoices')
        .select('id, invoice_ref')
        .eq('vendor_id', vendor.id)
        .eq('vendor_invoice_no', invoiceNo)
        .maybeSingle()
      if (existing) {
        result.errors.push({ row: rowNum, message: `Duplicate invoice — already exists as ${existing.invoice_ref}` })
        result.failed++
        continue
      }

      // Parse dates
      const invoiceDate = new Date(invoiceDateStr)
      if (isNaN(invoiceDate.getTime())) {
        result.errors.push({ row: rowNum, field: 'vendor_invoice_date', message: `Invalid date: ${invoiceDateStr}` })
        result.failed++
        continue
      }

      const dueDateStr = clean(row.due_date)
      let dueDate: Date
      if (dueDateStr) {
        dueDate = new Date(dueDateStr)
        if (isNaN(dueDate.getTime())) {
          dueDate = new Date(invoiceDate.getTime() + (vendor.credit_period_days || 30) * 86400000)
        }
      } else {
        dueDate = new Date(invoiceDate.getTime() + (vendor.credit_period_days || 30) * 86400000)
      }

      const gstAmount = cleanNumber(row.gst_amount) ?? 0
      const paidAmount = cleanNumber(row.paid_amount) ?? 0
      const subtotal = totalAmount - gstAmount

      // Determine payment status
      let paymentStatus = 'unpaid'
      if (paidAmount >= totalAmount) paymentStatus = 'paid'
      else if (paidAmount > 0) paymentStatus = 'partial'

      // Generate invoice ref
      const { data: seqData } = await supabase.rpc('next_sequence_number', {
        seq_name: 'invoice_ref_seq',
        seq_type: 'invoice',
        centre_code: centreCode
      })
      const invoiceRef = seqData || `H1-${centreCode}-INV-IMPORT-${String(Date.now()).slice(-6)}`

      const { error } = await supabase.from('invoices').insert({
        invoice_ref: invoiceRef,
        vendor_invoice_no: invoiceNo,
        vendor_invoice_date: invoiceDate.toISOString().split('T')[0],
        centre_id: centreId,
        vendor_id: vendor.id,
        subtotal: subtotal,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        match_status: 'pending',
        credit_period_days: vendor.credit_period_days || 30,
        due_date: dueDate.toISOString().split('T')[0],
        payment_status: paymentStatus,
        paid_amount: paidAmount,
        status: 'approved',
        created_by: userId,
      })

      if (error) {
        result.errors.push({ row: rowNum, message: error.message })
        result.failed++
      } else {
        result.success++
      }
    } catch (err) {
      result.errors.push({ row: rowNum, message: String(err) })
      result.failed++
    }
  }

  return result
}

// ─── MAIN HANDLER ─────────────────────────────────────────
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check role — only admin/CAO can bulk import
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['group_admin', 'group_cao'].includes(profile.role)) {
    return NextResponse.json({ error: 'Only Group Admin or CAO can perform bulk imports' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const importType = formData.get('type') as ImportType | null

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }
  if (!importType) {
    return NextResponse.json({ error: 'Import type is required' }, { status: 400 })
  }

  const validTypes: ImportType[] = ['vendors', 'items', 'vendor_items', 'opening_stock', 'vendor_outstanding']
  if (!validTypes.includes(importType)) {
    return NextResponse.json({ error: `Invalid type. Valid: ${validTypes.join(', ')}` }, { status: 400 })
  }

  // Parse file
  let rows: Record<string, string>[]
  try {
    rows = await parseFile(file)
  } catch {
    return NextResponse.json({ error: 'Failed to parse file. Ensure it is a valid .xlsx or .csv file' }, { status: 400 })
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 })
  }

  if (rows.length > 5000) {
    return NextResponse.json({ error: 'Maximum 5000 rows per import. Please split your file.' }, { status: 400 })
  }

  // Run import
  let result: ImportResult
  switch (importType) {
    case 'vendors':
      result = await importVendors(rows, supabase)
      break
    case 'items':
      result = await importItems(rows, supabase)
      break
    case 'vendor_items':
      result = await importVendorItems(rows, supabase)
      break
    case 'opening_stock':
      result = await importOpeningStock(rows, supabase, user.id)
      break
    case 'vendor_outstanding':
      result = await importVendorOutstanding(rows, supabase, user.id)
      break
  }

  // Log the import
  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: 'bulk_import',
    entity_type: importType,
    details: {
      total: result.total,
      success: result.success,
      failed: result.failed,
      error_count: result.errors.length,
    }
  })

  return NextResponse.json(result)
}
