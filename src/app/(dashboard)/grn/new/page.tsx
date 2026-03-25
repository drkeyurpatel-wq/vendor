'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, AlertTriangle, WifiOff, CloudOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { generateGRNNumber, formatCurrency } from '@/lib/utils'
import BarcodeScanButton from '@/components/ui/BarcodeScanButton'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { queueOfflineRequest } from '@/lib/service-worker'
import { notifyAll } from '@/lib/notify'

interface GRNLineItem {
  po_item_id: string
  item_id: string
  item_code: string
  generic_name: string
  unit: string
  hsn_code: string
  ordered_qty: number
  already_received: number
  po_rate: number
  po_gst_percent: number
  po_purchase_unit: string
  po_conversion_factor: number
  received_qty: number
  accepted_qty: number
  rejected_qty: number
  short_qty: number
  excess_qty: number
  damaged_qty: number
  free_qty: number
  rejection_reason: string
  damage_reason: string
  batch_no: string
  expiry_date: string
  mrp: string
  manufacturer: string
  storage_location: string
  rate: number
  net_rate: number
  trade_discount_percent: number
  gst_percent: number
  cgst_percent: number
  sgst_percent: number
  igst_percent: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  total_amount: number
  qc_status: string
  qc_remarks: string
}

export default function NewGRNPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { isOnline, pendingCount } = useOnlineStatus()

  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [eligiblePOs, setEligiblePOs] = useState<any[]>([])
  const [selectedPO, setSelectedPO] = useState<any>(null)
  const [lineItems, setLineItems] = useState<GRNLineItem[]>([])
  const [grnDate, setGrnDate] = useState(new Date().toISOString().split('T')[0])
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState('')
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState('')
  const [vendorInvoiceAmount, setVendorInvoiceAmount] = useState('')
  const [notes, setNotes] = useState('')

  const [highlightedItemIdx, setHighlightedItemIdx] = useState<number | null>(null)

  // Transport details
  const [dcNumber, setDcNumber] = useState('')
  const [dcDate, setDcDate] = useState('')
  const [lrNumber, setLrNumber] = useState('')
  const [transportName, setTransportName] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [ewayBillNo, setEwayBillNo] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('user_profiles')
        .select('*, centre:centres(*)')
        .eq('id', user.id)
        .single()
      if (prof) setProfile(prof)

    // Get eligible POs
      try {
        let poQuery = supabase
          .from('purchase_orders')
          .select('id, po_number, vendor_id, centre_id, vendor:vendors(legal_name, state), centre:centres(code, name, state), total_amount, status')
          .in('status', ['approved', 'sent_to_vendor', 'partially_received', 'pending_approval'])
          .is('deleted_at', null)
          .order('po_date', { ascending: false })
          .limit(50)

        if (prof && prof.centre_id && !['group_admin', 'group_cao'].includes(prof.role)) {
          poQuery = poQuery.eq('centre_id', prof.centre_id)
        }

        const { data: pos, error: poError } = await poQuery
        if (poError) console.error('PO load error:', poError)
        if (pos) setEligiblePOs(pos)
      // Pre-select PO from URL
        const poId = searchParams.get('po')
        if (poId && pos) {
          const found = pos.find((p: any) => p.id === poId)
          if (found) loadPOItems(found)
        }
      } catch (err) {
        console.error('PO load failed:', err)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Determine supply type from PO or vendor/centre states
  function getSupplyType(po: any): 'intra_state' | 'inter_state' {
    if (po.supply_type) return po.supply_type
    const vendorState = po.vendor?.state
    const centreState = po.centre?.state
    if (vendorState && centreState && vendorState !== centreState) return 'inter_state'
    return 'intra_state'
  }

  async function loadPOItems(po: any) {
    setSelectedPO(po)
    const { data: poItems } = await supabase
      .from('purchase_order_items')
      .select('*, item:items(item_code, generic_name, unit, hsn_code, manufacturer, storage_location)')
      .eq('po_id', po.id)

    if (poItems) {
      const supplyType = getSupplyType(po)
      setLineItems(poItems.map((pi: any) => {
        const pendingQty = pi.ordered_qty - (pi.received_qty || 0)
        const rate = pi.rate || 0
        const gstPct = pi.gst_percent || 0
        const discPct = pi.trade_discount_percent || 0
        const discountedRate = rate * (1 - discPct / 100)
        const taxableAmount = pendingQty * discountedRate
        const cgstPct = supplyType === 'intra_state' ? gstPct / 2 : 0
        const sgstPct = supplyType === 'intra_state' ? gstPct / 2 : 0
        const igstPct = supplyType === 'inter_state' ? gstPct : 0
        const cgstAmt = taxableAmount * cgstPct / 100
        const sgstAmt = taxableAmount * sgstPct / 100
        const igstAmt = taxableAmount * igstPct / 100
        const totalAmt = taxableAmount + cgstAmt + sgstAmt + igstAmt

        return {
          po_item_id: pi.id,
          item_id: pi.item_id,
          item_code: pi.item?.item_code || '',
          generic_name: pi.item?.generic_name || '',
          unit: pi.unit || pi.item?.unit || '',
          hsn_code: pi.hsn_code || pi.item?.hsn_code || '',
          ordered_qty: pi.ordered_qty,
          already_received: pi.received_qty || 0,
          po_rate: rate,
          po_gst_percent: gstPct,
          po_purchase_unit: pi.purchase_unit || pi.unit || '',
          po_conversion_factor: pi.conversion_factor || 1,
          received_qty: pendingQty,
          accepted_qty: pendingQty,
          rejected_qty: 0,
          short_qty: 0,
          excess_qty: 0,
          damaged_qty: 0,
          free_qty: 0,
          rejection_reason: '',
          damage_reason: '',
          batch_no: '',
          expiry_date: '',
          mrp: pi.mrp ? String(pi.mrp) : '',
          manufacturer: pi.manufacturer || pi.item?.manufacturer || '',
          storage_location: pi.item?.storage_location || '',
          rate: rate,
          net_rate: discountedRate,
          trade_discount_percent: discPct,
          gst_percent: gstPct,
          cgst_percent: cgstPct,
          sgst_percent: sgstPct,
          igst_percent: igstPct,
          cgst_amount: Math.round(cgstAmt * 100) / 100,
          sgst_amount: Math.round(sgstAmt * 100) / 100,
          igst_amount: Math.round(igstAmt * 100) / 100,
          total_amount: Math.round(totalAmt * 100) / 100,
          qc_status: 'pending',
          qc_remarks: '',
        }
      }))
    }
  }

  function recalcTax(line: GRNLineItem): GRNLineItem {
    const discountedRate = line.rate * (1 - line.trade_discount_percent / 100)
    const taxableAmount = line.accepted_qty * discountedRate
    const supplyType = selectedPO ? getSupplyType(selectedPO) : 'intra_state'

    const cgstPct = supplyType === 'intra_state' ? line.gst_percent / 2 : 0
    const sgstPct = supplyType === 'intra_state' ? line.gst_percent / 2 : 0
    const igstPct = supplyType === 'inter_state' ? line.gst_percent : 0

    const cgstAmt = taxableAmount * cgstPct / 100
    const sgstAmt = taxableAmount * sgstPct / 100
    const igstAmt = taxableAmount * igstPct / 100

    return {
      ...line,
      net_rate: discountedRate,
      cgst_percent: cgstPct,
      sgst_percent: sgstPct,
      igst_percent: igstPct,
      cgst_amount: Math.round(cgstAmt * 100) / 100,
      sgst_amount: Math.round(sgstAmt * 100) / 100,
      igst_amount: Math.round(igstAmt * 100) / 100,
      total_amount: Math.round((taxableAmount + cgstAmt + sgstAmt + igstAmt) * 100) / 100,
    }
  }

  function updateLine(idx: number, field: string, value: any) {
    const updated = [...lineItems]
    let line = { ...updated[idx], [field]: value }

    if (field === 'received_qty') {
      const maxReceivable = line.ordered_qty - line.already_received
      const recv = Math.max(0, Number(value) || 0)
      line.received_qty = recv

      if (recv < maxReceivable) {
        line.short_qty = maxReceivable - recv
        line.excess_qty = 0
      } else if (recv > maxReceivable) {
        line.excess_qty = recv - maxReceivable
        line.short_qty = 0
      } else {
        line.short_qty = 0
        line.excess_qty = 0
      }

      // Recalc accepted = received - rejected - damaged
      line.accepted_qty = Math.max(0, line.received_qty - line.rejected_qty - line.damaged_qty)
    }

    if (field === 'rejected_qty') {
      line.rejected_qty = Math.min(Math.max(0, Number(value) || 0), line.received_qty)
      line.accepted_qty = Math.max(0, line.received_qty - line.rejected_qty - line.damaged_qty)
    }

    if (field === 'damaged_qty') {
      line.damaged_qty = Math.min(Math.max(0, Number(value) || 0), line.received_qty - line.rejected_qty)
      line.accepted_qty = Math.max(0, line.received_qty - line.rejected_qty - line.damaged_qty)
    }

    // Recalc tax on qty/rate/discount changes
    if (['received_qty', 'rejected_qty', 'damaged_qty', 'rate', 'trade_discount_percent', 'gst_percent'].includes(field)) {
      line = recalcTax(line)
    }

    updated[idx] = line
    setLineItems(updated)
  }

  // Summary totals
  const totalCGST = lineItems.reduce((s, li) => s + li.cgst_amount, 0)
  const totalSGST = lineItems.reduce((s, li) => s + li.sgst_amount, 0)
  const totalIGST = lineItems.reduce((s, li) => s + li.igst_amount, 0)
  const grandTotal = lineItems.reduce((s, li) => s + li.total_amount, 0)
  const hasShortOrExcess = lineItems.some(li => li.short_qty > 0 || li.excess_qty > 0)
  const hasRejections = lineItems.some(li => li.rejected_qty > 0)
  const hasDamaged = lineItems.some(li => li.damaged_qty > 0)

  function handleBarcodeScan(code: string) {
    const idx = lineItems.findIndex(li => li.item_code.toLowerCase() === code.toLowerCase())
    if (idx >= 0) {
      setHighlightedItemIdx(idx)
      toast.success(`Found: ${lineItems[idx].generic_name} (${lineItems[idx].item_code})`)
      // Clear highlight after 4 seconds
      setTimeout(() => setHighlightedItemIdx(null), 4000)
      // Scroll to the row
      const row = document.getElementById(`grn-line-${idx}`)
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      toast.error(`Item not found for barcode: ${code}`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPO) { toast.error('Select a purchase order'); return }
    if (lineItems.every(li => li.received_qty === 0)) { toast.error('At least one item must have received qty > 0'); return }

    // Validate rejection reasons
    const missingRejectReason = lineItems.find(li => li.rejected_qty > 0 && !li.rejection_reason.trim())
    if (missingRejectReason) {
      toast.error(`Provide rejection reason for ${missingRejectReason.generic_name}`)
      return
    }
    const missingDamageReason = lineItems.find(li => li.damaged_qty > 0 && !li.damage_reason.trim())
    if (missingDamageReason) {
      toast.error(`Provide damage reason for ${missingDamageReason.generic_name}`)
      return
    }

    setLoading(true)

    // ── Offline mode: queue for later sync ──
    if (!isOnline) {
      const centreCode = selectedPO.centre?.code || 'XXX'
      const offlineGRNNumber = generateGRNNumber(centreCode, Date.now() % 10000)
      const centreId = selectedPO.centre_id || profile?.centre_id

      const grnPayload = {
        grn_number: offlineGRNNumber,
        centre_id: centreId,
        po_id: selectedPO.id,
        vendor_id: selectedPO.vendor_id,
        grn_date: grnDate,
        vendor_invoice_no: vendorInvoiceNo.trim() || null,
        vendor_invoice_date: vendorInvoiceDate || null,
        vendor_invoice_amount: vendorInvoiceAmount ? parseFloat(vendorInvoiceAmount) : null,
        dc_number: dcNumber.trim() || null,
        dc_date: dcDate || null,
        lr_number: lrNumber.trim() || null,
        transport_name: transportName.trim() || null,
        vehicle_number: vehicleNumber.trim() || null,
        eway_bill_no: ewayBillNo.trim() || null,
        notes: notes.trim() || null,
        line_items: lineItems.filter(li => li.received_qty > 0).map(li => ({
          po_item_id: li.po_item_id,
          item_id: li.item_id,
          ordered_qty: li.ordered_qty,
          received_qty: li.received_qty,
          accepted_qty: li.accepted_qty,
          rejected_qty: li.rejected_qty,
          short_qty: li.short_qty,
          excess_qty: li.excess_qty,
          damaged_qty: li.damaged_qty,
          free_qty: li.free_qty,
          rejection_reason: li.rejection_reason.trim() || null,
          damage_reason: li.damage_reason.trim() || null,
          batch_no: li.batch_no.trim() || null,
          expiry_date: li.expiry_date || null,
          mrp: li.mrp ? parseFloat(li.mrp) : null,
          manufacturer: li.manufacturer.trim() || null,
          storage_location: li.storage_location.trim() || null,
          rate: li.rate,
          net_rate: li.net_rate,
          trade_discount_percent: li.trade_discount_percent,
          gst_percent: li.gst_percent,
          cgst_percent: li.cgst_percent,
          sgst_percent: li.sgst_percent,
          igst_percent: li.igst_percent,
          cgst_amount: li.cgst_amount,
          sgst_amount: li.sgst_amount,
          igst_amount: li.igst_amount,
          total_amount: li.total_amount,
          hsn_code: li.hsn_code || null,
          qc_status: li.qc_status || 'pending',
          qc_remarks: li.qc_remarks.trim() || null,
        })),
        total_amount: Math.round(grandTotal * 100) / 100,
      }

      try {
        await queueOfflineRequest(
          '/api/grn/submit',
          'POST',
          JSON.stringify(grnPayload),
          { 'Content-Type': 'application/json' },
          { type: 'grn', grn_number: offlineGRNNumber, po_number: selectedPO.po_number }
        )
        toast.success(`GRN saved offline (${offlineGRNNumber}). Will submit when connected.`, { duration: 5000 })
        router.push('/grn')
      } catch (err) {
        toast.error('Failed to save GRN offline. Please try again.')
      }
      setLoading(false)
      return
    }

    const centreCode = selectedPO.centre?.code || 'XXX'

    // Use atomic DB sequence for race-safe numbering
    let grnNumber: string
    try {
      const seqRes = await fetch(`/api/sequence?type=grn&centre_code=${centreCode}`)
      const seqData = await seqRes.json()
      if (!seqRes.ok || !seqData.number) throw new Error(seqData.error || 'Sequence failed')
      grnNumber = seqData.number
    } catch {
      const { count } = await supabase.from('grns').select('*', { count: 'exact', head: true })
      grnNumber = generateGRNNumber(centreCode, (count ?? 0) + 1)
    }

    // Determine if any discrepancies
    const hasDiscrepancy = lineItems.some(li => li.rejected_qty > 0 || li.damaged_qty > 0 || li.short_qty > 0)

    const centreId = selectedPO.centre_id || profile?.centre_id

    try {
      const { data: grn, error } = await supabase.from('grns').insert({
        grn_number: grnNumber,
        centre_id: centreId,
        po_id: selectedPO.id,
        vendor_id: selectedPO.vendor_id,
        grn_date: grnDate,
        vendor_invoice_no: vendorInvoiceNo.trim() || null,
        vendor_invoice_date: vendorInvoiceDate || null,
        vendor_invoice_amount: vendorInvoiceAmount ? parseFloat(vendorInvoiceAmount) : null,
        dc_number: dcNumber.trim() || null,
        dc_date: dcDate || null,
        lr_number: lrNumber.trim() || null,
        transport_name: transportName.trim() || null,
        vehicle_number: vehicleNumber.trim() || null,
        eway_bill_no: ewayBillNo.trim() || null,
        status: hasDiscrepancy ? 'discrepancy' : 'submitted',
        quality_status: 'pending',
        cgst_amount: Math.round(totalCGST * 100) / 100,
        sgst_amount: Math.round(totalSGST * 100) / 100,
        igst_amount: Math.round(totalIGST * 100) / 100,
        total_amount: Math.round(grandTotal * 100) / 100,
        discount_amount: 0,
        net_amount: Math.round(grandTotal * 100) / 100,
        notes: notes.trim() || null,
        received_by: profile?.id || null,
      }).select().single()

      if (error) { toast.error(`GRN save failed: ${error.message}`); setLoading(false); return }
      if (!grn) { toast.error('GRN created but no data returned'); setLoading(false); return }

    // Insert GRN items
    const grnItems = lineItems
      .filter(li => li.received_qty > 0)
      .map(li => ({
        grn_id: grn.id,
        po_item_id: li.po_item_id,
        item_id: li.item_id,
        ordered_qty: li.ordered_qty,
        received_qty: li.received_qty,
        accepted_qty: li.accepted_qty,
        rejected_qty: li.rejected_qty,
        short_qty: li.short_qty,
        excess_qty: li.excess_qty,
        damaged_qty: li.damaged_qty,
        free_qty: li.free_qty,
        rejection_reason: li.rejection_reason.trim() || null,
        damage_reason: li.damage_reason.trim() || null,
        receipt_unit: li.po_purchase_unit || li.unit,
        conversion_factor: li.po_conversion_factor,
        batch_no: li.batch_no.trim() || null,
        expiry_date: li.expiry_date || null,
        mrp: li.mrp ? parseFloat(li.mrp) : null,
        manufacturer: li.manufacturer.trim() || null,
        storage_location: li.storage_location.trim() || null,
        rate: li.rate,
        net_rate: li.net_rate,
        trade_discount_percent: li.trade_discount_percent,
        trade_discount_amount: Math.round(li.accepted_qty * li.rate * li.trade_discount_percent / 100 * 100) / 100,
        gst_percent: li.gst_percent,
        cgst_percent: li.cgst_percent,
        sgst_percent: li.sgst_percent,
        igst_percent: li.igst_percent,
        cgst_amount: li.cgst_amount,
        sgst_amount: li.sgst_amount,
        igst_amount: li.igst_amount,
        total_amount: li.total_amount,
        hsn_code: li.hsn_code || null,
        qc_status: li.qc_status || 'pending',
        qc_remarks: li.qc_remarks.trim() || null,
      }))

    const { error: itemError } = await supabase.from('grn_items').insert(grnItems)
    if (itemError) { toast.error(`GRN items failed: ${itemError.message}`); setLoading(false); return }

    // Update PO item received quantities
    for (const li of lineItems) {
      if (li.accepted_qty > 0) {
        const newReceived = li.already_received + li.accepted_qty
        await supabase.from('purchase_order_items')
          .update({ received_qty: newReceived })
          .eq('id', li.po_item_id)
      }
    }

    // Update stock via DB function (atomic, writes stock_ledger too)
    const { data: { user: authUser } } = await supabase.auth.getUser()

    // Try v2 first, then v1, then manual fallback
    let stockUpdated = false
    const { error: stockErrorV2 } = await supabase.rpc('update_stock_from_grn_v2', {
      p_grn_id: grn.id,
      p_user_id: authUser?.id,
    })
    if (!stockErrorV2) {
      stockUpdated = true
    } else {
      const { error: stockErrorV1 } = await supabase.rpc('update_stock_from_grn', {
        p_grn_id: grn.id,
        p_user_id: authUser?.id,
      })
      if (!stockErrorV1) {
        stockUpdated = true
      }
    }

    if (!stockUpdated) {
      console.error('Stock RPC unavailable, using manual fallback')
      // Fallback: manual stock updates
      for (const li of lineItems) {
        if (li.accepted_qty > 0) {
          const { data: existing } = await supabase
            .from('item_centre_stock')
            .select('id, current_stock')
            .eq('item_id', li.item_id)
            .eq('centre_id', centreId)
            .single()

          if (existing) {
            await supabase.from('item_centre_stock')
              .update({
                current_stock: existing.current_stock + li.accepted_qty,
                last_grn_date: grnDate,
                last_grn_rate: li.rate,
              })
              .eq('id', existing.id)
          } else {
            await supabase.from('item_centre_stock').insert({
              item_id: li.item_id,
              centre_id: centreId,
              current_stock: li.accepted_qty,
              reorder_level: 0,
              max_level: 0,
              safety_stock: 0,
              last_grn_date: grnDate,
              last_grn_rate: li.rate,
            })
          }

          await supabase.from('stock_ledger').insert({
            item_id: li.item_id,
            centre_id: centreId,
            transaction_type: 'grn',
            quantity: li.accepted_qty,
            balance_after: (existing?.current_stock || 0) + li.accepted_qty,
            reference_id: grn.id,
            reference_number: grnNumber,
            notes: li.batch_no.trim() ? `Batch: ${li.batch_no.trim()}` : null,
            created_by: authUser?.id,
          })
        }
      }
    }

    // Update PO status
    const { data: allPOItems } = await supabase
      .from('purchase_order_items')
      .select('ordered_qty, received_qty')
      .eq('po_id', selectedPO.id)

    if (allPOItems) {
      const allFullyReceived = allPOItems.every((i: any) => i.received_qty >= i.ordered_qty)
      const anyReceived = allPOItems.some((i: any) => i.received_qty > 0)
      const newPOStatus = allFullyReceived ? 'fully_received' : anyReceived ? 'partially_received' : selectedPO.status
      await supabase.from('purchase_orders').update({ status: newPOStatus }).eq('id', selectedPO.id)
    }

    toast.success(`GRN ${grnNumber} created successfully`)

    // Auto-create follow-up indent for short deliveries
    const shortItems = lineItems.filter(li => li.short_qty > 0)
    if (shortItems.length > 0) {
      try {
        const { count: indentCount } = await supabase.from('purchase_indents').select('*', { count: 'exact', head: true })
        const indentNum = `H1-SH-${new Date().getFullYear().toString().slice(2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String((indentCount ?? 0) + 1).padStart(3, '0')}`
        const { data: indent } = await supabase.from('purchase_indents').insert({
          indent_number: indentNum, centre_id: centreId,
          status: 'approved', priority: 'urgent',
          notes: `Auto: short delivery on GRN ${grnNumber} (PO ${selectedPO.po_number}). ${shortItems.length} item(s) short.`,
        }).select().single()
        if (indent) {
          await supabase.from('purchase_indent_items').insert(
            shortItems.map(li => ({
              indent_id: indent.id, item_id: li.item_id,
              requested_qty: li.short_qty, unit: li.unit || 'Nos',
              notes: `Short ${li.short_qty} of ${li.ordered_qty} ordered`,
            }))
          )
          toast(`${shortItems.length} short items → auto-indent ${indentNum} created`, { icon: '📋', duration: 5000 })
        }
      } catch { /* non-critical */ }
    }

    // Notify: email vendor (goods received) + in-app to finance
    notifyAll({
      emailType: 'grn_received',
      emailData: { grn_id: grn.id },
      action: 'grn_submitted',
      entity_type: 'grn',
      entity_id: grn.id,
      details: { grn_number: grnNumber },
    })

    router.push(`/grn/${grn.id}`)
    } catch (err: any) {
      console.error('GRN creation error:', err)
      toast.error(`GRN creation failed: ${err?.message || 'Unknown error'}`)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl">
      <div className="page-header">
        <div>
          <Link href="/grn" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Back to GRNs
          </Link>
          <h1 className="page-title">New Goods Receipt Note</h1>
          <p className="page-subtitle mt-1">Record goods received against a purchase order</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: '#1B3A6B' }}>
              <CloudOff size={14} />
              {pendingCount} Pending Sync
            </span>
          )}
          {!isOnline && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800">
              <WifiOff size={14} />
              Offline Mode
            </span>
          )}
          <button onClick={handleSubmit} disabled={loading || !selectedPO} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : !isOnline ? <><CloudOff size={16} /> Save Offline</> : <><Save size={16} /> Submit GRN</>}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" aria-label="Create goods receipt note form">
        {/* PO Selection */}
        <div className="card p-6">
          <fieldset>
            <legend className="font-semibold mb-4 pb-3 border-b border-gray-100 w-full" style={{ color: '#1B3A6B' }}>
              Select Purchase Order
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="grn-po-select" className="form-label">Purchase Order *</label>
                <select
                  id="grn-po-select"
                  className="form-select"
                  value={selectedPO?.id || ''}
                  aria-required="true"
                  onChange={e => {
                    const po = eligiblePOs.find(p => p.id === e.target.value)
                    if (po) loadPOItems(po)
                    else { setSelectedPO(null); setLineItems([]) }
                  }}
                >
                  <option value="">Select a PO...</option>
                  {eligiblePOs.map(po => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} — {po.vendor?.legal_name} ({po.centre?.code}) — {formatCurrency(po.total_amount)} — {po.status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="grn-date" className="form-label">GRN Date *</label>
                <input id="grn-date" type="date" className="form-input" value={grnDate} onChange={e => setGrnDate(e.target.value)} required aria-required="true" />
              </div>
              <div>
                <label htmlFor="grn-notes" className="form-label">Notes</label>
                <input id="grn-notes" className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes..." />
              </div>
            </div>
          </fieldset>

          {selectedPO && (
            <div className="mt-4 p-3 rounded-lg flex items-center gap-4 text-sm" style={{ backgroundColor: '#E6F5F6' }}>
              <div><span className="font-medium" style={{ color: '#1B3A6B' }}>Vendor:</span> {selectedPO.vendor?.legal_name}</div>
              <div><span className="font-medium" style={{ color: '#1B3A6B' }}>Centre:</span> {selectedPO.centre?.name} ({selectedPO.centre?.code})</div>
              <div>
                <span className={`badge ${selectedPO.status === 'partially_received' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                  {selectedPO.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Transport & Vendor Invoice — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transport Details */}
          <div className="card p-6">
            <fieldset>
              <legend className="font-semibold mb-4 pb-3 border-b border-gray-100 w-full" style={{ color: '#1B3A6B' }}>
                Transport Details
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grn-dc-number" className="form-label">DC Number</label>
                  <input id="grn-dc-number" className="form-input" value={dcNumber} onChange={e => setDcNumber(e.target.value)} placeholder="Delivery challan #" />
                </div>
                <div>
                  <label htmlFor="grn-dc-date" className="form-label">DC Date</label>
                  <input id="grn-dc-date" type="date" className="form-input" value={dcDate} onChange={e => setDcDate(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="grn-lr-number" className="form-label">LR Number</label>
                  <input id="grn-lr-number" className="form-input" value={lrNumber} onChange={e => setLrNumber(e.target.value)} placeholder="Lorry receipt #" />
                </div>
                <div>
                  <label htmlFor="grn-transport-name" className="form-label">Transport Name</label>
                  <input id="grn-transport-name" className="form-input" value={transportName} onChange={e => setTransportName(e.target.value)} placeholder="Transporter" />
                </div>
                <div>
                  <label htmlFor="grn-vehicle-number" className="form-label">Vehicle Number</label>
                  <input id="grn-vehicle-number" className="form-input" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="GJ-01-XX-0000" />
                </div>
                <div>
                  <label htmlFor="grn-eway-bill" className="form-label">E-Way Bill No</label>
                  <input id="grn-eway-bill" className="form-input" value={ewayBillNo} onChange={e => setEwayBillNo(e.target.value)} placeholder="E-way bill #" />
                </div>
              </div>
            </fieldset>
          </div>

          {/* Vendor Invoice */}
          <div className="card p-6">
            <fieldset>
              <legend className="font-semibold mb-4 pb-3 border-b border-gray-100 w-full" style={{ color: '#1B3A6B' }}>
                Vendor Invoice Details
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="grn-vendor-invoice-no" className="form-label">Invoice Number</label>
                  <input id="grn-vendor-invoice-no" className="form-input" value={vendorInvoiceNo} onChange={e => setVendorInvoiceNo(e.target.value)} placeholder="Vendor invoice #" />
                </div>
                <div>
                  <label htmlFor="grn-vendor-invoice-date" className="form-label">Invoice Date</label>
                  <input id="grn-vendor-invoice-date" type="date" className="form-input" value={vendorInvoiceDate} onChange={e => setVendorInvoiceDate(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="grn-vendor-invoice-amount" className="form-label">Invoice Amount (₹)</label>
                  <input id="grn-vendor-invoice-amount" type="number" step="0.01" className="form-input" value={vendorInvoiceAmount} onChange={e => setVendorInvoiceAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Short / Excess warning banner */}
        {hasShortOrExcess && (
          <div className="rounded-lg border border-yellow-300 p-4 flex items-start gap-3" style={{ backgroundColor: '#FEF9C3' }}>
            <AlertTriangle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800 text-sm">Quantity Discrepancy Detected</p>
              <ul className="mt-1 text-sm text-yellow-700 space-y-0.5">
                {lineItems.filter(li => li.short_qty > 0).map(li => (
                  <li key={`short-${li.po_item_id}`}>
                    <span className="font-medium">{li.generic_name}</span>: Short by {li.short_qty} {li.unit}
                  </li>
                ))}
                {lineItems.filter(li => li.excess_qty > 0).map(li => (
                  <li key={`excess-${li.po_item_id}`}>
                    <span className="font-medium">{li.generic_name}</span>: Excess by {li.excess_qty} {li.unit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Line Items */}
        {lineItems.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h2 className="font-semibold" style={{ color: '#1B3A6B' }}>
                Receiving Items
              </h2>
              <BarcodeScanButton onScan={handleBarcodeScan} label="Scan Item" scanType="item" />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <caption className="sr-only">GRN line items for receiving goods against purchase order</caption>
                <thead>
                  <tr>
                    <th scope="col">Item</th>
                    <th scope="col" className="text-center">Ordered</th>
                    <th scope="col" className="text-center">Prev Recv</th>
                    <th scope="col" className="text-center">Receiving</th>
                    <th scope="col" className="text-center">Accepted</th>
                    <th scope="col" className="text-center">Rejected</th>
                    <th scope="col" className="text-center">Damaged</th>
                    <th scope="col" className="text-center">Free</th>
                    <th scope="col">Batch</th>
                    <th scope="col">Expiry</th>
                    <th scope="col">MRP</th>
                    <th scope="col" className="text-right">Rate</th>
                    <th scope="col" className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((li, idx) => (
                    <tr key={li.po_item_id} id={`grn-line-${idx}`} className={`${highlightedItemIdx === idx ? 'ring-2 ring-[#0D7E8A] bg-[#E6F5F6]' : li.short_qty > 0 ? 'bg-yellow-50' : li.excess_qty > 0 ? 'bg-orange-50' : ''} transition-all duration-300`}>
                      <td>
                        <div className="font-medium text-gray-900 text-sm">{li.generic_name}</div>
                        <div className="font-mono text-xs text-gray-400">{li.item_code} | {li.unit}</div>
                        {li.hsn_code && <div className="text-xs text-gray-400">HSN: {li.hsn_code}</div>}
                      </td>
                      <td className="text-sm font-medium text-center">{li.ordered_qty}</td>
                      <td className="text-sm text-gray-500 text-center">{li.already_received}</td>
                      <td className="text-center">
                        <input
                          type="number"
                          min="0"
                          className="form-input w-20 text-center"
                          value={li.received_qty}
                          onChange={e => updateLine(idx, 'received_qty', parseInt(e.target.value) || 0)}
                          aria-label={`Receiving quantity for ${li.generic_name}`}
                        />
                      </td>
                      <td className="text-center">
                        <span className="text-sm font-medium" style={{ color: '#0D7E8A' }}>{li.accepted_qty}</span>
                      </td>
                      <td className="text-center">
                        <input
                          type="number"
                          min="0"
                          max={li.received_qty}
                          className="form-input w-20 text-center"
                          value={li.rejected_qty}
                          onChange={e => updateLine(idx, 'rejected_qty', parseInt(e.target.value) || 0)}
                          aria-label={`Rejected quantity for ${li.generic_name}`}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="number"
                          min="0"
                          max={li.received_qty - li.rejected_qty}
                          className="form-input w-20 text-center"
                          value={li.damaged_qty}
                          onChange={e => updateLine(idx, 'damaged_qty', parseInt(e.target.value) || 0)}
                          aria-label={`Damaged quantity for ${li.generic_name}`}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          type="number"
                          min="0"
                          className="form-input w-16 text-center"
                          value={li.free_qty}
                          onChange={e => updateLine(idx, 'free_qty', parseInt(e.target.value) || 0)}
                          aria-label={`Free quantity for ${li.generic_name}`}
                        />
                      </td>
                      <td>
                        <input
                          className="form-input w-28"
                          value={li.batch_no}
                          onChange={e => updateLine(idx, 'batch_no', e.target.value)}
                          placeholder="Batch"
                          aria-label={`Batch number for ${li.generic_name}`}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-input w-36"
                          value={li.expiry_date}
                          onChange={e => updateLine(idx, 'expiry_date', e.target.value)}
                          aria-label={`Expiry date for ${li.generic_name}`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-input w-24"
                          value={li.mrp}
                          onChange={e => updateLine(idx, 'mrp', e.target.value)}
                          placeholder="MRP"
                          aria-label={`MRP for ${li.generic_name}`}
                        />
                      </td>
                      <td className="text-right text-sm font-medium">
                        {formatCurrency(li.rate)}
                        {li.trade_discount_percent > 0 && (
                          <div className="text-xs text-gray-400">-{li.trade_discount_percent}%</div>
                        )}
                      </td>
                      <td className="text-right text-sm font-medium" style={{ color: '#1B3A6B' }}>
                        {formatCurrency(li.total_amount)}
                        <div className="text-xs text-gray-400">
                          {li.cgst_amount > 0 && `C:${formatCurrency(li.cgst_amount)}`}
                          {li.sgst_amount > 0 && ` S:${formatCurrency(li.sgst_amount)}`}
                          {li.igst_amount > 0 && `I:${formatCurrency(li.igst_amount)}`}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold" style={{ backgroundColor: '#EEF2F9' }}>
                    <td colSpan={12} className="text-right" style={{ color: '#1B3A6B' }}>Grand Total</td>
                    <td className="text-right" style={{ color: '#1B3A6B' }}>{formatCurrency(grandTotal)}</td>
                  </tr>
                  {(totalCGST > 0 || totalSGST > 0) && (
                    <tr className="text-sm text-gray-600" style={{ backgroundColor: '#EEF2F9' }}>
                      <td colSpan={12} className="text-right">CGST / SGST</td>
                      <td className="text-right">{formatCurrency(totalCGST)} / {formatCurrency(totalSGST)}</td>
                    </tr>
                  )}
                  {totalIGST > 0 && (
                    <tr className="text-sm text-gray-600" style={{ backgroundColor: '#EEF2F9' }}>
                      <td colSpan={12} className="text-right">IGST</td>
                      <td className="text-right">{formatCurrency(totalIGST)}</td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>

            {/* Rejection Reasons */}
            {hasRejections && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg space-y-3">
                <h3 className="text-sm font-semibold text-red-700">Rejection Reasons</h3>
                {lineItems.filter(li => li.rejected_qty > 0).map(li => {
                  const lineIdx = lineItems.findIndex(l => l.po_item_id === li.po_item_id)
                  return (
                    <div key={li.po_item_id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-48 flex-shrink-0">
                        {li.generic_name} <span className="text-red-600">({li.rejected_qty} rejected)</span>:
                      </span>
                      <input
                        className="form-input flex-1"
                        value={li.rejection_reason}
                        onChange={e => updateLine(lineIdx, 'rejection_reason', e.target.value)}
                        placeholder="Reason for rejection (required)..."
                        aria-label={`Rejection reason for ${li.generic_name}`}
                        aria-required="true"
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Damage Reasons */}
            {hasDamaged && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg space-y-3">
                <h3 className="text-sm font-semibold text-orange-700">Damage Reasons</h3>
                {lineItems.filter(li => li.damaged_qty > 0).map(li => {
                  const lineIdx = lineItems.findIndex(l => l.po_item_id === li.po_item_id)
                  return (
                    <div key={li.po_item_id} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-48 flex-shrink-0">
                        {li.generic_name} <span className="text-orange-600">({li.damaged_qty} damaged)</span>:
                      </span>
                      <input
                        className="form-input flex-1"
                        value={li.damage_reason}
                        onChange={e => updateLine(lineIdx, 'damage_reason', e.target.value)}
                        placeholder="Reason for damage (required)..."
                        aria-label={`Damage reason for ${li.generic_name}`}
                        aria-required="true"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 pb-6">
          <button type="submit" disabled={loading || !selectedPO} className="btn-primary">
            {loading ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : !isOnline ? <><CloudOff size={16} /> Save Offline</> : <><Save size={16} /> Submit GRN</>}
          </button>
          <Link href="/grn" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
