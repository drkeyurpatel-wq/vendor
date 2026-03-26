import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, HeadingLevel,
  ShadingType, TableLayoutType, ImageRun,
} from 'docx'
import { format } from 'date-fns'
import { rateLimit } from '@/lib/rate-limit'
import { HEALTH1_LOGO_BASE64 } from '@/lib/logo-base64'
import { withApiErrorHandler } from '@/lib/api-error-handler'

// ============================================================
// H1 VPMS — Purchase Order DOCX Generator
// ============================================================

const NAVY = '1B3A6B'
const TEAL = '0D7E8A'
const LIGHT_NAVY = 'EEF2F9'
const WHITE = 'FFFFFF'

// ─── Indian Number-to-Words Converter ───────────────────────

const onesWords = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tensWords = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigitWords(n: number): string {
  if (n < 20) return onesWords[n]
  return tensWords[Math.floor(n / 10)] + (n % 10 ? '-' + onesWords[n % 10] : '')
}

function threeDigitWords(n: number): string {
  if (n === 0) return ''
  if (n < 100) return twoDigitWords(n)
  return onesWords[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigitWords(n % 100) : '')
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

function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0.00'
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

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const vendor = po.vendor as Record<string, string> | null
  const centre = po.centre as Record<string, string> | null
  const items = (po.items || []) as Record<string, unknown>[]
  const isIGST = (po.igst_amount || 0) > 0

  // Build document sections
  const sections: Paragraph[] = []

  // Title with logo
  const logoBuffer = Buffer.from(HEALTH1_LOGO_BASE64, 'base64')
  sections.push(
    new Paragraph({
      children: [
        new ImageRun({ data: logoBuffer, transformation: { width: 120, height: 71 }, type: 'jpg' }),
        new TextRun({ text: '   ', size: 32 }),
        new TextRun({ text: 'PURCHASE ORDER', bold: true, size: 32, color: NAVY, font: 'Calibri' }),
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

  // PO Details table
  const detailsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [cellText('PO Number:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY }, width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [cellText(po.po_number)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY }, width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [cellText('Status:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY }, width: { size: 25, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [cellText((po.status || '').replace(/_/g, ' ').toUpperCase())], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY }, width: { size: 25, type: WidthType.PERCENTAGE } }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [cellText('PO Date:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText(formatDate(po.po_date))], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText('Priority:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText((po.priority || 'normal').toUpperCase())], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [cellText('Expected Delivery:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText(po.expected_delivery_date ? formatDate(po.expected_delivery_date) : 'N/A')], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText('Revision:', true, 18, NAVY)], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
          new TableCell({ children: [cellText(String(po.revision_number || 0))], borders: noBorder(), shading: { type: ShadingType.SOLID, color: LIGHT_NAVY } }),
        ],
      }),
    ],
  })

  sections.push(new Paragraph({ children: [] })) // spacer

  // Vendor Details heading
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'VENDOR DETAILS', bold: true, size: 20, color: WHITE, font: 'Calibri' })],
      shading: { type: ShadingType.SOLID, color: NAVY },
      spacing: { before: 200, after: 80 },
    })
  )

  const vendorLines = vendor ? [
    vendor.legal_name,
    vendor.trade_name && vendor.trade_name !== vendor.legal_name ? `(${vendor.trade_name})` : '',
    vendor.address || '',
    [vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(', '),
    vendor.gstin ? `GSTIN: ${vendor.gstin}` : '',
    vendor.pan ? `PAN: ${vendor.pan}` : '',
    vendor.primary_contact_phone ? `Phone: ${vendor.primary_contact_phone}` : '',
    vendor.primary_contact_email ? `Email: ${vendor.primary_contact_email}` : '',
  ].filter(Boolean) : []

  vendorLines.forEach(line => {
    sections.push(new Paragraph({
      children: [new TextRun({ text: line, size: 18, font: 'Calibri' })],
      spacing: { after: 20 },
    }))
  })

  // Ship To heading
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: 'SHIP TO', bold: true, size: 20, color: WHITE, font: 'Calibri' })],
      shading: { type: ShadingType.SOLID, color: NAVY },
      spacing: { before: 200, after: 80 },
    })
  )

  const centreLines = centre ? [
    centre.name,
    centre.address || '',
    [centre.city, centre.state].filter(Boolean).join(', '),
    centre.phone ? `Phone: ${centre.phone}` : '',
    centre.email ? `Email: ${centre.email}` : '',
  ].filter(Boolean) : []

  centreLines.forEach(line => {
    sections.push(new Paragraph({
      children: [new TextRun({ text: line, size: 18, font: 'Calibri' })],
      spacing: { after: 20 },
    }))
  })

  // Supply type
  const supplyType = isIGST ? 'Inter-State (IGST)' : 'Intra-State (CGST + SGST)'
  sections.push(new Paragraph({
    children: [
      new TextRun({ text: `Supply Type: ${supplyType}`, bold: true, size: 18, color: TEAL, font: 'Calibri' }),
      ...(po.quotation_ref ? [new TextRun({ text: `    Quotation: ${po.quotation_ref}${po.quotation_date ? ' dt. ' + formatDate(po.quotation_date) : ''}`, size: 18, color: TEAL, font: 'Calibri' })] : []),
    ],
    shading: { type: ShadingType.SOLID, color: 'E6F5F6' },
    spacing: { before: 200, after: 200 },
  }))

  // Items Table
  const headerCells = ['S.No', 'Item Description', 'HSN', 'Qty', 'Unit', 'Rate', 'Disc%']
  if (isIGST) {
    headerCells.push('IGST%', 'IGST', 'Amount')
  } else {
    headerCells.push('CGST%', 'SGST%', 'Amount')
  }

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map(h => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, size: 16, color: WHITE, font: 'Calibri' })],
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
      (item.hsn_code as string) || (it?.hsn_code as string) || '',
      String(item.ordered_qty),
      (item.unit as string) || (it?.unit as string) || '',
      formatINR(item.rate as number),
      item.trade_discount_percent ? String(item.trade_discount_percent) + '%' : '-',
    ]

    if (isIGST) {
      cells.push(
        item.igst_percent ? String(item.igst_percent) + '%' : String(item.gst_percent) + '%',
        formatINR(item.igst_amount as number),
        formatINR(item.total_amount as number)
      )
    } else {
      cells.push(
        item.cgst_percent ? String(item.cgst_percent) + '%' : String((item.gst_percent as number) / 2) + '%',
        item.sgst_percent ? String(item.sgst_percent) + '%' : String((item.gst_percent as number) / 2) + '%',
        formatINR(item.total_amount as number)
      )
    }

    return new TableRow({
      children: cells.map((c, ci) => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: c, size: 16, font: 'Calibri' })],
          alignment: ci === 0 || ci >= 2 ? AlignmentType.CENTER : AlignmentType.LEFT,
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
  const summaryLines: [string, string][] = [
    ['Subtotal', formatINR(po.subtotal)],
  ]
  if (po.discount_amount > 0) summaryLines.push(['Discount', '(-) ' + formatINR(po.discount_amount)])
  if (isIGST) {
    summaryLines.push(['IGST', formatINR(po.igst_amount || 0)])
  } else {
    summaryLines.push(['CGST', formatINR(po.cgst_amount || 0)])
    summaryLines.push(['SGST', formatINR(po.sgst_amount || 0)])
  }
  if (po.freight_amount > 0) summaryLines.push(['Freight', formatINR(po.freight_amount)])
  if (po.loading_charges > 0) summaryLines.push(['Loading', formatINR(po.loading_charges)])
  if (po.insurance_charges > 0) summaryLines.push(['Insurance', formatINR(po.insurance_charges)])
  if (po.other_charges > 0) summaryLines.push(['Other Charges', formatINR(po.other_charges)])
  if (po.round_off != null && po.round_off !== 0) summaryLines.push(['Round Off', formatINR(po.round_off)])
  summaryLines.push(['Grand Total', formatINR(po.net_amount || po.total_amount)])

  const summaryParagraphs: Paragraph[] = []
  summaryLines.forEach(([label, value], i) => {
    const isTotal = i === summaryLines.length - 1
    summaryParagraphs.push(new Paragraph({
      children: [
        new TextRun({ text: `${label}: `, bold: isTotal, size: isTotal ? 22 : 18, color: isTotal ? NAVY : '6B7280', font: 'Calibri' }),
        new TextRun({ text: value, bold: isTotal, size: isTotal ? 22 : 18, color: isTotal ? NAVY : '000000', font: 'Calibri' }),
      ],
      alignment: AlignmentType.RIGHT,
      spacing: { after: isTotal ? 0 : 40 },
    }))
  })

  // Amount in words
  const amountWords = numberToWordsINR(po.net_amount || po.total_amount)

  // Terms
  const termsParagraphs: Paragraph[] = []
  if (po.terms_and_conditions || po.delivery_instructions || po.payment_terms) {
    termsParagraphs.push(new Paragraph({
      children: [new TextRun({ text: 'TERMS & CONDITIONS', bold: true, size: 20, color: WHITE, font: 'Calibri' })],
      shading: { type: ShadingType.SOLID, color: NAVY },
      spacing: { before: 200, after: 80 },
    }))

    if (po.delivery_instructions) {
      termsParagraphs.push(
        new Paragraph({ children: [new TextRun({ text: 'Delivery Instructions:', bold: true, size: 18, font: 'Calibri' })], spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: po.delivery_instructions, size: 18, font: 'Calibri' })], spacing: { after: 80 } })
      )
    }
    if (po.payment_terms) {
      termsParagraphs.push(
        new Paragraph({ children: [new TextRun({ text: 'Payment Terms:', bold: true, size: 18, font: 'Calibri' })], spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: po.payment_terms, size: 18, font: 'Calibri' })], spacing: { after: 80 } })
      )
    }
    if (po.terms_and_conditions) {
      termsParagraphs.push(
        new Paragraph({ children: [new TextRun({ text: 'General Terms:', bold: true, size: 18, font: 'Calibri' })], spacing: { after: 40 } }),
        new Paragraph({ children: [new TextRun({ text: po.terms_and_conditions, size: 18, font: 'Calibri' })], spacing: { after: 80 } })
      )
    }
  }

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
        new Paragraph({
          children: [
            new TextRun({ text: 'Amount in Words: ', bold: true, size: 18, font: 'Calibri' }),
            new TextRun({ text: amountWords, italics: true, size: 18, font: 'Calibri' }),
          ],
          spacing: { before: 200, after: 200 },
        }),
        ...termsParagraphs,
        // Signature section
        new Paragraph({ children: [], spacing: { before: 600 } }),
        new Paragraph({
          children: [
            new TextRun({ text: '____________________________', size: 18, font: 'Calibri' }),
            new TextRun({ text: '                                                    ', size: 18, font: 'Calibri' }),
            new TextRun({ text: '____________________________', size: 18, font: 'Calibri' }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Prepared By', size: 16, color: '6B7280', font: 'Calibri' }),
            new TextRun({ text: '                                                                           ', size: 16, font: 'Calibri' }),
            new TextRun({ text: 'Authorized Signatory', size: 16, color: '6B7280', font: 'Calibri' }),
          ],
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: '', size: 16, font: 'Calibri' }),
            new TextRun({ text: '                                                                           ', size: 16, font: 'Calibri' }),
            new TextRun({ text: 'For Health1 Super Speciality Hospitals Pvt. Ltd.', bold: true, size: 16, color: NAVY, font: 'Calibri' }),
          ],
          spacing: { after: 200 },
        }),
        // Footer
        new Paragraph({
          children: [new TextRun({
            text: `Generated on ${format(new Date(), 'dd MMM yyyy, h:mm a')}`,
            size: 12, color: '6B7280', font: 'Calibri',
          })],
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
      'Content-Disposition': `attachment; filename="${po.po_number}.docx"`,
      'Content-Length': String(buffer.length),
    },
  })
})
