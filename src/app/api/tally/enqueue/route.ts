import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'

// ─── XML helpers ─────────────────────────────────────────────

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function envelope(companyName: string, reportName: string, data: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>${reportName}</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${data}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

// ─── XML Generators ──────────────────────────────────────────

function vendorLedgerXml(vendor: any): string {
  const ledgerName = vendor.tally_ledger_name || vendor.legal_name
  const tallyGroup = vendor.tally_group || 'Sundry Creditors'
  return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${escapeXml(ledgerName)}" ACTION="Create">
            <NAME>${escapeXml(ledgerName)}</NAME>
            <PARENT>${escapeXml(tallyGroup)}</PARENT>
            <ISBILLWISEON>Yes</ISBILLWISEON>
            <AFFECTSSTOCK>No</AFFECTSSTOCK>
            <COUNTRYOFRESIDENCE>India</COUNTRYOFRESIDENCE>
            <GSTREGISTRATIONTYPE>${vendor.gstin ? 'Regular' : 'Unknown'}</GSTREGISTRATIONTYPE>
            <PARTYGSTIN>${escapeXml(vendor.gstin || '')}</PARTYGSTIN>
            <INCOMETAXNUMBER>${escapeXml(vendor.pan || vendor.pan_number || '')}</INCOMETAXNUMBER>
            <LEDSTATENAME>${escapeXml(vendor.state || '')}</LEDSTATENAME>
            <CREDITPERIOD>${vendor.credit_period_days || 30} Days</CREDITPERIOD>
            <ADDRESS.LIST>
              <ADDRESS>${escapeXml(vendor.address || '')}</ADDRESS>
              <ADDRESS>${escapeXml([vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', '))}</ADDRESS>
            </ADDRESS.LIST>
            <LEDGERPHONE>${escapeXml(vendor.primary_contact_phone || '')}</LEDGERPHONE>
            <LEDGEREMAIL>${escapeXml(vendor.primary_contact_email || '')}</LEDGEREMAIL>
            <LEDGERCONTACT>${escapeXml(vendor.primary_contact_name || '')}</LEDGERCONTACT>
          </LEDGER>
        </TALLYMESSAGE>`
}

function stockGroupXml(categoryName: string): string {
  return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <STOCKGROUP NAME="${escapeXml(categoryName)}" ACTION="Create">
            <NAME>${escapeXml(categoryName)}</NAME>
            <PARENT>Primary</PARENT>
          </STOCKGROUP>
        </TALLYMESSAGE>`
}

function stockItemXml(item: any): string {
  const itemName = item.tally_item_name || item.generic_name
  const categoryName = item.category?.name || 'Primary'
  const unit = item.unit || 'Nos'
  return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <STOCKITEM NAME="${escapeXml(itemName)}" ACTION="Create">
            <NAME>${escapeXml(itemName)}</NAME>
            <PARENT>${escapeXml(categoryName)}</PARENT>
            <BASEUNITS>${escapeXml(unit)}</BASEUNITS>
            <HSNCODE>${escapeXml(item.hsn_code || '')}</HSNCODE>
            <GSTAPPLICABLE>Applicable</GSTAPPLICABLE>
            <GSTTYPEOFSUPPLY>Goods</GSTTYPEOFSUPPLY>
          </STOCKITEM>
        </TALLYMESSAGE>`
}

function purchaseVoucherXml(invoice: any, invoiceItems: any[], vendor: any, config: any): string {
  const invDate = format(new Date(invoice.vendor_invoice_date || invoice.created_at), 'yyyyMMdd')
  const vendorLedger = vendor.tally_ledger_name || vendor.legal_name
  const purchaseLedger = config.purchase_ledger_general || 'Purchase Account'

  let ledgerEntries = ''

  // Credit vendor (total amount)
  ledgerEntries += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(vendorLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${invoice.total_amount}</AMOUNT>
              <BILLALLOCATIONS.LIST>
                <NAME>${escapeXml(invoice.vendor_invoice_no)}</NAME>
                <BILLTYPE>New Ref</BILLTYPE>
                <AMOUNT>${invoice.total_amount}</AMOUNT>
              </BILLALLOCATIONS.LIST>
            </ALLLEDGERENTRIES.LIST>`

  // GST entries
  const cgstTotal = invoiceItems.reduce((s: number, i: any) => s + (Number(i.cgst_amount) || 0), 0)
  const sgstTotal = invoiceItems.reduce((s: number, i: any) => s + (Number(i.sgst_amount) || 0), 0)
  const igstTotal = invoiceItems.reduce((s: number, i: any) => s + (Number(i.igst_amount) || 0), 0)

  if (cgstTotal > 0) {
    ledgerEntries += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(config.cgst_input_ledger || 'CGST Input')}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${cgstTotal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`
  }
  if (sgstTotal > 0) {
    ledgerEntries += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(config.sgst_input_ledger || 'SGST Input')}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${sgstTotal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`
  }
  if (igstTotal > 0) {
    ledgerEntries += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(config.igst_input_ledger || 'IGST Input')}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${igstTotal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`
  }

  // TDS entry
  if (invoice.tds_amount && Number(invoice.tds_amount) > 0) {
    ledgerEntries += `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(config.tds_payable_ledger || 'TDS Payable')}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${invoice.tds_amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`
  }

  // Inventory entries
  let inventoryEntries = ''
  invoiceItems.forEach((li: any) => {
    const itemName = li.item?.tally_item_name || li.item?.generic_name || li.description || 'Unknown Item'
    const unit = li.item?.unit || 'Nos'
    inventoryEntries += `
            <ALLINVENTORYENTRIES.LIST>
              <STOCKITEMNAME>${escapeXml(itemName)}</STOCKITEMNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <RATE>${li.rate}/${escapeXml(unit)}</RATE>
              <AMOUNT>-${li.taxable_amount || li.total_amount}</AMOUNT>
              <ACTUALQTY>${li.quantity} ${escapeXml(unit)}</ACTUALQTY>
              <BILLEDQTY>${li.quantity} ${escapeXml(unit)}</BILLEDQTY>
              <ACCOUNTINGALLOCATIONS.LIST>
                <LEDGERNAME>${escapeXml(purchaseLedger)}</LEDGERNAME>
                <AMOUNT>-${li.taxable_amount || li.total_amount}</AMOUNT>
              </ACCOUNTINGALLOCATIONS.LIST>
            </ALLINVENTORYENTRIES.LIST>`
  })

  return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create">
            <DATE>${invDate}</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(invoice.vendor_invoice_no)}</VOUCHERNUMBER>
            <REFERENCE>${escapeXml(invoice.invoice_ref)}</REFERENCE>
            <PARTYLEDGERNAME>${escapeXml(vendorLedger)}</PARTYLEDGERNAME>
            <BASICBASEPARTYNAME>${escapeXml(vendorLedger)}</BASICBASEPARTYNAME>
            <ISINVOICE>Yes</ISINVOICE>
            <PERSISTEDVIEW>Invoice Voucher View</PERSISTEDVIEW>
            <NARRATION>VPMS Ref: ${escapeXml(invoice.invoice_ref)} | Vendor: ${escapeXml(vendor.legal_name)}</NARRATION>${ledgerEntries}${inventoryEntries}
          </VOUCHER>
        </TALLYMESSAGE>`
}

function paymentVoucherXml(batch: any, batchItem: any, vendor: any, config: any): string {
  const payDate = format(new Date(batch.payment_date || batch.batch_date), 'yyyyMMdd')
  const vendorLedger = vendor.tally_ledger_name || vendor.legal_name
  const bankLedger = (batchItem.payment_mode === 'cash')
    ? (config.cash_ledger || 'Cash')
    : (config.bank_ledger || 'Bank Account')

  let tdsEntry = ''
  if (batchItem.tds_amount && Number(batchItem.tds_amount) > 0) {
    tdsEntry = `
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(config.tds_payable_ledger || 'TDS Payable')}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${batchItem.tds_amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>`
  }

  return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create">
            <DATE>${payDate}</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(batch.batch_number)}</VOUCHERNUMBER>
            <REFERENCE>${escapeXml(batchItem.utr_number || batchItem.reference_number || '')}</REFERENCE>
            <PARTYLEDGERNAME>${escapeXml(vendorLedger)}</PARTYLEDGERNAME>
            <NARRATION>Payment: ${escapeXml(batch.batch_number)} | ${escapeXml(batchItem.payment_mode || 'NEFT')} | UTR: ${escapeXml(batchItem.utr_number || 'N/A')}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(vendorLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${batchItem.net_payable || batchItem.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(bankLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${batchItem.net_payable || batchItem.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>${tdsEntry}
          </VOUCHER>
        </TALLYMESSAGE>`
}

function debitNoteXml(dn: any, vendor: any, config: any): string {
  const noteDate = format(new Date(dn.created_at), 'yyyyMMdd')
  const vendorLedger = vendor.tally_ledger_name || vendor.legal_name
  const purchaseLedger = config.purchase_ledger_general || 'Purchase Account'

  return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Debit Note" ACTION="Create">
            <DATE>${noteDate}</DATE>
            <VOUCHERTYPENAME>Debit Note</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(dn.debit_note_number)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${escapeXml(vendorLedger)}</PARTYLEDGERNAME>
            <NARRATION>Debit Note: ${escapeXml(dn.debit_note_number)} | Reason: ${escapeXml(dn.reason)}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(vendorLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${dn.total_amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(purchaseLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${dn.subtotal || dn.total_amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`
}

function creditNoteXml(cn: any, vendor: any, config: any): string {
  const noteDate = format(new Date(cn.created_at), 'yyyyMMdd')
  const vendorLedger = vendor.tally_ledger_name || vendor.legal_name
  const purchaseLedger = config.purchase_ledger_general || 'Purchase Account'

  return `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Credit Note" ACTION="Create">
            <DATE>${noteDate}</DATE>
            <VOUCHERTYPENAME>Credit Note</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(cn.credit_note_number)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${escapeXml(vendorLedger)}</PARTYLEDGERNAME>
            <NARRATION>Credit Note: ${escapeXml(cn.credit_note_number)} | Reason: ${escapeXml(cn.reason)}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(vendorLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${cn.total_amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(purchaseLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${cn.subtotal || cn.total_amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`
}

// ─── Entity type to priority mapping ─────────────────────────
const PRIORITY: Record<string, number> = {
  stock_group: 10,
  stock_item: 9,
  vendor_ledger: 8,
  purchase_voucher: 5,
  payment_voucher: 5,
  debit_note: 5,
  credit_note: 5,
}

// ─── Main handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { supabase, user } = await requireApiAuth()
  try {
    const body = await req.json()
    const { entity_type, entity_ids, centre_id } = body as {
      entity_type: string
      entity_ids?: string[]
      centre_id?: string
    }

    if (!entity_type) {
      return NextResponse.json({ error: 'entity_type is required' }, { status: 400 })
    }

    // Get config
    const { data: config } = await supabase
      .from('tally_company_config')
      .select('*')
      .limit(1)
      .single()

    if (!config) {
      return NextResponse.json({ error: 'Tally config not found. Configure in Settings → Tally.' }, { status: 400 })
    }

    const companyName = config.company_name
    const queueItems: {
      centre_id: string
      direction: string
      entity_type: string
      entity_id: string | null
      entity_ref: string
      priority: number
      tally_xml_request: string
      created_by: string
    }[] = []

    // ── Vendor Ledgers ──────────────────────────────────
    if (entity_type === 'vendor_ledger') {
      let query = supabase.from('vendors').select('*').eq('status', 'active').is('deleted_at', null)
      if (entity_ids?.length) query = query.in('id', entity_ids)

      const { data: vendors, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      for (const v of vendors || []) {
        const xml = envelope(companyName, 'All Masters', vendorLedgerXml(v))
        queueItems.push({
          centre_id: config.centre_id,
          direction: 'vpms_to_tally',
          entity_type: 'vendor_ledger',
          entity_id: v.id,
          entity_ref: v.tally_ledger_name || v.legal_name,
          priority: PRIORITY.vendor_ledger,
          tally_xml_request: xml,
          created_by: user.id,
        })
      }
    }

    // ── Stock Items ──────────────────────────────────────
    else if (entity_type === 'stock_item') {
      let query = supabase.from('items').select('*, category:item_categories(name)').eq('is_active', true).is('deleted_at', null)
      if (entity_ids?.length) query = query.in('id', entity_ids)

      const { data: items, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      // Collect unique categories for stock groups
      const categories = new Set<string>()
      for (const item of items || []) {
        if (item.category?.name) categories.add(item.category.name)
      }

      // Queue stock groups first (higher priority)
      for (const catName of Array.from(categories)) {
        const xml = envelope(companyName, 'All Masters', stockGroupXml(catName))
        queueItems.push({
          centre_id: config.centre_id,
          direction: 'vpms_to_tally',
          entity_type: 'stock_group',
          entity_id: null,
          entity_ref: catName,
          priority: PRIORITY.stock_group,
          tally_xml_request: xml,
          created_by: user.id,
        })
      }

      // Queue stock items
      for (const item of items || []) {
        const xml = envelope(companyName, 'All Masters', stockItemXml(item))
        queueItems.push({
          centre_id: config.centre_id,
          direction: 'vpms_to_tally',
          entity_type: 'stock_item',
          entity_id: item.id,
          entity_ref: item.tally_item_name || item.generic_name,
          priority: PRIORITY.stock_item,
          tally_xml_request: xml,
          created_by: user.id,
        })
      }
    }

    // ── Purchase Vouchers (Invoices) ─────────────────────
    else if (entity_type === 'purchase_voucher') {
      let query = supabase.from('invoices')
        .select('*, vendor:vendors(*), items:invoice_items(*, item:items(generic_name, tally_item_name, unit))')
        .eq('status', 'approved')
      if (entity_ids?.length) query = query.in('id', entity_ids)
      else query = query.is('tally_synced_at', null) // Only unsynced

      const { data: invoices, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      for (const inv of invoices || []) {
        const xml = envelope(companyName, 'Vouchers', purchaseVoucherXml(inv, inv.items || [], inv.vendor, config))
        queueItems.push({
          centre_id: config.centre_id,
          direction: 'vpms_to_tally',
          entity_type: 'purchase_voucher',
          entity_id: inv.id,
          entity_ref: inv.vendor_invoice_no,
          priority: PRIORITY.purchase_voucher,
          tally_xml_request: xml,
          created_by: user.id,
        })
      }
    }

    // ── Payment Vouchers ─────────────────────────────────
    else if (entity_type === 'payment_voucher') {
      let query = supabase.from('payment_batches')
        .select('*, items:payment_batch_items(*, vendor:vendors(*))')
        .eq('status', 'processed')
      if (entity_ids?.length) query = query.in('id', entity_ids)
      else query = query.is('tally_synced_at', null)

      const { data: batches, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      for (const batch of batches || []) {
        for (const batchItem of batch.items || []) {
          if (!batchItem.vendor) continue
          const xml = envelope(companyName, 'Vouchers', paymentVoucherXml(batch, batchItem, batchItem.vendor, config))
          queueItems.push({
            centre_id: config.centre_id,
            direction: 'vpms_to_tally',
            entity_type: 'payment_voucher',
            entity_id: batch.id,
            entity_ref: batch.batch_number,
            priority: PRIORITY.payment_voucher,
            tally_xml_request: xml,
            created_by: user.id,
          })
        }
      }
    }

    // ── Debit Notes ──────────────────────────────────────
    else if (entity_type === 'debit_note') {
      let query = supabase.from('debit_notes').select('*, vendor:vendors(*)')
      if (entity_ids?.length) query = query.in('id', entity_ids)
      else query = query.is('tally_synced_at', null)

      const { data: notes, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      for (const dn of notes || []) {
        if (!dn.vendor) continue
        const xml = envelope(companyName, 'Vouchers', debitNoteXml(dn, dn.vendor, config))
        queueItems.push({
          centre_id: config.centre_id,
          direction: 'vpms_to_tally',
          entity_type: 'debit_note',
          entity_id: dn.id,
          entity_ref: dn.debit_note_number,
          priority: PRIORITY.debit_note,
          tally_xml_request: xml,
          created_by: user.id,
        })
      }
    }

    // ── Credit Notes ─────────────────────────────────────
    else if (entity_type === 'credit_note') {
      let query = supabase.from('credit_notes').select('*, vendor:vendors(*)')
      if (entity_ids?.length) query = query.in('id', entity_ids)
      else query = query.is('tally_synced_at', null)

      const { data: notes, error } = await query
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      for (const cn of notes || []) {
        if (!cn.vendor) continue
        const xml = envelope(companyName, 'Vouchers', creditNoteXml(cn, cn.vendor, config))
        queueItems.push({
          centre_id: config.centre_id,
          direction: 'vpms_to_tally',
          entity_type: 'credit_note',
          entity_id: cn.id,
          entity_ref: cn.credit_note_number,
          priority: PRIORITY.credit_note,
          tally_xml_request: xml,
          created_by: user.id,
        })
      }
    }

    // ── Bulk insert into queue ────────────────────────────
    if (queueItems.length === 0) {
      return NextResponse.json({ queued: 0, message: 'No records to sync' })
    }

    const { error: insertErr } = await supabase.from('tally_sync_queue').insert(queueItems)
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'tally_enqueued',
      entity_type: entity_type,
      details: { count: queueItems.length, entity_type },
    })

    return NextResponse.json({
      queued: queueItems.length,
      entity_type,
      message: `${queueItems.length} items queued for Tally sync`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
