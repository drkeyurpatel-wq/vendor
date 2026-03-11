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
// API INPUT VALIDATION — PO Approval
// ============================================================
export const poApprovalSchema = z.object({
  po_id: z.string().uuid('Invalid PO ID'),
  action: z.enum(['approve', 'reject'], { errorMap: () => ({ message: 'Action must be approve or reject' }) }),
  comments: z.string().max(1000).optional(),
})

export type POApprovalInput = z.infer<typeof poApprovalSchema>

// ============================================================
// API INPUT VALIDATION — GRN Submit
// ============================================================
export const grnSubmitSchema = z.object({
  grn_id: z.string().uuid('Invalid GRN ID'),
  action: z.enum(['verify', 'flag_discrepancy'], { errorMap: () => ({ message: 'Action must be verify or flag_discrepancy' }) }),
})

export type GRNSubmitInput = z.infer<typeof grnSubmitSchema>

// ============================================================
// API INPUT VALIDATION — Invoice Match
// ============================================================
export const invoiceMatchSchema = z.object({
  invoice_id: z.string().uuid('Invalid invoice ID'),
})

export type InvoiceMatchInput = z.infer<typeof invoiceMatchSchema>

// ============================================================
// API INPUT VALIDATION — Credit Check
// ============================================================
export const creditCheckSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
})

export type CreditCheckInput = z.infer<typeof creditCheckSchema>

// ============================================================
// API INPUT VALIDATION — Tally Push
// ============================================================
export const tallyPushSchema = z.object({
  type: z.enum(['purchase', 'payment', 'debit_note', 'credit_note'], {
    errorMap: () => ({ message: 'Type must be purchase, payment, debit_note, or credit_note' }),
  }),
  entity_id: z.string().uuid('Invalid entity ID'),
})

export type TallyPushInput = z.infer<typeof tallyPushSchema>

// ============================================================
// API INPUT VALIDATION — Tally Sync
// ============================================================
export const tallySyncSchema = z.object({
  action: z.enum(['export_vendors', 'export_items', 'import_ledgers'], {
    errorMap: () => ({ message: 'Action must be export_vendors, export_items, or import_ledgers' }),
  }),
  xml_data: z.string().optional(),
})

export type TallySyncInput = z.infer<typeof tallySyncSchema>

// ============================================================
// API INPUT VALIDATION — Notification Send
// ============================================================
export const notificationSendSchema = z.object({
  type: z.enum(['po_created', 'po_approved', 'grn_received', 'payment_processed', 'invoice_overdue'], {
    errorMap: () => ({ message: 'Invalid notification type' }),
  }),
  data: z.record(z.unknown()),
})

export type NotificationSendInput = z.infer<typeof notificationSendSchema>

// ============================================================
// API INPUT VALIDATION — WhatsApp Notification
// ============================================================
export const whatsappNotificationSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  template: z.enum(['po_created', 'payment_advice', 'delivery_reminder'], {
    errorMap: () => ({ message: 'Invalid template' }),
  }),
  params: z.record(z.string()),
})

export type WhatsAppNotificationInput = z.infer<typeof whatsappNotificationSchema>

// ============================================================
// API INPUT VALIDATION — Report Generate
// ============================================================
export const reportGenerateSchema = z.object({
  report_type: z.enum(['spend_analysis', 'aging_report', 'po_status_report', 'vendor_scorecard'], {
    errorMap: () => ({ message: 'Invalid report type' }),
  }),
  format: z.enum(['pdf', 'excel']).default('pdf'),
  filters: z.object({
    centre_id: z.string().uuid().optional().nullable(),
    date_from: z.string().optional().nullable(),
    date_to: z.string().optional().nullable(),
    vendor_id: z.string().uuid().optional().nullable(),
  }).default({}),
})

export type ReportGenerateInput = z.infer<typeof reportGenerateSchema>

// ============================================================
// API INPUT VALIDATION — Tenant Create
// ============================================================
export const tenantCreateSchema = z.object({
  name: z.string().min(2, 'Name is required').max(200),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
})

export type TenantCreateInput = z.infer<typeof tenantCreateSchema>

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
