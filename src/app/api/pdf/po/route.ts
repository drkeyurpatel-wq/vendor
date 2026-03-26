import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'
import { renderPDFHeader } from '@/lib/pdf-header'
import { withApiErrorHandler } from '@/lib/api-error-handler'

// ============================================================
// H1 VPMS — Purchase Order PDF Generator
// Brand: Navy #1B3A6B, Teal #0D7E8A
// ============================================================

const NAVY: [number, number, number] = [27, 58, 107]
const TEAL: [number, number, number] = [13, 126, 138]
const LIGHT_NAVY: [number, number, number] = [238, 242, 249]
const WHITE: [number, number, number] = [255, 255, 255]
const BLACK: [number, number, number] = [0, 0, 0]
const GRAY: [number, number, number] = [107, 114, 128]

// ─── Indian Number-to-Words Converter ───────────────────────

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigitWords(n: number): string {
  if (n < 20) return ones[n]
  return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '')
}

function threeDigitWords(n: number): string {
  if (n === 0) return ''
  if (n < 100) return twoDigitWords(n)
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigitWords(n % 100) : '')
}

function numberToWordsINR(amount: number): string {
  if (amount === 0) return 'Rupees Zero Only'

  const rupees = Math.floor(Math.abs(amount))
  const paise = Math.round((Math.abs(amount) - rupees) * 100)

  if (rupees === 0 && paise === 0) return 'Rupees Zero Only'

  let words = ''
  const crores = Math.floor(rupees / 10000000)
  const lakhs = Math.floor((rupees % 10000000) / 100000)
  const thousands = Math.floor((rupees % 100000) / 1000)
  const hundreds = rupees % 1000

  if (crores > 0) words += twoDigitWords(crores) + ' Crore '
  if (lakhs > 0) words += twoDigitWords(lakhs) + ' Lakh '
  if (thousands > 0) words += twoDigitWords(thousands) + ' Thousand '
  if (hundreds > 0) words += threeDigitWords(hundreds)

  words = 'Rupees ' + words.trim()

  if (paise > 0) {
    words += ' and ' + twoDigitWords(paise) + ' Paise'
  }

  return words + ' Only'
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(date: string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

// ─── PDF Generation ─────────────────────────────────────────

export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const rateLimitResult = await rateLimit(request, 20, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Missing PO id' }, { status: 400 })
  }

  const { supabase, user, userId } = await requireApiAuth()
  // Fetch PO with all related data
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      vendor:vendors(legal_name, trade_name, gstin, pan, address, city, state, pincode, primary_contact_phone, primary_contact_email),
      centre:centres(name, code, address, city, state, phone, email),
      items:purchase_order_items(
        *,
        item:items(generic_name, brand_name, hsn_code, unit)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !po) {
    return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 })
  }

  // Create PDF
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // ── Company Header with Logo ──
  y = renderPDFHeader(doc, 'PURCHASE ORDER', po.centre)

  // ── PO Details Box ──
  doc.setFillColor(...LIGHT_NAVY)
  doc.roundedRect(margin, y, contentWidth, 28, 2, 2, 'F')

  doc.setTextColor(...NAVY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  const col1 = margin + 4
  const col2 = margin + contentWidth / 2 + 4

  doc.text('PO Number:', col1, y + 7)
  doc.text('PO Date:', col1, y + 14)
  doc.text('Expected Delivery:', col1, y + 21)

  doc.text('Status:', col2, y + 7)
  doc.text('Priority:', col2, y + 14)
  doc.text('Revision:', col2, y + 21)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK)
  doc.text(po.po_number, col1 + 36, y + 7)
  doc.text(formatDate(po.po_date), col1 + 36, y + 14)
  doc.text(po.expected_delivery_date ? formatDate(po.expected_delivery_date) : 'N/A', col1 + 36, y + 21)

  doc.text(po.status?.replace(/_/g, ' ').toUpperCase() || '', col2 + 24, y + 7)
  doc.text((po.priority || 'normal').toUpperCase(), col2 + 24, y + 14)
  doc.text(String(po.revision_number || 0), col2 + 24, y + 21)

  y += 34

  // ── Vendor Details ──
  doc.setFillColor(...NAVY)
  doc.rect(margin, y, contentWidth / 2 - 2, 7, 'F')
  doc.setTextColor(...WHITE)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('VENDOR DETAILS', col1, y + 5)

  doc.setFillColor(...NAVY)
  doc.rect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, 7, 'F')
  doc.text('SHIP TO', col2, y + 5)

  y += 10

  doc.setTextColor(...BLACK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)

  const vendor = po.vendor
  const vendorLines = [
    vendor?.legal_name || '',
    vendor?.trade_name && vendor.trade_name !== vendor.legal_name ? `(${vendor.trade_name})` : '',
    vendor?.address || '',
    [vendor?.city, vendor?.state, vendor?.pincode].filter(Boolean).join(', '),
    vendor?.gstin ? `GSTIN: ${vendor.gstin}` : '',
    vendor?.pan ? `PAN: ${vendor.pan}` : '',
    vendor?.primary_contact_phone ? `Phone: ${vendor.primary_contact_phone}` : '',
  ].filter(Boolean)

  const centre = po.centre
  const centreLines = [
    centre?.name || '',
    centre?.address || '',
    [centre?.city, centre?.state].filter(Boolean).join(', '),
    centre?.phone ? `Phone: ${centre.phone}` : '',
    centre?.email ? `Email: ${centre.email}` : '',
  ].filter(Boolean)

  vendorLines.forEach((line, i) => {
    doc.text(line, col1, y + i * 4.5)
  })

  centreLines.forEach((line, i) => {
    doc.text(line, col2, y + i * 4.5)
  })

  y += Math.max(vendorLines.length, centreLines.length) * 4.5 + 4

  // ── Supply Type ──
  const supplyType = po.igst_amount > 0 ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'
  doc.setFillColor(230, 245, 246)
  doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F')
  doc.setTextColor(...TEAL)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text(`Supply Type: ${supplyType}`, col1, y + 5)
  if (po.quotation_ref) {
    doc.text(`Quotation Ref: ${po.quotation_ref}${po.quotation_date ? ' dt. ' + formatDate(po.quotation_date) : ''}`, col2, y + 5)
  }
  y += 12

  // ── Items Table ──
  const items = po.items || []
  const isIGST = (po.igst_amount || 0) > 0

  // Compute tax totals from line items if PO-level is null
  let computedSubtotal = 0
  let computedCGST = 0
  let computedSGST = 0
  let computedIGST = 0
  items.forEach((item: any) => {
    const lineTotal = (item.rate || 0) * (item.ordered_qty || 0)
    const gstPct = item.gst_percent || 0
    computedSubtotal += lineTotal
    if (isIGST) {
      computedIGST += lineTotal * gstPct / 100
    } else {
      computedCGST += lineTotal * gstPct / 200
      computedSGST += lineTotal * gstPct / 200
    }
  })

  const finalSubtotal = po.subtotal || computedSubtotal
  const finalCGST = po.cgst_amount != null ? po.cgst_amount : computedCGST
  const finalSGST = po.sgst_amount != null ? po.sgst_amount : computedSGST
  const finalIGST = po.igst_amount != null ? po.igst_amount : computedIGST
  const finalTotal = po.net_amount || po.total_amount || (finalSubtotal - (po.discount_amount || 0) + finalCGST + finalSGST + finalIGST + (po.freight_amount || 0) + (po.loading_charges || 0) + (po.insurance_charges || 0) + (po.other_charges || 0))

  const tableHead = isIGST
    ? [['S.No', 'Item Description', 'HSN', 'Qty', 'Unit', 'Rate', 'Disc%', 'IGST%', 'IGST', 'Amount']]
    : [['S.No', 'Item Description', 'HSN', 'Qty', 'Unit', 'Rate', 'Disc%', 'CGST%', 'SGST%', 'Amount']]

  const tableBody = items.map((item: Record<string, unknown>, idx: number) => {
    const it = item.item as Record<string, unknown> | undefined
    const name = it?.generic_name
      ? `${it.generic_name}${it.brand_name ? ' (' + it.brand_name + ')' : ''}`
      : 'Item'
    const row = [
      String(idx + 1),
      name,
      (item.hsn_code as string) || (it?.hsn_code as string) || '',
      String(item.ordered_qty),
      (item.unit as string) || (it?.unit as string) || '',
      formatINR(item.rate as number),
      item.trade_discount_percent ? String(item.trade_discount_percent) + '%' : '-',
    ]
    if (isIGST) {
      row.push(
        (item.igst_percent ? String(item.igst_percent) + '%' : String(item.gst_percent) + '%'),
        formatINR(item.igst_amount as number),
        formatINR(item.total_amount as number)
      )
    } else {
      row.push(
        (item.cgst_percent ? String(item.cgst_percent) + '%' : String((item.gst_percent as number) / 2) + '%'),
        (item.sgst_percent ? String(item.sgst_percent) + '%' : String((item.gst_percent as number) / 2) + '%'),
        formatINR(item.total_amount as number)
      )
    }
    return row
  })

  autoTable(doc, {
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: NAVY,
      textColor: WHITE,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [55, 65, 81],
      cellPadding: 2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { cellWidth: 40 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 11 },
      5: { halign: 'right', cellWidth: 22 },
      6: { halign: 'center', cellWidth: 11 },
      7: { halign: 'center', cellWidth: 12 },
      8: { halign: 'center', cellWidth: 12 },
      9: { halign: 'right', cellWidth: 28 },
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6

  // ── Tax Summary (right-aligned) ──
  const summaryX = margin + contentWidth - 80
  const summaryW = 80
  const labelX = summaryX + 2
  const valueX = summaryX + summaryW - 2

  doc.setFillColor(...LIGHT_NAVY)
  doc.roundedRect(summaryX, y, summaryW, isIGST ? 52 : 58, 2, 2, 'F')

  doc.setTextColor(...GRAY)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')

  const summaryLines: [string, string][] = [
    ['Subtotal', formatINR(finalSubtotal)],
  ]
  if ((po.discount_amount || 0) > 0) {
    summaryLines.push(['Discount', '(-) ' + formatINR(po.discount_amount)])
  }
  if (isIGST) {
    summaryLines.push(['IGST', formatINR(finalIGST)])
  } else {
    summaryLines.push(['CGST', formatINR(finalCGST)])
    summaryLines.push(['SGST', formatINR(finalSGST)])
  }
  if ((po.freight_amount || 0) > 0) summaryLines.push(['Freight', formatINR(po.freight_amount)])
  if ((po.loading_charges || 0) > 0) summaryLines.push(['Loading', formatINR(po.loading_charges)])
  if ((po.insurance_charges || 0) > 0) summaryLines.push(['Insurance', formatINR(po.insurance_charges)])
  if ((po.other_charges || 0) > 0) summaryLines.push(['Other Charges', formatINR(po.other_charges)])
  if (po.round_off != null && po.round_off !== 0) summaryLines.push(['Round Off', formatINR(po.round_off)])

  summaryLines.forEach(([label, value], i) => {
    const lineY = y + 7 + i * 5
    doc.text(label, labelX, lineY)
    doc.text(value, valueX, lineY, { align: 'right' })
  })

  // Grand Total line
  const totalY = y + 7 + summaryLines.length * 5 + 2
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.3)
  doc.line(summaryX + 2, totalY - 3, summaryX + summaryW - 2, totalY - 3)
  doc.setTextColor(...NAVY)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Grand Total', labelX, totalY)
  doc.text(formatINR(finalTotal), valueX, totalY, { align: 'right' })

  // Amount in words — left side
  doc.setTextColor(...BLACK)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text('Amount in Words:', margin, y + 4)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7)
  const amountWords = numberToWordsINR(finalTotal)
  const wordLines = doc.splitTextToSize(amountWords, summaryX - margin - 8)
  doc.text(wordLines, margin, y + 9)

  y = totalY + 10

  // ── Terms & Conditions ──
  if (po.terms_and_conditions || po.delivery_instructions || po.payment_terms) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage()
      y = margin
    }

    doc.setFillColor(...NAVY)
    doc.rect(margin, y, contentWidth, 6, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('TERMS & CONDITIONS', margin + 4, y + 4.5)
    y += 9

    doc.setTextColor(...BLACK)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')

    if (po.delivery_instructions) {
      doc.setFont('helvetica', 'bold')
      doc.text('Delivery Instructions:', margin, y)
      doc.setFont('helvetica', 'normal')
      y += 4
      const delLines = doc.splitTextToSize(po.delivery_instructions, contentWidth - 4)
      doc.text(delLines, margin + 2, y)
      y += delLines.length * 3.5 + 3
    }

    if (po.payment_terms) {
      doc.setFont('helvetica', 'bold')
      doc.text('Payment Terms:', margin, y)
      doc.setFont('helvetica', 'normal')
      y += 4
      const payLines = doc.splitTextToSize(po.payment_terms, contentWidth - 4)
      doc.text(payLines, margin + 2, y)
      y += payLines.length * 3.5 + 3
    }

    if (po.terms_and_conditions) {
      doc.setFont('helvetica', 'bold')
      doc.text('General Terms:', margin, y)
      doc.setFont('helvetica', 'normal')
      y += 4
      const tncLines = doc.splitTextToSize(po.terms_and_conditions, contentWidth - 4)
      doc.text(tncLines, margin + 2, y)
      y += tncLines.length * 3.5 + 3
    }
  }

  // ── Signatory ──
  y = Math.max(y + 10, 255)
  if (y > 270) {
    doc.addPage()
    y = 240
  }

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  // Left signature
  doc.line(margin, y, margin + 60, y)
  doc.setTextColor(...GRAY)
  doc.setFontSize(7)
  doc.text('Prepared By', margin, y + 4)

  // Right signature
  doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)
  doc.text('Authorized Signatory', pageWidth - margin - 60, y + 4)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...NAVY)
  doc.text('For Health1 Super Speciality Hospitals Pvt. Ltd.', pageWidth - margin - 60, y + 8)

  // ── Footer ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(6)
    doc.setTextColor(...GRAY)
    doc.text(
      `Generated on ${format(new Date(), 'dd MMM yyyy, h:mm a')} | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    )
  }

  // Return PDF
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${po.po_number}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
})
