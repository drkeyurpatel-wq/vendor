import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatLakhs, formatDate } from '@/lib/utils'
import { ArrowLeft, FileText, Download, Building2, Hash } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function GSTSummaryReport({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; centre?: string; view?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const selectedMonth = params.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, month] = selectedMonth.split('-').map(Number)
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const monthEnd = new Date(year, month, 0).toISOString().split('T')[0]
  const view = params.view || 'vendor'

  // Fetch invoices for the month
  let query = supabase
    .from('invoices')
    .select('id, invoice_ref, vendor_invoice_no, vendor_invoice_date, subtotal, gst_amount, total_amount, status, vendor:vendors(vendor_code, legal_name, gstin, state), centre:centres(code, name, state)')
    .gte('vendor_invoice_date', monthStart)
    .lte('vendor_invoice_date', monthEnd)
    .eq('status', 'approved')

  if (params.centre) query = query.eq('centre_id', params.centre)

  const { data: invoices } = await query.order('vendor_invoice_date')
  const { data: centres } = await supabase.from('centres').select('id, code, name').eq('is_active', true).order('code')

  const allInvoices = invoices || []
  const invoiceIds = allInvoices.map((inv: any) => inv.id)

  // Fetch invoice_items for HSN-wise breakdown (when line-level data exists)
  let invoiceItemsData: any[] = []
  if (invoiceIds.length > 0) {
    const { data: items } = await supabase
      .from('invoice_items')
      .select('invoice_id, hsn_code, taxable_amount, cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount, total_amount')
      .in('invoice_id', invoiceIds)
    invoiceItemsData = items || []
  }

  const hasLineItems = invoiceItemsData.length > 0

  const totalTaxable = allInvoices.reduce((s, i: any) => s + (i.subtotal || 0), 0)
  const totalGST = allInvoices.reduce((s, i: any) => s + (i.gst_amount || 0), 0)
  const totalValue = allInvoices.reduce((s, i: any) => s + (i.total_amount || 0), 0)

  // Vendor-wise grouping
  const vendorMap = new Map<string, { vendor: any; invoices: any[]; taxable: number; gst: number; total: number }>()
  allInvoices.forEach((inv: any) => {
    const key = inv.vendor?.vendor_code || 'unknown'
    if (!vendorMap.has(key)) vendorMap.set(key, { vendor: inv.vendor, invoices: [], taxable: 0, gst: 0, total: 0 })
    const g = vendorMap.get(key)!
    g.invoices.push(inv)
    g.taxable += inv.subtotal || 0
    g.gst += inv.gst_amount || 0
    g.total += inv.total_amount || 0
  })
  const vendorGroups = Array.from(vendorMap.values()).sort((a, b) => b.total - a.total)

  // Centre-wise grouping
  const centreMap = new Map<string, { centre: any; taxable: number; gst: number; total: number; count: number }>()
  allInvoices.forEach((inv: any) => {
    const key = inv.centre?.code || 'unknown'
    if (!centreMap.has(key)) centreMap.set(key, { centre: inv.centre, taxable: 0, gst: 0, total: 0, count: 0 })
    const g = centreMap.get(key)!
    g.taxable += inv.subtotal || 0; g.gst += inv.gst_amount || 0; g.total += inv.total_amount || 0; g.count++
  })

  // HSN-wise grouping from invoice_items
  const hsnMap = new Map<string, { hsn: string; taxable: number; cgst: number; sgst: number; igst: number; total: number; count: number }>()
  if (hasLineItems) {
    invoiceItemsData.forEach((item: any) => {
      const hsn = item.hsn_code || 'N/A'
      if (!hsnMap.has(hsn)) hsnMap.set(hsn, { hsn, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0, count: 0 })
      const g = hsnMap.get(hsn)!
      g.taxable += item.taxable_amount || 0
      g.cgst += item.cgst_amount || 0
      g.sgst += item.sgst_amount || 0
      g.igst += item.igst_amount || 0
      g.total += item.total_amount || 0
      g.count++
    })
  }
  const hsnGroups = Array.from(hsnMap.values()).sort((a, b) => b.total - a.total)

  // Month options (last 12 months)
  const monthOptions: string[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const monthLabel = new Date(year, month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div>
      <Link href="/reports" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Reports
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">GST Summary — {monthLabel}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {allInvoices.length} approved invoices
            {hasLineItems && <span className="text-[#0D7E8A] font-medium ml-2">HSN-wise data available</span>}
          </p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <Link href={`/reports/gst-summary?month=${selectedMonth}${params.centre ? `&centre=${params.centre}` : ''}&view=vendor`}
            className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === 'vendor' ? 'bg-navy-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
            By Vendor
          </Link>
          <Link href={`/reports/gst-summary?month=${selectedMonth}${params.centre ? `&centre=${params.centre}` : ''}&view=hsn`}
            className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === 'hsn' ? 'bg-navy-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
            By HSN
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {monthOptions.map(m => (
          <Link key={m} href={`/reports/gst-summary?month=${m}${params.centre ? `&centre=${params.centre}` : ''}&view=${view}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              selectedMonth === m ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {new Date(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]) - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}
          </Link>
        ))}
      </div>

      {/* Centre filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <Link href={`/reports/gst-summary?month=${selectedMonth}&view=${view}`}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !params.centre ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>
          All Centres
        </Link>
        {centres?.map(c => (
          <Link key={c.id} href={`/reports/gst-summary?month=${selectedMonth}&centre=${c.id}&view=${view}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              params.centre === c.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>
            {c.code}
          </Link>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5">
          <div className="text-xs text-gray-500">Taxable Value</div>
          <div className="text-xl font-bold text-navy-600">{formatLakhs(totalTaxable)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5">
          <div className="text-xs text-gray-500">CGST + SGST / IGST</div>
          <div className="text-xl font-bold text-teal-600">{formatLakhs(totalGST)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5">
          <div className="text-xs text-gray-500">Total Invoice Value</div>
          <div className="text-xl font-bold text-navy-600">{formatLakhs(totalValue)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5">
          <div className="text-xs text-gray-500">Invoices</div>
          <div className="text-xl font-bold text-gray-900">{allInvoices.length}</div>
          <div className="text-xs text-gray-400 mt-1">{vendorMap.size} vendors</div>
        </div>
      </div>

      {/* Centre-wise summary */}
      {centreMap.size > 1 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-navy-600 flex items-center gap-2"><Building2 size={16} /> Centre-wise GST Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Centre</th><th className="text-right">Taxable</th><th className="text-right">GST</th><th className="text-right">Total</th><th>Invoices</th></tr></thead>
              <tbody>
                {Array.from(centreMap.values()).map(g => (
                  <tr key={g.centre?.code || 'x'}>
                    <td><span className="badge bg-blue-50 text-blue-700">{g.centre?.code} — {g.centre?.name}</span></td>
                    <td className="text-sm text-right font-mono">{formatCurrency(g.taxable)}</td>
                    <td className="text-sm text-right font-mono">{formatCurrency(g.gst)}</td>
                    <td className="text-sm text-right font-semibold font-mono">{formatCurrency(g.total)}</td>
                    <td className="text-sm text-gray-600">{g.count}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#EEF2F9]">
                  <td className="font-semibold text-navy-600">Total</td>
                  <td className="text-right font-bold font-mono text-navy-600">{formatCurrency(totalTaxable)}</td>
                  <td className="text-right font-bold font-mono text-teal-600">{formatCurrency(totalGST)}</td>
                  <td className="text-right font-bold font-mono text-navy-600">{formatCurrency(totalValue)}</td>
                  <td className="font-semibold">{allInvoices.length}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* HSN-wise breakdown (when line-level data exists) */}
      {view === 'hsn' && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-navy-600 flex items-center gap-2"><Hash size={16} /> HSN-wise Tax Summary</h2>
            <p className="text-xs text-gray-500 mt-1">
              {hasLineItems
                ? 'Grouped by HSN code from invoice line items — for GSTR-2 reconciliation'
                : 'No line-level data available. Add invoice line items to enable HSN-wise breakdown.'}
            </p>
          </div>
          {hasLineItems ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>HSN Code</th>
                    <th className="text-right">Taxable Value</th>
                    <th className="text-right">CGST</th>
                    <th className="text-right">SGST</th>
                    <th className="text-right">IGST</th>
                    <th className="text-right">Total Tax</th>
                    <th className="text-right">Total Value</th>
                    <th>Items</th>
                  </tr>
                </thead>
                <tbody>
                  {hsnGroups.map(g => (
                    <tr key={g.hsn}>
                      <td><span className="font-mono text-sm font-medium text-gray-900">{g.hsn}</span></td>
                      <td className="text-sm text-right font-mono">{formatCurrency(g.taxable)}</td>
                      <td className="text-sm text-right font-mono">{g.cgst > 0 ? formatCurrency(g.cgst) : '—'}</td>
                      <td className="text-sm text-right font-mono">{g.sgst > 0 ? formatCurrency(g.sgst) : '—'}</td>
                      <td className="text-sm text-right font-mono">{g.igst > 0 ? formatCurrency(g.igst) : '—'}</td>
                      <td className="text-sm text-right font-mono font-semibold">{formatCurrency(g.cgst + g.sgst + g.igst)}</td>
                      <td className="text-sm text-right font-mono font-bold">{formatCurrency(g.total)}</td>
                      <td className="text-sm text-gray-600">{g.count}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#EEF2F9]">
                    <td className="font-semibold text-navy-600">Total</td>
                    <td className="text-right font-bold font-mono">{formatCurrency(hsnGroups.reduce((s, g) => s + g.taxable, 0))}</td>
                    <td className="text-right font-bold font-mono">{formatCurrency(hsnGroups.reduce((s, g) => s + g.cgst, 0))}</td>
                    <td className="text-right font-bold font-mono">{formatCurrency(hsnGroups.reduce((s, g) => s + g.sgst, 0))}</td>
                    <td className="text-right font-bold font-mono">{formatCurrency(hsnGroups.reduce((s, g) => s + g.igst, 0))}</td>
                    <td className="text-right font-bold font-mono text-teal-600">{formatCurrency(hsnGroups.reduce((s, g) => s + g.cgst + g.sgst + g.igst, 0))}</td>
                    <td className="text-right font-bold font-mono text-navy-600">{formatCurrency(hsnGroups.reduce((s, g) => s + g.total, 0))}</td>
                    <td className="font-semibold">{hsnGroups.reduce((s, g) => s + g.count, 0)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-state py-12">
              <Hash size={36} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">No HSN-wise data available</p>
              <p className="text-sm text-gray-400 mt-1">Add line items when creating invoices to enable HSN-wise tax summary</p>
            </div>
          )}
        </div>
      )}

      {/* Vendor-wise detail */}
      {view === 'vendor' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-navy-600 flex items-center gap-2"><FileText size={16} /> Vendor-wise GSTR-2 Data</h2>
            <p className="text-xs text-gray-500 mt-1">For ITC reconciliation — matches GSTR-2A/2B format</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>GSTIN</th><th>Vendor</th><th>Invoices</th><th className="text-right">Taxable</th><th className="text-right">CGST</th><th className="text-right">SGST</th><th className="text-right">IGST</th><th className="text-right">Total Tax</th><th className="text-right">Invoice Value</th></tr></thead>
              <tbody>
                {vendorGroups.map(g => {
                  const halfGST = g.gst / 2
                  const isInterState = g.vendor?.state && g.invoices[0]?.centre?.state && g.vendor.state !== g.invoices[0].centre.state

                  // Use line-item data if available for this vendor's invoices
                  let vendorCGST = 0, vendorSGST = 0, vendorIGST = 0
                  const vendorInvoiceIds = new Set(g.invoices.map((inv: any) => inv.id))
                  const vendorLineItems = invoiceItemsData.filter((item: any) => vendorInvoiceIds.has(item.invoice_id))

                  if (vendorLineItems.length > 0) {
                    vendorCGST = vendorLineItems.reduce((s: number, item: any) => s + (item.cgst_amount || 0), 0)
                    vendorSGST = vendorLineItems.reduce((s: number, item: any) => s + (item.sgst_amount || 0), 0)
                    vendorIGST = vendorLineItems.reduce((s: number, item: any) => s + (item.igst_amount || 0), 0)
                  } else {
                    // Fall back to invoice-level approximation
                    vendorCGST = isInterState ? 0 : halfGST
                    vendorSGST = isInterState ? 0 : halfGST
                    vendorIGST = isInterState ? g.gst : 0
                  }

                  return (
                    <tr key={g.vendor?.vendor_code || 'x'}>
                      <td><span className="font-mono text-xs text-gray-700">{g.vendor?.gstin || '—'}</span></td>
                      <td>
                        <div className="text-sm font-medium text-gray-900">{g.vendor?.legal_name}</div>
                        <div className="font-mono text-[10px] text-gray-400">{g.vendor?.vendor_code}</div>
                      </td>
                      <td className="text-sm text-gray-700">{g.invoices.length}</td>
                      <td className="text-sm text-right font-mono">{formatCurrency(g.taxable)}</td>
                      <td className="text-sm text-right font-mono">{vendorCGST > 0 ? formatCurrency(vendorCGST) : '—'}</td>
                      <td className="text-sm text-right font-mono">{vendorSGST > 0 ? formatCurrency(vendorSGST) : '—'}</td>
                      <td className="text-sm text-right font-mono">{vendorIGST > 0 ? formatCurrency(vendorIGST) : '—'}</td>
                      <td className="text-sm text-right font-mono font-semibold">{formatCurrency(g.gst)}</td>
                      <td className="text-sm text-right font-mono font-bold">{formatCurrency(g.total)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#EEF2F9]">
                  <td colSpan={3} className="font-semibold text-navy-600">Grand Total</td>
                  <td className="text-right font-bold font-mono">{formatCurrency(totalTaxable)}</td>
                  <td className="text-right font-bold font-mono">{formatCurrency(hasLineItems ? invoiceItemsData.reduce((s: number, i: any) => s + (i.cgst_amount || 0), 0) : totalGST / 2)}</td>
                  <td className="text-right font-bold font-mono">{formatCurrency(hasLineItems ? invoiceItemsData.reduce((s: number, i: any) => s + (i.sgst_amount || 0), 0) : totalGST / 2)}</td>
                  <td className="text-right font-bold font-mono">{formatCurrency(hasLineItems ? invoiceItemsData.reduce((s: number, i: any) => s + (i.igst_amount || 0), 0) : 0)}</td>
                  <td className="text-right font-bold font-mono text-teal-600">{formatCurrency(totalGST)}</td>
                  <td className="text-right font-bold font-mono text-navy-600">{formatCurrency(totalValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
