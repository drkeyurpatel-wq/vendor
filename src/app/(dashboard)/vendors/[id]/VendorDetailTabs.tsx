'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn, formatDate, formatLakhs, formatCurrency, PO_STATUS_COLORS, PAYMENT_STATUS_COLORS, MATCH_STATUS_COLORS } from '@/lib/utils'
import { Building2, Phone, Mail, MapPin, CreditCard, FileText, ShoppingCart, CheckCircle2, Clock, AlertTriangle, Truck, Shield } from 'lucide-react'

interface Props {
  vendor: any
  pos: any[]
  invoices: any[]
  grns: any[]
  documents: any[]
  approvedCentreNames: string[]
  userRole?: string
}

export default function VendorDetailTabs({ vendor, pos, invoices, grns, documents, approvedCentreNames, userRole }: Props) {
  const [tab, setTab] = useState('profile')

  const tabs = [
    { key: 'profile', label: 'Profile', count: undefined },
    { key: 'orders', label: 'Purchase Orders', count: pos.length },
    { key: 'invoices', label: 'Invoices', count: invoices.length },
    { key: 'grns', label: 'GRNs', count: grns.length },
    { key: 'documents', label: 'Documents', count: documents.length },
  ]

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 overflow-x-auto px-2" role="tablist">
        {tabs.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={cn('px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px',
              tab === t.key ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}>
            {t.label}
            {t.count !== undefined && (
              <span className={cn('ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                tab === t.key ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500')}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 animate-fade-in" key={tab}>
        {tab === 'profile' && <ProfileTab vendor={vendor} approvedCentreNames={approvedCentreNames} />}
        {tab === 'orders' && <OrdersTab pos={pos} vendorId={vendor.id} />}
        {tab === 'invoices' && <InvoicesTab invoices={invoices} />}
        {tab === 'grns' && <GRNsTab grns={grns} />}
        {tab === 'documents' && <DocumentsTab documents={documents} vendorId={vendor.id} />}
      </div>
    </div>
  )
}

// ─── Profile Tab ──────────────────────────────────────────

function ProfileTab({ vendor, approvedCentreNames }: { vendor: any; approvedCentreNames: string[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3 flex items-center gap-2"><Building2 size={14} className="text-teal-600" /> Contact & Address</h3>
        <div className="space-y-2.5 text-sm">
          {vendor.primary_contact_name && <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Contact:</span><span className="text-gray-900 font-medium">{vendor.primary_contact_name}</span></div>}
          {vendor.primary_contact_phone && <div className="flex items-center gap-2"><Phone size={13} className="text-gray-400" /><span className="text-gray-900">{vendor.primary_contact_phone}</span></div>}
          {vendor.primary_contact_email && <div className="flex items-center gap-2"><Mail size={13} className="text-gray-400" /><a href={`mailto:${vendor.primary_contact_email}`} className="text-teal-600 hover:underline">{vendor.primary_contact_email}</a></div>}
          {vendor.address && <div className="flex items-start gap-2"><MapPin size={13} className="text-gray-400 mt-0.5" /><span className="text-gray-900">{vendor.address}{vendor.city ? `, ${vendor.city}` : ''}{vendor.state ? `, ${vendor.state}` : ''} {vendor.pincode || ''}</span></div>}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3 flex items-center gap-2"><FileText size={14} className="text-teal-600" /> Compliance</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2"><span className="text-gray-500 w-24 shrink-0">GSTIN:</span><span className="font-mono text-gray-900">{vendor.gstin || '—'}</span>{vendor.gstin_verified && <CheckCircle2 size={13} className="text-green-500" />}</div>
          <div className="flex items-center gap-2"><span className="text-gray-500 w-24 shrink-0">PAN:</span><span className="font-mono text-gray-900">{vendor.pan || '—'}</span>{vendor.pan_verified && <CheckCircle2 size={13} className="text-green-500" />}</div>
          {vendor.drug_license_no && <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Drug Lic:</span><span className="font-mono text-gray-900">{vendor.drug_license_no}</span></div>}
          {vendor.fssai_no && <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">FSSAI:</span><span className="font-mono text-gray-900">{vendor.fssai_no}</span></div>}
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3 flex items-center gap-2"><CreditCard size={14} className="text-teal-600" /> Banking</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Bank:</span><span className="text-gray-900">{vendor.bank_name || '—'}</span></div>
          <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">Account:</span><span className="font-mono text-gray-900">{vendor.bank_account_no || '—'}</span></div>
          <div className="flex gap-2"><span className="text-gray-500 w-24 shrink-0">IFSC:</span><span className="font-mono text-gray-900">{vendor.bank_ifsc || '—'}</span></div>
          <div className="flex items-center gap-2"><span className="text-gray-500 w-24 shrink-0">Verified:</span>{vendor.bank_verified ? <span className="badge bg-green-100 text-green-700 text-xs">Yes</span> : <span className="badge bg-yellow-100 text-yellow-800 text-xs">Pending</span>}</div>
        </div>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Approved Centres</h3>
        {approvedCentreNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">{approvedCentreNames.map(c => <span key={c} className="badge bg-blue-50 text-blue-700">{c}</span>)}</div>
        ) : (
          <p className="text-sm text-gray-400">All centres (no restriction)</p>
        )}
      </div>
    </div>
  )
}

// ─── Orders Tab ───────────────────────────────────────────

function OrdersTab({ pos, vendorId }: { pos: any[]; vendorId: string }) {
  if (pos.length === 0) return <div className="text-center py-8 text-sm text-gray-400">No purchase orders yet</div>
  return (
    <div>
      <div className="overflow-x-auto -mx-6 -mb-6">
        <table className="data-table">
          <thead><tr><th>PO Number</th><th>Centre</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {pos.map((po: any) => (
              <tr key={po.id}>
                <td><Link href={`/purchase-orders/${po.id}`} className="font-mono text-xs font-semibold text-teal-600 hover:underline">{po.po_number}</Link></td>
                <td><span className="badge bg-blue-50 text-blue-700">{po.centre?.code}</span></td>
                <td className="text-sm text-gray-600">{formatDate(po.po_date)}</td>
                <td className="text-sm font-semibold">{formatLakhs(po.total_amount)}</td>
                <td><span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>{po.status.replace(/_/g, ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-center">
        <Link href={`/purchase-orders?vendor=${vendorId}`} className="text-xs text-teal-600 hover:underline font-medium">View all POs for this vendor →</Link>
      </div>
    </div>
  )
}

// ─── Invoices Tab ─────────────────────────────────────────

function InvoicesTab({ invoices }: { invoices: any[] }) {
  if (invoices.length === 0) return <div className="text-center py-8 text-sm text-gray-400">No invoices yet</div>
  return (
    <div className="overflow-x-auto -mx-6 -mb-6">
      <table className="data-table">
        <thead><tr><th>Ref</th><th>Vendor Inv #</th><th>Amount</th><th>Due Date</th><th>Match</th><th>Payment</th></tr></thead>
        <tbody>
          {invoices.map((inv: any) => {
            const overdue = inv.payment_status !== 'paid' && new Date(inv.due_date) < new Date()
            return (
              <tr key={inv.id}>
                <td><Link href={`/finance/invoices/${inv.id}`} className="font-mono text-xs text-teal-600 hover:underline">{inv.invoice_ref}</Link></td>
                <td className="font-mono text-xs text-gray-600">{inv.vendor_invoice_no}</td>
                <td className="text-sm font-semibold">{formatLakhs(inv.total_amount)}</td>
                <td className={cn('text-sm', overdue ? 'text-red-600 font-medium' : 'text-gray-600')}>
                  {formatDate(inv.due_date)}{overdue && <AlertTriangle size={11} className="inline ml-1 -mt-0.5" />}
                </td>
                <td><span className={cn('badge', MATCH_STATUS_COLORS[inv.match_status as keyof typeof MATCH_STATUS_COLORS])}>{inv.match_status?.replace(/_/g, ' ')}</span></td>
                <td><span className={cn('badge', PAYMENT_STATUS_COLORS[inv.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>{inv.payment_status?.replace(/_/g, ' ')}</span></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── GRNs Tab ─────────────────────────────────────────────

function GRNsTab({ grns }: { grns: any[] }) {
  if (grns.length === 0) return <div className="text-center py-8 text-sm text-gray-400">No GRNs yet</div>
  return (
    <div className="overflow-x-auto -mx-6 -mb-6">
      <table className="data-table">
        <thead><tr><th>GRN #</th><th>Date</th><th>Inv Amount</th><th>Status</th></tr></thead>
        <tbody>
          {grns.map((g: any) => (
            <tr key={g.id}>
              <td><Link href={`/grn/${g.id}`} className="font-mono text-xs text-teal-600 hover:underline">{g.grn_number}</Link></td>
              <td className="text-sm text-gray-600">{formatDate(g.grn_date)}</td>
              <td className="text-sm font-semibold">{g.vendor_invoice_amount ? formatLakhs(g.vendor_invoice_amount) : '—'}</td>
              <td><span className={cn('badge', g.status === 'verified' ? 'bg-green-100 text-green-800' : g.status === 'discrepancy' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700')}>{g.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Documents Tab ────────────────────────────────────────

function DocumentsTab({ documents, vendorId }: { documents: any[]; vendorId: string }) {
  const docTypeLabels: Record<string, string> = {
    gstin_certificate: 'GSTIN Certificate',
    pan_card: 'PAN Card',
    cancelled_cheque: 'Cancelled Cheque',
    drug_license: 'Drug License',
    fssai_certificate: 'FSSAI Certificate',
    address_proof: 'Address Proof',
    other: 'Other',
  }

  return (
    <div>
      {documents.length > 0 ? (
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="data-table">
            <thead><tr><th>Document Type</th><th>File Name</th><th>Uploaded</th><th>Expiry</th><th>Verified</th></tr></thead>
            <tbody>
              {documents.map((doc: any) => (
                <tr key={doc.id}>
                  <td className="text-sm font-medium text-gray-900">{docTypeLabels[doc.document_type] || doc.document_type}</td>
                  <td className="text-sm text-gray-600">{doc.file_name}</td>
                  <td className="text-xs text-gray-500">{formatDate(doc.created_at)}</td>
                  <td className="text-xs text-gray-500">{doc.expires_at ? formatDate(doc.expires_at) : '—'}</td>
                  <td>{doc.is_verified ? <CheckCircle2 size={14} className="text-green-500" /> : <Clock size={14} className="text-yellow-500" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-400">No documents uploaded</div>
      )}
      <div className="mt-4 text-center">
        <Link href={`/vendors/${vendorId}/documents`} className="btn-secondary text-sm">Manage Documents</Link>
      </div>
    </div>
  )
}
