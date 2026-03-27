'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'

interface Props {
  poId: string
  poNumber: string
  vendorId: string
}

export default function VendorPOActions({ poId, poNumber, vendorId }: Props) {
  const router = useRouter()
  const [showAck, setShowAck] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [disputeReason, setDisputeReason] = useState('')

  async function handleAcknowledge() {
    if (!deliveryDate) {
      toast.error('Please confirm a delivery date')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/po/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po_id: poId, vendor_id: vendorId, delivery_date: deliveryDate, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(`PO ${poNumber} acknowledged`)
      router.refresh()
      setShowAck(false)
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  async function handleDispute() {
    if (!disputeReason.trim()) {
      toast.error('Please provide a reason for the dispute')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/vendor/po/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ po_id: poId, vendor_id: vendorId, reason: disputeReason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Dispute raised successfully')
      router.refresh()
      setShowDispute(false)
    } catch (err: any) {
      toast.error(err.message)
    }
    setLoading(false)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowAck(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] transition-colors cursor-pointer shadow-sm"
        >
          <CheckCircle size={14} /> Acknowledge PO
        </button>
        <button
          onClick={() => setShowDispute(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
        >
          <AlertTriangle size={14} /> Dispute
        </button>
      </div>

      {/* Acknowledge Modal */}
      {showAck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Acknowledge PO</h3>
              <button onClick={() => setShowAck(false)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Confirm you will fulfil <span className="font-semibold">{poNumber}</span></p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmed Delivery Date *</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A]"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any remarks or conditions..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAck(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
              <button
                onClick={handleAcknowledge}
                disabled={loading || !deliveryDate}
                className="flex-1 px-4 py-2.5 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? 'Confirming...' : 'Confirm Acknowledgement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Raise Dispute</h3>
              <button onClick={() => setShowDispute(false)} className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-600 mb-4">Report an issue with <span className="font-semibold">{poNumber}</span></p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Dispute *</label>
              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={4}
                placeholder="Describe the issue — pricing, quantity, terms, delivery date, etc."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowDispute(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">Cancel</button>
              <button
                onClick={handleDispute}
                disabled={loading || !disputeReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {loading ? 'Submitting...' : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
