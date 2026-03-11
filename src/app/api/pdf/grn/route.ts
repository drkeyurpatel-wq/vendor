import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

// ============================================================
// H1 VPMS — GRN PDF Generator
// Brand: Navy #1B3A6B, Teal #0D7E8A
// ============================================================

const NAVY: [number, number, number] = [27, 58, 107]
const TEAL: [number, number, number] = [13, 126, 138]
const LIGHT_NAVY: [number, number, number] = [238, 242, 249]
const WHITE: [number, number, number] = [255, 255, 255]
const BLACK: [number, number, number] = [0, 0, 0]
const GRAY: [number, number, number] = [107, 114, 128]

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd MMM yyyy')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing GRN id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: grn, error } = await supabase
    .from('grns')
    .select(`
      *,
      vendor:vendors(legal_name, trade_name, gstin, address, city, state, pincode, primary_contact_phone),
      centre:centres(name, code, address, city, state),
      po:purchase_orders(po_number),
      items:grn_items(
        *,
        item:items(generic_name, brand_name, hsn_code, unit)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !grn) {
    return NextResponse.json({ error: 'GRN not found' }, { status: 404 })
  }

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // ── Header ──
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.setTextColor(...WHITE)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('GOODS RECEIPT NOTE', pageWidth / 2, 13, { align: 'center' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Health1 Super Speciality Hospitals Pvt. Ltd.', pageWidth / 2, 20, { align: 'center' })
  doc.setFontSize(8)
  const centreAddr = grn.centre?.address
    ? `${grn.centre.name} | ${grn.centre.address}, ${grn.centre.city || ''}, ${grn.centre.state || ''}`
    : grn.centre?.name || ''
  doc.text(centreAddr, pageWidth / 2, 26, { align: 'center' })

  y = 38

  // ── GRN Details Box ──
  doc.setFillColor(...LIGHT_NAVY)
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F')

  const col1 = margin + 4
  const col2 = margin + contentWidth / 3 + 4
  const col3 = margin + (contentWidth * 2) / 3 + 4

  doc.setTextColor(...NAVY)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('GRN Number:', col1, y + 6)
  doc.text('GRN Date:', col1, y + 12)
  doc.text('Status:', col1, y + 18)

  doc.text('PO Reference:', col2, y + 6)
  doc.text('Invoice No:', col2, y + 12)
  doc.text('Invoice Date:', col2, y + 18)

  doc.text('QC Status:', col3, y + 6)
  doc.text('Invoice Amt:', col3, y + 12)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK)
  doc.text(grn.grn_number, col1 + 26, y + 6)
  doc.text(formatDate(grn.grn_date), col1 + 26, y + 12)
  doc.text((grn.status || '').replace(/_/g, ' ').toUpperCase(), col1 + 26, y + 18)

  doc.text(grn.po?.po_number || 'N/A', col2 + 26, y + 6)
  doc.text(grn.vendor_invoice_no || 'N/A', col2 + 26, y + 12)
  doc.text(formatDate(grn.vendor_invoice_date), col2 + 26, y + 18)

  doc.text((grn.quality_status || 'pending').replace(/_/g, ' ').toUpperCase(), col3 + 22, y + 6)
  doc.text(grn.vendor_invoice_amount ? formatINR(grn.vendor_invoice_amount) : 'N/A', col3 + 22, y + 12)

  y += 28

  // ── Vendor Details ──
  doc.setFillColor(...NAVY)
  doc.rect(margin, y, contentWidth, 6, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('VENDOR DETAILS', col1, y + 4.5)
  y += 8

  doc.setTextColor(...BLACK)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  const vendor = grn.vendor
  const vendorInfo = [
    vendor?.legal_name || '',
    vendor?.trade_name && vendor.trade_name !== vendor.legal_name ? `(${vendor.trade_name})` : '',
    [vendor?.address, vendor?.city, vendor?.state, vendor?.pincode].filter(Boolean).join(', '),
    vendor?.gstin ? `GSTIN: ${vendor.gstin}` : '',
    vendor?.primary_contact_phone ? `Phone: ${vendor.primary_contact_phone}` : '',
  ].filter(Boolean)

  vendorInfo.forEach((line, i) => {
    doc.text(line, col1, y + i * 4)
  })
  y += vendorInfo.length * 4 + 4

  // ── Transport Details ──
  if (grn.dc_number || grn.lr_number || grn.vehicle_number || grn.eway_bill_no) {
    doc.setFillColor(230, 245, 246)
    doc.roundedRect(margin, y, contentWidth, 14, 1, 1, 'F')
    doc.setTextColor(...TEAL)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Transport Details', col1, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BLACK)

    const transLines = [
      grn.dc_number ? `DC No: ${grn.dc_number}${grn.dc_date ? ' dt. ' + formatDate(grn.dc_date) : ''}` : '',
      grn.lr_number ? `LR No: ${grn.lr_number}` : '',
      grn.vehicle_number ? `Vehicle: ${grn.vehicle_number}` : '',
      grn.transport_name ? `Transporter: ${grn.transport_name}` : '',
      grn.eway_bill_no ? `E-Way Bill: ${grn.eway_bill_no}` : '',
    ].filter(Boolean)

    doc.setFontSize(7)
    doc.text(transLines.join('  |  '), col1, y + 10)
    y += 18
  }

  // ── Items Table ──
  const items = grn.items || []

  autoTable(doc, {
    startY: y,
    head: [[
      'S.No', 'Item', 'Batch', 'Expiry', 'MRP',
      'Ord Qty', 'Rec Qty', 'Accepted', 'Rejected', 'Rate', 'Amount',
    ]],
    body: items.map((item: Record<string, unknown>, idx: number) => {
      const it = item.item as Record<string, unknown> | undefined
      const name = it?.generic_name
        ? `${it.generic_name}${it.brand_name ? '\n(' + it.brand_name + ')' : ''}`
        : 'Item'
      return [
        String(idx + 1),
        name,
        (item.batch_no as string) || '-',
        item.expiry_date ? formatDate(item.expiry_date as string) : '-',
        item.mrp ? formatINR(item.mrp as number) : '-',
        String(item.ordered_qty),
        String(item.received_qty),
        String(item.accepted_qty),
        String(item.rejected_qty),
        formatINR(item.rate as number),
        formatINR(item.total_amount as number),
      ]
    }),
    theme: 'grid',
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontSize: 6.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [55, 65, 81],
      cellPadding: 1.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 36 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 16 },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 12 },
      6: { halign: 'right', cellWidth: 12 },
      7: { halign: 'right', cellWidth: 14 },
      8: { halign: 'right', cellWidth: 14 },
      9: { halign: 'right', cellWidth: 18 },
      10: { halign: 'right', cellWidth: 20 },
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6

  // ── Totals ──
  const summaryX = margin + contentWidth - 70
  const summaryW = 70
  doc.setFillColor(...LIGHT_NAVY)
  doc.roundedRect(summaryX, y, summaryW, 30, 2, 2, 'F')

  doc.setTextColor(...GRAY)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')

  const totals: [string, string][] = []
  if (grn.discount_amount > 0) totals.push(['Discount', '(-) ' + formatINR(grn.discount_amount)])
  if (grn.cgst_amount > 0) totals.push(['CGST', formatINR(grn.cgst_amount)])
  if (grn.sgst_amount > 0) totals.push(['SGST', formatINR(grn.sgst_amount)])
  if (grn.igst_amount > 0) totals.push(['IGST', formatINR(grn.igst_amount)])

  totals.forEach(([label, value], i) => {
    doc.text(label, summaryX + 2, y + 6 + i * 5)
    doc.text(value, summaryX + summaryW - 2, y + 6 + i * 5, { align: 'right' })
  })

  const totalLineY = y + 6 + totals.length * 5 + 2
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.3)
  doc.line(summaryX + 2, totalLineY - 3, summaryX + summaryW - 2, totalLineY - 3)
  doc.setTextColor(...NAVY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Net Amount', summaryX + 2, totalLineY)
  doc.text(formatINR(grn.net_amount || grn.total_amount), summaryX + summaryW - 2, totalLineY, { align: 'right' })

  // Notes on left side
  if (grn.notes) {
    doc.setTextColor(...GRAY)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', margin, y + 4)
    doc.setFont('helvetica', 'normal')
    const noteLines = doc.splitTextToSize(grn.notes, summaryX - margin - 8)
    doc.text(noteLines, margin, y + 8)
  }

  y = totalLineY + 12

  // ── QC Notes ──
  if (grn.qc_notes) {
    if (y > 250) { doc.addPage(); y = margin }
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(margin, y, contentWidth, 12, 1, 1, 'F')
    doc.setTextColor(146, 64, 14)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('QC Remarks:', margin + 3, y + 5)
    doc.setFont('helvetica', 'normal')
    const qcLines = doc.splitTextToSize(grn.qc_notes, contentWidth - 8)
    doc.text(qcLines, margin + 3, y + 9)
    y += 16
  }

  // ── Signature Section ──
  y = Math.max(y + 8, 248)
  if (y > 270) { doc.addPage(); y = 240 }

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)

  const sigWidth = (contentWidth - 10) / 3
  const sig1X = margin
  const sig2X = margin + sigWidth + 5
  const sig3X = margin + (sigWidth + 5) * 2

  doc.line(sig1X, y, sig1X + sigWidth, y)
  doc.line(sig2X, y, sig2X + sigWidth, y)
  doc.line(sig3X, y, sig3X + sigWidth, y)

  doc.setTextColor(...GRAY)
  doc.setFontSize(7)
  doc.text('Received By', sig1X, y + 4)
  doc.text('Verified By', sig2X, y + 4)
  doc.text('QC Approved By', sig3X, y + 4)

  doc.setTextColor(...NAVY)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Store Department', sig1X, y + 8)
  doc.text('Purchase Department', sig2X, y + 8)
  doc.text('Quality Control', sig3X, y + 8)

  // ── Page Footer ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(6)
    doc.setTextColor(...GRAY)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Generated on ${format(new Date(), 'dd MMM yyyy, h:mm a')} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    )
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${grn.grn_number}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
