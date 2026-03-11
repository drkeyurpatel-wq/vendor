import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

// CSV/Excel template definitions for each import type
const TEMPLATES: Record<string, { name: string; headers: string[]; sampleRows: string[][]; instructions: string[] }> = {
  vendors: {
    name: 'Vendor_Import_Template',
    headers: [
      'legal_name', 'trade_name', 'category',
      'gstin', 'pan', 'drug_license_no',
      'primary_contact_name', 'primary_contact_phone', 'primary_contact_email',
      'address', 'city', 'state', 'pincode',
      'bank_name', 'bank_account_no', 'bank_ifsc', 'bank_account_type',
      'credit_period_days', 'credit_limit',
      'centres_served'
    ],
    sampleRows: [
      [
        'ABC Pharma Pvt Ltd', 'ABC Pharma', 'Pharma',
        '24AABCU9603R1ZM', 'AABCU9603R', 'GJ/25B/2024/001234',
        'Rajesh Patel', '9876543210', 'rajesh@abcpharma.com',
        '123 MG Road', 'Ahmedabad', 'Gujarat', '380001',
        'HDFC Bank', '0012345678901', 'HDFC0001234', 'current',
        '30', '500000',
        'SHI,VAS,MOD'
      ],
      [
        'XYZ Surgical Supplies', '', 'Surgical',
        '24BBBCU1234R1ZP', 'BBBCU1234R', '',
        'Mahesh Shah', '9898989898', 'mahesh@xyzsurgical.com',
        '456 Industrial Area', 'Gandhinagar', 'Gujarat', '382010',
        'SBI', '1234567890123', 'SBIN0001234', 'current',
        '45', '200000',
        'ALL'
      ]
    ],
    instructions: [
      'legal_name: Required. Full legal company name as on GST certificate',
      'trade_name: Optional. Common trade name if different from legal name',
      'category: Required. One of: Pharma, Surgical, Equipment, Consumable, Lab, Housekeeping, IT, Other',
      'gstin: 15-character GST number (e.g., 24AABCU9603R1ZM)',
      'pan: 10-character PAN (e.g., AABCU9603R)',
      'drug_license_no: Drug license number if pharma vendor',
      'primary_contact_name/phone/email: Main contact person details',
      'address/city/state/pincode: Registered address',
      'bank_name/bank_account_no/bank_ifsc: Bank details for payment',
      'bank_account_type: One of: savings, current, cc, od',
      'credit_period_days: Number of days (default 30)',
      'credit_limit: Maximum outstanding amount allowed',
      'centres_served: Comma-separated centre codes (SHI,VAS,MOD,UDA,GAN) or ALL for all centres'
    ]
  },
  items: {
    name: 'Item_Import_Template',
    headers: [
      'generic_name', 'brand_name', 'category', 'sub_category',
      'unit', 'hsn_code', 'gst_percent',
      'shelf_life_days', 'is_cold_chain', 'is_narcotic', 'is_high_alert',
      'ecw_item_code', 'tally_item_name', 'notes'
    ],
    sampleRows: [
      [
        'Paracetamol 500mg', 'Crocin', 'Pharma', 'Tablets',
        'STRIP', '30049099', '12',
        '730', 'No', 'No', 'No',
        'ECW-PAR500', 'Paracetamol 500mg Tab', ''
      ],
      [
        'Surgical Gloves (Medium)', '', 'Surgical', 'Gloves',
        'BOX', '40151920', '12',
        '1095', 'No', 'No', 'No',
        '', 'Surgical Gloves M', ''
      ]
    ],
    instructions: [
      'generic_name: Required. Generic/common name of the item',
      'brand_name: Optional. Brand name if applicable',
      'category: Required. Main category (e.g., Pharma, Surgical, Equipment, Lab, Consumable)',
      'sub_category: Optional. Sub-category within main category',
      'unit: Required. One of: STRIP, TABLET, VIAL, BOTTLE, BOX, NOS, KG, LITRE, PAIR, SET, ROLL, PACK',
      'hsn_code: HSN/SAC code for GST',
      'gst_percent: GST percentage (0, 5, 12, 18, 28). Default 12',
      'shelf_life_days: Shelf life in days',
      'is_cold_chain: Yes/No - requires cold storage',
      'is_narcotic: Yes/No - narcotic/controlled substance',
      'is_high_alert: Yes/No - high alert medication',
      'ecw_item_code: eClinicalWorks item code for mapping',
      'tally_item_name: Tally item name for accounting sync',
      'notes: Any additional notes'
    ]
  },
  vendor_items: {
    name: 'Vendor_Item_Mapping_Template',
    headers: [
      'vendor_gstin_or_name', 'item_generic_name',
      'last_quoted_rate', 'l_rank', 'is_preferred'
    ],
    sampleRows: [
      ['24AABCU9603R1ZM', 'Paracetamol 500mg', '45.50', '1', 'Yes'],
      ['ABC Pharma Pvt Ltd', 'Amoxicillin 250mg', '120.00', '2', 'No'],
      ['24BBBCU1234R1ZP', 'Surgical Gloves (Medium)', '350.00', '1', 'Yes']
    ],
    instructions: [
      'vendor_gstin_or_name: Required. GSTIN (preferred) or exact legal_name of vendor (must already exist in system)',
      'item_generic_name: Required. Exact generic_name of item (must already exist in system)',
      'last_quoted_rate: Latest quoted rate (per unit) from this vendor',
      'l_rank: Vendor ranking for this item. 1=L1 (cheapest), 2=L2, 3=L3',
      'is_preferred: Yes/No - is this the preferred vendor for this item',
      'NOTE: Import vendors and items FIRST, then import this mapping'
    ]
  },
  opening_stock: {
    name: 'Opening_Stock_Template',
    headers: [
      'item_generic_name', 'centre_code',
      'current_stock', 'reorder_level', 'max_level',
      'last_grn_rate', 'avg_daily_consumption'
    ],
    sampleRows: [
      ['Paracetamol 500mg', 'SHI', '5000', '500', '10000', '45.50', '25'],
      ['Paracetamol 500mg', 'VAS', '3000', '300', '8000', '45.50', '15'],
      ['Surgical Gloves (Medium)', 'SHI', '200', '50', '500', '350.00', '5']
    ],
    instructions: [
      'item_generic_name: Required. Exact generic_name of item (must already exist in system)',
      'centre_code: Required. One of: SHI, VAS, MOD, UDA, GAN',
      'current_stock: Required. Current stock quantity on hand',
      'reorder_level: Stock level at which reorder should be triggered',
      'max_level: Maximum stock level to maintain',
      'last_grn_rate: Last purchase rate per unit',
      'avg_daily_consumption: Average daily consumption units',
      'NOTE: Import items FIRST before importing opening stock'
    ]
  },
  vendor_outstanding: {
    name: 'Vendor_Outstanding_Template',
    headers: [
      'vendor_gstin_or_name', 'vendor_invoice_no', 'vendor_invoice_date',
      'centre_code', 'total_amount', 'gst_amount',
      'paid_amount', 'due_date', 'notes'
    ],
    sampleRows: [
      [
        '24AABCU9603R1ZM', 'INV/2025-26/1234', '2025-12-15',
        'SHI', '50000', '6000',
        '0', '2026-01-14', 'Pharma supplies Dec batch'
      ],
      [
        'ABC Pharma Pvt Ltd', 'INV/2025-26/1235', '2026-01-10',
        'VAS', '125000', '15000',
        '50000', '2026-02-09', 'Partial payment done'
      ]
    ],
    instructions: [
      'vendor_gstin_or_name: Required. GSTIN (preferred) or exact legal_name of vendor',
      'vendor_invoice_no: Required. Original vendor invoice number',
      'vendor_invoice_date: Required. Date format YYYY-MM-DD',
      'centre_code: Required. One of: SHI, VAS, MOD, UDA, GAN',
      'total_amount: Required. Total invoice amount including GST',
      'gst_amount: GST amount included in total',
      'paid_amount: Amount already paid (0 if unpaid)',
      'due_date: Payment due date in YYYY-MM-DD format',
      'notes: Any notes about this outstanding',
      'NOTE: This imports historical outstanding invoices. Vendors must exist in the system first.',
      'TIP for Tally export: Go to Gateway > Display > Statement of Accounts > Outstanding > Vendor-wise, export to Excel, then map columns to this template'
    ]
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const format = searchParams.get('format') || 'xlsx'

  if (!type || !TEMPLATES[type]) {
    return NextResponse.json(
      { error: 'Invalid template type. Valid types: ' + Object.keys(TEMPLATES).join(', ') },
      { status: 400 }
    )
  }

  const template = TEMPLATES[type]

  if (format === 'csv') {
    // Generate CSV
    const rows = [
      template.headers.join(','),
      ...template.sampleRows.map(row => row.map(cell => `"${cell}"`).join(',')),
      '',
      '# INSTRUCTIONS:',
      ...template.instructions.map(i => `# ${i}`)
    ]
    const csv = rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${template.name}.csv"`,
      }
    })
  }

  // Generate Excel with formatting
  const wb = XLSX.utils.book_new()

  // Data sheet
  const dataRows = [template.headers, ...template.sampleRows]
  const ws = XLSX.utils.aoa_to_sheet(dataRows)

  // Set column widths
  ws['!cols'] = template.headers.map(h => ({ wch: Math.max(h.length + 4, 18) }))

  XLSX.utils.book_append_sheet(wb, ws, 'Data')

  // Instructions sheet
  const instrRows = [
    ['INSTRUCTIONS FOR ' + template.name.replace(/_/g, ' ').toUpperCase()],
    [''],
    ...template.instructions.map(i => [i]),
    [''],
    ['IMPORTANT:'],
    ['- Delete the sample rows before importing your actual data'],
    ['- Do not change the column headers in the Data sheet'],
    ['- Save as .xlsx or .csv before uploading'],
    ['- Date format must be YYYY-MM-DD (e.g., 2026-03-15)'],
    ['- For Yes/No fields, use exactly "Yes" or "No"'],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(instrRows)
  ws2['!cols'] = [{ wch: 80 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Instructions')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${template.name}.xlsx"`,
    }
  })
}
