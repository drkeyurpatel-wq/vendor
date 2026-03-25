'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Plus, RefreshCw, Loader2, CheckCircle2, ArrowRight, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-green-100 text-green-700',
  billed: 'bg-blue-100 text-blue-700',
}

export default function ConsignmentUsageListPage() {
  const supabase = createClient()
  const [usage, setUsage] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('consignment_usage')
      .select('*, stock:consignment_stock(vendor_rate, batch_number, serial_number, item:items(item_code, generic_name)), deposit:consignment_deposits(deposit_number, vendor:vendors(legal_name)), centre:centres(code)')
      .order('created_at', { ascending: false }).limit(200)
    setUsage(data || [])
    setLoading(false)
  }

  async function convert(usageId: string) {
    setConverting(usageId)
    try {
      const res = await fetch('/api/consignment/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usage_id: usageId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.message)
        load()
      } else {
        toast.error(data.error || 'Conversion failed')
      }
    } catch { toast.error('Conversion failed') }
    setConverting(null)
  }

  async function convertAll() {
    const pending = usage.filter(u => u.conversion_status === 'pending')
    if (!pending.length) { toast('Nothing to convert'); return }
    for (const u of pending) {
      setConverting(u.id)
      try {
        const res = await fetch('/api/consignment/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usage_id: u.id }),
        })
        const data = await res.json()
        if (!res.ok) toast.error(`${u.patient_name}: ${data.error}`)
      } catch {}
    }
    setConverting(null)
    toast.success(`${pending.length} usage records converted`)
    load()
  }

  const pendingCount = usage.filter(u => u.conversion_status === 'pending').length

  return (
    <div>
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Consignment Usage Log</h1>
          <p className="page-subtitle">{usage.length} records — {pendingCount} pending conversion</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button onClick={convertAll} disabled={!!converting} className="text-sm px-3 py-1.5 rounded-lg bg-orange-600 text-white hover:bg-orange-700 font-medium flex items-center gap-1.5">
              <RefreshCw size={14} /> Convert All ({pendingCount})
            </button>
          )}
          <Link href="/consignment/usage/new" className="btn-primary text-sm"><Plus size={14} /> Record Usage</Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#1B3A6B]" /></div>
        ) : usage.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Usage #</th><th>Patient</th><th>Item</th><th>Vendor</th><th>Centre</th><th>Date</th><th>Qty</th><th className="text-right">Amount</th><th>Status</th><th>Documents</th><th>Action</th>
              </tr></thead>
              <tbody>
                {usage.map(u => {
                  const amount = (u.stock?.vendor_rate || 0) * (u.qty_used || 1)
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="font-mono text-xs font-semibold text-[#1B3A6B]">{u.usage_number || u.id.substring(0, 8)}</td>
                      <td>
                        <div className="text-sm font-medium text-gray-900">{u.patient_name}</div>
                        {u.patient_uhid && <div className="text-xs text-gray-400">{u.patient_uhid}</div>}
                        {u.surgeon_name && <div className="text-xs text-gray-400">Dr. {u.surgeon_name}</div>}
                      </td>
                      <td>
                        <div className="text-sm">{u.stock?.item?.generic_name}</div>
                        <div className="text-xs text-gray-400 font-mono">{u.stock?.item?.item_code} | SN: {u.stock?.serial_number || '—'}</div>
                      </td>
                      <td className="text-sm text-gray-600">{u.deposit?.vendor?.legal_name}</td>
                      <td><span className="badge bg-blue-50 text-blue-700 text-xs">{u.centre?.code}</span></td>
                      <td className="text-sm text-gray-600">{formatDate(u.usage_date || u.created_at)}</td>
                      <td className="text-sm text-center">{u.qty_used}</td>
                      <td className="text-sm text-right font-semibold">{formatCurrency(amount)}</td>
                      <td><span className={cn('badge text-xs', STATUS_COLORS[u.conversion_status] || STATUS_COLORS.pending)}>{(u.conversion_status || 'pending').replace(/_/g, ' ')}</span></td>
                      <td className="text-xs">
                        {u.po_id && <Link href={`/purchase-orders/${u.po_id}`} className="text-teal-600 hover:underline block">PO</Link>}
                        {u.grn_id && <Link href={`/grn/${u.grn_id}`} className="text-teal-600 hover:underline block">GRN</Link>}
                        {u.invoice_id && <Link href={`/finance/invoices/${u.invoice_id}`} className="text-teal-600 hover:underline block">Invoice</Link>}
                      </td>
                      <td>
                        {u.conversion_status === 'pending' && (
                          <button onClick={() => convert(u.id)} disabled={converting === u.id}
                            className="text-xs px-2 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 font-medium flex items-center gap-1 whitespace-nowrap">
                            {converting === u.id ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                            Convert
                          </button>
                        )}
                        {u.conversion_status === 'converted' && <CheckCircle2 size={16} className="text-green-500" />}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <FileText size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No usage records yet</p>
            <p className="text-sm text-gray-400 mt-1">Record a consignment item usage to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
