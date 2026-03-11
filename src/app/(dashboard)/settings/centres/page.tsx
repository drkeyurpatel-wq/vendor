import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Building2, MapPin, Phone, Mail, CheckCircle, XCircle, Shield } from 'lucide-react'
import CentreFormModal from './CentreFormModal'

export default async function CentresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['group_admin', 'group_cao'].includes(currentProfile.role)) {
    return (
      <div>
        <h1 className="page-title mb-4">Centre Management</h1>
        <div className="card p-12 text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-500">Access Restricted</p>
          <p className="text-sm text-gray-400 mt-1">Only Group Admin or Group CAO can view centre settings</p>
        </div>
      </div>
    )
  }

  const { data: centres } = await supabase
    .from('centres')
    .select('*')
    .order('code')

  const totalCentres = centres?.length ?? 0
  const activeCentres = centres?.filter(c => c.is_active).length ?? 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Centre Management</h1>
          <p className="page-subtitle">All Health1 hospital centres</p>
        </div>
        {currentProfile.role === 'group_admin' && (
          <CentreFormModal />
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
            {new Set(centres?.map(c => c.state).filter(Boolean)).size}
          </div>
        </div>
      </div>

      {/* Centre Cards */}
      {centres && centres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {centres.map((centre: any) => (
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
                  <div>
                    <span className="badge bg-[#1B3A6B] text-white font-mono text-xs">
                      {centre.code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-[#1B3A6B] text-base">{centre.name}</h3>
                  {currentProfile.role === 'group_admin' && (
                    <CentreFormModal editCentre={centre} />
                  )}
                </div>

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
                  <p className="text-sm text-gray-400 italic">No contact details configured</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12">
          <div className="empty-state">
            <Building2 size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No centres found</p>
            <p className="text-sm text-gray-400 mt-1">Click &quot;+ Add Centre&quot; above to add your first hospital centre</p>
          </div>
        </div>
      )}
    </div>
  )
}
