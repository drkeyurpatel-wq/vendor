import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Construction } from 'lucide-react'

export default async function ConsumptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div>
      <Link href="/items" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Items
      </Link>
      <div className="card p-12 text-center">
        <Construction size={48} className="mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Patient-Level Consumption</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          This module requires integration with the HMIS/EMR system for real-time patient-level item consumption tracking. 
          It will pull dispensing data from eClinicalWorks via the HL7 interface once the HMIS EMR module is live.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/items/stock" className="btn-primary text-sm">View Stock Levels</Link>
          <Link href="/reports" className="btn-secondary text-sm">Reports</Link>
        </div>
      </div>
    </div>
  )
}
