import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { rateLimit } from '@/lib/rate-limit'
import { reportGenerateSchema } from '@/lib/validations'

const NAVY: [number, number, number] = [27, 58, 107]
const WHITE: [number, number, number] = [255, 255, 255]

function formatINR(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '₹0.00'
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function POST(req: NextRequest) {
  const rateLimitResult = await rateLimit(req, 30, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = reportGenerateSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { report_type, format, filters } = parsed.data
  const { centre_id, date_from, date_to, vendor_id } = filters

  switch (report_type) {
    case 'spend_analysis':
      return generateSpendAnalysis(supabase, format, { centre_id, date_from, date_to })
    case 'aging_report':
      return generateAgingReport(supabase, format, { centre_id, vendor_id })
    case 'po_status_report':
      return generatePOStatusReport(supabase, format, { centre_id, date_from, date_to })
    case 'vendor_scorecard':
      return generateVendorScorecard(supabase, format, { vendor_id, date_from, date_to })
    default:
      return NextResponse.json({ error: 'Invalid report_type' }, { status: 400 })
  }
}

async function generateSpendAnalysis(supabase: any, format: string, filters: any) {
  let query = supabase
    .from('purchase_orders')
    .select('po_number, po_date, total_amount, status, vendor:vendors(legal_name, vendor_code), centre:centres(code, name)')
    .in('status', ['approved', 'sent_to_vendor', 'partially_received', 'fully_received'])
    .is('deleted_at', null)
    .order('po_date', { ascending: false })
    .limit(1000)

  if (filters.centre_id) query = query.eq('centre_id', filters.centre_id)
  if (filters.date_from) query = query.gte('po_date', filters.date_from)
  if (filters.date_to) query = query.lte('po_date', filters.date_to)

  const { data: pos } = await query

  const rows = (pos || []).map((po: any) => {
    const vendor = Array.isArray(po.vendor) ? po.vendor[0] : po.vendor
    const centre = Array.isArray(po.centre) ? po.centre[0] : po.centre
    return [
      po.po_number,
      formatDate(po.po_date),
      vendor?.legal_name || '',
      centre?.code || '',
      po.status.replace(/_/g, ' '),
      formatINR(po.total_amount || 0),
    ]
  })

  const totalSpend = (pos || []).reduce((s: number, po: any) => s + (po.total_amount || 0), 0)

  if (format === 'excel') {
    return generateExcel('Spend Analysis', ['PO Number', 'Date', 'Vendor', 'Centre', 'Status', 'Amount'], rows, `Total: ${formatINR(totalSpend)}`)
  }

  return generatePDFReport('Spend Analysis Report', ['PO Number', 'Date', 'Vendor', 'Centre', 'Status', 'Amount'], rows, `Total Spend: ${formatINR(totalSpend)}`)
}

async function generateAgingReport(supabase: any, format: string, filters: any) {
  let query = supabase
    .from('invoices')
    .select('invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, due_date, payment_status, vendor:vendors(legal_name, vendor_code), centre:centres(code)')
    .in('payment_status', ['unpaid', 'partial'])
    .order('due_date', { ascending: true })
    .limit(1000)

  if (filters.centre_id) query = query.eq('centre_id', filters.centre_id)
  if (filters.vendor_id) query = query.eq('vendor_id', filters.vendor_id)

  const { data: invoices } = await query
  const today = new Date()

  const rows = (invoices || []).map((inv: any) => {
    const vendor = Array.isArray(inv.vendor) ? inv.vendor[0] : inv.vendor
    const centre = Array.isArray(inv.centre) ? inv.centre[0] : inv.centre
    const balance = (inv.total_amount || 0) - (inv.paid_amount || 0)
    const dueDate = inv.due_date ? new Date(inv.due_date) : today
    const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / 86400000)
    const bucket = daysOverdue <= 0 ? 'Current' : daysOverdue <= 30 ? '1-30' : daysOverdue <= 60 ? '31-60' : daysOverdue <= 90 ? '61-90' : '>90'

    return [
      vendor?.legal_name || '',
      inv.invoice_ref || '',
      centre?.code || '',
      formatDate(inv.due_date),
      formatINR(inv.total_amount || 0),
      formatINR(inv.paid_amount || 0),
      formatINR(balance),
      String(daysOverdue > 0 ? daysOverdue : 0),
      bucket,
    ]
  })

  const totalOutstanding = (invoices || []).reduce((s: number, inv: any) => s + ((inv.total_amount || 0) - (inv.paid_amount || 0)), 0)

  if (format === 'excel') {
    return generateExcel('Aging Report', ['Vendor', 'Invoice', 'Centre', 'Due Date', 'Amount', 'Paid', 'Balance', 'Days Overdue', 'Bucket'], rows, `Total Outstanding: ${formatINR(totalOutstanding)}`)
  }

  return generatePDFReport('Aging Report', ['Vendor', 'Invoice', 'Centre', 'Due Date', 'Amount', 'Paid', 'Balance', 'Days', 'Bucket'], rows, `Total Outstanding: ${formatINR(totalOutstanding)}`)
}

async function generatePOStatusReport(supabase: any, format: string, filters: any) {
  let query = supabase
    .from('purchase_orders')
    .select('po_number, po_date, status, total_amount, priority, expected_delivery_date, vendor:vendors(legal_name), centre:centres(code)')
    .is('deleted_at', null)
    .order('po_date', { ascending: false })
    .limit(1000)

  if (filters.centre_id) query = query.eq('centre_id', filters.centre_id)
  if (filters.date_from) query = query.gte('po_date', filters.date_from)
  if (filters.date_to) query = query.lte('po_date', filters.date_to)

  const { data: pos } = await query

  const rows = (pos || []).map((po: any) => {
    const vendor = Array.isArray(po.vendor) ? po.vendor[0] : po.vendor
    const centre = Array.isArray(po.centre) ? po.centre[0] : po.centre
    return [
      po.po_number,
      formatDate(po.po_date),
      vendor?.legal_name || '',
      centre?.code || '',
      po.status.replace(/_/g, ' '),
      po.priority,
      formatDate(po.expected_delivery_date),
      formatINR(po.total_amount || 0),
    ]
  })

  if (format === 'excel') {
    return generateExcel('PO Status Report', ['PO Number', 'Date', 'Vendor', 'Centre', 'Status', 'Priority', 'Expected Delivery', 'Amount'], rows)
  }

  return generatePDFReport('Purchase Order Status Report', ['PO#', 'Date', 'Vendor', 'Centre', 'Status', 'Priority', 'Del. Date', 'Amount'], rows)
}

async function generateVendorScorecard(supabase: any, format: string, filters: any) {
  let query = supabase
    .from('vendor_performance')
    .select('*, vendor:vendors(legal_name, vendor_code)')
    .order('month', { ascending: false })
    .limit(500)

  if (filters.vendor_id) query = query.eq('vendor_id', filters.vendor_id)
  if (filters.date_from) query = query.gte('month', filters.date_from)

  const { data: records } = await query

  const rows = (records || []).map((r: any) => {
    const vendor = Array.isArray(r.vendor) ? r.vendor[0] : r.vendor
    return [
      vendor?.legal_name || '',
      r.month || '',
      `${r.on_time_delivery_pct || 0}%`,
      `${r.quality_score || 0}%`,
      `${r.price_compliance_pct || 0}%`,
      String(r.total_pos || 0),
      formatINR(r.total_value || 0),
    ]
  })

  if (format === 'excel') {
    return generateExcel('Vendor Scorecard', ['Vendor', 'Month', 'On-Time Delivery', 'Quality Score', 'Price Compliance', 'Total POs', 'Total Value'], rows)
  }

  return generatePDFReport('Vendor Performance Scorecard', ['Vendor', 'Month', 'OTD %', 'Quality %', 'Price %', 'POs', 'Value'], rows)
}

function generatePDFReport(title: string, headers: string[], rows: string[][], summary?: string) {
  const doc = new jsPDF({ orientation: 'landscape' })

  // Header
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, 297, 25, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(14)
  doc.text(title, 14, 16)
  doc.setFontSize(8)
  doc.text(`Health1 Super Speciality Hospitals Pvt. Ltd. | Generated: ${new Date().toLocaleString('en-IN')}`, 297 - 14, 16, { align: 'right' })

  // Table
  autoTable(doc, {
    startY: 32,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: WHITE, fontSize: 8 },
    bodyStyles: { fontSize: 7 },
    alternateRowStyles: { fillColor: [238, 242, 249] },
    margin: { left: 14, right: 14 },
  })

  // Summary
  if (summary) {
    const finalY = (doc as any).lastAutoTable?.finalY || 200
    doc.setTextColor(...NAVY)
    doc.setFontSize(10)
    doc.text(summary, 14, finalY + 10)
  }

  const buffer = doc.output('arraybuffer')
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`,
    },
  })
}

function generateExcel(title: string, headers: string[], rows: string[][], summary?: string) {
  const wb = XLSX.utils.book_new()
  const wsData = [headers, ...rows]
  if (summary) wsData.push([], [summary])
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Set column widths
  ws['!cols'] = headers.map(() => ({ wch: 18 }))

  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31))
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}
