import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate, VENDOR_STATUS_COLORS, PO_STATUS_COLORS, formatLakhs } from '@/lib/utils'
import { ArrowLeft, Building2, Phone, Mail, MapPin, CreditCard, FileText, ShoppingCart, AlertTriangle } from 'lucide-react'

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*, category:vendor_categories(name, code)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!vendor || error) redirect('/vendors')

  // Fetch related data in parallel
  const [{ data: centres }, { data: pos }, { data: documents }, { data: invoices }] = await Promise.all([
    supabase.from('centres').select('id, code, name').eq('is_active', true).order('code'),
    supabase.from('purchase_orders')
      .select('id, po_number, po_date, status, total_amount, centre:centres(code)')
      .eq('vendor_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('vendor_documents')
      .select('id, document_type, file_name, is_verified, uploaded_at')
      .eq('vendor_id', id)
      .order('uploaded_at', { ascending: false }),
    supabase.from('invoices')
      .select('id, vendor_invoice_no, total_amount, due_date, payment_status')
      .eq('vendor_id', id)
      .neq('payment_status', 'paid')
      .order('due_date')
      .limit(10),
  ])

  const approvedCentreNames = centres
    ?.filter(c => vendor.approved_centres?.includes(c.id))
    .map(c => `${c.code} — ${c.name}`) ?? []

  const totalPOValue = pos?.reduce((s, p: any) => s + (p.total_amount || 0), 0) ?? 0
  const outstandingAmount = invoices?.reduce((s, i: any) => s + (i.total_amount || 0), 0) ?? 0

  return (
    <div>
      <Link href="/vendors" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Vendors
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-gray-500">{vendor.vendor_code}</span>
              <span className={cn('badge', VENDOR_STATUS_COLORS[vendor.status as keyof typeof VENDOR_STATUS_COLORS])}>
                {vendor.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-[#1B3A6B]">{vendor.legal_name}</h1>
            {vendor.trade_name && <p className="text-gray-500 mt-0.5">Trade Name: {vendor.trade_name}</p>}
            {vendor.category && (
              <span className="badge bg-blue-50 text-blue-700 mt-2">{vendor.category.name}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/purchase-orders/new?vendor=${vendor.id}`} className="btn-primary">
              <ShoppingCart size={15} /> Create PO
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-sm text-gray-500">Total POs</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{pos?.length ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Total PO Value</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{formatLakhs(totalPOValue)}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Credit Period</div>
          <div className="text-xl font-bold text-[#0D7E8A]">{vendor.credit_period_days} days</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Outstanding</div>
          <div className={cn('text-xl font-bold', outstandingAmount > 0 ? 'text-red-600' : 'text-green-600')}>
            {formatLakhs(outstandingAmount)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Address */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
            <Building2 size={16} className="text-[#0D7E8A]" /> Contact & Address
          </h2>
          <div className="space-y-3 text-sm">
            {vendor.primary_contact_name && (
              <div className="flex items-start gap-2"><span className="text-gray-500 w-24 shrink-0">Contact:</span><span className="text-gray-900">{vendor.primary_contact_name}</span></div>
            )}
            {vendor.primary_contact_phone && (
              <div className="flex items-start gap-2"><Phone size={14} className="text-gray-400 mt-0.5" /><span className="text-gray-900">{vendor.primary_contact_phone}</span></div>
            )}
            {vendor.primary_contact_email && (
              <div className="flex items-start gap-2"><Mail size={14} className="text-gray-400 mt-0.5" /><span className="text-gray-900">{vendor.primary_contact_email}</span></div>
            )}
            {vendor.address && (
              <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5" /><span className="text-gray-900">{vendor.address}{vendor.city ? `, ${vendor.city}` : ''}{vendor.state ? `, ${vendor.state}` : ''} {vendor.pincode || ''}</span></div>
            )}
          </div>
        </div>

        {/* Compliance */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
            <FileText size={16} className="text-[#0D7E8A]" /> Compliance & Registration
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-24 shrink-0">GSTIN:</span>
              <span className="font-mono text-gray-900">{vendor.gstin || '—'}</span>
              {vendor.gstin_verified && <span className="badge bg-green-100 text-green-700 text-xs">Verified</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-24 shrink-0">PAN:</span>
              <span className="font-mono text-gray-900">{vendor.pan || '—'}</span>
              {vendor.pan_verified && <span className="badge bg-green-100 text-green-700 text-xs">Verified</span>}
            </div>
            {vendor.drug_license_no && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-24 shrink-0">Drug License:</span>
                <span className="font-mono text-gray-900">{vendor.drug_license_no}</span>
              </div>
            )}
          </div>
        </div>

        {/* Banking */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
            <CreditCard size={16} className="text-[#0D7E8A]" /> Banking Details
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Bank:</span><span className="text-gray-900">{vendor.bank_name || '—'}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Account:</span><span className="font-mono text-gray-900">{vendor.bank_account_no || '—'}</span></div>
            <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">IFSC:</span><span className="font-mono text-gray-900">{vendor.bank_ifsc || '—'}</span></div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 w-24 shrink-0">Verified:</span>
              {vendor.bank_verified
                ? <span className="badge bg-green-100 text-green-700 text-xs">Yes</span>
                : <span className="badge bg-yellow-100 text-yellow-800 text-xs">Pending</span>}
            </div>
          </div>
        </div>

        {/* Approved Centres */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Approved Centres</h2>
          {approvedCentreNames.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {approvedCentreNames.map(c => (
                <span key={c} className="badge bg-blue-50 text-blue-700">{c}</span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No centres assigned</p>
          )}
        </div>
      </div>

      {/* Recent POs */}
      <div className="card overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Purchase Orders</h2>
          <Link href={`/purchase-orders?vendor=${vendor.id}`} className="text-xs text-[#0D7E8A] hover:underline">View All</Link>
        </div>
        {pos && pos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>PO Number</th><th>Centre</th><th>Date</th><th>Amount</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pos.map((po: any) => (
                  <tr key={po.id}>
                    <td><span className="font-mono text-xs font-semibold">{po.po_number}</span></td>
                    <td><span className="badge bg-gray-100 text-gray-700">{po.centre?.code}</span></td>
                    <td className="text-sm text-gray-600">{formatDate(po.po_date)}</td>
                    <td className="text-sm font-semibold">{formatLakhs(po.total_amount)}</td>
                    <td><span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>{po.status.replace(/_/g, ' ')}</span></td>
                    <td><Link href={`/purchase-orders/${po.id}`} className="text-xs text-[#0D7E8A] hover:underline">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-sm">No purchase orders yet</div>
        )}
      </div>

      {/* Outstanding Invoices */}
      {invoices && invoices.length > 0 && (
        <div className="card overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <h2 className="font-semibold text-gray-900">Outstanding Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr><th>Invoice No.</th><th>Amount</th><th>Due Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs">{inv.vendor_invoice_no}</td>
                    <td className="font-semibold">{formatLakhs(inv.total_amount)}</td>
                    <td className="text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                    <td><span className={cn('badge', inv.payment_status === 'unpaid' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>{inv.payment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-400">
        Created: {formatDate(vendor.created_at)} | Last updated: {formatDate(vendor.updated_at)}
      </div>
    </div>
  )
}
