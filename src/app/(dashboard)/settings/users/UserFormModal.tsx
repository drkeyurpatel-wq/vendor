'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { ROLE_LABELS } from '@/types/database'
import type { UserRole } from '@/types/database'

interface Centre {
  id: string
  code: string
  name: string
}

interface UserFormModalProps {
  centres: Centre[]
  editUser?: {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: string
    centre_id: string | null
    is_active: boolean
  } | null
}

const ROLES: UserRole[] = [
  'group_admin', 'group_cao', 'unit_cao',
  'unit_purchase_manager', 'store_staff', 'finance_staff', 'vendor',
]

export default function UserFormModal({ centres, editUser }: UserFormModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [fullName, setFullName] = useState(editUser?.full_name || '')
  const [email, setEmail] = useState(editUser?.email || '')
  const [phone, setPhone] = useState(editUser?.phone || '')
  const [role, setRole] = useState(editUser?.role || 'unit_purchase_manager')
  const [centreId, setCentreId] = useState(editUser?.centre_id || '')
  const [isActive, setIsActive] = useState(editUser?.is_active ?? true)

  function resetForm() {
    if (editUser) {
      setFullName(editUser.full_name)
      setEmail(editUser.email)
      setPhone(editUser.phone || '')
      setRole(editUser.role)
      setCentreId(editUser.centre_id || '')
      setIsActive(editUser.is_active)
    } else {
      setFullName('')
      setEmail('')
      setPhone('')
      setRole('unit_purchase_manager')
      setCentreId('')
      setIsActive(true)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!fullName.trim()) { toast.error('Name is required'); return }
    if (!email.trim()) { toast.error('Email is required'); return }

    const isGroupRole = ['group_admin', 'group_cao'].includes(role)

    setLoading(true)

    if (editUser) {
      // Update existing user
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          role,
          centre_id: isGroupRole ? null : (centreId || null),
          is_active: isActive,
        })
        .eq('id', editUser.id)

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success('User updated')
    } else {
      // Create new user via Supabase Auth admin invite
      // Note: This creates an auth user who will need to set their password
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          role,
        },
      })

      if (authError) {
        // Fallback: if admin API not available, just create the profile
        // The auth user may need to be created via Supabase Dashboard
        const { error: profileError } = await supabase.from('user_profiles').insert({
          id: crypto.randomUUID(),
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          role,
          centre_id: isGroupRole ? null : (centreId || null),
          is_active: isActive,
        })

        if (profileError) {
          toast.error(profileError.message)
          setLoading(false)
          return
        }
      } else if (authData?.user) {
        // Update profile with centre assignment
        await supabase.from('user_profiles')
          .update({
            phone: phone.trim() || null,
            centre_id: isGroupRole ? null : (centreId || null),
          })
          .eq('id', authData.user.id)
      }

      toast.success('User created')
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => { resetForm(); setOpen(true) }} className={editUser ? 'text-xs text-teal-500 hover:underline font-medium' : 'btn-primary'}>
        {editUser ? 'Edit' : '+ Add User'}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>

              <div>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!editUser} />
                {editUser && <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>}
              </div>

              <div>
                <label className="form-label">Phone</label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit mobile" />
              </div>

              <div>
                <label className="form-label">Role *</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                  {ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>

              {!['group_admin', 'group_cao'].includes(role) && (
                <div>
                  <label className="form-label">Centre</label>
                  <select className="form-select" value={centreId} onChange={e => setCentreId(e.target.value)}>
                    <option value="">Select centre</option>
                    {centres.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {editUser && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editUser ? 'Update User' : 'Create User'}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
