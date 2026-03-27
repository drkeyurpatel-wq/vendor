'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Send, CheckCircle, Clock, FileQuestion } from 'lucide-react'

interface RFQItem {
  id: string
  description: string
  quantity: number
  unit: string
  specifications: string | null
}

interface QuoteItem {
  rfq_item_id: string
  unit_rate: string
  gst_percent: string
  brand: string
  manufacturer: string
  delivery_days: string
  remarks: string
}

export default function VendorRFQDetailPage() {
  const router = useRouter()
  const params = useParams()
  const rfqId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rfq, setRfq] = useState<any>(null)
  const [rfqItems, setRfqItems] = useState<RFQItem[]>([])
  const [existingQuote, setExistingQuote] = useState<any>(null)
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [paymentTerms, setPaymentTerms] = useState('')
  const [validityDays, setValidityDays] = useState('30')
  const [deliveryDays, setDeliveryDays] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/vendor/rfq/${rfqId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)

        setRfq(data.rfq)
        setRfqItems(data.items || [])
        setExistingQuote(data.existing_quote)

        if (data.existing_quote) {
          setPaymentTerms(data.existing_quote.payment_terms || '')
          setValidityDays(String(data.existing_quote.validity_days || 30))
          setDeliveryDays(String(data.existing_quote.delivery_timeline_days || ''))
          setNotes(data.existing_quote.notes || '')
        }

        // Initialize quote items
        const items = data.items || []
        const existingItems = data.existing_quote_items || []
        setQuoteItems(items.map((item: RFQItem) => {
          const existing = existingItems.find((ei: any) => ei.rfq_item_id === item.id)
          return {
            rfq_item_id: item.id,
            unit_rate: existing?.unit_rate?.toString() || '',
            gst_percent: existing?.gst_percent?.toString() || '18',
            brand: existing?.brand || '',
            manufacturer: existing?.manufacturer || '',
            delivery_days: existing?.delivery_days?.toString() || '',
            remarks: existing?.remarks || '',
          }
        }))
      } catch (err: any) {
        toast.error(err.message || 'Failed to load RFQ')
      }
      setLoading(false)
    }
    load()
  }, [rfqId])

  function updateQuoteItem(index: number, field: keyof QuoteItem, value: string) {
    setQuoteItems(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  function getTotal() {
    return quoteItems.reduce((sum, qi, idx) => {
      const rate = parseFloat(qi.unit_rate) || 0
      const qty = rfqItems[idx]?.quantity || 0
      const gst = parseFloat(qi.gst_percent) || 0
      const lineTotal = rate * qty * (1 + gst / 100)
      return sum + lineTotal
    }, 0)
  }

  async function handleSubmit() {
    const incomplete = quoteItems.some(qi => !qi.unit_rate)
    if (incomplete) {
      toast.error('Please fill unit rate for all items')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/vendor/rfq/${rfqId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: quoteItems.map(qi => ({
            ...qi,
            unit_rate: parseFloat(qi.unit_rate),
            gst_percent: parseFloat(qi.gst_percent) || 0,
            delivery_days: qi.delivery_days ? parseInt(qi.delivery_days) : null,
          })),
          payment_terms: paymentTerms,
          validity_days: parseInt(validityDays) || 30,
          delivery_timeline_days: deliveryDays ? parseInt(deliveryDays) : null,
          notes,
          total_amount: getTotal(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success('Quote submitted successfully!')
      router.push('/vendor/rfqs')
    } catch (err: any) {
      toast.error(err.message)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#0D7E8A] rounded-full animate-spin" />
      </div>
    )
  }

  if (!rfq) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <FileQuestion size={40} className="mx-auto mb-3 text-gray-400" />
        <p className="font-medium text-gray-500">RFQ not found</p>
        <Link href="/vendor/rfqs" className="inline-block mt-4 px-4 py-2 bg-[#0D7E8A] text-white text-sm rounded-xl">Back to RFQs</Link>
      </div>
    )
  }

  const deadlinePassed = new Date(rfq.submission_deadline) < new Date()
  const canSubmit = !deadlinePassed && rfq.status === 'open'
  const alreadySubmitted = existingQuote?.status === 'submitted'

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendor/rfqs" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{rfq.rfq_number}</h1>
          <p className="text-sm text-gray-500">{rfq.title}</p>
        </div>
      </div>

      {/* RFQ Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-xs text-gray-500 block">Centre</span><span className="font-semibold">{rfq.centre?.code || '—'}</span></div>
          <div><span className="text-xs text-gray-500 block">Deadline</span><span className={cn('font-semibold', deadlinePassed ? 'text-red-600' : '')}>{formatDate(rfq.submission_deadline)}</span></div>
          <div><span className="text-xs text-gray-500 block">Delivery By</span><span className="font-semibold">{rfq.delivery_required_by ? formatDate(rfq.delivery_required_by) : '—'}</span></div>
          <div><span className="text-xs text-gray-500 block">Status</span><span className="font-semibold capitalize">{rfq.status}</span></div>
        </div>
        {rfq.description && <p className="text-sm text-gray-600 mt-4 border-t border-gray-100 pt-3">{rfq.description}</p>}
        {rfq.terms_and_conditions && <p className="text-xs text-gray-500 mt-2 italic">{rfq.terms_and_conditions}</p>}
      </div>

      {alreadySubmitted && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl mb-6 text-sm text-green-700">
          <CheckCircle size={16} />
          <span>Quote submitted on {existingQuote.submitted_at ? formatDate(existingQuote.submitted_at) : '—'} | Total: {formatCurrency(existingQuote.total_amount)}</span>
        </div>
      )}

      {/* Quote Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{canSubmit ? 'Your Quote' : 'Quote Details'}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase min-w-[200px]">Item</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase min-w-[100px]">Unit Rate *</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">GST %</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Brand</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {rfqItems.map((item, idx) => {
                const qi = quoteItems[idx]
                if (!qi) return null
                const rate = parseFloat(qi.unit_rate) || 0
                const gst = parseFloat(qi.gst_percent) || 0
                const lineTotal = rate * item.quantity * (1 + gst / 100)

                return (
                  <tr key={item.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{item.description}</div>
                      {item.specifications && <div className="text-[11px] text-gray-500 mt-0.5">{item.specifications}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{item.unit}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number" step="0.01" value={qi.unit_rate}
                        onChange={(e) => updateQuoteItem(idx, 'unit_rate', e.target.value)}
                        disabled={!canSubmit}
                        className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] disabled:bg-gray-50"
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number" step="0.01" value={qi.gst_percent}
                        onChange={(e) => updateQuoteItem(idx, 'gst_percent', e.target.value)}
                        disabled={!canSubmit}
                        className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] disabled:bg-gray-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text" value={qi.brand}
                        onChange={(e) => updateQuoteItem(idx, 'brand', e.target.value)}
                        disabled={!canSubmit}
                        className="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] disabled:bg-gray-50"
                        placeholder="Brand"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(lineTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="border-t border-gray-300">
                <td colSpan={7} className="px-4 py-3 text-right text-sm font-bold text-gray-900">Total Quote Amount</td>
                <td className="px-4 py-3 text-right text-base font-bold text-[#1B3A6B]">{formatCurrency(getTotal())}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Terms */}
      {canSubmit && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Payment Terms</label>
              <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g. 30 days from invoice"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Delivery Timeline (days)</label>
              <input type="number" value={deliveryDays} onChange={(e) => setDeliveryDays(e.target.value)}
                placeholder="e.g. 7"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Quote Validity (days)</label>
              <input type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Any additional remarks or conditions..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] resize-none" />
          </div>
        </div>
      )}

      {canSubmit && (
        <div className="flex gap-3">
          <Link href="/vendor/rfqs" className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">Cancel</Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] disabled:opacity-50 transition-colors cursor-pointer shadow-sm"
          >
            {submitting ? 'Submitting...' : <><Send size={14} /> Submit Quote</>}
          </button>
        </div>
      )}
    </div>
  )
}
