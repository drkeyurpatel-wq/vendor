'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Tag, Plus, Pencil, X, Save, Loader2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import FieldError from '@/components/ui/FieldError'

interface VendorCategory {
  id: string
  name: string
  code: string
  description: string | null
  is_active: boolean
}

interface Props {
  initialCategories: VendorCategory[]
  vendorCountMap: Record<string, number>
}

const emptyForm = { name: '', code: '', description: '', is_active: true }

export default function VendorCategoriesManager({ initialCategories, vendorCountMap }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [categories, setCategories] = useState<VendorCategory[]>(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const activeCount = categories.filter(c => c.is_active).length
  const totalVendors = Object.values(vendorCountMap).reduce((a, b) => a + b, 0)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Category name is required'
    if (!form.code.trim()) e.code = 'Category code is required'
    else if (form.code.trim().length > 10) e.code = 'Code must be 10 characters or less'
    else {
      const dup = categories.find(c => c.code.toUpperCase() === form.code.trim().toUpperCase() && c.id !== editingId)
      if (dup) e.code = 'This code is already in use'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAdd = () => {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (cat: VendorCategory) => {
    setEditingId(cat.id)
    setForm({ name: cat.name, code: cat.code, description: cat.description || '', is_active: cat.is_active })
    setErrors({})
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      is_active: form.is_active,
    }

    if (editingId) {
      const { error } = await supabase.from('vendor_categories').update(payload).eq('id', editingId)
      if (error) { toast.error(error.message); setSaving(false); return }
      setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } : c))
      toast.success('Category updated')
    } else {
      const { data, error } = await supabase.from('vendor_categories').insert(payload).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Category added')
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    router.refresh()
  }

  const toggleActive = async (cat: VendorCategory) => {
    const { error } = await supabase.from('vendor_categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    if (error) { toast.error(error.message); return }
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
    toast.success(`${cat.name} ${cat.is_active ? 'deactivated' : 'activated'}`)
    router.refresh()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Categories</h1>
          <p className="page-subtitle">
            {categories.length} categories ({activeCount} active) covering {totalVendors} vendors
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-[#EEF2F9] rounded-t-xl">
              <h2 className="text-lg font-bold text-[#1B3A6B]">
                {editingId ? 'Edit Category' : 'Add Vendor Category'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Code *</label>
                  <input
                    className="form-input uppercase"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="e.g. PHARMA"
                    maxLength={10}
                  />
                  <FieldError message={errors.code} />
                </div>
                <div>
                  <label className="form-label">Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Pharmaceuticals"
                  />
                  <FieldError message={errors.name} />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this category"
                />
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
                {editingId ? 'Update' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {categories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Vendors</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {cat.code}
                      </span>
                    </td>
                    <td className="font-medium text-gray-900">{cat.name}</td>
                    <td className="text-sm text-gray-600 max-w-xs truncate">
                      {cat.description || <span className="text-gray-400">--</span>}
                    </td>
                    <td>
                      <span className={cn(
                        'badge',
                        cat.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="text-sm font-semibold text-[#1B3A6B]">
                        {vendorCountMap[cat.id] ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="text-[#0D7E8A] hover:text-[#1B3A6B] p-1.5 rounded-lg hover:bg-[#E6F5F6] transition-colors"
                          title="Edit category"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => toggleActive(cat)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            cat.is_active
                              ? 'text-red-500 hover:bg-red-50'
                              : 'text-green-500 hover:bg-green-50'
                          )}
                          title={cat.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {cat.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <Tag size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No vendor categories yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Click &quot;Add Category&quot; to create your first category
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
