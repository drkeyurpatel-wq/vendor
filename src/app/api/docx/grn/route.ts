import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle,
  ShadingType, TableLayoutType, ImageRun,
} from 'docx'
import { format } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'
import { HEALTH1_LOGO_BASE64 } from '@/lib/logo-base64'

// ============================================================
// H1 VPMS — GRN DOCX Generator
// ============================================================

const NAVY = '1B3A6B'
const TEAL = '0D7E8A'
const LIGHT_NAVY = 'EEF2F9'
const WHITE = 'FFFFFF'

function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
}

function formatDate(date: string | null): string {
  if (!date) return 'N/A'
  return format(new Date(date), 'dd MMM yyyy')
}

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: WHITE },
    bottom: { style: BorderStyle.NONE, size: 0, color: WHITE },
    left: { style: BorderStyle.NONE, size: 0, color: WHITE },
    right: { style: BorderStyle.NONE, size: 0, color: WHITE },
  }
}

function cellText(text: string, bold = false, size = 18, color = '000000'): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold, size, color, font: 'Calibri' })],
  })
}

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 20, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing GRN id' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: grn, error } = await supabase
    .from('grns')
    .select(`
      *,
      vendor:vendors(legal_name, trade_name, gstin, address, city, state, pincode, primary_contact_phone),
      centre:centres(name, code, address, city, state),
      po:purchase_orders(po_number),
      items:grn_items(*, item:items(generic_name, brand_name, hsn_code, unit))
    `)
    .eq('id', id)
    .single()

  if (error || !grn) return NextResponse.json({ error: 'GRN not found' }, { status: 404 })

  const vendor = grn.vendor as Record<string, string> | null
  const centre = grn.centre as Record<string, string> | null
  const items = (grn.items || []) as Record<string, unknown>[]

  const sections: Paragraph[] = []

  // Title with logo
  const logoBuffer = Buffer.from(HEALTH1_LOGO_BASE64, 'base64')
  sections.push(
    new Paragraph({
      children: [
        new ImageRun({ data: logoBuffer, transformation: { width: 120, height: 71 }, type: 'jpg' }),
        new TextRun({ text: '   ', size: 32 }),
        new TextRun({ text: 'GOODS RECEIPT NOTE', bold: true, size: 32, color: NAVY, font: 'Calibri' }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    new Paragraph({
      children: [new TextRun({ text: 'Health1 Super Speciality Hospitals Pvt. Ltd.', size: 22, color: NAVY, font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: centre ? `${centre.name} | ${centre.address || ''}, ${centre.city || ''}, ${centre.state || ''}` : '',
        size: 16, color: '6B7280', font: 'Calibri',
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  )

  // GRN Details table
  const detailsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [cellText('GRN Number:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText(grn.grn_number)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText('PO Reference:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText((grn.po as Record<string, string>)?.po_number || 'N/A')], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [cellText('GRN Date:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText(formatDate(grn.grn_date))], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText('Invoice No:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText(grn.vendor_invoice_no || 'N/A')], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [cellText('Status:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText((grn.status || '').replace(/_/g, ' ').toUpperCase())], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText('QC Status:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText((grn.quality_status || 'pending').replace(/_/g, ' ').toUpperCase())], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
        ],
      }),
    ],
  })

  // Vendor Details
  sections.push(
    new Paragraph({ children: [], spacing: { after: 100 } }),
    new Paragraph({
      children: [new TextRun({ text: 'VENDOR DETAILS', bold: true, size: 20, color: WHITE, font: 'Calibri' })],
      shading: { type: ShadingType.SOLID, color: NAVY },
      spacing: { before: 100, after: 80 },
    })
  )

  const vendorLines = vendor ? [
    vendor.legal_name,
    vendor.trade_name && vendor.trade_name !== vendor.legal_name ? `(${vendor.trade_name})` : '',
    [vendor.address, vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', '),
    vendor.gstin ? `GSTIN: ${vendor.gstin}` : '',
    vendor.primary_contact_phone ? `Phone: ${vendor.primary_contact_phone}` : '',
  ].filter(Boolean) : []

  vendorLines.forEach(line => {
    sections.push(new Paragraph({
      children: [new TextRun({ text: line, size: 18, font: 'Calibri' })],
      spacing: { after: 20 },
    }))
  })

  // Transport Details
  if (grn.dc_number || grn.lr_number || grn.vehicle_number || grn.eway_bill_no) {
    sections.push(new Paragraph({
      children: [new TextRun({ text: 'TRANSPORT DETAILS', bold: true, size: 18, color: TEAL, font: 'Calibri' })],
      shading: { type: ShadingType.SOLID, color: 'E6F5F6' },
      spacing: { before: 200, after: 80 },
    }))

    const transLines = [
      grn.dc_number ? `DC No: ${grn.dc_number}${grn.dc_date ? ' dt. ' + formatDate(grn.dc_date) : ''}` : '',
      grn.lr_number ? `LR No: ${grn.lr_number}` : '',
      grn.vehicle_number ? `Vehicle: ${grn.vehicle_number}` : '',
      grn.transport_name ? `Transporter: ${grn.transport_name}` : '',
      grn.eway_bill_no ? `E-Way Bill: ${grn.eway_bill_no}` : '',
    ].filter(Boolean)

    transLines.forEach(line => {
      sections.push(new Paragraph({
        children: [new TextRun({ text: line, size: 16, font: 'Calibri' })],
        spacing: { after: 20 },
      }))
    })
  }

  // Items Table
  const headerCells = ['S.No', 'Item', 'Batch', 'Expiry', 'MRP', 'Ord Qty', 'Rec Qty', 'Accepted', 'Rejected', 'Rate', 'Amount']

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map(h => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, size: 14, color: WHITE, font: 'Calibri' })],
        alignment: AlignmentType.CENTER,
      })],
      shading: { type: ShadingType.SOLID, color: NAVY },
    })),
  })

  const itemRows = items.map((item, idx) => {
    const it = item.item as Record<string, unknown> | undefined
    const name = it?.generic_name
      ? `${it.generic_name}${it.brand_name ? ' (' + it.brand_name + ')' : ''}`
      : 'Item'

    const cells = [
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

    return new TableRow({
      children: cells.map((c, ci) => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: c, size: 14, font: 'Calibri' })],
          alignment: ci === 0 || ci >= 4 ? AlignmentType.CENTER : AlignmentType.LEFT,
        })],
        shading: idx % 2 === 1 ? { type: ShadingType.SOLID, color: 'F8FAFC' } : undefined,
      })),
    })
  })

  const itemsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...itemRows],
  })

  // Summary
  const summaryParagraphs: Paragraph[] = []
  const totals: [string, string][] = []
  if (grn.discount_amount > 0) totals.push(['Discount', '(-) ' + formatINR(grn.discount_amount)])
  if (grn.cgst_amount > 0) totals.push(['CGST', formatINR(grn.cgst_amount)])
  if (grn.sgst_amount > 0) totals.push(['SGST', formatINR(grn.sgst_amount)])
  if (grn.igst_amount > 0) totals.push(['IGST', formatINR(grn.igst_amount)])
  totals.push(['Net Amount', formatINR(grn.net_amount || grn.total_amount)])

  totals.forEach(([label, value], i) => {
    const isTotal = i === totals.length - 1
    summaryParagraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: isTotal, size: isTotal ? 22 : 18, color: isTotal ? NAVY : '6B7280', font: 'Calibri' }),
        new TextRun({ text: value, bold: isTotal, size: isTotal ? 22 : 18, color: isTotal ? NAVY : '000000', font: 'Calibri' }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: isTotal ? 0 : 40 },
    }))
  })

  // Build document
  const doc = new Document({
    sections: [{
      children: [
        ...sections,
        detailsTable,
        new Paragraph({ children: [], spacing: { after: 200 } }),
        itemsTable,
        new Paragraph({ children: [], spacing: { after: 100 } }),
        ...summaryParagraphs,
        // Notes
        ...(grn.notes ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'Notes: ', bold: true, size: 18, font: 'Calibri' }),
              new TextRun({ text: grn.notes, size: 18, font: 'Calibri' }),
            ],
            spacing: { before: 200, after: 100 },
          }),
        ] : []),
        // QC Notes
        ...(grn.qc_notes ? [
          new Paragraph({
            children: [
              new TextRun({ text: 'QC Remarks: ', bold: true, size: 18, color: '92400E', font: 'Calibri' }),
              new TextRun({ text: grn.qc_notes, size: 18, font: 'Calibri' }),
            ],
            spacing: { before: 100, after: 200 },
          }),
        ] : []),
        // Signatures
        new Paragraph({ children: [], spacing: { before: 400 } }),
        new Paragraph({
          children: [
            new TextRun({ text: '____________________', size: 18, font: 'Calibri' }),
            new TextRun({ text: '                    ', size: 18, font: 'Calibri' }),
            new TextRun({ text: '____________________', size: 18, font: 'Calibri' }),
            new TextRun({ text: '                    ', size: 18, font: 'Calibri' }),
            new TextRun({ text: '____________________', size: 18, font: 'Calibri' }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Received By', size: 14, color: '6B7280', font: 'Calibri' }),
            new TextRun({ text: '                              ', size: 14, font: 'Calibri' }),
            new TextRun({ text: 'Verified By', size: 14, color: '6B7280', font: 'Calibri' }),
            new TextRun({ text: '                              ', size: 14, font: 'Calibri' }),
            new TextRun({ text: 'QC Approved By', size: 14, color: '6B7280', font: 'Calibri' }),
          ],
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Store Department', bold: true, size: 14, color: NAVY, font: 'Calibri' }),
            new TextRun({ text: '                         ', size: 14, font: 'Calibri' }),
            new TextRun({ text: 'Purchase Department', bold: true, size: 14, color: NAVY, font: 'Calibri' }),
            new TextRun({ text: '                     ', size: 14, font: 'Calibri' }),
            new TextRun({ text: 'Quality Control', bold: true, size: 14, color: NAVY, font: 'Calibri' }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `Generated on ${format(new Date(), 'dd MMM yyyy, h:mm a')}`, size: 12, color: '6B7280', font: 'Calibri' })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const uint8 = new Uint8Array(buffer)

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${grn.grn_number}.docx"`,
      'Content-Length': String(buffer.length),
    },
  })
}
