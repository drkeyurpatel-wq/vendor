'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, MapPin, Phone, Mail, CheckCircle, XCircle, Plus, Pencil, X, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import FieldError from '@/components/ui/FieldError'
import { Centre } from '@/types/database'

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal',
]

const emptyForm = {
  code: '',
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  is_active: true,
}

interface Props {
  initialCentres: Centre[]
  userRole: string
}

export default function CentresManager({ initialCentres, userRole }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [centres, setCentres] = useState<Centre[]>(initialCentres)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const totalCentres = centres.length
  const activeCentres = centres.filter(c => c.is_active).length

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.code.trim()) e.code = 'Centre code is required'
    else if (form.code.trim().length > 5) e.code = 'Code must be 5 characters or less'
    else {
      const duplicate = centres.find(c => c.code.toUpperCase() === form.code.trim().toUpperCase() && c.id !== editingId)
      if (duplicate) e.code = 'This code is already in use'
    }
    if (!form.name.trim()) e.name = 'Centre name is required'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format'
    if (form.phone && !/^[\d\s+\-()]{7,15}$/.test(form.phone)) e.phone = 'Invalid phone number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (centre: Centre) => {
    setEditingId(centre.id)
    setForm({
      code: centre.code,
      name: centre.name,
      address: centre.address || '',
      city: centre.city || '',
      state: centre.state || '',
      phone: centre.phone || '',
      email: centre.email || '',
      is_active: centre.is_active,
    })
    setErrors({})
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      state: form.state || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      is_active: form.is_active,
    }

    if (editingId) {
      const { error } = await supabase
        .from('centres')
        .update(payload)
        .eq('id', editingId)

      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }
      setCentres(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } : c))
      toast.success('Centre updated')
    } else {
      const { data, error } = await supabase
        .from('centres')
        .insert(payload)
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        setSaving(false)
        return
      }
      setCentres(prev => [...prev, data].sort((a, b) => a.code.localeCompare(b.code)))
      toast.success('Centre added')
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    router.refresh()
  }

  const toggleActive = async (centre: Centre) => {
    const { error } = await supabase
      .from('centres')
      .update({ is_active: !centre.is_active })
      .eq('id', centre.id)

    if (error) {
      toast.error(error.message)
      return
    }
    setCentres(prev => prev.map(c => c.id === centre.id ? { ...c, is_active: !c.is_active } : c))
    toast.success(`${centre.name} ${centre.is_active ? 'deactivated' : 'activated'}`)
    router.refresh()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Centre Management</h1>
          <p className="page-subtitle">
            {totalCentres} centres ({activeCentres} active)
          </p>
        </div>
        {userRole === 'group_admin' && (
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Centre
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Centres</div>
          <div className="text-2xl font-bold text-[#1B3A6B] mt-1">{totalCentres}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Active Centres</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{activeCentres}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Inactive Centres</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{totalCentres - activeCentres}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">States Covered</div>
          <div className="text-2xl font-bold text-[#0D7E8A] mt-1">
            {new Set(centres.map(c => c.state).filter(Boolean)).size}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-[#EEF2F9] rounded-t-xl">
              <h2 className="text-lg font-bold text-[#1B3A6B]">
                {editingId ? 'Edit Centre' : 'Add New Centre'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Centre Code *</label>
                  <input
                    className="form-input uppercase"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. SHI"
                    maxLength={5}
                    disabled={!!editingId}
                  />
                  <FieldError message={errors.code} />
                </div>
                <div>
                  <label className="form-label">Centre Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Shilaj"
                  />
                  <FieldError message={errors.name} />
                </div>
              </div>

              <div>
                <label className="form-label">Address</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Full address"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">City</label>
                  <input
                    className="form-input"
                    value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="form-label">State</label>
                  <select
                    className="form-select"
                    value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  >
                    <option value="">Select State</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    className="form-input"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                  <FieldError message={errors.phone} />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="centre@health1.in"
                  />
                  <FieldError message={errors.email} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0D7E8A]"></div>
                </label>
                <span className="text-sm text-gray-700">Active</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingId ? 'Update Centre' : 'Add Centre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Centre Cards */}
      {centres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {centres.map((centre) => (
            <div key={centre.id} className="card overflow-hidden">
              {/* Header */}
              <div className={cn(
                'px-5 py-4 flex items-center justify-between border-b',
                centre.is_active ? 'bg-[#EEF2F9] border-blue-100' : 'bg-gray-50 border-gray-100'
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    centre.is_active ? 'bg-[#1B3A6B]' : 'bg-gray-300'
                  )}>
                    <Building2 size={18} className="text-white" />
                  </div>
                  <span className="badge bg-[#1B3A6B] text-white font-mono text-xs">
                    {centre.code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEdit(centre)}
                    className="text-gray-400 hover:text-[#0D7E8A] transition-colors p-1.5 rounded-lg hover:bg-[#E6F5F6]"
                    title="Edit centre"
                  >
                    <Pencil size={14} />
                  </button>
                  <span className={cn(
                    'badge',
                    centre.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {centre.is_active ? (
                      <span className="flex items-center gap-1"><CheckCircle size={12} /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1"><XCircle size={12} /> Inactive</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-3">
                <h3 className="font-semibold text-[#1B3A6B] text-base">{centre.name}</h3>

                {centre.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>
                      {centre.address}
                      {centre.city && <>, {centre.city}</>}
                      {centre.state && <>, {centre.state}</>}
                    </span>
                  </div>
                )}
                {!centre.address && centre.city && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>
                      {centre.city}
                      {centre.state && <>, {centre.state}</>}
                    </span>
                  </div>
                )}

                {centre.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={14} className="shrink-0 text-gray-400" />
                    <span>{centre.phone}</span>
                  </div>
                )}

                {centre.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="shrink-0 text-gray-400" />
                    <span className="truncate">{centre.email}</span>
                  </div>
                )}

                {!centre.address && !centre.city && !centre.phone && !centre.email && (
                  <p className="text-sm text-gray-400 italic">No contact details — click edit to add</p>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-5 py-3 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => toggleActive(centre)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                    centre.is_active
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-green-600 hover:bg-green-50'
                  )}
                >
                  {centre.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12">
          <div className="empty-state">
            <Building2 size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No centres found</p>
            <p className="text-sm text-gray-400 mt-1">Click &quot;Add Centre&quot; to create your first hospital centre</p>
          </div>
        </div>
      )}
    </div>
  )
}
