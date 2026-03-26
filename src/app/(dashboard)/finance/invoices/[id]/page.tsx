import { requireAuth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, formatLakhs, getDueDateStatus, MATCH_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { ArrowLeft, FileText, Download, Calendar, CreditCard, Building2, Clock } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import MatchBreakdown from './MatchBreakdown'
import InvoiceActions from '@/components/ui/InvoiceActions'

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const { data: profile } = await supabase.from('user_profiles').select('id, role').eq('id', user.id).single()

  // Fetch invoice with joins
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, vendor:vendors(id, vendor_code, legal_name), centre:centres(code, name), grn:grns(id, grn_number, po_id)')
    .eq('id', id)
    .single()

  if (!invoice || error) {
    notFound()
  }

  const poId = invoice.po_id || invoice.grn?.po_id || null

  // Fetch PO details, PO items, and GRN items in parallel
  const [poResult, poItemsResult, grnItemsResult] = await Promise.all([
    poId
      ? supabase.from('purchase_orders').select('id, po_number, status').eq('id', poId).single()
      : Promise.resolve({ data: null }),
    poId
      ? supabase
          .from('purchase_order_items')
          .select('item_id, ordered_qty, rate, item:items(item_code, generic_name)')
          .eq('po_id', poId)
      : Promise.resolve({ data: null }),
    invoice.grn_id
      ? supabase
          .from('grn_items')
          .select('item_id, accepted_qty, item:items(item_code, generic_name)')
          .eq('grn_id', invoice.grn_id)
      : poId
        ? (async () => {
            const { data: grns } = await supabase
              .from('grns')
              .select('id')
              .eq('po_id', poId)
              .in('status', ['submitted', 'verified'])
            if (!grns || grns.length === 0) return { data: null }
            const grnIds = grns.map(g => g.id)
            return supabase
              .from('grn_items')
              .select('item_id, accepted_qty, item:items(item_code, generic_name)')
              .in('grn_id', grnIds)
          })()
        : Promise.resolve({ data: null }),
  ])

  const po = poResult.data
  const poItems = poItemsResult.data || []
  const grnItems = grnItemsResult.data || []

  // Also try to fetch invoice line items if they exist
  const { data: invoiceItems } = await supabase
    .from('invoice_items')
    .select('item_id, qty, rate')
    .eq('invoice_id', id)

  // Build GRN items map (aggregate accepted_qty per item)
  const grnMap = new Map<string, number>()
  grnItems.forEach((gi: any) => {
    const current = grnMap.get(gi.item_id) || 0
    grnMap.set(gi.item_id, current + gi.accepted_qty)
  })

  // Build invoice items map
  const invoiceItemsMap = new Map<string, { qty: number; rate: number }>()
  invoiceItems?.forEach((ii: any) => {
    invoiceItemsMap.set(ii.item_id, { qty: ii.qty, rate: ii.rate })
  })

  // Build match comparison items from PO items
  const matchItems = poItems.map((poi: any) => {
    const grnAccepted = grnMap.get(poi.item_id) || 0
    const invItem = invoiceItemsMap.get(poi.item_id)
    return {
      item_id: poi.item_id,
      item_code: poi.item?.item_code || '',
      item_name: poi.item?.generic_name || '',
      po_qty: poi.ordered_qty,
      po_rate: poi.rate,
      grn_accepted_qty: grnAccepted,
      invoice_qty: invItem?.qty ?? grnAccepted,
      invoice_rate: invItem?.rate ?? poi.rate,
    }
  })

  // Collect all GRN IDs linked to this invoice or PO
  const grnIds: string[] = []
  if (invoice.grn_id) grnIds.push(invoice.grn_id)
  if (poId && !invoice.grn_id) {
    const { data: relatedGrns } = await supabase
      .from('grns')
      .select('id')
      .eq('po_id', poId)
      .in('status', ['submitted', 'verified'])
    relatedGrns?.forEach(g => { if (!grnIds.includes(g.id)) grnIds.push(g.id) })
  }

  // Credit period calculations
  const creditPeriodDays = invoice.credit_period_days || 30
  const dueDate = invoice.due_date
  const dueDateStatus = dueDate ? getDueDateStatus(dueDate) : 'ok'
  const daysRemaining = dueDate ? differenceInDays(new Date(dueDate), new Date()) : null

  const DUE_STATUS_COLORS: Record<string, string> = {
    overdue: 'text-red-700 bg-red-50',
    critical: 'text-orange-700 bg-orange-50',
    warning: 'text-yellow-700 bg-yellow-50',
    ok: 'text-green-700 bg-green-50',
  }

  return (
    <div>
      <Link href="/finance/invoices" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Invoices
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-navy-600 font-mono">{invoice.invoice_ref}</h1>
              <span className={cn('badge', MATCH_STATUS_COLORS[invoice.match_status as keyof typeof MATCH_STATUS_COLORS])}>
                {(invoice.match_status || 'pending').replace(/_/g, ' ')}
              </span>
              <span className={cn('badge', PAYMENT_STATUS_COLORS[invoice.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>
                {(invoice.payment_status || 'unpaid').replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {invoice.vendor && (
                <>
                  <Link href={`/vendors/${invoice.vendor.id}`} className="text-teal-500 hover:underline">
                    {invoice.vendor.legal_name}
                  </Link>
                  {' '}<span className="font-mono text-xs text-gray-500">({invoice.vendor.vendor_code})</span>
                </>
              )}
              {invoice.centre && (
                <>{' | '}<span className="font-medium">{invoice.centre.code} — {invoice.centre.name}</span></>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {invoice.invoice_file_path && (
              <a href={invoice.invoice_file_path} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-1.5">
                <Download size={15} /> Download PDF
              </a>
            )}
            <Link href="/finance/invoices" className="btn-secondary flex items-center gap-1.5">
              <FileText size={15} /> All Invoices
            </Link>
          </div>
        </div>
      </div>

      {/* Invoice Actions */}
      {profile && (
        <div className="card p-5 mb-6">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Actions</h3>
          <InvoiceActions
            invoiceId={invoice.id} invoiceRef={invoice.invoice_ref}
            currentStatus={invoice.status || 'pending'} matchStatus={invoice.match_status || 'pending'}
            paymentStatus={invoice.payment_status || 'unpaid'}
            totalAmount={invoice.total_amount || 0} paidAmount={invoice.paid_amount || 0}
            vendorId={invoice.vendor_id} centreId={invoice.centre_id}
            poId={poId || undefined} grnId={invoice.grn_id || undefined}
            userRole={role}
          />
        </div>
      )}

      {/* 3-col summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Invoice Details */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
            <FileText size={13} /> Invoice Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Invoice Ref:</span>
              <span className="font-mono font-medium">{invoice.invoice_ref}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vendor Invoice No:</span>
              <span className="font-mono font-medium">{invoice.vendor_invoice_no || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Vendor Invoice Date:</span>
              <span className="font-medium">{invoice.vendor_invoice_date ? formatDate(invoice.vendor_invoice_date) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Due Date:</span>
              <span className="font-medium">{dueDate ? formatDate(dueDate) : '—'}</span>
            </div>
            {po && (
              <div className="flex justify-between">
                <span className="text-gray-500">Linked PO:</span>
                <Link href={`/purchase-orders/${po.id}`} className="text-teal-500 hover:underline font-mono text-xs">
                  {po.po_number}
                </Link>
              </div>
            )}
            {invoice.grn && (
              <div className="flex justify-between">
                <span className="text-gray-500">Linked GRN:</span>
                <Link href={`/grn/${invoice.grn.id}`} className="text-teal-500 hover:underline font-mono text-xs">
                  {invoice.grn.grn_number}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Amount Summary */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
            <CreditCard size={13} /> Amount Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-mono font-semibold text-navy-600">{formatCurrency(invoice.total_amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GST Amount:</span>
              <span className="font-mono">{formatCurrency(invoice.gst_amount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Paid Amount:</span>
              <span className="font-mono text-green-700">{formatCurrency(invoice.paid_amount || 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 border-gray-200">
              <span className="text-gray-500 font-medium">Balance Due:</span>
              <span className="font-mono font-bold text-red-700">
                {formatCurrency((invoice.total_amount || 0) - (invoice.paid_amount || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Credit Period */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
            <Clock size={13} /> Credit Period
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Credit Period:</span>
              <span className="font-medium">{creditPeriodDays} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GRN Date (start):</span>
              <span className="font-medium">
                {invoice.grn_date ? formatDate(invoice.grn_date) : invoice.grn?.grn_date ? formatDate(invoice.grn.grn_date) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Due Date:</span>
              <span className="font-medium">{dueDate ? formatDate(dueDate) : '—'}</span>
            </div>
            {daysRemaining !== null && (
              <div className="mt-3">
                <div className={cn('rounded-lg px-3 py-2 text-center font-semibold', DUE_STATUS_COLORS[dueDateStatus])}>
                  {daysRemaining > 0
                    ? `${daysRemaining} days remaining`
                    : daysRemaining === 0
                      ? 'Due today'
                      : `${Math.abs(daysRemaining)} days overdue`}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor & Centre Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {invoice.vendor && (
          <div className="card p-5">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
              <Building2 size={13} /> Vendor
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Legal Name:</span>
                <Link href={`/vendors/${invoice.vendor.id}`} className="text-teal-500 hover:underline font-medium">
                  {invoice.vendor.legal_name}
                </Link>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vendor Code:</span>
                <span className="font-mono text-xs">{invoice.vendor.vendor_code}</span>
              </div>
            </div>
          </div>
        )}
        {invoice.centre && (
          <div className="card p-5">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3 flex items-center gap-1.5">
              <Building2 size={13} /> Centre
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Code:</span>
                <span className="font-mono font-medium">{invoice.centre.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{invoice.centre.name}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3-Way Match Breakdown */}
      <div className="mb-6">
        <MatchBreakdown
          invoice_id={id}
          po_id={poId}
          grn_ids={grnIds}
          initialItems={matchItems}
          currentMatchStatus={invoice.match_status || 'pending'}
        />
      </div>
    </div>
  )
}
