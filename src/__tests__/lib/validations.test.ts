import {
  vendorSchema,
  purchaseOrderSchema,
  grnSchema,
  invoiceSchema,
  paymentBatchSchema,
  itemSchema,
  extractErrors,
} from '@/lib/validations'

// ──────────────────────────────────────────────────────────
// Helper to build a valid base object, then override fields
// ──────────────────────────────────────────────────────────
const validVendor = {
  legal_name: 'ABC Pharma Pvt Ltd',
  trade_name: 'ABC Pharma',
  category_id: '550e8400-e29b-41d4-a716-446655440000',
  gstin: '27AAPFU0939F1ZV',
  pan: 'AAPFU0939F',
  drug_license_no: 'DL-123',
  primary_contact_name: 'Rajesh Kumar',
  primary_contact_phone: '9876543210',
  primary_contact_email: 'rajesh@abcpharma.com',
  address: '123, Industrial Area, Mumbai',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  credit_period_days: 30,
  credit_limit: 500000,
  bank_name: 'HDFC Bank',
  bank_account_no: '1234567890123',
  bank_ifsc: 'HDFC0001234',
}

const validUUID = '550e8400-e29b-41d4-a716-446655440000'

// ──────────────────────────────────────────────────────────
// vendorSchema
// ──────────────────────────────────────────────────────────
describe('vendorSchema', () => {
  it('accepts a fully valid vendor', () => {
    const result = vendorSchema.safeParse(validVendor)
    expect(result.success).toBe(true)
  })

  it('accepts vendor with optional fields empty', () => {
    const minimal = {
      legal_name: 'Test Vendor',
      primary_contact_name: 'Test',
      primary_contact_phone: '9876543210',
      primary_contact_email: 'test@test.com',
      address: '123 Main St',
      city: 'Delhi',
      state: 'Delhi',
      credit_period_days: 0,
    }
    const result = vendorSchema.safeParse(minimal)
    expect(result.success).toBe(true)
  })

  // GSTIN validation
  describe('GSTIN', () => {
    it('accepts valid GSTIN', () => {
      const result = vendorSchema.safeParse({ ...validVendor, gstin: '27AAPFU0939F1ZV' })
      expect(result.success).toBe(true)
    })

    it('rejects invalid GSTIN format', () => {
      const result = vendorSchema.safeParse({ ...validVendor, gstin: 'INVALID' })
      expect(result.success).toBe(false)
    })

    it('accepts empty GSTIN (optional)', () => {
      const result = vendorSchema.safeParse({ ...validVendor, gstin: '' })
      expect(result.success).toBe(true)
    })

    it('rejects GSTIN with lowercase', () => {
      const result = vendorSchema.safeParse({ ...validVendor, gstin: '27aapfu0939f1zv' })
      expect(result.success).toBe(false)
    })
  })

  // PAN validation
  describe('PAN', () => {
    it('accepts valid PAN', () => {
      const result = vendorSchema.safeParse({ ...validVendor, pan: 'ABCDE1234F' })
      expect(result.success).toBe(true)
    })

    it('rejects PAN with wrong format', () => {
      const result = vendorSchema.safeParse({ ...validVendor, pan: '12345' })
      expect(result.success).toBe(false)
    })

    it('rejects PAN with lowercase', () => {
      const result = vendorSchema.safeParse({ ...validVendor, pan: 'abcde1234f' })
      expect(result.success).toBe(false)
    })

    it('accepts empty PAN (optional)', () => {
      const result = vendorSchema.safeParse({ ...validVendor, pan: '' })
      expect(result.success).toBe(true)
    })
  })

  // IFSC validation
  describe('IFSC', () => {
    it('accepts valid IFSC', () => {
      const result = vendorSchema.safeParse({ ...validVendor, bank_ifsc: 'SBIN0001234' })
      expect(result.success).toBe(true)
    })

    it('rejects IFSC without 0 at 5th position', () => {
      const result = vendorSchema.safeParse({ ...validVendor, bank_ifsc: 'SBIN1001234' })
      expect(result.success).toBe(false)
    })

    it('rejects IFSC with wrong length', () => {
      const result = vendorSchema.safeParse({ ...validVendor, bank_ifsc: 'SBIN0' })
      expect(result.success).toBe(false)
    })

    it('accepts empty IFSC (optional)', () => {
      const result = vendorSchema.safeParse({ ...validVendor, bank_ifsc: '' })
      expect(result.success).toBe(true)
    })
  })

  // Phone validation
  describe('Phone', () => {
    it('accepts valid 10-digit mobile starting with 6-9', () => {
      expect(vendorSchema.safeParse({ ...validVendor, primary_contact_phone: '9876543210' }).success).toBe(true)
      expect(vendorSchema.safeParse({ ...validVendor, primary_contact_phone: '6000000000' }).success).toBe(true)
    })

    it('rejects number starting with 0-5', () => {
      expect(vendorSchema.safeParse({ ...validVendor, primary_contact_phone: '5876543210' }).success).toBe(false)
      expect(vendorSchema.safeParse({ ...validVendor, primary_contact_phone: '0123456789' }).success).toBe(false)
    })

    it('rejects number with wrong length', () => {
      expect(vendorSchema.safeParse({ ...validVendor, primary_contact_phone: '98765' }).success).toBe(false)
      expect(vendorSchema.safeParse({ ...validVendor, primary_contact_phone: '98765432101' }).success).toBe(false)
    })
  })

  // Pincode
  describe('Pincode', () => {
    it('accepts 6-digit pincode', () => {
      expect(vendorSchema.safeParse({ ...validVendor, pincode: '400001' }).success).toBe(true)
    })

    it('rejects non-6-digit pincode', () => {
      expect(vendorSchema.safeParse({ ...validVendor, pincode: '4000' }).success).toBe(false)
    })
  })

  // Required fields
  describe('Required fields', () => {
    it('rejects empty legal_name', () => {
      const result = vendorSchema.safeParse({ ...validVendor, legal_name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects empty primary_contact_name', () => {
      const result = vendorSchema.safeParse({ ...validVendor, primary_contact_name: '' })
      expect(result.success).toBe(false)
    })

    it('rejects invalid email', () => {
      const result = vendorSchema.safeParse({ ...validVendor, primary_contact_email: 'not-email' })
      expect(result.success).toBe(false)
    })

    it('rejects negative credit period', () => {
      const result = vendorSchema.safeParse({ ...validVendor, credit_period_days: -1 })
      expect(result.success).toBe(false)
    })

    it('rejects credit period > 365', () => {
      const result = vendorSchema.safeParse({ ...validVendor, credit_period_days: 400 })
      expect(result.success).toBe(false)
    })
  })
})

// ──────────────────────────────────────────────────────────
// purchaseOrderSchema
// ──────────────────────────────────────────────────────────
describe('purchaseOrderSchema', () => {
  const validPO = {
    centre_id: validUUID,
    vendor_id: validUUID,
    expected_delivery_date: '2025-04-01',
    priority: 'normal' as const,
    notes: 'Test PO',
    items: [
      {
        item_id: validUUID,
        ordered_qty: 100,
        unit: 'Nos',
        rate: 50,
        gst_percent: 12,
      },
    ],
  }

  it('accepts a valid PO', () => {
    expect(purchaseOrderSchema.safeParse(validPO).success).toBe(true)
  })

  it('rejects PO without items', () => {
    const result = purchaseOrderSchema.safeParse({ ...validPO, items: [] })
    expect(result.success).toBe(false)
  })

  it('rejects PO with invalid centre_id', () => {
    const result = purchaseOrderSchema.safeParse({ ...validPO, centre_id: 'not-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects PO with invalid vendor_id', () => {
    const result = purchaseOrderSchema.safeParse({ ...validPO, vendor_id: 'bad' })
    expect(result.success).toBe(false)
  })

  it('defaults priority to normal', () => {
    const noPriority = { ...validPO }
    delete (noPriority as any).priority
    const result = purchaseOrderSchema.safeParse(noPriority)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.priority).toBe('normal')
    }
  })

  it('accepts all priority levels', () => {
    for (const p of ['low', 'normal', 'urgent', 'emergency']) {
      expect(purchaseOrderSchema.safeParse({ ...validPO, priority: p }).success).toBe(true)
    }
  })

  it('rejects invalid priority', () => {
    expect(purchaseOrderSchema.safeParse({ ...validPO, priority: 'critical' }).success).toBe(false)
  })

  // Line item validations
  describe('line items', () => {
    it('rejects zero quantity', () => {
      const result = purchaseOrderSchema.safeParse({
        ...validPO,
        items: [{ ...validPO.items[0], ordered_qty: 0 }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative quantity', () => {
      const result = purchaseOrderSchema.safeParse({
        ...validPO,
        items: [{ ...validPO.items[0], ordered_qty: -5 }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects zero rate', () => {
      const result = purchaseOrderSchema.safeParse({
        ...validPO,
        items: [{ ...validPO.items[0], rate: 0 }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects GST > 100', () => {
      const result = purchaseOrderSchema.safeParse({
        ...validPO,
        items: [{ ...validPO.items[0], gst_percent: 150 }],
      })
      expect(result.success).toBe(false)
    })

    it('accepts GST of 0', () => {
      const result = purchaseOrderSchema.safeParse({
        ...validPO,
        items: [{ ...validPO.items[0], gst_percent: 0 }],
      })
      expect(result.success).toBe(true)
    })

    it('rejects item without item_id', () => {
      const result = purchaseOrderSchema.safeParse({
        ...validPO,
        items: [{ ordered_qty: 10, unit: 'Nos', rate: 50, gst_percent: 12 }],
      })
      expect(result.success).toBe(false)
    })

    it('rejects empty unit', () => {
      const result = purchaseOrderSchema.safeParse({
        ...validPO,
        items: [{ ...validPO.items[0], unit: '' }],
      })
      expect(result.success).toBe(false)
    })
  })
})

// ──────────────────────────────────────────────────────────
// grnSchema
// ──────────────────────────────────────────────────────────
describe('grnSchema', () => {
  const validGRN = {
    po_id: validUUID,
    centre_id: validUUID,
    vendor_id: validUUID,
    grn_date: '2025-03-15',
    vendor_invoice_no: 'INV-001',
    vendor_invoice_date: '2025-03-14',
    vendor_invoice_amount: 50000,
    notes: '',
    items: [
      {
        po_item_id: validUUID,
        item_id: validUUID,
        received_qty: 100,
        accepted_qty: 95,
        rejected_qty: 5,
        rejection_reason: 'Damaged',
        batch_no: 'BATCH-001',
        expiry_date: '2026-12-31',
      },
    ],
  }

  it('accepts a valid GRN', () => {
    expect(grnSchema.safeParse(validGRN).success).toBe(true)
  })

  it('rejects GRN without grn_date', () => {
    const result = grnSchema.safeParse({ ...validGRN, grn_date: '' })
    expect(result.success).toBe(false)
  })

  it('rejects GRN without items', () => {
    const result = grnSchema.safeParse({ ...validGRN, items: [] })
    expect(result.success).toBe(false)
  })

  it('rejects negative received_qty', () => {
    const result = grnSchema.safeParse({
      ...validGRN,
      items: [{ ...validGRN.items[0], received_qty: -1 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative accepted_qty', () => {
    const result = grnSchema.safeParse({
      ...validGRN,
      items: [{ ...validGRN.items[0], accepted_qty: -1 }],
    })
    expect(result.success).toBe(false)
  })

  it('accepts zero rejected_qty', () => {
    const result = grnSchema.safeParse({
      ...validGRN,
      items: [{ ...validGRN.items[0], rejected_qty: 0 }],
    })
    expect(result.success).toBe(true)
  })

  it('allows optional batch_no and expiry_date', () => {
    const result = grnSchema.safeParse({
      ...validGRN,
      items: [{
        po_item_id: validUUID,
        item_id: validUUID,
        received_qty: 50,
        accepted_qty: 50,
        rejected_qty: 0,
      }],
    })
    expect(result.success).toBe(true)
  })

  it('allows optional vendor_invoice_no', () => {
    const result = grnSchema.safeParse({
      ...validGRN,
      vendor_invoice_no: undefined,
    })
    expect(result.success).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────
// invoiceSchema
// ──────────────────────────────────────────────────────────
describe('invoiceSchema', () => {
  const validInvoice = {
    vendor_invoice_no: 'VINV-2025-001',
    vendor_invoice_date: '2025-03-15',
    centre_id: validUUID,
    vendor_id: validUUID,
    grn_id: validUUID,
    po_id: validUUID,
    subtotal: 45000,
    gst_amount: 5400,
    total_amount: 50400,
  }

  it('accepts a valid invoice', () => {
    expect(invoiceSchema.safeParse(validInvoice).success).toBe(true)
  })

  it('rejects missing vendor_invoice_no', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, vendor_invoice_no: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing vendor_invoice_date', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, vendor_invoice_date: '' })
    expect(result.success).toBe(false)
  })

  it('rejects zero subtotal', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, subtotal: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects negative gst_amount', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, gst_amount: -100 })
    expect(result.success).toBe(false)
  })

  it('accepts empty grn_id and po_id (optional)', () => {
    const result = invoiceSchema.safeParse({ ...validInvoice, grn_id: '', po_id: '' })
    expect(result.success).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────
// paymentBatchSchema
// ──────────────────────────────────────────────────────────
describe('paymentBatchSchema', () => {
  const validBatch = {
    centre_id: validUUID,
    batch_date: '2025-03-15',
    notes: 'Saturday payment batch',
    invoice_ids: [validUUID],
  }

  it('accepts a valid batch', () => {
    expect(paymentBatchSchema.safeParse(validBatch).success).toBe(true)
  })

  it('rejects empty invoice_ids', () => {
    const result = paymentBatchSchema.safeParse({ ...validBatch, invoice_ids: [] })
    expect(result.success).toBe(false)
  })

  it('rejects missing batch_date', () => {
    const result = paymentBatchSchema.safeParse({ ...validBatch, batch_date: '' })
    expect(result.success).toBe(false)
  })

  it('accepts empty centre_id (optional)', () => {
    const result = paymentBatchSchema.safeParse({ ...validBatch, centre_id: '' })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID invoice_ids', () => {
    const result = paymentBatchSchema.safeParse({ ...validBatch, invoice_ids: ['not-a-uuid'] })
    expect(result.success).toBe(false)
  })
})

// ──────────────────────────────────────────────────────────
// itemSchema
// ──────────────────────────────────────────────────────────
describe('itemSchema', () => {
  const validItem = {
    generic_name: 'Paracetamol 500mg',
    brand_name: 'Crocin',
    category_id: validUUID,
    unit: 'Tab',
    hsn_code: '30049099',
    gst_percent: 12,
    shelf_life_days: 730,
    is_cold_chain: false,
    is_narcotic: false,
    is_high_alert: false,
  }

  it('accepts a valid item', () => {
    expect(itemSchema.safeParse(validItem).success).toBe(true)
  })

  it('rejects empty generic_name', () => {
    expect(itemSchema.safeParse({ ...validItem, generic_name: '' }).success).toBe(false)
  })

  it('rejects empty unit', () => {
    expect(itemSchema.safeParse({ ...validItem, unit: '' }).success).toBe(false)
  })

  it('rejects GST > 100', () => {
    expect(itemSchema.safeParse({ ...validItem, gst_percent: 110 }).success).toBe(false)
  })

  it('defaults gst_percent to 12', () => {
    const noGST = { ...validItem }
    delete (noGST as any).gst_percent
    const result = itemSchema.safeParse(noGST)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.gst_percent).toBe(12)
    }
  })

  it('defaults boolean flags to false', () => {
    const result = itemSchema.safeParse({
      generic_name: 'Test Item',
      unit: 'Nos',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.is_cold_chain).toBe(false)
      expect(result.data.is_narcotic).toBe(false)
      expect(result.data.is_high_alert).toBe(false)
    }
  })

  it('accepts negative-free shelf_life_days', () => {
    expect(itemSchema.safeParse({ ...validItem, shelf_life_days: 0 }).success).toBe(true)
  })
})

// ──────────────────────────────────────────────────────────
// extractErrors helper
// ──────────────────────────────────────────────────────────
describe('extractErrors', () => {
  it('extracts flat field errors', () => {
    const result = vendorSchema.safeParse({ legal_name: '', primary_contact_phone: 'bad' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = extractErrors(result.error)
      expect(errors).toHaveProperty('legal_name')
      expect(errors).toHaveProperty('primary_contact_phone')
    }
  })

  it('extracts nested path errors', () => {
    const result = purchaseOrderSchema.safeParse({
      centre_id: validUUID,
      vendor_id: validUUID,
      items: [{ item_id: 'bad', ordered_qty: 0, unit: '', rate: -1, gst_percent: 200 }],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = extractErrors(result.error)
      // Nested paths should be dot-separated
      expect(Object.keys(errors).some(k => k.startsWith('items.'))).toBe(true)
    }
  })

  it('keeps only the first error per path', () => {
    const result = vendorSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = extractErrors(result.error)
      // Each path should appear only once
      const paths = Object.keys(errors)
      expect(paths.length).toBe(new Set(paths).size)
    }
  })
})
