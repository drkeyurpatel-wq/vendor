import { requireApiAuthWithProfile } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'
import { renderPDFHeader } from '@/lib/pdf-header'
import { withApiErrorHandler } from '@/lib/api-error-handler'

// ============================================================
// H1 VPMS — Purchase Indent PDF Generator
// Brand: Navy #1B3A6B, Teal #0D7E8A
// ============================================================

const NAVY: [number, number, number] = [27, 58, 107]
const TEAL: [number, number, number] = [13, 126, 138]
const LIGHT_NAVY: [number, number, number] = [238, 242, 249]
const WHITE: [number, number, number] = [255, 255, 255]
const BLACK: [number, number, number] = [0, 0, 0]
const GRAY: [number, number, number] = [107, 114, 128]

function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd MMM yyyy')
}

export const GET = withApiErrorHandler(async (request: NextRequest) => {
  const rateLimitResult = await rateLimit(request, 20, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing indent id' }, { status: 400 })

  const { supabase, user, userId, role, centreId, isGroupLevel } = await requireApiAuthWithProfile()
  const { data: indent, error } = await supabase
    .from('purchase_indents')
    .select(`
      *,
      centre:centres(name, code, address, city, state),
      items:purchase_indent_items(
        *,
        item:items(generic_name, brand_name, item_code, unit, hsn_code)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !indent) {
    return NextResponse.json({ error: 'Indent not found' }, { status: 404 })
  }

  // Fetch users separately
  let requestedByName = ''
  let approvedByName = ''
  if (indent.requested_by) {
    const { data: u } = await supabase.from('user_profiles').select('full_name').eq('id', indent.requested_by).single()
    requestedByName = u?.full_name || ''
  }
  if (indent.approved_by) {
    const { data: u } = await supabase.from('user_profiles').select('full_name').eq('id', indent.approved_by).single()
    approvedByName = u?.full_name || ''
  }

  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = margin

  // ── Header with Logo ──
  y = renderPDFHeader(doc, 'PURCHASE INDENT', indent.centre)

  // ── Indent Details Box ──
  doc.setFillColor(...LIGHT_NAVY)
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F')

  const col1 = margin + 4
  const col2 = margin + contentWidth / 2 + 4

  doc.setTextColor(...NAVY)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Indent Number:', col1, y + 6)
  doc.text('Indent Date:', col1, y + 12)
  doc.text('Status:', col1, y + 18)

  doc.text('Priority:', col2, y + 6)
  doc.text('Required By:', col2, y + 12)
  doc.text('Department:', col2, y + 18)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BLACK)
  doc.text(indent.indent_number || 'N/A', col1 + 30, y + 6)
  doc.text(formatDate(indent.indent_date || indent.created_at), col1 + 30, y + 12)
  doc.text((indent.status || '').replace(/_/g, ' ').toUpperCase(), col1 + 30, y + 18)

  doc.text((indent.priority || 'normal').toUpperCase(), col2 + 26, y + 6)
  doc.text(indent.required_by_date ? formatDate(indent.required_by_date) : 'N/A', col2 + 26, y + 12)
  doc.text(indent.department || 'N/A', col2 + 26, y + 18)

  y += 28

  // ── Requested/Approved By ──
  doc.setFillColor(230, 245, 246)
  doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F')
  doc.setTextColor(...TEAL)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'bold')
  doc.text(`Requested By: ${requestedByName || 'N/A'}`, col1, y + 5.5)
  if (approvedByName) {
    doc.text(`Approved By: ${approvedByName}`, col2, y + 5.5)
  }
  y += 14

  // ── Items Table ──
  const items = indent.items || []

  autoTable(doc, {
    startY: y,
    head: [['S.No', 'Item Code', 'Item Description', 'Unit', 'Qty Required', 'Current Stock', 'Est. Rate', 'Est. Amount']],
    body: items.map((item: Record<string, unknown>, idx: number) => {
      const it = item.item as Record<string, unknown> | undefined
      const name = it?.generic_name
        ? `${it.generic_name}${it.brand_name ? ' (' + it.brand_name + ')' : ''}`
        : 'Item'
      const estRate = (item.last_purchase_rate as number) || 0
      const qty = (item.requested_qty as number) || 0
      return [
        String(idx + 1),
        (it?.item_code as string) || '',
        name,
        (item.unit as string) || (it?.unit as string) || '',
        String(qty),
        String(item.current_stock ?? '—'),
        estRate > 0 ? formatINR(estRate) : '—',
        estRate > 0 && qty > 0 ? formatINR(estRate * qty) : '—',
      ]
    }),
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
      1: { halign: 'center', cellWidth: 22 },
      2: { cellWidth: 48 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'right', cellWidth: 22 },
      7: { halign: 'right', cellWidth: 24 },
    },
    margin: { left: margin, right: margin },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 8

  // ── Estimated Total ──
  const totalEst = items.reduce((sum: number, item: Record<string, unknown>) => {
    const rate = (item.last_purchase_rate as number) || 0
    const qty = (item.requested_qty as number) || 0
    return sum + rate * qty
  }, 0)

  if (totalEst > 0) {
    doc.setTextColor(...NAVY)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Estimated Total: ${formatINR(totalEst)}`, pageWidth - margin, y, { align: 'right' })
    y += 8
  }

  // ── Justification / Notes ──
  if (indent.justification || indent.notes) {
    if (y > 240) { doc.addPage(); y = margin }

    doc.setFillColor(...NAVY)
    doc.rect(margin, y, contentWidth, 6, 'F')
    doc.setTextColor(...WHITE)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('JUSTIFICATION / NOTES', margin + 4, y + 4.5)
    y += 9

    doc.setTextColor(...BLACK)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')

    if (indent.justification) {
      const justLines = doc.splitTextToSize(indent.justification, contentWidth - 4)
      doc.text(justLines, margin + 2, y)
      y += justLines.length * 3.5 + 4
    }
    if (indent.notes) {
      const noteLines = doc.splitTextToSize(indent.notes, contentWidth - 4)
      doc.text(noteLines, margin + 2, y)
      y += noteLines.length * 3.5 + 4
    }
  }

  // ── Signature Section ──
  y = Math.max(y + 12, 252)
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
  doc.text('Requested By', sig1X, y + 4)
  doc.text('HOD Approval', sig2X, y + 4)
  doc.text('Purchase Dept', sig3X, y + 4)

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
  const filename = indent.indent_number || `indent-${id.substring(0, 8)}`

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      'Content-Length': String(pdfBuffer.length),
    },
  })
})
