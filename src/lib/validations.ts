import { z } from 'zod'

// ============================================================
// VENDOR FORM
// ============================================================
export const vendorSchema = z.object({
  legal_name: z.string().min(2, 'Legal name is required'),
  trade_name: z.string().optional(),
  category_id: z.string().uuid('Select a category').optional().or(z.literal('')),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional().or(z.literal('')),
  drug_license_no: z.string().optional(),
  primary_contact_name: z.string().min(2, 'Contact name is required'),
  primary_contact_phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid 10-digit mobile number'),
  primary_contact_email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode').optional().or(z.literal('')),
  credit_period_days: z.coerce.number().int().min(0).max(365),
  credit_limit: z.coerce.number().min(0).optional(),
  bank_name: z.string().optional(),
  bank_account_no: z.string().optional(),
  bank_ifsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code').optional().or(z.literal('')),
})

export type VendorFormData = z.infer<typeof vendorSchema>

// ============================================================
// PURCHASE ORDER
// ============================================================
export const poLineItemSchema = z.object({
  item_id: z.string().uuid('Select an item'),
  ordered_qty: z.coerce.number().positive('Quantity must be > 0'),
  unit: z.string().min(1, 'Unit is required'),
  rate: z.coerce.number().positive('Rate must be > 0'),
  gst_percent: z.coerce.number().min(0).max(100),
})

export const purchaseOrderSchema = z.object({
  centre_id: z.string().uuid('Select a centre'),
  vendor_id: z.string().uuid('Select a vendor'),
  expected_delivery_date: z.string().optional(),
  priority: z.enum(['low', 'normal', 'urgent', 'emergency']).default('normal'),
  notes: z.string().max(500).optional(),
  items: z.array(poLineItemSchema).min(1, 'Add at least one item'),
})

export type POFormData = z.infer<typeof purchaseOrderSchema>

// ============================================================
// GRN
// ============================================================
export const grnLineItemSchema = z.object({
  po_item_id: z.string().uuid(),
  item_id: z.string().uuid(),
  received_qty: z.coerce.number().min(0, 'Cannot be negative'),
  accepted_qty: z.coerce.number().min(0, 'Cannot be negative'),
  rejected_qty: z.coerce.number().min(0).default(0),
  rejection_reason: z.string().optional(),
  batch_no: z.string().optional(),
  expiry_date: z.string().optional(),
})

export const grnSchema = z.object({
  po_id: z.string().uuid('Select a purchase order'),
  centre_id: z.string().uuid(),
  vendor_id: z.string().uuid(),
  grn_date: z.string().min(1, 'GRN date is required'),
  vendor_invoice_no: z.string().optional(),
  vendor_invoice_date: z.string().optional(),
  vendor_invoice_amount: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  items: z.array(grnLineItemSchema).min(1, 'Add at least one item'),
})

export type GRNFormData = z.infer<typeof grnSchema>

// ============================================================
// INVOICE
// ============================================================
export const invoiceSchema = z.object({
  vendor_invoice_no: z.string().min(1, 'Vendor invoice number is required'),
  vendor_invoice_date: z.string().min(1, 'Invoice date is required'),
  centre_id: z.string().uuid('Select a centre'),
  vendor_id: z.string().uuid('Select a vendor'),
  grn_id: z.string().uuid('Link to a GRN').optional().or(z.literal('')),
  po_id: z.string().uuid().optional().or(z.literal('')),
  subtotal: z.coerce.number().positive('Subtotal must be > 0'),
  gst_amount: z.coerce.number().min(0),
  total_amount: z.coerce.number().positive('Total must be > 0'),
})

export type InvoiceFormData = z.infer<typeof invoiceSchema>

// ============================================================
// PAYMENT BATCH
// ============================================================
export const paymentBatchSchema = z.object({
  centre_id: z.string().uuid('Select a centre').optional().or(z.literal('')),
  batch_date: z.string().min(1, 'Batch date is required'),
  notes: z.string().max(500).optional(),
  invoice_ids: z.array(z.string().uuid()).min(1, 'Select at least one invoice'),
})

export type PaymentBatchFormData = z.infer<typeof paymentBatchSchema>

// ============================================================
// ITEM MASTER
// ============================================================
export const itemSchema = z.object({
  generic_name: z.string().min(2, 'Generic name is required'),
  brand_name: z.string().optional(),
  category_id: z.string().uuid('Select a category').optional().or(z.literal('')),
  unit: z.string().min(1, 'Unit is required'),
  hsn_code: z.string().optional(),
  gst_percent: z.coerce.number().min(0).max(100).default(12),
  shelf_life_days: z.coerce.number().int().min(0).optional(),
  is_cold_chain: z.boolean().default(false),
  is_narcotic: z.boolean().default(false),
  is_high_alert: z.boolean().default(false),
})

export type ItemFormData = z.infer<typeof itemSchema>

// ============================================================
// HELPERS
// ============================================================
export function extractErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.')
    if (!errors[path]) errors[path] = issue.message
  }
  return errors
}
