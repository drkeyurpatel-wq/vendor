import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransferForm from './TransferForm'

export default async function NewStockTransferPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: centres } = await supabase
    .from('centres')
    .select('id, code, name')
    .eq('is_active', true)
    .order('code')

  return (
    <TransferForm
      centres={centres ?? []}
      userCentreId={profile.centre_id}
    />
  )
}
