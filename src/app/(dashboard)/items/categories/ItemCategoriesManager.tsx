'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FolderTree, Plus, Pencil, X, Save, Loader2, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import FieldError from '@/components/ui/FieldError'

interface ItemCategory {
  id: string
  name: string
  code: string
  parent_id: string | null
  is_active: boolean
}

interface Props {
  initialCategories: ItemCategory[]
  itemCountMap: Record<string, number>
}

const emptyForm = { name: '', code: '', parent_id: '', is_active: true }

export default function ItemCategoriesManager({ initialCategories, itemCountMap }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [categories, setCategories] = useState<ItemCategory[]>(initialCategories)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Build parent/child structure
  const parentCategories = categories.filter(c => !c.parent_id)
  const childCategories = (parentId: string) => categories.filter(c => c.parent_id === parentId)
  const activeCount = categories.filter(c => c.is_active).length
  const totalItems = Object.values(itemCountMap).reduce((a, b) => a + b, 0)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Category name is required'
    if (!form.code.trim()) e.code = 'Category code is required'
    else if (form.code.trim().length > 10) e.code = 'Code must be 10 characters or less'
    else {
      const dup = categories.find(c => c.code.toUpperCase() === form.code.trim().toUpperCase() && c.id !== editingId)
      if (dup) e.code = 'This code is already in use'
    }
    // Prevent setting parent to self or to own child
    if (editingId && form.parent_id === editingId) e.parent_id = 'Cannot be its own parent'
    if (editingId && form.parent_id) {
      const child = categories.find(c => c.id === form.parent_id)
      if (child?.parent_id === editingId) e.parent_id = 'Circular reference detected'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const openAdd = (parentId?: string) => {
    setEditingId(null)
    setForm({ ...emptyForm, parent_id: parentId || '' })
    setErrors({})
    setShowForm(true)
  }

  const openEdit = (cat: ItemCategory) => {
    setEditingId(cat.id)
    setForm({ name: cat.name, code: cat.code, parent_id: cat.parent_id || '', is_active: cat.is_active })
    setErrors({})
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      parent_id: form.parent_id || null,
      is_active: form.is_active,
    }

    if (editingId) {
      const { error } = await supabase.from('item_categories').update(payload).eq('id', editingId)
      if (error) { toast.error(error.message); setSaving(false); return }
      setCategories(prev => prev.map(c => c.id === editingId ? { ...c, ...payload } : c))
      toast.success('Category updated')
    } else {
      const { data, error } = await supabase.from('item_categories').insert(payload).select().single()
      if (error) { toast.error(error.message); setSaving(false); return }
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      toast.success('Category added')
    }

    setSaving(false)
    setShowForm(false)
    setEditingId(null)
    router.refresh()
  }

  const toggleActive = async (cat: ItemCategory) => {
    const { error } = await supabase.from('item_categories').update({ is_active: !cat.is_active }).eq('id', cat.id)
    if (error) { toast.error(error.message); return }
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
    toast.success(`${cat.name} ${cat.is_active ? 'deactivated' : 'activated'}`)
    router.refresh()
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Item Categories</h1>
          <p className="page-subtitle">
            {categories.length} categories ({activeCount} active) covering {totalItems} items
          </p>
        </div>
        <button onClick={() => openAdd()} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Parent Categories</div>
          <div className="text-2xl font-bold text-navy-600 mt-1">{parentCategories.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Sub-Categories</div>
          <div className="text-2xl font-bold text-teal-500 mt-1">{categories.length - parentCategories.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{activeCount}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Total Items</div>
          <div className="text-2xl font-bold text-navy-600 mt-1">{totalItems}</div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b bg-navy-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-navy-600">
                {editingId ? 'Edit Category' : 'Add Item Category'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-600 p-1">
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
                    placeholder="e.g. DRUG"
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
                    placeholder="e.g. Drugs & Medicine"
                  />
                  <FieldError message={errors.name} />
                </div>
              </div>

              <div>
                <label className="form-label">Parent Category</label>
                <select
                  className="form-select"
                  value={form.parent_id}
                  onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                >
                  <option value="">None (Top-level category)</option>
                  {parentCategories
                    .filter(c => c.id !== editingId)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))
                  }
                </select>
                <FieldError message={errors.parent_id} />
                <p className="text-xs text-gray-500 mt-1">Leave empty for a top-level category, or select a parent to create a sub-category</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
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

      {/* Hierarchical Category List */}
      {categories.length > 0 ? (
        <div className="space-y-3">
          {parentCategories.map(parent => {
            const children = childCategories(parent.id)
            const parentItemCount = itemCountMap[parent.id] ?? 0
            const childItemCount = children.reduce((sum, c) => sum + (itemCountMap[c.id] ?? 0), 0)

            return (
              <div key={parent.id} className="card overflow-hidden">
                {/* Parent row */}
                <div className={cn(
                  'flex items-center justify-between px-5 py-4',
                  !parent.is_active && 'opacity-60'
                )}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-navy-600 rounded-lg flex items-center justify-center">
                      <FolderTree size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{parent.code}</span>
                        <span className="font-semibold text-gray-900">{parent.name}</span>
                        <span className={cn('badge', parent.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {parent.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {parentItemCount + childItemCount} items total
                        {children.length > 0 && <> &middot; {children.length} sub-categories</>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAdd(parent.id)}
                      className="text-teal-500 hover:text-navy-600 p-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                      title="Add sub-category"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => openEdit(parent)}
                      className="text-teal-500 hover:text-navy-600 p-1.5 rounded-lg hover:bg-teal-50 transition-colors"
                      title="Edit category"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(parent)}
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        parent.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'
                      )}
                      title={parent.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {parent.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    </button>
                  </div>
                </div>

                {/* Children */}
                {children.length > 0 && (
                  <div className="border-t bg-gray-50">
                    {children.map(child => (
                      <div
                        key={child.id}
                        className={cn(
                          'flex items-center justify-between px-5 py-3 pl-14 border-b last:border-b-0',
                          !child.is_active && 'opacity-60'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight size={12} className="text-gray-500" />
                          <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border">{child.code}</span>
                          <span className="text-sm text-gray-800">{child.name}</span>
                          <span className={cn('badge text-[10px]', child.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500')}>
                            {child.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">{itemCountMap[child.id] ?? 0} items</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(child)}
                            className="text-teal-500 hover:text-navy-600 p-1 rounded hover:bg-teal-50 transition-colors"
                            title="Edit sub-category"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => toggleActive(child)}
                            className={cn(
                              'p-1 rounded transition-colors',
                              child.is_active ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'
                            )}
                            title={child.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {child.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Orphan categories (have parent_id but parent doesn't exist, or uncategorised) */}
          {categories.filter(c => c.parent_id && !parentCategories.find(p => p.id === c.parent_id)).length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-2">Uncategorised Sub-Categories</h3>
              {categories
                .filter(c => c.parent_id && !parentCategories.find(p => p.id === c.parent_id))
                .map(cat => (
                  <div key={cat.id} className="flex items-center justify-between py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{cat.code}</span>
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <button onClick={() => openEdit(cat)} className="text-teal-500 p-1">
                      <Pencil size={12} />
                    </button>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12">
          <div className="empty-state">
            <FolderTree size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No item categories yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Click &quot;Add Category&quot; to create your first category
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
