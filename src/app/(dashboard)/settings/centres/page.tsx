import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils'
import { Building2 } from 'lucide-react'

export default async function CentresPage() {
  const supabase = await createClient()

  const { data: centres, count } = await supabase
    .from('centres')
    .select('*', { count: 'exact' })
    .order('code')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Centres</h1>
          <p className="page-subtitle">{count ?? 0} centres configured</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {centres && centres.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {centres.map((centre: any) => (
                  <tr key={centre.id}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-[#1B3A6B]">{centre.code}</span>
                    </td>
                    <td className="text-sm font-medium text-gray-900">{centre.name}</td>
                    <td className="text-sm text-gray-600">{centre.city || '—'}</td>
                    <td className="text-sm text-gray-600">{centre.state || '—'}</td>
                    <td className="text-sm text-gray-600">{centre.phone || '—'}</td>
                    <td className="text-sm text-gray-600">{centre.email || '—'}</td>
                    <td>
                      <span className={cn('badge', centre.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                        {centre.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Building2 size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No centres found</p>
            <p className="text-sm text-gray-400 mt-1">Centres need to be configured in the database</p>
          </div>
        )}
      </div>
    </div>
  )
}
