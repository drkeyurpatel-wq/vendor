import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate, VENDOR_STATUS_COLORS, PO_STATUS_COLORS, PAYMENT_STATUS_COLORS, formatLakhs } from '@/lib/utils'
import { ArrowLeft, Building2, Phone, Mail, MapPin, CreditCard, FileText, ShoppingCart, AlertTriangle, Upload, CheckCircle2, Clock, Shield } from 'lucide-react'
import VendorActions from './VendorActions'
import VendorDetailTabs from './VendorDetailTabs'

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, role } = await requireAuth()

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*, category:vendor_categories(name, code)')
    .eq('id', id).is('deleted_at', null).single()

  if (!vendor || error) redirect('/vendors')

  const [{ data: centres }, { data: pos }, { data: documents }, { data: invoices }, { data: grns }] = await Promise.all([
    supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
    supabase.from('purchase_orders')
      .select('id, po_number, po_date, status, total_amount, centre:centres(code)')
      .eq('vendor_id', id).is('deleted_at', null)
      .order('created_at', { ascending: false }).limit(20),
    supabase.from('vendor_documents')
      .select('id, document_type, file_name, is_verified, expires_at, created_at')
      .eq('vendor_id', id).order('created_at', { ascending: false }),
    supabase.from('invoices')
      .select('id, invoice_ref, vendor_invoice_no, total_amount, paid_amount, due_date, payment_status, match_status')
      .eq('vendor_id', id).order('created_at', { ascending: false }).limit(20),
    supabase.from('grns')
      .select('id, grn_number, grn_date, status, vendor_invoice_amount')
      .eq('vendor_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  const approvedCentreNames = centres?.filter(c => vendor.approved_centres?.includes(c.id)).map(c => `${c.code} — ${c.name}`) ?? []
  const totalPOValue = pos?.reduce((s, p: any) => s + (p.total_amount || 0), 0) ?? 0
  const outstandingAmount = invoices?.filter((i: any) => i.payment_status !== 'paid').reduce((s, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0) ?? 0
  const paidAmount = invoices?.reduce((s, i: any) => s + (i.paid_amount || 0), 0) ?? 0

  return (
    <div>
      <Link href="/vendors" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Vendors
      </Link>

      {/* Header card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded text-gray-600">{vendor.vendor_code}</span>
              <span className={cn('badge', VENDOR_STATUS_COLORS[vendor.status as keyof typeof VENDOR_STATUS_COLORS])}>
                {vendor.status === 'blacklisted' && <Shield size={10} className="mr-0.5" />}
                {vendor.status}
              </span>
              {vendor.category && <span className="badge bg-blue-50 text-blue-700">{vendor.category.name}</span>}
            </div>
            <h1 className="text-2xl font-bold text-navy-600 mt-1">{vendor.legal_name}</h1>
            {vendor.trade_name && <p className="text-sm text-gray-500 mt-0.5">Trade: {vendor.trade_name}</p>}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href={`/vendors/${vendor.id}/documents`} className="btn-secondary text-sm"><Upload size={14} /> Documents</Link>
            <Link href={`/purchase-orders/new?vendor=${vendor.id}`} className="btn-primary text-sm"><ShoppingCart size={14} /> Create PO</Link>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
          <div className="text-xs text-gray-500 font-medium">Total POs</div>
          <div className="text-xl font-bold text-navy-600 mt-1">{pos?.length ?? 0}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
          <div className="text-xs text-gray-500 font-medium">PO Value</div>
          <div className="text-xl font-bold text-navy-600 mt-1">{formatLakhs(totalPOValue)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
          <div className="text-xs text-gray-500 font-medium">Credit Period</div>
          <div className="text-xl font-bold text-teal-600 mt-1">{vendor.credit_period_days}d</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
          <div className="text-xs text-gray-500 font-medium">Outstanding</div>
          <div className={cn('text-xl font-bold mt-1', outstandingAmount > 0 ? 'text-red-600' : 'text-green-600')}>{formatLakhs(outstandingAmount)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
          <div className="text-xs text-gray-500 font-medium">Total Paid</div>
          <div className="text-xl font-bold text-green-600 mt-1">{formatLakhs(paidAmount)}</div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="card overflow-hidden">
        <VendorDetailTabs
          vendor={vendor}
          pos={pos ?? []}
          invoices={invoices ?? []}
          grns={grns ?? []}
          documents={documents ?? []}
          approvedCentreNames={approvedCentreNames}
          userRole={role}
        />
      </div>

      {/* Vendor Actions (status change, blacklist) */}
      <div className="mt-6">
        <VendorActions vendorId={vendor.id} currentStatus={vendor.status} userRole={role} />
      </div>

      <div className="mt-4 text-xs text-gray-400">
        Created: {formatDate(vendor.created_at)} | Last updated: {formatDate(vendor.updated_at)}
      </div>
    </div>
  )
}
