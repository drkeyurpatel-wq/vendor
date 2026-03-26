import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import TransferForm from './TransferForm'

export default async function NewTransferPage() {
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const { data: profile } = await supabase.from('user_profiles').select('id, role, centre_id').eq('id', user.id).single()
  if (!profile || !['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(role)) {
    return (
      <div>
        <Link href="/inventory/transfers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="card p-12 text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">You don't have permission to create transfers.</p>
        </div>
      </div>
    )
  }

  const { data: centres } = await supabase.from('centres').select('id, code, name').eq('is_active', true).order('code')

  return (
    <div className="max-w-4xl">
      <Link href="/inventory/transfers" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Transfers
      </Link>
      <h1 className="text-2xl font-bold text-navy-600 mb-6">New Inter-Centre Transfer</h1>
      <TransferForm centres={centres ?? []} userCentreId={centreId} />
    </div>
  )
}
