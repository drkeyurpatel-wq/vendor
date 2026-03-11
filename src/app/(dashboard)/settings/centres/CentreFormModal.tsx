'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface CentreFormModalProps {
  editCentre?: {
    id: string
    code: string
    name: string
    address: string | null
    city: string | null
    state: string | null
    phone: string | null
    email: string | null
    is_active: boolean
  } | null
}

export default function CentreFormModal({ editCentre }: CentreFormModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [code, setCode] = useState(editCentre?.code || '')
  const [name, setName] = useState(editCentre?.name || '')
  const [address, setAddress] = useState(editCentre?.address || '')
  const [city, setCity] = useState(editCentre?.city || '')
  const [state, setState] = useState(editCentre?.state || '')
  const [phone, setPhone] = useState(editCentre?.phone || '')
  const [email, setEmail] = useState(editCentre?.email || '')
  const [isActive, setIsActive] = useState(editCentre?.is_active ?? true)

  function resetForm() {
    if (editCentre) {
      setCode(editCentre.code)
      setName(editCentre.name)
      setAddress(editCentre.address || '')
      setCity(editCentre.city || '')
      setState(editCentre.state || '')
      setPhone(editCentre.phone || '')
      setEmail(editCentre.email || '')
      setIsActive(editCentre.is_active)
    } else {
      setCode('')
      setName('')
      setAddress('')
      setCity('')
      setState('')
      setPhone('')
      setEmail('')
      setIsActive(true)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!code.trim()) { toast.error('Centre code is required'); return }
    if (!name.trim()) { toast.error('Centre name is required'); return }
    if (code.trim().length > 5) { toast.error('Code must be 5 characters or less (e.g. SHI, VAS)'); return }

    setLoading(true)

    const record = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      is_active: isActive,
    }

    if (editCentre) {
      const { error } = await supabase
        .from('centres')
        .update(record)
        .eq('id', editCentre.id)

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success('Centre updated')
    } else {
      const { error } = await supabase
        .from('centres')
        .insert(record)

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('A centre with this code already exists')
        } else {
          toast.error(error.message)
        }
        setLoading(false)
        return
      }
      toast.success('Centre added')
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => { resetForm(); setOpen(true) }}
        className={editCentre ? 'text-xs text-[#0D7E8A] hover:underline font-medium' : 'btn-primary'}
      >
        {editCentre ? 'Edit' : '+ Add Centre'}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {editCentre ? 'Edit Centre' : 'Add New Centre'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Centre Code *</label>
                  <input
                    className="form-input uppercase"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. SHI"
                    maxLength={5}
                    disabled={!!editCentre}
                  />
                  {editCentre && <p className="text-xs text-gray-400 mt-1">Code cannot be changed</p>}
                </div>
                <div>
                  <label className="form-label">Centre Name *</label>
                  <input
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Shilaj Hospital"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">City</label>
                  <input
                    className="form-input"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="e.g. Ahmedabad"
                  />
                </div>
                <div>
                  <label className="form-label">State</label>
                  <input
                    className="form-input"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    placeholder="e.g. Gujarat"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="centre@health1.in"
                  />
                </div>
              </div>

              {editCentre && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="centreActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="centreActive" className="text-sm text-gray-700">Active</label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editCentre ? 'Update Centre' : 'Add Centre'}
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
