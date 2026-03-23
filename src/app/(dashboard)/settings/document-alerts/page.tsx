import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { AlertTriangle, Clock, FileCheck, FileWarning, Bell, Search } from 'lucide-react'
import Link from 'next/link'
import DocumentAlertActions from '@/components/ui/DocumentAlertActions'

const DOC_TYPE_LABELS: Record<string, string> = {
  gstin_certificate: 'GSTIN Certificate',
  pan_card: 'PAN Card',
  cancelled_cheque: 'Cancelled Cheque',
  drug_license: 'Drug License',
  fssai_certificate: 'FSSAI Certificate',
  address_proof: 'Address Proof',
  other: 'Other',
}

function getDocStatus(expiresAt: string | null): { label: string; color: string; daysRemaining: number | null } {
  if (!expiresAt) return { label: 'No Expiry', color: 'bg-gray-100 text-gray-600', daysRemaining: null }

  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffMs = expiry.getTime() - now.getTime()
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) return { label: 'Expired', color: 'bg-red-100 text-red-800', daysRemaining }
  if (daysRemaining <= 30) return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800', daysRemaining }
  if (daysRemaining <= 90) return { label: 'Expiring in 90d', color: 'bg-blue-100 text-blue-800', daysRemaining }
  return { label: 'Valid', color: 'bg-green-100 text-green-800', daysRemaining }
}

export default async function DocumentAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', user.id)
    .single()

  if (!profile || !['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(profile.role)) {
    redirect('/')
  }

  // Fetch all documents with expiry dates
  let query = supabase
    .from('vendor_documents')
    .select(`
      id,
      vendor_id,
      document_type,
      file_name,
      file_path,
      expires_at,
      is_verified,
      created_at,
      vendor:vendors(id, vendor_code, legal_name, primary_contact_email, primary_contact_phone, status)
    `)
    .not('expires_at', 'is', null)
    .order('expires_at', { ascending: true })

  if (params.type) {
    query = query.eq('document_type', params.type)
  }

  const { data: documents } = await query

  // Categorize documents
  const now = new Date()
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const nowStr = now.toISOString().split('T')[0]
  const in30Str = in30Days.toISOString().split('T')[0]
  const in90Str = in90Days.toISOString().split('T')[0]

  let filtered = (documents || []).map(doc => ({
    ...doc,
    ...getDocStatus(doc.expires_at),
  }))

  // Filter by status
  if (params.status === 'expired') {
    filtered = filtered.filter(d => d.expires_at && d.expires_at < nowStr)
  } else if (params.status === 'expiring_30') {
    filtered = filtered.filter(d => d.expires_at && d.expires_at >= nowStr && d.expires_at <= in30Str)
  } else if (params.status === 'expiring_90') {
    filtered = filtered.filter(d => d.expires_at && d.expires_at >= nowStr && d.expires_at > in30Str && d.expires_at <= in90Str)
  }

  // Filter by vendor search
  if (params.q) {
    const q = params.q.toLowerCase()
    filtered = filtered.filter(d => {
      const vendor = d.vendor as any
      return (
        vendor?.legal_name?.toLowerCase().includes(q) ||
        vendor?.vendor_code?.toLowerCase().includes(q)
      )
    })
  }

  // Count by category
  const allDocs = (documents || []).map(doc => ({ ...doc, ...getDocStatus(doc.expires_at) }))
  const expiredCount = allDocs.filter(d => d.expires_at && d.expires_at < nowStr).length
  const expiring30Count = allDocs.filter(d => d.expires_at && d.expires_at >= nowStr && d.expires_at <= in30Str).length
  const expiring90Count = allDocs.filter(d => d.expires_at && d.expires_at >= nowStr && d.expires_at > in30Str && d.expires_at <= in90Str).length

  const DOC_TYPES = ['gstin_certificate', 'pan_card', 'cancelled_cheque', 'drug_license', 'fssai_certificate', 'address_proof', 'other']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Document Expiry Alerts</h1>
          <p className="page-subtitle">Monitor vendor document compliance and expiry status</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link
          href="/settings/document-alerts?status=expired"
          className={cn(
            'stat-card border-l-4 border-l-red-500 hover:shadow-md transition-shadow cursor-pointer',
            params.status === 'expired' && 'ring-2 ring-red-300'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <FileWarning size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expired Documents</p>
              <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
            </div>
          </div>
        </Link>

        <Link
          href="/settings/document-alerts?status=expiring_30"
          className={cn(
            'stat-card border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow cursor-pointer',
            params.status === 'expiring_30' && 'ring-2 ring-yellow-300'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiring in 30 Days</p>
              <p className="text-2xl font-bold text-yellow-600">{expiring30Count}</p>
            </div>
          </div>
        </Link>

        <Link
          href="/settings/document-alerts?status=expiring_90"
          className={cn(
            'stat-card border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer',
            params.status === 'expiring_90' && 'ring-2 ring-blue-300'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expiring in 90 Days</p>
              <p className="text-2xl font-bold text-blue-600">{expiring90Count}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex gap-4 flex-wrap items-end">
        <div className="flex-1 min-w-48">
          <label className="form-label">Search Vendor</label>
          <form>
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                name="q"
                placeholder="Search vendor name or code..."
                defaultValue={params.q}
                className="form-input pl-10"
              />
            </div>
            {params.status && <input type="hidden" name="status" value={params.status} />}
            {params.type && <input type="hidden" name="type" value={params.type} />}
          </form>
        </div>
        <div className="w-52">
          <label className="form-label">Document Type</label>
          <form>
            <select name="type" className="form-select" defaultValue={params.type} onChange={(e) => (e.target as HTMLSelectElement).form?.submit()}>
              <option value="">All Types</option>
              {DOC_TYPES.map(t => (
                <option key={t} value={t}>{DOC_TYPE_LABELS[t] || t}</option>
              ))}
            </select>
            {params.status && <input type="hidden" name="status" value={params.status} />}
            {params.q && <input type="hidden" name="q" value={params.q} />}
          </form>
        </div>
        <div>
          <Link href="/settings/document-alerts" className="btn-secondary text-sm px-3 py-2">
            Clear Filters
          </Link>
        </div>
      </div>

      {/* Documents Table */}
      <div className="card overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Document Type</th>
                  <th>File Name</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Days Remaining</th>
                  <th>Contact</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc: any) => {
                  const vendor = doc.vendor as any
                  return (
                    <tr key={doc.id}>
                      <td>
                        <Link
                          href={`/vendors/${doc.vendor_id}`}
                          className="text-sm font-medium text-[#0D7E8A] hover:underline"
                        >
                          {vendor?.legal_name || 'Unknown'}
                        </Link>
                        <div className="text-xs text-gray-400 font-mono">{vendor?.vendor_code}</div>
                      </td>
                      <td className="text-sm text-gray-700">
                        {DOC_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </td>
                      <td className="text-sm text-gray-600 max-w-[200px] truncate">
                        {doc.file_name}
                      </td>
                      <td className="text-sm text-gray-700 font-medium">
                        {doc.expires_at ? formatDate(doc.expires_at) : '—'}
                      </td>
                      <td>
                        <span className={cn('badge', doc.color)}>
                          {doc.label}
                        </span>
                      </td>
                      <td className="text-sm">
                        {doc.daysRemaining !== null ? (
                          <span className={cn(
                            'font-semibold',
                            doc.daysRemaining < 0 ? 'text-red-600' :
                            doc.daysRemaining <= 30 ? 'text-yellow-600' :
                            doc.daysRemaining <= 90 ? 'text-blue-600' : 'text-green-600'
                          )}>
                            {doc.daysRemaining < 0
                              ? `${Math.abs(doc.daysRemaining)}d overdue`
                              : `${doc.daysRemaining}d left`}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="text-xs text-gray-500">
                        {vendor?.primary_contact_email && (
                          <div className="truncate max-w-[150px]">{vendor.primary_contact_email}</div>
                        )}
                        {vendor?.primary_contact_phone && (
                          <div>{vendor.primary_contact_phone}</div>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-1 items-center">
                          <DocumentAlertActions alertId={doc.id} vendorName={vendor?.legal_name || ''} documentType={DOC_TYPE_LABELS[doc.document_type] || doc.document_type} userRole={profile.role} />
                          {(vendor?.primary_contact_email || vendor?.primary_contact_phone) && (
                            <a
                              href={vendor?.primary_contact_email
                                ? `mailto:${vendor.primary_contact_email}?subject=Document Renewal Required - ${DOC_TYPE_LABELS[doc.document_type] || doc.document_type}&body=Dear ${vendor.legal_name},%0D%0A%0D%0AYour ${DOC_TYPE_LABELS[doc.document_type] || doc.document_type} ${doc.daysRemaining !== null && doc.daysRemaining < 0 ? 'has expired' : 'is expiring soon'}. Please renew and upload the updated document at the earliest.%0D%0A%0D%0ARegards,%0D%0AHealth1 Hospitals`
                                : `https://wa.me/${vendor?.primary_contact_phone?.replace(/\D/g, '')}?text=Dear ${vendor?.legal_name}, your ${DOC_TYPE_LABELS[doc.document_type] || doc.document_type} ${doc.daysRemaining !== null && doc.daysRemaining < 0 ? 'has expired' : 'is expiring soon'}. Please renew and upload the updated document.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-primary text-xs px-2.5 py-1 flex items-center gap-1"
                            >
                              <Bell size={12} />
                              Remind
                            </a>
                          )}
                          <Link
                            href={`/vendors/${doc.vendor_id}/documents`}
                            className="btn-secondary text-xs px-2.5 py-1"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileCheck size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No documents matching your filters</p>
            <p className="text-sm text-gray-400 mt-1">
              {params.status || params.type || params.q
                ? 'Try adjusting your filters'
                : 'All vendor documents are up to date'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
