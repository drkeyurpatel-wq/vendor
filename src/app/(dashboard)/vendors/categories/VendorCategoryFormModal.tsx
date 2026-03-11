'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface VendorCategoryFormModalProps {
  editCategory?: {
    id: string
    name: string
    code: string
    description: string | null
    is_active: boolean
  } | null
}

export default function VendorCategoryFormModal({ editCategory }: VendorCategoryFormModalProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(editCategory?.name || '')
  const [code, setCode] = useState(editCategory?.code || '')
  const [description, setDescription] = useState(editCategory?.description || '')
  const [isActive, setIsActive] = useState(editCategory?.is_active ?? true)

  function resetForm() {
    if (editCategory) {
      setName(editCategory.name)
      setCode(editCategory.code)
      setDescription(editCategory.description || '')
      setIsActive(editCategory.is_active)
    } else {
      setName('')
      setCode('')
      setDescription('')
      setIsActive(true)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) { toast.error('Category name is required'); return }
    if (!code.trim()) { toast.error('Category code is required'); return }

    setLoading(true)

    const record = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      is_active: isActive,
    }

    if (editCategory) {
      const { error } = await supabase
        .from('vendor_categories')
        .update(record)
        .eq('id', editCategory.id)

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success('Category updated')
    } else {
      const { error } = await supabase
        .from('vendor_categories')
        .insert(record)

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('A category with this code already exists')
        } else {
          toast.error(error.message)
        }
        setLoading(false)
        return
      }
      toast.success('Category added')
    }

    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => { resetForm(); setOpen(true) }}
        className={editCategory ? 'text-xs text-[#0D7E8A] hover:underline font-medium' : 'btn-primary'}
      >
        {editCategory ? 'Edit' : '+ Add Category'}
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {editCategory ? 'Edit Vendor Category' : 'Add Vendor Category'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Code *</label>
                  <input
                    className="form-input uppercase"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. PHARMA"
                    maxLength={20}
                  />
                </div>
                <div>
                  <label className="form-label">Name *</label>
                  <input
                    className="form-input"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Pharmaceutical"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description of this vendor category"
                />
              </div>

              {editCategory && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="catActive" className="text-sm text-gray-700">Active</label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : editCategory ? 'Update Category' : 'Add Category'}
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
