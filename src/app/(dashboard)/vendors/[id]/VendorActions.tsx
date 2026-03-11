'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, ShieldBan, ShieldAlert, Power } from 'lucide-react'
import toast from 'react-hot-toast'
import type { UserRole, VendorStatus } from '@/types/database'

interface Props {
  vendorId: string
  currentStatus: string
  userRole: string
}

const ACTIVATE_ROLES: UserRole[] = ['group_admin', 'group_cao', 'unit_cao']
const BLACKLIST_ROLES: UserRole[] = ['group_admin']

export default function VendorActions({ vendorId, currentStatus, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [showBlacklistForm, setShowBlacklistForm] = useState(false)
  const [blacklistReason, setBlacklistReason] = useState('')

  const role = userRole as UserRole
  const status = currentStatus as VendorStatus

  const canActivate = status === 'pending' && ACTIVATE_ROLES.includes(role)
  const canBlacklist = status === 'active' && BLACKLIST_ROLES.includes(role)
  const canReactivate = status === 'blacklisted' && BLACKLIST_ROLES.includes(role)
  const canDeactivate = status === 'active'

  async function updateStatus(newStatus: VendorStatus, extra?: Record<string, unknown>) {
    setLoading(true)
    try {
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...extra,
      }

      const { error } = await supabase
        .from('vendors')
        .update(updatePayload)
        .eq('id', vendorId)

      if (error) throw error

      toast.success(`Vendor ${newStatus === 'active' ? 'activated' : newStatus === 'blacklisted' ? 'blacklisted' : newStatus === 'inactive' ? 'deactivated' : 'updated'} successfully`)
      setShowBlacklistForm(false)
      setBlacklistReason('')
      router.refresh()
    } catch {
      toast.error('Failed to update vendor status')
    } finally {
      setLoading(false)
    }
  }

  function handleActivate() {
    updateStatus('active')
  }

  function handleDeactivate() {
    if (!confirm('Are you sure you want to deactivate this vendor? They will no longer appear in vendor selection for new POs.')) return
    updateStatus('inactive')
  }

  function handleBlacklistClick() {
    setShowBlacklistForm(true)
  }

  function handleBlacklistConfirm() {
    if (!blacklistReason.trim()) {
      toast.error('A reason is required to blacklist a vendor')
      return
    }
    updateStatus('blacklisted', { blacklist_reason: blacklistReason.trim() })
  }

  function handleReactivate() {
    if (!confirm('Are you sure you want to reactivate this blacklisted vendor?')) return
    updateStatus('active', { blacklist_reason: null })
  }

  if (!canActivate && !canBlacklist && !canReactivate && !canDeactivate) return null

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
        Vendor Actions
      </h2>

      <div className="space-y-3">
        {canActivate && (
          <button
            onClick={handleActivate}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            Activate Vendor
          </button>
        )}

        {canBlacklist && !showBlacklistForm && (
          <button
            onClick={handleBlacklistClick}
            disabled={loading}
            className="btn-danger w-full flex items-center justify-center gap-2"
          >
            <ShieldBan size={15} />
            Blacklist Vendor
          </button>
        )}

        {canBlacklist && showBlacklistForm && (
          <div className="space-y-3 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <ShieldAlert size={15} />
              Confirm Blacklisting
            </div>
            <p className="text-xs text-red-600">
              This action will prevent the vendor from receiving any new purchase orders. A reason is required.
            </p>
            <textarea
              className="form-input w-full text-sm"
              rows={3}
              placeholder="Enter reason for blacklisting (required)..."
              value={blacklistReason}
              onChange={e => setBlacklistReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleBlacklistConfirm}
                disabled={loading || !blacklistReason.trim()}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldBan size={15} />}
                Confirm Blacklist
              </button>
              <button
                onClick={() => { setShowBlacklistForm(false); setBlacklistReason('') }}
                disabled={loading}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {canReactivate && (
          <button
            onClick={handleReactivate}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            Reactivate Vendor
          </button>
        )}

        {canDeactivate && (
          <button
            onClick={handleDeactivate}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Power size={15} />}
            Deactivate Vendor
          </button>
        )}
      </div>
    </div>
  )
}
