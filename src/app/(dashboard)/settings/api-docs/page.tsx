import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'

// ============================================================
// H1 VPMS — Internal API Documentation
// ============================================================

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  rateLimit?: string
  roles?: string[]
  requestBody?: { field: string; type: string; required: boolean; description: string }[]
  queryParams?: { field: string; type: string; required: boolean; description: string }[]
  responseExample?: string
  notes?: string[]
}

interface Category {
  name: string
  id: string
  description: string
  endpoints: Endpoint[]
}

const API_CATEGORIES: Category[] = [
  {
    name: 'Authentication',
    id: 'authentication',
    description: 'Supabase Auth callback handler for OAuth flows.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/auth/callback',
        description: 'Handles OAuth callback from Supabase Auth. Exchanges authorization code for a session and redirects the user.',
        queryParams: [
          { field: 'code', type: 'string', required: true, description: 'Authorization code from Supabase Auth' },
          { field: 'next', type: 'string', required: false, description: 'Redirect path after login (defaults to /)' },
        ],
        responseExample: '302 Redirect to {origin}/{next} on success\n302 Redirect to /login?error=auth_callback_error on failure',
        notes: ['This endpoint is called automatically by Supabase Auth — do not call directly.'],
      },
    ],
  },
  {
    name: 'Purchase Orders',
    id: 'purchase-orders',
    description: 'PO approval workflow and sequence number generation.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/po/approve',
        description: 'Multi-level sequential PO approval chain. Each approval level must be approved in order. Supports approve and reject actions.',
        rateLimit: '10 requests per 60 seconds',
        roles: ['unit_purchase_manager', 'unit_cao', 'group_cao', 'group_admin'],
        requestBody: [
          { field: 'po_id', type: 'string (UUID)', required: true, description: 'Purchase order ID' },
          { field: 'action', type: '"approve" | "reject"', required: true, description: 'Approval action' },
          { field: 'comments', type: 'string', required: false, description: 'Comments (required for rejection)' },
        ],
        responseExample: `// Approved (intermediate level)
{ "success": true, "status": "pending_approval", "message": "Approved at level 1. Awaiting unit cao approval." }

// Approved (final)
{ "success": true, "status": "approved" }

// Rejected
{ "success": true, "status": "cancelled" }`,
        notes: [
          'Approval thresholds: <=10K auto-approved, 10K-50K unit_purchase_manager, 50K-2L unit_cao, 2L-10L group_cao, >10L group_admin',
          'Rejection at any level cancels the PO entirely',
          'Comments are required for rejection, optional for approval',
          'All actions are logged to activity_log',
        ],
      },
      {
        method: 'GET',
        path: '/api/sequence',
        description: 'Atomic sequence number generator using database sequences. Returns formatted document numbers.',
        queryParams: [
          { field: 'type', type: 'string', required: true, description: 'Document type: vendor, item, po, grn, indent, invoice, batch' },
          { field: 'centre_code', type: 'string', required: false, description: 'Centre code (e.g., SHI, VAS). Defaults to XXX' },
        ],
        responseExample: `{ "number": "H1-SHI-PO-2603-001" }`,
        notes: ['Uses a database RPC function (next_sequence_number) for atomic generation', 'Format varies by type — see Auto-Numbering Formats in system docs'],
      },
    ],
  },
  {
    name: 'Goods Receipt',
    id: 'goods-receipt',
    description: 'GRN verification and submission workflow.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/grn/submit',
        description: 'Verify or flag discrepancy on a GRN. Updates GRN status and logs activity.',
        rateLimit: '10 requests per 60 seconds',
        roles: ['store_staff', 'unit_purchase_manager', 'unit_cao', 'group_admin'],
        requestBody: [
          { field: 'grn_id', type: 'string (UUID)', required: true, description: 'GRN ID to action' },
          { field: 'action', type: '"verify" | "discrepancy"', required: true, description: 'Verify as correct or flag discrepancy' },
        ],
        responseExample: `{ "success": true, "status": "verified" }
// or
{ "success": true, "status": "discrepancy" }`,
      },
    ],
  },
  {
    name: 'Invoices & Finance',
    id: 'invoices-finance',
    description: '3-way matching engine, credit period enforcement, and invoice processing.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/invoices/match',
        description: '3-way matching engine. Compares PO (ordered qty + rate) vs GRN (accepted qty) vs Invoice (qty + rate). Match status blocks or allows payment.',
        rateLimit: '20 requests per 60 seconds',
        roles: ['finance_staff', 'unit_cao', 'group_cao', 'group_admin'],
        requestBody: [
          { field: 'invoice_id', type: 'string (UUID)', required: true, description: 'Invoice ID to run matching on' },
        ],
        responseExample: `{
  "match_status": "matched",
  "results": [
    {
      "item_id": "uuid",
      "po_qty": 100, "po_rate": 45.50,
      "grn_qty": 100,
      "invoice_qty": 100, "invoice_rate": 45.50,
      "qty_match": true, "rate_match": true
    }
  ],
  "summary": { "total_items": 5, "matched": 5, "mismatched": 0 }
}`,
        notes: [
          'Rate tolerance: +/-0.5% for rate contract items',
          'Invoices without a linked PO are automatically flagged as mismatch (No PO = No Payment rule)',
          'Match statuses: matched, partial_match, mismatch',
          'Mismatch status blocks payment processing',
        ],
      },
      {
        method: 'GET',
        path: '/api/credit/check',
        description: 'Check if a vendor has exceeded their credit limit or has overdue invoices. Returns blocked/warning status.',
        queryParams: [
          { field: 'vendor_id', type: 'string (UUID)', required: true, description: 'Vendor ID to check' },
        ],
        responseExample: `{
  "blocked": false,
  "warning": "2 overdue invoice(s) totalling INR 1,50,000",
  "reason": null,
  "vendor_name": "ABC Pharma Pvt Ltd",
  "credit_period_days": 30,
  "credit_limit": 500000,
  "total_outstanding": 325000,
  "overdue_count": 2,
  "overdue_amount": 150000
}`,
        notes: [
          'Blacklisted vendors are always blocked',
          'Inactive vendors are blocked',
          'Blocked if >3 overdue invoices or overdue amount exceeds 50% of credit limit',
          'Blocked if total outstanding exceeds credit limit',
        ],
      },
      {
        method: 'POST',
        path: '/api/credit/check',
        description: 'Same as GET but accepts vendor_id in the request body.',
        requestBody: [
          { field: 'vendor_id', type: 'string (UUID)', required: true, description: 'Vendor ID to check' },
        ],
        responseExample: '(Same as GET /api/credit/check)',
      },
    ],
  },
  {
    name: 'Notifications',
    id: 'notifications',
    description: 'Email and WhatsApp notification dispatch for PO, GRN, payment, and invoice events.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/notifications/send',
        description: 'Send email notifications for various events. Automatically fetches recipient from vendor/PO/invoice records.',
        roles: ['All authenticated users'],
        requestBody: [
          { field: 'type', type: 'string', required: true, description: 'One of: po_created, po_approved, grn_received, payment_processed, invoice_overdue' },
          { field: 'data', type: 'object', required: true, description: 'Event-specific data (e.g., { po_id } for po_created, { batch_id, vendor_id } for payment_processed)' },
        ],
        responseExample: `{
  "success": true,
  "email_sent": true,
  "recipient": "vendor@example.com",
  "subject": "H1 VPMS: New Purchase Order H1-SHI-PO-2603-001"
}`,
        notes: [
          'Email is sent only if a valid recipient address is found',
          'All notification attempts (sent or not) are logged to activity_log',
          'Required data fields vary by type: po_created/po_approved need po_id, grn_received needs grn_id, payment_processed needs batch_id, invoice_overdue needs invoice_id',
        ],
      },
      {
        method: 'POST',
        path: '/api/notifications/whatsapp',
        description: 'Send WhatsApp template messages via Meta Graph API (v18.0). Templates must be pre-approved in WhatsApp Business Manager.',
        roles: ['All authenticated users'],
        requestBody: [
          { field: 'phone', type: 'string', required: true, description: 'Recipient phone number (Indian format, e.g., 9876543210)' },
          { field: 'template', type: 'string', required: true, description: 'One of: po_created, payment_advice, delivery_reminder' },
          { field: 'params', type: 'object', required: true, description: 'Template parameters (vendor_name, po_number, amount, etc.)' },
        ],
        responseExample: `{
  "sent": true,
  "message_id": "wamid.HBgNOTE4OTg5ODk4OTgVAgAS",
  "phone": "919876543210",
  "template": "po_created"
}`,
        notes: [
          'Requires WHATSAPP_API_TOKEN and WHATSAPP_PHONE_ID env vars',
          'If not configured, returns { sent: false, reason: "not_configured" } with status 200',
          'Phone numbers are auto-normalized to E.164 format (adds 91 prefix if needed)',
        ],
      },
    ],
  },
  {
    name: 'Tally Integration',
    id: 'tally-integration',
    description: 'Bi-directional integration with Tally ERP. Exports vouchers as XML and imports ledger data.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/tally/push',
        description: 'Generate Tally XML voucher and optionally push it to a Tally server. Supports purchase vouchers, payment vouchers, debit notes, and credit notes.',
        roles: ['finance_staff', 'unit_cao', 'group_cao', 'group_admin'],
        requestBody: [
          { field: 'type', type: 'string', required: true, description: 'One of: purchase, payment, debit_note, credit_note' },
          { field: 'entity_id', type: 'string (UUID)', required: true, description: 'ID of the PO, payment batch item, debit note, or credit note' },
        ],
        responseExample: `// When Tally server is configured:
{ "pushed": true, "tally_voucher_no": "TALLY-12345", "message": "Voucher pushed to Tally successfully" }

// When Tally server is NOT configured:
{ "pushed": false, "xml": "<ENVELOPE>...</ENVELOPE>", "reason": "tally_not_configured" }`,
        notes: [
          'Requires TALLY_SERVER_URL env var for direct push',
          'Without TALLY_SERVER_URL, returns the XML for manual import into Tally',
          'Handles GST (CGST/SGST/IGST), TDS, freight, and other charges',
          'XML follows Tally Prime import format',
        ],
      },
      {
        method: 'POST',
        path: '/api/tally/sync',
        description: 'Sync master data between VPMS and Tally. Export vendor ledgers, stock items, or import ledger mappings from Tally XML.',
        roles: ['finance_staff', 'unit_cao', 'group_cao', 'group_admin'],
        requestBody: [
          { field: 'action', type: 'string', required: true, description: 'One of: export_vendors, export_items, import_ledgers' },
          { field: 'xml_data', type: 'string', required: false, description: 'Tally XML data (required for import_ledgers action)' },
        ],
        responseExample: `// export_vendors
{ "xml": "<ENVELOPE>...</ENVELOPE>", "count": 150, "message": "Generated Tally XML for 150 vendor ledgers" }

// import_ledgers
{ "total_ledgers": 200, "matched": 145, "unmatched": 55, "unmatched_ledgers": ["..."] }`,
        notes: [
          'export_vendors: Generates vendor ledger creation XML for all active vendors',
          'export_items: Generates stock item + stock group creation XML',
          'import_ledgers: Parses Tally XML and maps Sundry Creditors to existing vendors by GSTIN or name',
        ],
      },
    ],
  },
  {
    name: 'Import / Export',
    id: 'import-export',
    description: 'Bulk data import from Excel/CSV and CSV export of system data.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/import',
        description: 'Bulk import data from Excel (.xlsx) or CSV files. Validates each row, auto-generates codes, and reports errors per row.',
        roles: ['group_admin', 'group_cao'],
        requestBody: [
          { field: 'file', type: 'File (multipart/form-data)', required: true, description: 'Excel or CSV file to import' },
          { field: 'type', type: 'string', required: true, description: 'One of: vendors, items, vendor_items, opening_stock, vendor_outstanding' },
        ],
        responseExample: `{
  "total": 100,
  "success": 95,
  "failed": 5,
  "errors": [
    { "row": 12, "field": "gstin", "message": "Invalid GSTIN format: 24INVALID" },
    { "row": 45, "field": "gstin", "message": "Duplicate GSTIN - already exists as H1V-0042" }
  ],
  "created_codes": ["H1V-0098", "H1V-0099", "..."]
}`,
        notes: [
          'Maximum 5000 rows per import',
          'GSTIN and PAN are validated against regex patterns',
          'Duplicate checks: GSTIN for vendors, generic_name for items, vendor_id+vendor_invoice_no for outstanding',
          'Vendor items use upsert (updates existing mappings)',
          'Opening stock writes to both item_centre_stock and stock_ledger',
        ],
      },
      {
        method: 'GET',
        path: '/api/import/templates',
        description: 'Download import template files with headers, sample data, and instructions.',
        queryParams: [
          { field: 'type', type: 'string', required: true, description: 'One of: vendors, items, vendor_items, opening_stock, vendor_outstanding' },
          { field: 'format', type: 'string', required: false, description: '"xlsx" (default) or "csv"' },
        ],
        responseExample: 'Binary file download (.xlsx or .csv)',
        notes: ['Templates include sample rows and an Instructions sheet', 'Delete sample rows before importing your actual data'],
      },
      {
        method: 'GET',
        path: '/api/export',
        description: 'Export system data as CSV files.',
        queryParams: [
          { field: 'type', type: 'string', required: true, description: 'One of: purchase_orders, invoices, vendors, stock' },
          { field: 'status', type: 'string', required: false, description: 'Filter by status (for purchase_orders)' },
        ],
        responseExample: 'CSV file download with headers matching the export type',
        notes: ['Limited to 1000 rows per export', 'Includes related data (vendor names, centre codes)'],
      },
    ],
  },
  {
    name: 'PDF Generation',
    id: 'pdf-generation',
    description: 'Generate branded PDF documents for purchase orders, GRNs, and payment advice.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/pdf/po',
        description: 'Generate a professional Purchase Order PDF with full line items, GST breakdown, terms & conditions, and amount in words.',
        roles: ['All authenticated users'],
        queryParams: [
          { field: 'id', type: 'string (UUID)', required: true, description: 'Purchase Order ID' },
        ],
        responseExample: 'Binary PDF download — filename: {po_number}.pdf',
        notes: [
          'Supports both IGST (inter-state) and CGST+SGST (intra-state) formats',
          'Includes vendor details, ship-to address, line items table, tax summary',
          'Amount in words uses Indian numbering (Crore/Lakh/Thousand)',
          'Brand colors: Navy header, light navy backgrounds',
        ],
      },
      {
        method: 'GET',
        path: '/api/pdf/grn',
        description: 'Generate a Goods Receipt Note PDF with received/accepted/rejected quantities, batch/expiry info, and QC remarks.',
        roles: ['All authenticated users'],
        queryParams: [
          { field: 'id', type: 'string (UUID)', required: true, description: 'GRN ID' },
        ],
        responseExample: 'Binary PDF download — filename: {grn_number}.pdf',
        notes: [
          'Shows transport details (DC, LR, vehicle, e-way bill) if available',
          'Three signature blocks: Received By, Verified By, QC Approved By',
        ],
      },
      {
        method: 'GET',
        path: '/api/pdf/payment-advice',
        description: 'Generate Payment Advice PDF grouped by vendor. Includes bank details, invoice breakdown, TDS deductions, and net payment amount in words.',
        roles: ['All authenticated users'],
        queryParams: [
          { field: 'id', type: 'string (UUID)', required: true, description: 'Payment Batch ID' },
        ],
        responseExample: 'Binary PDF download — filename: Payment-Advice-{batch_number}.pdf',
        notes: [
          'Multi-vendor batches generate one page per vendor',
          'Includes vendor bank details (A/C, IFSC, type)',
          'Shows TDS deduction and net payable',
          'Includes disclaimer about reconciliation',
        ],
      },
    ],
  },
  {
    name: 'Reports & Analytics',
    id: 'reports-analytics',
    description: 'AI-powered analytics (consumption projections, price anomaly detection) and downloadable reports.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/analytics',
        description: 'AI-powered analytics engine. Provides consumption projections (EMA), ideal inventory levels (safety stock + EOQ), historic price analysis, and price anomaly detection.',
        roles: ['All authenticated users'],
        queryParams: [
          { field: 'type', type: 'string', required: false, description: '"anomalies" for advanced anomaly detection mode. Omit for full analytics.' },
          { field: 'centre_id', type: 'string (UUID)', required: false, description: 'Filter by centre' },
          { field: 'item_id', type: 'string (UUID)', required: false, description: 'Filter by item' },
        ],
        responseExample: `// Full analytics mode
{
  "consumption_projections": [
    { "item_code": "H1I-00001", "generic_name": "Paracetamol", "avg_daily_consumption": 25.5, "trend": "rising", "projected_30d": 850, "days_of_stock_remaining": 12, "stockout_risk": "warning" }
  ],
  "ideal_inventory": [
    { "item_code": "H1I-00001", "current_stock": 300, "reorder_level": 100, "calculated_reorder_point": 220, "safety_stock": 45, "economic_order_qty": 500, "adjustment_needed": "increase" }
  ],
  "price_history": [...],
  "price_anomalies": [...],
  "summary": { "total_items_analyzed": 150, "items_at_stockout_risk": 12, "items_with_price_anomalies": 3 }
}

// Anomaly detection mode
{
  "anomalies": {
    "price_spikes": [...],
    "volume_spikes": [...],
    "vendor_concentration": [...],
    "potential_duplicates": [...]
  }
}`,
        notes: [
          'Consumption projections use Exponential Moving Average (EMA, alpha=0.3)',
          'Safety stock: Z(1.65) x sigma x sqrt(lead_time) for 95% service level',
          'EOQ uses simplified Wilson formula with assumed order cost of INR 500',
          'Price anomalies flagged when |rate - mean| > 2 standard deviations',
          'Anomaly mode also checks: volume spikes (>2x average), vendor concentration (>80% category spend), and potential duplicate invoices',
        ],
      },
      {
        method: 'POST',
        path: '/api/reports/generate',
        description: 'Generate downloadable reports in PDF or Excel format.',
        roles: ['All authenticated users'],
        requestBody: [
          { field: 'report_type', type: 'string', required: true, description: 'One of: spend_analysis, aging_report, po_status_report, vendor_scorecard' },
          { field: 'format', type: 'string', required: false, description: '"pdf" (default) or "excel"' },
          { field: 'filters', type: 'object', required: false, description: '{ centre_id?, date_from?, date_to?, vendor_id? }' },
        ],
        responseExample: 'Binary PDF or Excel file download',
        notes: [
          'Aging report includes bucket classification: Current, 1-30, 31-60, 61-90, >90 days',
          'Vendor scorecard includes on-time delivery %, quality score, price compliance',
          'Reports limited to 1000 rows',
        ],
      },
    ],
  },
  {
    name: 'OCR',
    id: 'ocr',
    description: 'Invoice OCR scanning and data extraction.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/ocr/invoice',
        description: 'Upload an invoice document (PDF, PNG, JPG) for OCR processing. File is stored in Supabase Storage. Returns extracted fields when OCR is configured.',
        roles: ['All authenticated users'],
        requestBody: [
          { field: 'file', type: 'File (multipart/form-data)', required: true, description: 'Invoice file (PDF, PNG, or JPG, max 10MB)' },
        ],
        responseExample: `{
  "extracted": true,
  "confidence": 0.0,
  "data": {
    "vendor_invoice_no": null,
    "invoice_date": null,
    "subtotal": null,
    "cgst_amount": null, "sgst_amount": null, "igst_amount": null,
    "total_amount": null,
    "vendor_gstin": null,
    "items": []
  },
  "file_url": "https://...supabase.co/storage/v1/object/public/invoice-documents/...",
  "file_name": "invoice.pdf",
  "file_type": "application/pdf",
  "file_size": 245000,
  "message": "OCR service not configured. Configure GOOGLE_VISION_API_KEY for automatic extraction."
}`,
        notes: [
          'OCR is currently a placeholder — returns empty extracted data',
          'Supported OCR backends: Google Vision API, AWS Textract, Azure Form Recognizer',
          'File is always uploaded to Supabase Storage regardless of OCR configuration',
          'Allowed file types: PDF, PNG, JPG/JPEG',
        ],
      },
    ],
  },
  {
    name: 'Tenants',
    id: 'tenants',
    description: 'Multi-tenant management for onboarding new hospital organizations.',
    endpoints: [
      {
        method: 'GET',
        path: '/api/tenants',
        description: 'Get the current user\'s tenant information.',
        roles: ['All authenticated users'],
        responseExample: `{ "tenant": { "id": "uuid", "name": "Health1", "slug": "health1", "is_active": true, "subscription_plan": "basic" }, "is_owner": true }`,
      },
      {
        method: 'POST',
        path: '/api/tenants',
        description: 'Create a new tenant (hospital organization). The creating user becomes the tenant owner.',
        roles: ['All authenticated users'],
        requestBody: [
          { field: 'name', type: 'string', required: true, description: 'Organization name' },
          { field: 'slug', type: 'string', required: true, description: 'URL-friendly slug (lowercase, numbers, hyphens only)' },
        ],
        responseExample: `{ "tenant": { "id": "uuid", "name": "New Hospital", "slug": "new-hospital", ... }, "message": "Tenant created successfully" }`,
        notes: [
          'Slug must be unique across all tenants',
          'Default plan: basic, max 5 centres, max 20 users',
          'Creating user is automatically linked as tenant owner',
        ],
      },
    ],
  },
  {
    name: 'Consumption Import',
    id: 'consumption-import',
    description: 'eClinicalWorks (eCW) consumption data import with auto-indent generation.',
    endpoints: [
      {
        method: 'POST',
        path: '/api/consumption/import',
        description: 'Import consumption records from eClinicalWorks. Deducts stock, writes ledger entries, and auto-creates purchase indents when stock falls below reorder level (with L1 vendor auto-selection from rate contracts).',
        roles: ['group_admin', 'group_cao', 'unit_cao', 'store_staff'],
        requestBody: [
          { field: 'records', type: 'ConsumptionRow[]', required: true, description: 'Array of consumption records' },
        ],
        responseExample: `{
  "total": 50,
  "processed": 47,
  "skipped": 3,
  "errors": [
    { "row": 5, "reason": "Unknown item: ECW-XYZ123" }
  ],
  "indents_created": 2
}`,
        notes: [
          'Each record: { ecw_item_code | item_code, centre_code, qty_consumed, date, department?, patient_id? }',
          'Items mapped by ecw_item_code first, then item_code',
          'Auto-indent triggers when stock crosses below reorder_level',
          'L1 vendor auto-selected from active rate contracts per Business Rule #7',
          'Indent requested_qty = (reorder_level * 2) - current_stock',
        ],
      },
    ],
  },
]

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: 'bg-green-100', text: 'text-green-800' },
  POST: { bg: 'bg-blue-100', text: 'text-blue-800' },
  PUT: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  DELETE: { bg: 'bg-red-100', text: 'text-red-800' },
}

export default async function ApiDocsPage() {
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  return (
    <div className="flex gap-6">
      {/* Sidebar TOC */}
      <nav className="hidden lg:block w-56 flex-shrink-0 sticky top-6 self-start">
        <div className="card p-4">
          <h3 className="text-sm font-bold text-[#1B3A6B] mb-3 uppercase tracking-wide">Categories</h3>
          <ul className="space-y-1">
            {API_CATEGORIES.map((cat) => (
              <li key={cat.id}>
                <a
                  href={`#${cat.id}`}
                  className="block text-sm py-1.5 px-2 rounded text-gray-600 hover:text-[#0D7E8A] hover:bg-[#E6F5F6] transition-colors"
                >
                  {cat.name}
                  <span className="ml-1 text-xs text-gray-400">({cat.endpoints.length})</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              {API_CATEGORIES.reduce((sum, c) => sum + c.endpoints.length, 0)} endpoints total
            </p>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="page-header mb-6">
          <div>
            <h1 className="page-title">API Documentation</h1>
            <p className="page-subtitle">Internal API reference for H1 VPMS endpoints</p>
          </div>
        </div>

        {/* Overview Card */}
        <div className="card p-5 mb-6" style={{ backgroundColor: '#EEF2F9' }}>
          <h2 className="text-sm font-bold text-[#1B3A6B] mb-2">Base URL</h2>
          <code className="text-sm text-[#0D7E8A] bg-white px-3 py-1.5 rounded border border-gray-200 font-mono">
            https://vendor-rm26gxmw2-drkeyurpatel-6272s-projects.vercel.app
          </code>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Authentication</p>
              <p className="text-sm text-[#1B3A6B] font-medium">Supabase Auth (Cookie-based)</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Content Type</p>
              <p className="text-sm text-[#1B3A6B] font-medium">application/json</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Rate Limiting</p>
              <p className="text-sm text-[#1B3A6B] font-medium">10-20 req/min per endpoint</p>
            </div>
          </div>
        </div>

        {/* Method Legend */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(METHOD_COLORS).map(([method, colors]) => (
            <span key={method} className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${colors.bg} ${colors.text}`}>
              {method}
            </span>
          ))}
          <span className="text-xs text-gray-400 self-center ml-2">Method color coding</span>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {API_CATEGORIES.map((category) => (
            <section key={category.id} id={category.id}>
              <div className="border-l-4 border-[#0D7E8A] pl-4 mb-4">
                <h2 className="text-lg font-bold text-[#1B3A6B]">{category.name}</h2>
                <p className="text-sm text-gray-500">{category.description}</p>
              </div>

              <div className="space-y-4">
                {category.endpoints.map((endpoint, idx) => {
                  const methodColor = METHOD_COLORS[endpoint.method] || { bg: 'bg-gray-100', text: 'text-gray-800' }
                  return (
                    <div key={idx} className="card overflow-hidden">
                      {/* Endpoint Header */}
                      <div className="flex items-center gap-3 p-4 border-b border-gray-100" style={{ backgroundColor: '#FAFBFD' }}>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold ${methodColor.bg} ${methodColor.text} min-w-[52px] justify-center`}>
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-mono font-medium text-[#1B3A6B]">{endpoint.path}</code>
                        {endpoint.rateLimit && (
                          <span className="ml-auto hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500">
                            {endpoint.rateLimit}
                          </span>
                        )}
                      </div>

                      {/* Endpoint Body */}
                      <div className="p-4 space-y-4">
                        <p className="text-sm text-gray-700">{endpoint.description}</p>

                        {/* Roles */}
                        {endpoint.roles && endpoint.roles.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Required Roles</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {endpoint.roles.map((role) => (
                                <span key={role} className="badge text-xs" style={{ backgroundColor: '#E6F5F6', color: '#0D7E8A' }}>
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Query Params */}
                        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Query Parameters</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-1.5 pr-4 text-xs font-bold text-[#1B3A6B]">Parameter</th>
                                    <th className="text-left py-1.5 pr-4 text-xs font-bold text-[#1B3A6B]">Type</th>
                                    <th className="text-left py-1.5 pr-4 text-xs font-bold text-[#1B3A6B]">Required</th>
                                    <th className="text-left py-1.5 text-xs font-bold text-[#1B3A6B]">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.queryParams.map((param) => (
                                    <tr key={param.field} className="border-b border-gray-50">
                                      <td className="py-1.5 pr-4 font-mono text-xs text-[#0D7E8A]">{param.field}</td>
                                      <td className="py-1.5 pr-4 text-xs text-gray-500">{param.type}</td>
                                      <td className="py-1.5 pr-4">
                                        {param.required
                                          ? <span className="text-xs font-medium text-red-600">Yes</span>
                                          : <span className="text-xs text-gray-400">No</span>
                                        }
                                      </td>
                                      <td className="py-1.5 text-xs text-gray-600">{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Request Body */}
                        {endpoint.requestBody && endpoint.requestBody.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Request Body</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-1.5 pr-4 text-xs font-bold text-[#1B3A6B]">Field</th>
                                    <th className="text-left py-1.5 pr-4 text-xs font-bold text-[#1B3A6B]">Type</th>
                                    <th className="text-left py-1.5 pr-4 text-xs font-bold text-[#1B3A6B]">Required</th>
                                    <th className="text-left py-1.5 text-xs font-bold text-[#1B3A6B]">Description</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {endpoint.requestBody.map((param) => (
                                    <tr key={param.field} className="border-b border-gray-50">
                                      <td className="py-1.5 pr-4 font-mono text-xs text-[#0D7E8A]">{param.field}</td>
                                      <td className="py-1.5 pr-4 text-xs text-gray-500">{param.type}</td>
                                      <td className="py-1.5 pr-4">
                                        {param.required
                                          ? <span className="text-xs font-medium text-red-600">Yes</span>
                                          : <span className="text-xs text-gray-400">No</span>
                                        }
                                      </td>
                                      <td className="py-1.5 text-xs text-gray-600">{param.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Response Example */}
                        {endpoint.responseExample && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1.5">Response</h4>
                            <pre className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs overflow-x-auto font-mono leading-relaxed">
                              {endpoint.responseExample}
                            </pre>
                          </div>
                        )}

                        {/* Notes */}
                        {endpoint.notes && endpoint.notes.length > 0 && (
                          <div className="rounded-lg p-3" style={{ backgroundColor: '#E6F5F6' }}>
                            <h4 className="text-xs font-bold text-[#0D7E8A] uppercase mb-1.5">Notes</h4>
                            <ul className="space-y-1">
                              {endpoint.notes.map((note, i) => (
                                <li key={i} className="text-xs text-gray-700 flex gap-2">
                                  <span className="text-[#0D7E8A] flex-shrink-0">-</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Error Codes Reference */}
        <section className="mt-8" id="error-codes">
          <div className="border-l-4 border-[#1B3A6B] pl-4 mb-4">
            <h2 className="text-lg font-bold text-[#1B3A6B]">Common Error Codes</h2>
            <p className="text-sm text-gray-500">Standard HTTP error responses used across all endpoints.</p>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#1B3A6B' }}>
                  <th className="text-left py-2.5 px-4 text-xs font-bold text-white">Status</th>
                  <th className="text-left py-2.5 px-4 text-xs font-bold text-white">Meaning</th>
                  <th className="text-left py-2.5 px-4 text-xs font-bold text-white">Response Format</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { code: '400', meaning: 'Bad Request', desc: '{ "error": "Invalid request", "details": {...} }' },
                  { code: '401', meaning: 'Unauthorized', desc: '{ "error": "Unauthorized" }' },
                  { code: '403', meaning: 'Forbidden', desc: '{ "error": "Insufficient approval authority" }' },
                  { code: '404', meaning: 'Not Found', desc: '{ "error": "PO not found" }' },
                  { code: '409', meaning: 'Conflict', desc: '{ "error": "This slug is already taken" }' },
                  { code: '422', meaning: 'Unprocessable', desc: '{ "pushed": false, "message": "Tally did not confirm..." }' },
                  { code: '429', meaning: 'Too Many Requests', desc: '{ "error": "Too many requests" }' },
                  { code: '500', meaning: 'Server Error', desc: '{ "error": "Internal server error" }' },
                  { code: '502', meaning: 'Bad Gateway', desc: '{ "pushed": false, "reason": "tally_connection_failed" }' },
                ].map((row) => (
                  <tr key={row.code} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 font-mono text-sm font-bold text-[#1B3A6B]">{row.code}</td>
                    <td className="py-2 px-4 text-sm text-gray-700">{row.meaning}</td>
                    <td className="py-2 px-4 font-mono text-xs text-gray-500">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 text-center text-xs text-gray-400 pb-8">
          H1 VPMS API Documentation - Last updated March 2026
        </div>
      </div>
    </div>
  )
}
