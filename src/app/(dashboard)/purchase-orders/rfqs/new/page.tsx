'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ItemSearch from '@/components/ui/ItemSearch'
import FieldError from '@/components/ui/FieldError'

interface Line {
  key: string
  item_id: string | null
  description: string
  quantity: string
  unit: string
  specifications: string
}

function blankLine(): Line {
  return {
    key: Math.random().toString(36).slice(2),
    item_id: null,
    description: '',
    quantity: '',
    unit: '',
    specifications: '',
  }
}

/** Default deadline: one week out, which is the common turnaround for a quote. */
function defaultDeadline(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(17, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function NewRFQPage() {
  const router = useRouter()
  const supabase = createClient()

  const [saving, setSaving] = useState(false)
  const [centres, setCentres] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [centreId, setCentreId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [deadline, setDeadline] = useState(defaultDeadline())
  const [deliveryBy, setDeliveryBy] = useState('')
  const [terms, setTerms] = useState('')
  const [lines, setLines] = useState<Line[]>([blankLine()])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    supabase.from('centres').select('id, code, name').order('code').then(({ data }) => {
      if (data) setCentres(data)
    })
    supabase.from('vendor_categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data)
    })
  }, [])

  function updateLine(idx: number, patch: Partial<Line>) {
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines(prev => [...prev, blankLine()])
  }

  function removeLine(idx: number) {
    setLines(prev => (prev.length === 1 ? [blankLine()] : prev.filter((_, i) => i !== idx)))
  }

  const filledLines = lines.filter(l => l.description.trim() || l.quantity || l.unit.trim())

  function validate(): boolean {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Give the RFQ a title vendors will recognise'
    if (!deadline) next.deadline = 'Vendors need a submission deadline'
    else if (new Date(deadline).getTime() <= Date.now()) {
      next.deadline = 'The deadline must be in the future'
    }
    if (filledLines.length === 0) next.lines = 'Add at least one item to quote for'
    else {
      const bad = filledLines.find(
        l => !l.description.trim() || !(parseFloat(l.quantity) > 0) || !l.unit.trim()
      )
      if (bad) next.lines = 'Every item needs a description, a quantity above zero, and a unit'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent, status: 'draft' | 'open') {
    e.preventDefault()
    if (!validate()) {
      toast.error('Fix the highlighted fields')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          centre_id: centreId || null,
          category_id: categoryId || null,
          submission_deadline: new Date(deadline).toISOString(),
          delivery_required_by: deliveryBy || null,
          terms_and_conditions: terms.trim() || null,
          status,
          items: filledLines.map(l => ({
            item_id: l.item_id,
            description: l.description.trim(),
            quantity: parseFloat(l.quantity),
            unit: l.unit.trim(),
            specifications: l.specifications.trim() || null,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create the RFQ')

      toast.success(
        status === 'draft'
          ? `${data.rfq_number} saved as a draft`
          : `${data.rfq_number} is open — vendors can now quote`
      )
      router.push(`/purchase-orders/rfqs/${data.id}`)
    } catch (err: any) {
      toast.error(err.message || 'Could not create the RFQ')
      setSaving(false)
    }
  }

  return (
    <div>
      <Link
        href="/purchase-orders/rfqs"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer w-fit"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to RFQs
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">New Request for Quotation</h1>
          <p className="page-subtitle">
            Vendors in the selected category see this once it is open, and quote against the item list
          </p>
        </div>
      </div>

      <form onSubmit={e => handleSubmit(e, 'open')}>
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="rfq-title" className="form-label">
                Title <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                id="rfq-title"
                className="form-input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'rfq-title-error' : undefined}
                placeholder="e.g. Surgical gloves — Q3 quarterly requirement"
              />
              <FieldError id="rfq-title-error" message={errors.title} />
            </div>

            <div>
              <label htmlFor="rfq-centre" className="form-label">Centre</label>
              <select
                id="rfq-centre"
                className="form-select"
                value={centreId}
                onChange={e => setCentreId(e.target.value)}
              >
                <option value="">All centres</option>
                {centres.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="rfq-category" className="form-label">Vendor category</label>
              <select
                id="rfq-category"
                className="form-select"
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
              >
                <option value="">Every vendor</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only vendors in this category will see the RFQ in their portal.
              </p>
            </div>

            <div>
              <label htmlFor="rfq-deadline" className="form-label">
                Submission deadline <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                id="rfq-deadline"
                type="datetime-local"
                className="form-input"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                aria-invalid={!!errors.deadline}
                aria-describedby={errors.deadline ? 'rfq-deadline-error' : undefined}
              />
              <FieldError id="rfq-deadline-error" message={errors.deadline} />
            </div>

            <div>
              <label htmlFor="rfq-delivery" className="form-label">Delivery required by</label>
              <input
                id="rfq-delivery"
                type="date"
                className="form-input"
                value={deliveryBy}
                onChange={e => setDeliveryBy(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="rfq-description" className="form-label">Description</label>
              <textarea
                id="rfq-description"
                className="form-input"
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Anything vendors should know before quoting"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="rfq-terms" className="form-label">Terms and conditions</label>
              <textarea
                id="rfq-terms"
                className="form-input"
                rows={2}
                value={terms}
                onChange={e => setTerms(e.target.value)}
                placeholder="Payment terms, warranty, delivery expectations"
              />
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Items <span className="text-red-500 font-bold">*</span>
            </h2>
            <button type="button" onClick={addLine} className="btn-secondary text-sm cursor-pointer">
              <Plus size={14} aria-hidden="true" /> Add item
            </button>
          </div>

          <FieldError id="rfq-lines-error" message={errors.lines} />

          <div className="space-y-4 mt-2">
            {lines.map((line, idx) => (
              <div key={line.key} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Item {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    aria-label={`Remove item ${idx + 1}`}
                    className="text-gray-500 hover:text-red-600 transition-colors duration-150 cursor-pointer"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>

                <div className="mb-3">
                  <span className="form-label block">Pick from the item master (optional)</span>
                  <ItemSearch
                    onSelect={(selected: any) =>
                      updateLine(idx, {
                        item_id: selected.id,
                        description: selected.generic_name || selected.brand_name || '',
                        unit: selected.unit || '',
                      })
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank and type below for something not yet in the master.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label htmlFor={`line-desc-${line.key}`} className="form-label">Description</label>
                    <input
                      id={`line-desc-${line.key}`}
                      className="form-input"
                      value={line.description}
                      onChange={e => updateLine(idx, { description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor={`line-qty-${line.key}`} className="form-label">Quantity</label>
                    <input
                      id={`line-qty-${line.key}`}
                      type="number"
                      min="0"
                      step="any"
                      className="form-input"
                      value={line.quantity}
                      onChange={e => updateLine(idx, { quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor={`line-unit-${line.key}`} className="form-label">Unit</label>
                    <input
                      id={`line-unit-${line.key}`}
                      className="form-input"
                      value={line.unit}
                      onChange={e => updateLine(idx, { unit: e.target.value })}
                      placeholder="Box, Nos, Vial"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label htmlFor={`line-spec-${line.key}`} className="form-label">
                      Specifications
                    </label>
                    <input
                      id={`line-spec-${line.key}`}
                      className="form-input"
                      value={line.specifications}
                      onChange={e => updateLine(idx, { specifications: e.target.value })}
                      placeholder="Size, grade, sterility, packaging"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={saving} className="btn-primary text-sm cursor-pointer disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Save size={14} aria-hidden="true" />}
            {saving ? 'Saving...' : 'Publish to vendors'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={e => handleSubmit(e, 'draft')}
            className="btn-secondary text-sm cursor-pointer disabled:opacity-50"
          >
            Save as draft
          </button>
          <Link href="/purchase-orders/rfqs" className="btn-secondary text-sm cursor-pointer">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
