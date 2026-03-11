import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowLeft, Package, AlertTriangle, Thermometer, Pill, ShieldAlert,
  Building2, Beaker, Factory, Layers, Tag, FlaskConical
} from 'lucide-react'

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from('items')
    .select('*, category:item_categories(name, code)')
    .eq('id', id)
    .single()

  if (!item || error) redirect('/items')

  // Fetch stock levels, vendor mappings, batch stock in parallel
  const [{ data: stockLevels }, { data: vendorItems }, { data: batchStocks }] = await Promise.all([
    supabase
      .from('item_centre_stock')
      .select('*, centre:centres(code, name)')
      .eq('item_id', id)
      .order('centre_id'),
    supabase
      .from('vendor_items')
      .select('*, vendor:vendors(vendor_code, legal_name, status)')
      .eq('item_id', id)
      .order('l_rank', { ascending: true }),
    supabase
      .from('batch_stock')
      .select('*, centre:centres(code, name)')
      .eq('item_id', id)
      .eq('is_active', true)
      .gt('qty_available', 0)
      .order('expiry_date', { ascending: true }),
  ])

  const totalStock = stockLevels?.reduce((s, sl: any) => s + (sl.current_stock || 0), 0) ?? 0
  const lowStockCentres = stockLevels?.filter((sl: any) => sl.current_stock <= sl.reorder_level).length ?? 0

  // Collect active flags for display
  const flags: { label: string; color: string; icon?: React.ReactNode }[] = []
  if (item.is_cold_chain || item.is_refrigerated) flags.push({ label: 'Cold Chain', color: 'bg-cyan-100 text-cyan-800', icon: <Thermometer size={12} /> })
  if (item.is_narcotic) flags.push({ label: 'Narcotic', color: 'bg-purple-100 text-purple-800', icon: <Pill size={12} /> })
  if (item.is_high_alert) flags.push({ label: 'High Alert', color: 'bg-red-100 text-red-800', icon: <ShieldAlert size={12} /> })
  if (item.is_high_risk) flags.push({ label: 'High Risk', color: 'bg-red-100 text-red-700' })
  if (item.is_dpco) flags.push({ label: 'DPCO', color: 'bg-orange-100 text-orange-800' })
  if (item.scheduled_drug) flags.push({ label: `Schedule ${item.scheduled_drug_category || 'H'}`, color: 'bg-purple-100 text-purple-700' })
  if (item.is_look_alike) flags.push({ label: 'Look-A-Like', color: 'bg-yellow-100 text-yellow-800' })
  if (item.is_sound_alike) flags.push({ label: 'Sound-A-Like', color: 'bg-yellow-100 text-yellow-800' })
  if (item.is_consignment) flags.push({ label: 'Consignment', color: 'bg-blue-100 text-blue-700' })
  if (item.is_capital_goods) flags.push({ label: 'Capital Goods', color: 'bg-gray-100 text-gray-700' })
  if (item.is_emergency_drug) flags.push({ label: 'Emergency', color: 'bg-red-100 text-red-700' })
  if (item.is_hazardous) flags.push({ label: 'Hazardous', color: 'bg-orange-100 text-orange-800' })
  if (item.is_imported) flags.push({ label: 'Imported', color: 'bg-indigo-100 text-indigo-700' })
  if (item.is_immunization) flags.push({ label: 'Immunization', color: 'bg-teal-100 text-teal-700' })
  if (item.is_cssd_item) flags.push({ label: 'CSSD', color: 'bg-gray-100 text-gray-700' })

  // Helper for detail rows
  const DetailRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => {
    if (!value && value !== 0) return null
    return (
      <div className="flex justify-between py-1.5">
        <span className="text-gray-500 text-sm">{label}</span>
        <span className="text-sm font-medium text-gray-900">{value}</span>
      </div>
    )
  }

  return (
    <div>
      <Link href="/items" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Items
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-gray-500">{item.item_code}</span>
              <span className={cn('badge', item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                {item.is_active ? 'Active' : 'Inactive'}
              </span>
              {item.department && <span className="badge bg-blue-50 text-blue-700">{item.department}</span>}
              {item.item_type && <span className="badge bg-gray-100 text-gray-600">{item.item_type}</span>}
            </div>
            <h1 className="text-2xl font-bold text-[#1B3A6B]">{item.generic_name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
              {item.brand_name && <span>Brand: <strong>{item.brand_name}</strong></span>}
              {item.manufacturer && <><span className="text-gray-300">|</span><span>Mfg: <strong>{item.manufacturer}</strong></span></>}
              {item.strength && <><span className="text-gray-300">|</span><span>{item.strength}</span></>}
              {item.dosage_form && <><span className="text-gray-300">|</span><span>{item.dosage_form}</span></>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {item.category && <span className="badge bg-blue-50 text-blue-700">{item.category.name}</span>}
              <span className="badge bg-gray-100 text-gray-700">Unit: {item.unit}</span>
              <span className="badge bg-gray-100 text-gray-700">GST: {item.gst_percent}%</span>
              {item.hsn_code && <span className="badge bg-gray-100 text-gray-600">HSN: {item.hsn_code}</span>}
              {item.item_nature_abc && <span className="badge bg-[#EEF2F9] text-[#1B3A6B]">ABC: {item.item_nature_abc}</span>}
              {item.item_nature_ved && <span className="badge bg-[#E6F5F6] text-[#0D7E8A]">VED: {item.item_nature_ved}</span>}
              {item.item_nature_fsn && <span className="badge bg-gray-100 text-gray-700">FSN: {item.item_nature_fsn}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/items/new`} className="btn-secondary">Edit Item</Link>
            <Link href={`/purchase-orders/new`} className="btn-primary">
              <Package size={15} /> Create PO
            </Link>
          </div>
        </div>

        {/* Flags */}
        {flags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {flags.map((f, i) => (
              <span key={i} className={cn('badge flex items-center gap-1', f.color)}>
                {f.icon} {f.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Stock</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{totalStock} {item.issue_unit || item.unit}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Centres Stocking</div>
          <div className="text-xl font-bold text-[#0D7E8A]">{stockLevels?.length ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Low Stock</div>
          <div className={cn('text-xl font-bold', lowStockCentres > 0 ? 'text-red-600' : 'text-green-600')}>
            {lowStockCentres}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Vendors</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{vendorItems?.length ?? 0}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Batches</div>
          <div className="text-xl font-bold text-[#0D7E8A]">{batchStocks?.length ?? 0}</div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Item Details */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold text-[#1B3A6B] mb-3 flex items-center gap-2">
              <Tag size={16} /> Identification
            </h2>
            <div className="divide-y divide-gray-50">
              <DetailRow label="Item Code" value={item.item_code} />
              <DetailRow label="Generic Name" value={item.generic_name} />
              <DetailRow label="Brand" value={item.brand_name} />
              <DetailRow label="Category" value={item.category?.name} />
              <DetailRow label="Department" value={item.department} />
              <DetailRow label="Item Type" value={item.item_type} />
              <DetailRow label="SNOMED CT" value={item.snomed_ct_code} />
              <DetailRow label="Major Group" value={item.major_group} />
              <DetailRow label="Minor Group" value={item.minor_group} />
              <DetailRow label="Created" value={formatDate(item.created_at)} />
            </div>
          </div>

          {/* Drug Details */}
          {(item.manufacturer || item.dosage_form || item.strength) && (
            <div className="card p-5">
              <h2 className="font-semibold text-[#1B3A6B] mb-3 flex items-center gap-2">
                <FlaskConical size={16} /> Drug Details
              </h2>
              <div className="divide-y divide-gray-50">
                <DetailRow label="Manufacturer" value={item.manufacturer} />
                <DetailRow label="Marketed By" value={item.marketed_by} />
                <DetailRow label="Strength" value={item.strength} />
                <DetailRow label="Dosage Form" value={item.dosage_form} />
                <DetailRow label="R.O.A." value={item.route_of_administration} />
                <DetailRow label="Therapeutic Class" value={item.therapeutic_class} />
                <DetailRow label="Specification" value={item.specification} />
                <DetailRow label="Combination" value={item.combination_of_drugs} />
                <DetailRow label="Shelf Life" value={item.shelf_life_days ? `${item.shelf_life_days} days` : null} />
              </div>
            </div>
          )}

          {/* Unit Hierarchy */}
          <div className="card p-5">
            <h2 className="font-semibold text-[#1B3A6B] mb-3 flex items-center gap-2">
              <Layers size={16} /> Unit Hierarchy
            </h2>
            <div className="divide-y divide-gray-50">
              <DetailRow label="Unit Levels" value={item.unit_levels} />
              <DetailRow label="Level 1" value={item.level1_unit || item.unit} />
              {item.level2_unit && <DetailRow label="Level 2" value={`${item.level2_unit} (${item.level2_qty_per_unit} per L1)`} />}
              {item.level3_unit && <DetailRow label="Level 3" value={`${item.level3_unit} (${item.level3_qty_per_unit} per L2)`} />}
              <DetailRow label="Purchase Unit" value={item.purchase_unit} />
              <DetailRow label="Receipt Unit" value={item.receipt_unit} />
              <DetailRow label="Issue Unit" value={item.issue_unit} />
              <DetailRow label="Conversion Factor" value={item.qty_conversion !== 1 ? item.qty_conversion : null} />
            </div>
          </div>

          {/* Pricing */}
          <div className="card p-5">
            <h2 className="font-semibold text-[#1B3A6B] mb-3 flex items-center gap-2">
              <Factory size={16} /> Pricing & Tax
            </h2>
            <div className="divide-y divide-gray-50">
              <DetailRow label="Default Rate" value={item.default_rate ? formatCurrency(item.default_rate) : null} />
              <DetailRow label="MRP" value={item.mrp ? formatCurrency(item.mrp) : null} />
              <DetailRow label="HSN Code" value={item.hsn_code} />
              <DetailRow label="GST Slab" value={`${item.gst_percent}%`} />
              <DetailRow label="CGST" value={item.cgst_percent ? `${item.cgst_percent}%` : null} />
              <DetailRow label="SGST" value={item.sgst_percent ? `${item.sgst_percent}%` : null} />
              <DetailRow label="GRN Disc%" value={item.grn_disc_percent || null} />
              <DetailRow label="Margin%" value={item.margin_percent} />
            </div>
          </div>

          {/* Integration */}
          {(item.ecw_item_code || item.tally_item_name) && (
            <div className="card p-5">
              <h2 className="font-semibold text-[#1B3A6B] mb-3 flex items-center gap-2">
                <Beaker size={16} /> Integration
              </h2>
              <div className="divide-y divide-gray-50">
                <DetailRow label="eCW Code" value={item.ecw_item_code} />
                <DetailRow label="Tally Name" value={item.tally_item_name} />
              </div>
            </div>
          )}
        </div>

        {/* Column 2: Vendor Rankings */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-[#1B3A6B]">Approved Vendors (L-Rank)</h2>
            </div>
            {vendorItems && vendorItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr><th>Rank</th><th>Vendor</th><th>Last Rate</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {vendorItems.map((vi: any) => (
                      <tr key={vi.id}>
                        <td>
                          <span className={cn('badge',
                            vi.l_rank === 1 ? 'bg-green-100 text-green-800' :
                            vi.l_rank === 2 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-700'
                          )}>
                            L{vi.l_rank}
                          </span>
                        </td>
                        <td>
                          <Link href={`/vendors/${vi.vendor?.id || vi.vendor_id}`} className="text-[#0D7E8A] hover:underline font-medium text-sm">
                            {vi.vendor?.legal_name}
                          </Link>
                          <div className="font-mono text-xs text-gray-400">{vi.vendor?.vendor_code}</div>
                        </td>
                        <td className="text-sm font-medium">{vi.last_quoted_rate ? formatCurrency(vi.last_quoted_rate) : '—'}</td>
                        <td>
                          <span className={cn('badge',
                            vi.vendor?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {vi.vendor?.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">No vendor mappings yet</div>
            )}
          </div>
        </div>

        {/* Column 3: Stock by Centre */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Building2 size={16} className="text-[#0D7E8A]" />
              <h2 className="font-semibold text-[#1B3A6B]">Stock by Centre</h2>
            </div>
            {stockLevels && stockLevels.length > 0 ? (
              <div className="divide-y">
                {stockLevels.map((sl: any) => {
                  const isOut = sl.current_stock <= 0
                  const isLow = sl.current_stock > 0 && sl.current_stock <= sl.reorder_level
                  return (
                    <div key={sl.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{sl.centre?.code} — {sl.centre?.name}</div>
                        <div className="text-xs text-gray-500">
                          Reorder: {sl.reorder_level} | Max: {sl.max_level}
                          {sl.last_grn_date && <> | Last GRN: {formatDate(sl.last_grn_date)}</>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn('text-sm font-bold', isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900')}>
                          {sl.current_stock} {item.issue_unit || item.unit}
                        </div>
                        <span className={cn('badge text-[10px]',
                          isOut ? 'bg-red-100 text-red-800' :
                          isLow ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        )}>
                          {isOut ? 'OUT OF STOCK' : isLow ? 'LOW' : 'OK'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                <AlertTriangle size={20} className="mx-auto mb-2 text-gray-300" />
                No stock records yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Batch Stock — full width */}
      {batchStocks && batchStocks.length > 0 && (
        <div className="card overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package size={16} className="text-[#0D7E8A]" />
            <h2 className="font-semibold text-[#1B3A6B]">Batch-wise Stock (FIFO)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Centre</th>
                  <th>Batch No</th>
                  <th>Expiry</th>
                  <th>MRP</th>
                  <th>Purchase Rate</th>
                  <th>Qty Available</th>
                  <th>Manufacturer</th>
                  <th>GRN Date</th>
                </tr>
              </thead>
              <tbody>
                {batchStocks.map((bs: any) => {
                  const isExpired = bs.expiry_date && new Date(bs.expiry_date) < new Date()
                  const isExpiringSoon = bs.expiry_date && !isExpired &&
                    new Date(bs.expiry_date) < new Date(Date.now() + 90 * 86400000)
                  return (
                    <tr key={bs.id}>
                      <td><span className="badge bg-blue-50 text-blue-700">{bs.centre?.code}</span></td>
                      <td className="font-mono text-sm">{bs.batch_no}</td>
                      <td>
                        <span className={cn('text-sm',
                          isExpired ? 'text-red-600 font-bold' :
                          isExpiringSoon ? 'text-yellow-600 font-medium' : 'text-gray-600'
                        )}>
                          {bs.expiry_date ? formatDate(bs.expiry_date) : '—'}
                        </span>
                        {isExpired && <span className="badge bg-red-100 text-red-700 ml-1 text-[10px]">EXPIRED</span>}
                      </td>
                      <td className="text-sm">{bs.mrp ? formatCurrency(bs.mrp) : '—'}</td>
                      <td className="text-sm">{bs.purchase_rate ? formatCurrency(bs.purchase_rate) : '—'}</td>
                      <td className="text-sm font-bold">{bs.qty_available}</td>
                      <td className="text-sm text-gray-600">{bs.manufacturer || '—'}</td>
                      <td className="text-sm text-gray-600">{bs.grn_date ? formatDate(bs.grn_date) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
