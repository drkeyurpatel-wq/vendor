'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Edit, Power, PowerOff, Save, Loader2, AlertTriangle, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import Link from 'next/link'

interface Props {
  itemId: string
  itemCode: string
  itemName: string
  isActive: boolean
  userRole: string
  stockLevels: Array<{
    id: string
    centre_id: string
    centre_code: string
    centre_name: string
    current_stock: number
    reorder_level: number
    max_level: number
    unit: string
  }>
}

export default function ItemDetailActions({ itemId, itemCode, itemName, isActive, userRole, stockLevels }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showDeactivate, setShowDeactivate] = useState(false)
  const [comment, setComment] = useState('')
  const [editingReorder, setEditingReorder] = useState<string | null>(null)
  const [reorderVal, setReorderVal] = useState('')
  const [maxVal, setMaxVal] = useState('')
  const [saving, setSaving] = useState(false)

  const canEdit = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)
  const canDeactivate = ['group_admin', 'group_cao'].includes(userRole)

  async function toggleActive() {
    const { error } = await supabase.from('items').update({
      is_active: !isActive,
      updated_at: new Date().toISOString(),
    }).eq('id', itemId)

    if (error) { toast.error(error.message); return }

    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'item', entity_id: itemId,
        action: isActive ? 'item_deactivated' : 'item_reactivated',
        details: { item_code: itemCode, reason: comment || null },
      })
    } catch {}

    toast.success(`${itemCode} ${isActive ? 'deactivated' : 'reactivated'}`)
    setShowDeactivate(false)
    setComment('')
    router.refresh()
  }

  async function saveReorderLevels(stockId: string, centreCode: string) {
    const reorder = parseInt(reorderVal)
    const max = parseInt(maxVal)
    if (isNaN(reorder) || reorder < 0) { toast.error('Invalid reorder level'); return }
    if (isNaN(max) || max < reorder) { toast.error('Max must be ≥ reorder level'); return }

    setSaving(true)
    const { error } = await supabase.from('item_centre_stock').update({
      reorder_level: reorder,
      max_level: max,
      updated_at: new Date().toISOString(),
    }).eq('id', stockId)

    if (error) { toast.error(error.message); setSaving(false); return }

    toast.success(`Reorder levels updated for ${centreCode}`)
    setSaving(false)
    setEditingReorder(null)
    router.refresh()
  }

  if (!canEdit) return null

  return (
    <>
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={`/items/new?clone=${itemId}`} className="btn-primary text-sm">
          <Edit size={14} /> Edit Item
        </Link>

        {canDeactivate && (
          <button onClick={() => setShowDeactivate(true)}
            className={`text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'
            }`}>
            {isActive ? <><PowerOff size={14} className="inline mr-1" /> Deactivate</> : <><Power size={14} className="inline mr-1" /> Reactivate</>}
          </button>
        )}
      </div>

      {/* Editable reorder levels per centre */}
      {stockLevels.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-navy-600 flex items-center gap-2"><Package size={16} /> Reorder Configuration</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Centre</th>
                  <th>Current Stock</th>
                  <th>Reorder Level</th>
                  <th>Max Level</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map(sl => {
                  const isEditing = editingReorder === sl.id
                  const isLow = sl.current_stock <= sl.reorder_level && sl.reorder_level > 0
                  const isOut = sl.current_stock <= 0 && sl.reorder_level > 0
                  return (
                    <tr key={sl.id}>
                      <td><span className="badge bg-blue-50 text-blue-700">{sl.centre_code} — {sl.centre_name}</span></td>
                      <td className={`text-sm font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-yellow-600' : 'text-gray-900'}`}>
                        {sl.current_stock} {sl.unit}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" min="0" className="form-input w-20 text-sm text-center" value={reorderVal}
                            onChange={e => setReorderVal(e.target.value)} autoFocus />
                        ) : (
                          <span className="text-sm text-gray-700">{sl.reorder_level} {sl.unit}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="number" min="0" className="form-input w-20 text-sm text-center" value={maxVal}
                            onChange={e => setMaxVal(e.target.value)} />
                        ) : (
                          <span className="text-sm text-gray-500">{sl.max_level || '—'} {sl.unit}</span>
                        )}
                      </td>
                      <td>
                        {isOut ? (
                          <span className="badge bg-red-100 text-red-800">OUT</span>
                        ) : isLow ? (
                          <span className="badge bg-yellow-100 text-yellow-800">LOW</span>
                        ) : (
                          <span className="badge bg-green-100 text-green-800">OK</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div className="flex gap-1">
                            <button onClick={() => saveReorderLevels(sl.id, sl.centre_code)} disabled={saving}
                              className="text-xs px-2 py-1 bg-teal-600 text-white rounded hover:bg-teal-700">
                              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                            </button>
                            <button onClick={() => setEditingReorder(null)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingReorder(sl.id); setReorderVal(String(sl.reorder_level)); setMaxVal(String(sl.max_level || 0)) }}
                            className="text-xs text-teal-600 hover:underline">Edit</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deactivate dialog */}
      <ConfirmDialog
        open={showDeactivate}
        onClose={() => setShowDeactivate(false)}
        title={isActive ? 'Deactivate Item' : 'Reactivate Item'}
        description={isActive
          ? `Deactivating ${itemCode} — ${itemName} will prevent it from being added to new POs. Existing POs are not affected.`
          : `Reactivate ${itemCode} — ${itemName} to allow it in new purchase orders again.`}
        confirmLabel={isActive ? 'Deactivate' : 'Reactivate'}
        confirmVariant={isActive ? 'danger' : 'primary'}
        showCommentBox={isActive}
        requireComment={isActive}
        comment={comment}
        onCommentChange={setComment}
        onConfirm={toggleActive}
      />
    </>
  )
}
