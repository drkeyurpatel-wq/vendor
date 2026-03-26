'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, UserCheck, Plus, Loader2, Trash2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface Delegation { id: string; delegator_id: string; delegate_id: string; start_date: string; end_date: string; reason: string | null; is_active: boolean; delegator?: any; delegate?: any }

export default function DelegationsPage() {
  const supabase = createClient()
  const [delegations, setDelegations] = useState<Delegation[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [delegatorId, setDelegatorId] = useState('')
  const [delegateId, setDelegateId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: d }, { data: u }] = await Promise.all([
      supabase.from('approval_delegations').select('*').order('start_date', { ascending: false }),
      supabase.from('user_profiles').select('id, full_name, role, email').eq('is_active', true).order('full_name'),
    ])
    // Manually attach names
    const userMap = new Map((u || []).map(usr => [usr.id, usr]))
    setDelegations((d || []).map(del => ({ ...del, delegator: userMap.get(del.delegator_id), delegate: userMap.get(del.delegate_id) })))
    setUsers(u || [])
    setLoading(false)
  }

  async function createDelegation() {
    if (!delegatorId || !delegateId || !startDate || !endDate) { toast.error('All fields required'); return }
    if (delegatorId === delegateId) { toast.error('Cannot delegate to yourself'); return }
    if (new Date(endDate) < new Date(startDate)) { toast.error('End date must be after start date'); return }
    setSaving(true)
    const { error } = await supabase.from('approval_delegations').insert({
      delegator_id: delegatorId, delegate_id: delegateId,
      start_date: startDate, end_date: endDate,
      reason: reason.trim() || null, is_active: true,
    })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Delegation created')
    setShowForm(false); setDelegatorId(''); setDelegateId(''); setStartDate(''); setEndDate(''); setReason(''); setSaving(false)
    load()
  }

  async function revoke(id: string) {
    await supabase.from('approval_delegations').update({ is_active: false }).eq('id', id)
    toast.success('Delegation revoked')
    load()
  }

  const today = new Date().toISOString().split('T')[0]
  const approverRoles = ['unit_purchase_manager', 'unit_cao', 'group_cao', 'group_admin']
  const approvers = users.filter(u => approverRoles.includes(u.role))

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-navy-600" /></div>

  return (
    <div>
      <Link href="/settings" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Approval Delegations</h1>
          <p className="page-subtitle">When an approver is unavailable, delegate approval authority to another user</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary text-sm">
          <Plus size={14} /> New Delegation
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 border-2 border-teal-200">
          <h3 className="font-semibold text-gray-900 mb-4">Create Delegation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">Delegator (who is away)</label>
              <select className="form-select" value={delegatorId} onChange={e => setDelegatorId(e.target.value)}>
                <option value="">Select approver...</option>
                {approvers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role.replace(/_/g, ' ')})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Delegate (who will approve)</label>
              <select className="form-select" value={delegateId} onChange={e => setDelegateId(e.target.value)}>
                <option value="">Select delegate...</option>
                {approvers.filter(u => u.id !== delegatorId).map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role.replace(/_/g, ' ')})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} min={today} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate || today} />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Reason (optional)</label>
            <input className="form-input" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Annual leave, conference trip" />
          </div>
          <div className="flex gap-2">
            <button onClick={createDelegation} disabled={saving} className="btn-primary text-sm">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create Delegation'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {delegations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Delegator</th>
                  <th>Delegate</th>
                  <th>Period</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {delegations.map(d => {
                  const isActive = d.is_active && d.start_date <= today && d.end_date >= today
                  const isExpired = d.end_date < today
                  return (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td>
                        <div className="text-sm font-medium text-gray-900">{d.delegator?.full_name || '—'}</div>
                        <div className="text-xs text-gray-500">{d.delegator?.role?.replace(/_/g, ' ')}</div>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-gray-900">{d.delegate?.full_name || '—'}</div>
                        <div className="text-xs text-gray-500">{d.delegate?.role?.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="text-sm text-gray-600">{d.start_date} → {d.end_date}</td>
                      <td className="text-sm text-gray-500 max-w-[200px] truncate">{d.reason || '—'}</td>
                      <td>
                        <span className={cn('badge', isActive ? 'bg-green-100 text-green-700' : isExpired ? 'bg-gray-100 text-gray-500' : d.is_active ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600')}>
                          {isActive ? 'Active' : isExpired ? 'Expired' : d.is_active ? 'Upcoming' : 'Revoked'}
                        </span>
                      </td>
                      <td>
                        {d.is_active && !isExpired && (
                          <button onClick={() => revoke(d.id)} className="text-xs text-red-600 hover:underline flex items-center gap-1">
                            <Trash2 size={12} /> Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <UserCheck size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No delegations configured</p>
            <p className="text-sm text-gray-500 mt-1">Create a delegation when an approver is unavailable</p>
          </div>
        )}
      </div>
    </div>
  )
}
