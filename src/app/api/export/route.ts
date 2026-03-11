import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * CSV Export API
 * Exports data from various tables as CSV files
 * Usage: /api/export?type=purchase_orders&status=approved
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  if (!type) {
    return NextResponse.json({ error: 'type parameter required' }, { status: 400 })
  }

  let csvContent = ''
  let filename = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`

  switch (type) {
    case 'purchase_orders': {
      let query = supabase
        .from('purchase_orders')
        .select('po_number, po_date, status, total_amount, vendor:vendors(legal_name), centre:centres(code)')
        .is('deleted_at', null)
        .order('po_date', { ascending: false })

      const status = searchParams.get('status')
      if (status) query = query.eq('status', status)

      const { data: pos } = await query.limit(1000)

      csvContent = 'PO Number,PO Date,Status,Total Amount,Vendor,Centre\n'
      pos?.forEach((po: any) => {
        csvContent += `"${po.po_number}","${po.po_date}","${po.status}",${po.total_amount},"${po.vendor?.legal_name || ''}","${po.centre?.code || ''}"\n`
      })
      break
    }

    case 'invoices': {
      const { data: invoices } = await supabase
        .from('invoices')
        .select('invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, due_date, match_status, payment_status, vendor:vendors(legal_name), centre:centres(code)')
        .order('created_at', { ascending: false })
        .limit(1000)

      csvContent = 'Invoice Ref,Vendor Invoice No,Invoice Date,Total Amount,Paid Amount,Due Date,Match Status,Payment Status,Vendor,Centre\n'
      invoices?.forEach((inv: any) => {
        csvContent += `"${inv.invoice_ref}","${inv.vendor_invoice_no}","${inv.vendor_invoice_date}",${inv.total_amount},${inv.paid_amount || 0},"${inv.due_date}","${inv.match_status}","${inv.payment_status}","${inv.vendor?.legal_name || ''}","${inv.centre?.code || ''}"\n`
      })
      break
    }

    case 'vendors': {
      const { data: vendors } = await supabase
        .from('vendors')
        .select('vendor_code, legal_name, gstin, pan, status, credit_period_days, primary_contact_name, primary_contact_phone, city, state')
        .is('deleted_at', null)
        .order('legal_name')
        .limit(1000)

      csvContent = 'Vendor Code,Legal Name,GSTIN,PAN,Status,Credit Period,Contact,Phone,City,State\n'
      vendors?.forEach((v: any) => {
        csvContent += `"${v.vendor_code}","${v.legal_name}","${v.gstin || ''}","${v.pan || ''}","${v.status}",${v.credit_period_days},"${v.primary_contact_name || ''}","${v.primary_contact_phone || ''}","${v.city || ''}","${v.state || ''}"\n`
      })
      break
    }

    case 'stock': {
      const { data: stock } = await supabase
        .from('item_centre_stock')
        .select('current_stock, reorder_level, max_level, last_grn_date, item:items(item_code, generic_name, unit), centre:centres(code)')
        .order('current_stock')
        .limit(1000)

      csvContent = 'Item Code,Item Name,Unit,Centre,Current Stock,Reorder Level,Max Level,Last GRN Date\n'
      stock?.forEach((s: any) => {
        csvContent += `"${s.item?.item_code || ''}","${s.item?.generic_name || ''}","${s.item?.unit || ''}","${s.centre?.code || ''}",${s.current_stock},${s.reorder_level},${s.max_level},"${s.last_grn_date || ''}"\n`
      })
      break
    }

    default:
      return NextResponse.json({ error: `Unknown export type: ${type}` }, { status: 400 })
  }

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
