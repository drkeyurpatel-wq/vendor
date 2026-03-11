import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

// ============================================================
// H1 VPMS — Payment Advice PDF Generator
// Brand: Navy #1B3A6B, Teal #0D7E8A
// ============================================================

const NAVY: [number, number, number] = [27, 58, 107]
const TEAL: [number, number, number] = [13, 126, 138]
const LIGHT_NAVY: [number, number, number] = [238, 242, 249]
const WHITE: [number, number, number] = [255, 255, 255]
const BLACK: [number, number, number] = [0, 0, 0]
const GRAY: [number, number, number] = [107, 114, 128]

// ─── Number to Words (Indian) ───────────────────────────────

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
  if (paise > 0) words += ' and ' + twoDigitWords(paise) + ' Paise'
  return words + ' Only'
}

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
    return NextResponse.json({ error: 'Missing payment batch id' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch payment batch with items
  const { data: batch, error } = await supabase
    .from('payment_batches')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !batch) {
    return NextResponse.json({ error: 'Payment batch not found' }, { status: 404 })
  }

  // Fetch batch items with invoice and vendor info
  const { data: batchItems } = await supabase
    .from('payment_batch_items')
    .select(`
      *,
      invoice:invoices(
        invoice_ref,
        vendor_invoice_no,
        vendor_invoice_date,
        total_amount,
        tds_amount,
        net_payable,
        vendor:vendors(
          legal_name, trade_name, gstin, address, city, state, pincode,
          bank_name, bank_account_no, bank_ifsc, bank_account_type,
          primary_contact_phone, primary_contact_email
        )
      )
    `)
    .eq('batch_id', id)
    .order('created_at')

  const items = batchItems || []

  // Group by vendor for multi-vendor batches
  const vendorMap = new Map<string, {
    vendor: Record<string, unknown>
    invoices: Record<string, unknown>[]
    totalAmount: number
    totalTDS: number
    totalNet: number
  }>()

  items.forEach((item: Record<string, unknown>) => {
    const invoice = item.invoice as Record<string, unknown> | null
    if (!invoice) return
    const vendor = invoice.vendor as Record<string, unknown> | null
    if (!vendor) return
    const vendorName = (vendor.legal_name as string) || 'Unknown'

    if (!vendorMap.has(vendorName)) {
      vendorMap.set(vendorName, {
        vendor,
        invoices: [],
        totalAmount: 0,
        totalTDS: 0,
        totalNet: 0,
      })
    }

    const entry = vendorMap.get(vendorName)!
    entry.invoices.push(invoice)
    entry.totalAmount += (invoice.total_amount as number) || 0
    entry.totalTDS += (invoice.tds_amount as number) || 0
    entry.totalNet += (item.amount as number) || (invoice.net_payable as number) || 0
  })

  // If only one vendor, use a focused layout; otherwise generate multi-vendor
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  // For each vendor, generate a page
  let isFirstPage = true

  for (const [vendorName, entry] of Array.from(vendorMap)) {
    if (!isFirstPage) doc.addPage()
    isFirstPage = false

    let y = margin

    // ── Header ──
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, pageWidth, 32, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT ADVICE', pageWidth / 2, 13, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Health1 Super Speciality Hospitals Pvt. Ltd.', pageWidth / 2, 20, { align: 'center' })
    doc.setFontSize(8)
    doc.text(`Batch: ${batch.batch_number || id.substring(0, 8)} | Date: ${formatDate(batch.batch_date || batch.created_at)}`, pageWidth / 2, 26, { align: 'center' })

    y = 38

    // ── Batch & Payment Details ──
    doc.setFillColor(...LIGHT_NAVY)
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F')

    const col1 = margin + 4
    const col2 = margin + contentWidth / 2 + 4

    doc.setTextColor(...NAVY)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Batch Number:', col1, y + 6)
    doc.text('Payment Date:', col1, y + 12)
    doc.text('Payment Mode:', col2, y + 6)
    doc.text('UTR/Reference:', col2, y + 12)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BLACK)
    doc.text(batch.batch_number || 'N/A', col1 + 30, y + 6)
    doc.text(formatDate(batch.batch_date || batch.created_at), col1 + 30, y + 12)
    doc.text((batch.payment_mode || 'NEFT').toUpperCase(), col2 + 30, y + 6)
    doc.text(batch.utr_number || batch.reference_number || 'Pending', col2 + 30, y + 12)

    y += 22

    // ── Vendor Details ──
    doc.setFillColor(...NAVY)
    doc.rect(margin, y, contentWidth / 2 - 2, 6, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYEE DETAILS', col1, y + 4.5)

    doc.setFillColor(...NAVY)
    doc.rect(margin + contentWidth / 2 + 2, y, contentWidth / 2 - 2, 6, 'F')
    doc.text('BANK DETAILS', col2, y + 4.5)

    y += 9

    const vendor = entry.vendor
    doc.setTextColor(...BLACK)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')

    const vendorLines = [
      vendorName,
      vendor.trade_name && vendor.trade_name !== vendorName ? `(${vendor.trade_name})` : '',
      [vendor.address, vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', '),
      vendor.gstin ? `GSTIN: ${vendor.gstin}` : '',
      vendor.primary_contact_phone ? `Phone: ${vendor.primary_contact_phone}` : '',
      vendor.primary_contact_email ? `Email: ${vendor.primary_contact_email}` : '',
    ].filter(Boolean)

    const bankLines = [
      vendor.bank_name ? `Bank: ${vendor.bank_name}` : 'Bank: Not on file',
      vendor.bank_account_no ? `A/C No: ${vendor.bank_account_no}` : '',
      vendor.bank_ifsc ? `IFSC: ${vendor.bank_ifsc}` : '',
      vendor.bank_account_type ? `Type: ${(vendor.bank_account_type as string).toUpperCase()}` : '',
    ].filter(Boolean)

    vendorLines.forEach((line, i) => {
      doc.text(line as string, col1, y + i * 4)
    })

    bankLines.forEach((line, i) => {
      doc.text(line as string, col2, y + i * 4)
    })

    y += Math.max(vendorLines.length, bankLines.length) * 4 + 4

    // ── Invoice Table ──
    autoTable(doc, {
      startY: y,
      head: [['S.No', 'Invoice No.', 'Vendor Invoice', 'Invoice Date', 'Invoice Amount', 'TDS Deducted', 'Net Payment']],
      body: entry.invoices.map((inv: any, idx: number) => [
        String(idx + 1),
        (inv.invoice_ref as string) || '',
        (inv.vendor_invoice_no as string) || '',
        formatDate(inv.vendor_invoice_date as string | null),
        formatINR((inv.total_amount as number) || 0),
        formatINR((inv.tds_amount as number) || 0),
        formatINR((inv.net_payable as number) || (inv.total_amount as number) || 0),
      ]),
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
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { halign: 'center', cellWidth: 22 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'right', cellWidth: 24 },
        6: { halign: 'right', cellWidth: 28 },
      },
      margin: { left: margin, right: margin },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 6

    // ── Summary Box ──
    const summaryW = 80
    const summaryX = margin + contentWidth - summaryW

    doc.setFillColor(230, 245, 246)
    doc.roundedRect(summaryX, y, summaryW, 28, 2, 2, 'F')
    doc.setDrawColor(...TEAL)
    doc.setLineWidth(0.5)
    doc.line(summaryX, y, summaryX, y + 28)

    doc.setTextColor(...GRAY)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.text('Total Invoice Amount', summaryX + 4, y + 7)
    doc.text(formatINR(entry.totalAmount), summaryX + summaryW - 4, y + 7, { align: 'right' })

    doc.text('Total TDS Deducted', summaryX + 4, y + 13)
    doc.text('(-) ' + formatINR(entry.totalTDS), summaryX + summaryW - 4, y + 13, { align: 'right' })

    doc.setDrawColor(...TEAL)
    doc.setLineWidth(0.2)
    doc.line(summaryX + 4, y + 17, summaryX + summaryW - 4, y + 17)

    doc.setTextColor(...TEAL)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Net Payment', summaryX + 4, y + 23)
    doc.text(formatINR(entry.totalNet), summaryX + summaryW - 4, y + 23, { align: 'right' })

    // Amount in words — left side
    doc.setTextColor(...BLACK)
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.text('Amount in Words:', margin, y + 6)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7)
    const amtWords = numberToWordsINR(entry.totalNet)
    const wordLines = doc.splitTextToSize(amtWords, summaryX - margin - 8)
    doc.text(wordLines, margin, y + 11)

    y += 36

    // ── Notes ──
    if (batch.notes) {
      doc.setTextColor(...GRAY)
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text('Notes:', margin, y)
      doc.setFont('helvetica', 'normal')
      const noteLines = doc.splitTextToSize(batch.notes, contentWidth)
      doc.text(noteLines, margin, y + 4)
      y += noteLines.length * 3.5 + 6
    }

    // ── Disclaimer ──
    y = Math.max(y + 4, 240)
    if (y > 265) { doc.addPage(); y = margin }

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(margin, y, contentWidth, 10, 1, 1, 'F')
    doc.setTextColor(...GRAY)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.text(
      'This is a computer-generated payment advice and does not require a signature. Please reconcile the payment in your books.',
      margin + 3, y + 4
    )
    doc.text(
      'For any discrepancies, contact the Finance Department within 7 days of payment date.',
      margin + 3, y + 8
    )

    y += 14

    // ── Signatory ──
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)
    doc.setTextColor(...GRAY)
    doc.setFontSize(7)
    doc.text('Authorized Signatory', pageWidth - margin - 60, y + 4)
    doc.setTextColor(...NAVY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.text('For Health1 Super Speciality Hospitals Pvt. Ltd.', pageWidth - margin - 60, y + 8)
  }

  // If no vendor data, generate a simple "no data" page
  if (vendorMap.size === 0) {
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, pageWidth, 32, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT ADVICE', pageWidth / 2, 13, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Health1 Super Speciality Hospitals Pvt. Ltd.', pageWidth / 2, 20, { align: 'center' })

    doc.setTextColor(...GRAY)
    doc.setFontSize(12)
    doc.text('No payment items found for this batch.', pageWidth / 2, 60, { align: 'center' })
  }

  // ── Page Footer on all pages ──
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
  const filename = batch.batch_number
    ? `Payment-Advice-${batch.batch_number}.pdf`
    : `Payment-Advice-${id.substring(0, 8)}.pdf`

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
}
