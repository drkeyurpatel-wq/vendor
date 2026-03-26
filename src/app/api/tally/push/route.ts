import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'
import { tallyPushSchema } from '@/lib/validations'

const TALLY_URL = process.env.TALLY_SERVER_URL || ''
const COMPANY_NAME = 'Health1 Super Speciality Hospitals Pvt. Ltd.'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildPurchaseVoucherXml(po: any, items: any[], vendor: any): string {
  const poDate = format(new Date(po.po_date), 'yyyyMMdd')
  const vendorLedger = vendor.tally_ledger_name || vendor.legal_name

  let ledgerEntries = ''
  // Credit vendor (total amount)
  ledgerEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(vendorLedger)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${po.net_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`

  // Debit purchase account (subtotal minus discounts)
  const purchaseAmount = po.subtotal - po.discount_amount
  ledgerEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Purchase Account</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${purchaseAmount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`

  // GST entries
  if (po.cgst_amount > 0) {
    ledgerEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input CGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${po.cgst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }
  if (po.sgst_amount > 0) {
    ledgerEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${po.sgst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }
  if (po.igst_amount > 0) {
    ledgerEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input IGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${po.igst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }

  // TDS entry
  if (po.tds_applicable && po.tds_amount > 0) {
    ledgerEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>TDS Payable - ${po.tds_section || 'Section 194C'}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${po.tds_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }

  // Other charges
  if (po.freight_amount > 0) {
    ledgerEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Freight Charges</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${po.freight_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }

  // Inventory entries for each line item
  let inventoryEntries = ''
  items.forEach((item: any) => {
    const itemName = item.item?.tally_item_name || item.item?.generic_name || 'Unknown Item'
    inventoryEntries += `
        <ALLINVENTORYENTRIES.LIST>
          <STOCKITEMNAME>${escapeXml(itemName)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <RATE>${item.rate}/${escapeXml(item.unit || 'Nos')}</RATE>
          <AMOUNT>-${item.total_amount}</AMOUNT>
          <ACTUALQTY>${item.ordered_qty} ${escapeXml(item.unit || 'Nos')}</ACTUALQTY>
          <BILLEDQTY>${item.ordered_qty} ${escapeXml(item.unit || 'Nos')}</BILLEDQTY>
        </ALLINVENTORYENTRIES.LIST>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(COMPANY_NAME)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create">
            <DATE>${poDate}</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(po.po_number)}</VOUCHERNUMBER>
            <REFERENCE>${escapeXml(po.po_number)}</REFERENCE>
            <PARTYLEDGERNAME>${escapeXml(vendorLedger)}</PARTYLEDGERNAME>
            <NARRATION>PO: ${escapeXml(po.po_number)} | Vendor: ${escapeXml(vendor.legal_name)}</NARRATION>
            <ISINVOICE>Yes</ISINVOICE>${ledgerEntries}${inventoryEntries}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

function buildPaymentVoucherXml(payment: any, vendor: any, batchDate: string): string {
  const payDate = format(new Date(batchDate), 'yyyyMMdd')
  const vendorLedger = vendor.tally_ledger_name || vendor.legal_name
  const paymentMode = payment.payment_mode || 'neft'
  const bankLedger = paymentMode === 'cash' ? 'Cash' : 'Bank Account'

  let tdsEntry = ''
  if (payment.tds_amount && payment.tds_amount > 0) {
    tdsEntry = `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>TDS Payable - ${payment.tds_section || 'Section 194C'}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${payment.tds_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(COMPANY_NAME)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create">
            <DATE>${payDate}</DATE>
            <VOUCHERTYPENAME>Payment</VOUCHERTYPENAME>
            <REFERENCE>${escapeXml(payment.reference_number || '')}</REFERENCE>
            <PARTYLEDGERNAME>${escapeXml(vendorLedger)}</PARTYLEDGERNAME>
            <NARRATION>Payment to ${escapeXml(vendor.legal_name)} | Ref: ${escapeXml(payment.reference_number || 'N/A')}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(vendorLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${payment.net_amount || payment.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(bankLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${payment.net_amount || payment.amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>${tdsEntry}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

function buildDebitNoteXml(debitNote: any, vendor: any): string {
  const noteDate = format(new Date(debitNote.debit_note_date), 'yyyyMMdd')
  const vendorLedger = vendor.tally_ledger_name || vendor.legal_name

  let gstEntries = ''
  if (debitNote.cgst_amount > 0) {
    gstEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input CGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${debitNote.cgst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }
  if (debitNote.sgst_amount > 0) {
    gstEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${debitNote.sgst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }
  if (debitNote.igst_amount > 0) {
    gstEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input IGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
          <AMOUNT>${debitNote.igst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(COMPANY_NAME)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Debit Note" ACTION="Create">
            <DATE>${noteDate}</DATE>
            <VOUCHERTYPENAME>Debit Note</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(debitNote.debit_note_number)}</VOUCHERNUMBER>
            <REFERENCE>${escapeXml(debitNote.debit_note_number)}</REFERENCE>
            <PARTYLEDGERNAME>${escapeXml(vendorLedger)}</PARTYLEDGERNAME>
            <NARRATION>Debit Note: ${escapeXml(debitNote.debit_note_number)} | Reason: ${escapeXml(debitNote.reason)}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(vendorLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${debitNote.total_amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Purchase Returns</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${debitNote.subtotal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>${gstEntries}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

function buildCreditNoteXml(creditNote: any, vendor: any): string {
  const noteDate = format(new Date(creditNote.credit_note_date), 'yyyyMMdd')
  const vendorLedger = vendor.tally_ledger_name || vendor.legal_name

  let gstEntries = ''
  if (creditNote.cgst_amount > 0) {
    gstEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input CGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${creditNote.cgst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }
  if (creditNote.sgst_amount > 0) {
    gstEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${creditNote.sgst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }
  if (creditNote.igst_amount > 0) {
    gstEntries += `
        <ALLLEDGERENTRIES.LIST>
          <LEDGERNAME>Input IGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
          <AMOUNT>-${creditNote.igst_amount}</AMOUNT>
        </ALLLEDGERENTRIES.LIST>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(COMPANY_NAME)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Credit Note" ACTION="Create">
            <DATE>${noteDate}</DATE>
            <VOUCHERTYPENAME>Credit Note</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(creditNote.credit_note_number)}</VOUCHERNUMBER>
            <REFERENCE>${escapeXml(creditNote.credit_note_number)}</REFERENCE>
            <PARTYLEDGERNAME>${escapeXml(vendorLedger)}</PARTYLEDGERNAME>
            <NARRATION>Credit Note: ${escapeXml(creditNote.credit_note_number)} | Reason: ${escapeXml(creditNote.reason)}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(vendorLedger)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${creditNote.total_amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Purchase Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${creditNote.subtotal}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>${gstEntries}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

export async function POST(req: NextRequest) {
  const rateLimitResult = await rateLimit(req, 10, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { supabase, user, userId } = await requireApiAuth()
  try {
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = tallyPushSchema.safeParse(rawBody)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { type, entity_id } = parsed.data

    let xml = ''
    let entityTable = ''
    let entityRef = ''

    if (type === 'purchase') {
      const { data: po, error: poErr } = await supabase
        .from('purchase_orders')
        .select('*, vendor:vendors(*), items:purchase_order_items(*, item:items(generic_name, tally_item_name))')
        .eq('id', entity_id)
        .single()

      if (poErr || !po) {
        return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
      }

      xml = buildPurchaseVoucherXml(po, po.items || [], po.vendor)
      entityTable = 'purchase_orders'
      entityRef = po.po_number

    } else if (type === 'payment') {
      const { data: paymentItem, error: piErr } = await supabase
        .from('payment_batch_items')
        .select('*, batch:payment_batches(*), invoice:invoices(*, vendor:vendors(*))')
        .eq('id', entity_id)
        .single()

      if (piErr || !paymentItem) {
        return NextResponse.json({ error: 'Payment batch item not found' }, { status: 404 })
      }

      const vendor = paymentItem.invoice?.vendor
      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found for payment' }, { status: 404 })
      }

      xml = buildPaymentVoucherXml(paymentItem, vendor, paymentItem.batch?.batch_date || new Date().toISOString())
      entityTable = 'payment_batch_items'
      entityRef = `Payment-${entity_id.slice(0, 8)}`

    } else if (type === 'debit_note') {
      const { data: debitNote, error: dnErr } = await supabase
        .from('debit_notes')
        .select('*, vendor:vendors(*)')
        .eq('id', entity_id)
        .single()

      if (dnErr || !debitNote) {
        return NextResponse.json({ error: 'Debit note not found' }, { status: 404 })
      }

      xml = buildDebitNoteXml(debitNote, debitNote.vendor)
      entityTable = 'debit_notes'
      entityRef = debitNote.debit_note_number

    } else if (type === 'credit_note') {
      const { data: creditNote, error: cnErr } = await supabase
        .from('credit_notes')
        .select('*, vendor:vendors(*)')
        .eq('id', entity_id)
        .single()

      if (cnErr || !creditNote) {
        return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
      }

      xml = buildCreditNoteXml(creditNote, creditNote.vendor)
      entityTable = 'credit_notes'
      entityRef = creditNote.credit_note_number

    } else {
      return NextResponse.json({ error: 'Invalid type. Must be: purchase, payment, debit_note, credit_note' }, { status: 400 })
    }

    // If Tally URL is not configured, return the XML for manual import
    if (!TALLY_URL) {
      // Log the attempt
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'tally_xml_generated',
        entity_type: type,
        entity_id,
        details: { entity_ref: entityRef, reason: 'tally_not_configured' },
      })

      return NextResponse.json({
        pushed: false,
        xml,
        reason: 'tally_not_configured',
        message: 'Tally server URL not configured. XML generated for manual import.',
      })
    }

    // Push to Tally
    try {
      const tallyResponse = await fetch(TALLY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xml,
      })

      const tallyResult = await tallyResponse.text()
      const isSuccess = tallyResult.includes('CREATED') || tallyResult.includes('<CREATED>1</CREATED>')

      if (isSuccess) {
        // Extract voucher number from Tally response if available
        const voucherMatch = tallyResult.match(/<VCHMASTER(?:ID)?>(.*?)<\/VCHMASTER(?:ID)?>/)
        const tallyVoucherNo = voucherMatch ? voucherMatch[1] : `TALLY-${Date.now()}`

        // Update entity with tally voucher number
        if (entityTable === 'purchase_orders') {
          // tally_voucher_no and tally_sync_date don't exist on invoices table
        } else if (entityTable === 'debit_notes' || entityTable === 'credit_notes') {
          await supabase.from(entityTable).update({ tally_voucher_no: tallyVoucherNo }).eq('id', entity_id)
        }

        // Log success
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'tally_push_success',
          entity_type: type,
          entity_id,
          details: { entity_ref: entityRef, tally_voucher_no: tallyVoucherNo },
        })

        return NextResponse.json({
          pushed: true,
          tally_voucher_no: tallyVoucherNo,
          message: 'Voucher pushed to Tally successfully',
        })
      } else {
        // Log failure
        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'tally_push_failed',
          entity_type: type,
          entity_id,
          details: { entity_ref: entityRef, tally_response: tallyResult.slice(0, 500) },
        })

        return NextResponse.json({
          pushed: false,
          xml,
          tally_response: tallyResult,
          message: 'Tally did not confirm voucher creation',
        }, { status: 422 })
      }
    } catch (fetchErr: any) {
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'tally_push_error',
        entity_type: type,
        entity_id,
        details: { entity_ref: entityRef, error: fetchErr.message },
      })

      return NextResponse.json({
        pushed: false,
        xml,
        reason: 'tally_connection_failed',
        message: `Could not connect to Tally at ${TALLY_URL}: ${fetchErr.message}`,
      }, { status: 502 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
