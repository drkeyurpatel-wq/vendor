import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const COMPANY_NAME = 'Health1 Super Speciality Hospitals Pvt. Ltd.'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildVendorLedgersXml(vendors: any[]): string {
  let ledgerEntries = ''

  vendors.forEach((v) => {
    const ledgerName = v.tally_ledger_name || v.legal_name
    const tallyGroup = v.tally_group || 'Sundry Creditors'

    ledgerEntries += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${escapeXml(ledgerName)}" ACTION="Create">
            <NAME>${escapeXml(ledgerName)}</NAME>
            <PARENT>${escapeXml(tallyGroup)}</PARENT>
            <ISBILLWISEON>Yes</ISBILLWISEON>
            <AFFECTSSTOCK>No</AFFECTSSTOCK>
            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
            <OPENINGBALANCE>0</OPENINGBALANCE>
            <ADDRESS.LIST>
              <ADDRESS>${escapeXml(v.address || '')}</ADDRESS>
              <ADDRESS>${escapeXml([v.city, v.state, v.pincode].filter(Boolean).join(', '))}</ADDRESS>
            </ADDRESS.LIST>
            <LEDGERPHONE>${escapeXml(v.primary_contact_phone || '')}</LEDGERPHONE>
            <LEDGEREMAIL>${escapeXml(v.primary_contact_email || '')}</LEDGEREMAIL>
            <LEDGERCONTACT>${escapeXml(v.primary_contact_name || '')}</LEDGERCONTACT>
            <INCOMETAXNUMBER>${escapeXml(v.pan || '')}</INCOMETAXNUMBER>
            <PARTYGSTIN>${escapeXml(v.gstin || '')}</PARTYGSTIN>
            <GSTREGISTRATIONTYPE>${v.gstin ? 'Regular' : 'Unknown'}</GSTREGISTRATIONTYPE>
            <LEDSTATENAME>${escapeXml(v.state || '')}</LEDSTATENAME>
            <PAYMENTTERMS>${v.credit_period_days || 30}</PAYMENTTERMS>
          </LEDGER>
        </TALLYMESSAGE>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(COMPANY_NAME)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${ledgerEntries}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

function buildStockItemsXml(items: any[]): string {
  let stockEntries = ''

  items.forEach((item) => {
    const itemName = item.tally_item_name || item.generic_name
    const categoryName = item.category?.name || 'Primary'
    const unit = item.unit || 'Nos'

    stockEntries += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <STOCKITEM NAME="${escapeXml(itemName)}" ACTION="Create">
            <NAME>${escapeXml(itemName)}</NAME>
            <PARENT>${escapeXml(categoryName)}</PARENT>
            <BASEUNITS>${escapeXml(unit)}</BASEUNITS>
            <OPENINGBALANCE>0 ${escapeXml(unit)}</OPENINGBALANCE>
            <OPENINGRATE>0</OPENINGRATE>
            <OPENINGVALUE>0</OPENINGVALUE>
            <GSTAPPLICABLE>Applicable</GSTAPPLICABLE>
            <GSTTYPEOFSUPPLY>Goods</GSTTYPEOFSUPPLY>
            <HSNCODE>${escapeXml(item.hsn_code || '')}</HSNCODE>
            <TAXCLASSIFICATIONNAME>GST ${item.gst_percent || 0}%</TAXCLASSIFICATIONNAME>
          </STOCKITEM>
        </TALLYMESSAGE>`
  })

  // Also create stock groups from categories
  const categoryMap = new Map<string, string>()
  items.forEach((item) => {
    if (item.category?.name) {
      categoryMap.set(item.category.name, item.category.name)
    }
  })

  let groupEntries = ''
  categoryMap.forEach((name) => {
    groupEntries += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <STOCKGROUP NAME="${escapeXml(name)}" ACTION="Create">
            <NAME>${escapeXml(name)}</NAME>
            <PARENT>Primary</PARENT>
          </STOCKGROUP>
        </TALLYMESSAGE>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(COMPANY_NAME)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>${groupEntries}${stockEntries}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`
}

function parseTallyLedgerXml(xmlText: string): { name: string; parent: string; gstin: string }[] {
  const ledgers: { name: string; parent: string; gstin: string }[] = []
  const ledgerRegex = /<LEDGER[^>]*>([\s\S]*?)<\/LEDGER>/g
  let match

  while ((match = ledgerRegex.exec(xmlText)) !== null) {
    const block = match[1]
    const nameMatch = block.match(/<NAME>(.*?)<\/NAME>/)
    const parentMatch = block.match(/<PARENT>(.*?)<\/PARENT>/)
    const gstinMatch = block.match(/<PARTYGSTIN>(.*?)<\/PARTYGSTIN>/)

    if (nameMatch) {
      ledgers.push({
        name: nameMatch[1],
        parent: parentMatch ? parentMatch[1] : '',
        gstin: gstinMatch ? gstinMatch[1] : '',
      })
    }
  }

  return ledgers
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { action, xml_data } = body

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }

    if (action === 'export_vendors') {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('legal_name')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const xml = buildVendorLedgersXml(vendors || [])

      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'tally_export_vendors',
        entity_type: 'vendor',
        entity_id: null,
        details: { count: vendors?.length || 0 },
      })

      return NextResponse.json({
        xml,
        count: vendors?.length || 0,
        message: `Generated Tally XML for ${vendors?.length || 0} vendor ledgers`,
      })

    } else if (action === 'export_items') {
      const { data: items, error } = await supabase
        .from('items')
        .select('*, category:item_categories(name)')
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('generic_name')

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const xml = buildStockItemsXml(items || [])

      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'tally_export_items',
        entity_type: 'item',
        entity_id: null,
        details: { count: items?.length || 0 },
      })

      return NextResponse.json({
        xml,
        count: items?.length || 0,
        message: `Generated Tally XML for ${items?.length || 0} stock items`,
      })

    } else if (action === 'import_ledgers') {
      if (!xml_data) {
        return NextResponse.json({ error: 'xml_data is required for import_ledgers action' }, { status: 400 })
      }

      const ledgers = parseTallyLedgerXml(xml_data)
      const sundryCreditors = ledgers.filter(l =>
        l.parent === 'Sundry Creditors' || l.parent === 'Sundry Creditors - H1'
      )

      let matched = 0
      let unmatched = 0
      const unmatchedLedgers: string[] = []

      for (const ledger of sundryCreditors) {
        // Try to match by GSTIN first, then by name
        let vendor = null

        if (ledger.gstin) {
          const { data } = await supabase
            .from('vendors')
            .select('id')
            .eq('gstin', ledger.gstin)
            .is('deleted_at', null)
            .single()
          vendor = data
        }

        if (!vendor) {
          const { data } = await supabase
            .from('vendors')
            .select('id')
            .or(`legal_name.ilike.%${ledger.name}%,trade_name.ilike.%${ledger.name}%`)
            .is('deleted_at', null)
            .limit(1)
            .single()
          vendor = data
        }

        if (vendor) {
          await supabase
            .from('vendors')
            .update({ tally_ledger_name: ledger.name, tally_group: ledger.parent })
            .eq('id', vendor.id)
          matched++
        } else {
          unmatched++
          unmatchedLedgers.push(ledger.name)
        }
      }

      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'tally_import_ledgers',
        entity_type: 'vendor',
        entity_id: null,
        details: { total: sundryCreditors.length, matched, unmatched },
      })

      return NextResponse.json({
        total_ledgers: sundryCreditors.length,
        matched,
        unmatched,
        unmatched_ledgers: unmatchedLedgers.slice(0, 50),
        message: `Mapped ${matched} ledgers to vendors. ${unmatched} could not be matched.`,
      })

    } else {
      return NextResponse.json({
        error: 'Invalid action. Must be: export_vendors, export_items, import_ledgers',
      }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
