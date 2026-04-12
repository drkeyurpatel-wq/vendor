'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Settings2, Upload, Loader2,
  CheckCircle2, XCircle, Clock, Database, Package, Users,
  FileText, CreditCard, AlertTriangle, RotateCcw, ChevronDown, ChevronUp
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TallyConfig {
  id: string
  company_name: string
  purchase_ledger_pharmacy: string
  purchase_ledger_surgical: string
  purchase_ledger_general: string
  cgst_input_ledger: string
  sgst_input_ledger: string
  igst_input_ledger: string
  bank_ledger: string | null
  cash_ledger: string
  round_off_ledger: string
  tds_payable_ledger: string
  sync_enabled: boolean
  last_sync_at: string | null
  last_sync_status: string | null
}

interface DashboardData {
  config: { company_name: string; sync_enabled: boolean; last_sync_at: string | null; last_sync_status: string | null } | null
  stats: {
    pending: number; processing: number; success: number; failed: number; skipped: number
    by_type: Record<string, { pending: number; success: number; failed: number }>
  }
  coverage: {
    vendors: { total: number; synced: number }
    items: { total: number; synced: number }
    invoices: { total: number; synced: number }
  }
  recent_logs: any[]
  failed_items: { id: string; entity_type: string; entity_ref: string; error_message: string; retry_count: number; created_at: string }[]
}

export default function TallySettingsPage() {
  const [tab, setTab] = useState<'dashboard' | 'config'>('dashboard')
  const [config, setConfig] = useState<TallyConfig | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(false)

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/tally/dashboard')
      if (res.ok) {
        const data = await res.json()
        setDashboard(data)
      }
    } catch { /* ignore */ }
  }, [])

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/tally/config')
      if (res.ok) {
        const data = await res.json()
        setConfig(data.config)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    Promise.all([loadDashboard(), loadConfig()]).finally(() => setLoading(false))
  }, [loadDashboard, loadConfig])

  async function saveConfig() {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/tally/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (res.ok) {
        toast.success('Tally config saved')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Save failed')
      }
    } catch {
      toast.error('Network error')
    }
    setSaving(false)
  }

  async function enqueue(entityType: string) {
    setSyncing(entityType)
    try {
      const res = await fetch('/api/tally/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: entityType }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.queued} items queued for sync`)
        loadDashboard()
      } else {
        toast.error(data.error || 'Enqueue failed')
      }
    } catch {
      toast.error('Network error')
    }
    setSyncing(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    )
  }

  const SYNC_ACTIONS = [
    { key: 'vendor_ledger', label: 'Vendor Ledgers', icon: Users, description: 'Sync active vendors as Tally ledgers', color: 'text-teal-600 bg-teal-50' },
    { key: 'stock_item', label: 'Stock Items', icon: Package, description: 'Sync items + stock groups to Tally', color: 'text-orange-600 bg-orange-50' },
    { key: 'purchase_voucher', label: 'Purchase Vouchers', icon: FileText, description: 'Push approved invoices as purchase bills', color: 'text-blue-600 bg-blue-50' },
    { key: 'payment_voucher', label: 'Payment Vouchers', icon: CreditCard, description: 'Push processed payment batches', color: 'text-purple-600 bg-purple-50' },
    { key: 'debit_note', label: 'Debit Notes', icon: FileText, description: 'Push debit notes to Tally', color: 'text-red-600 bg-red-50' },
    { key: 'credit_note', label: 'Credit Notes', icon: FileText, description: 'Push credit notes to Tally', color: 'text-green-600 bg-green-50' },
  ]

  const d = dashboard

  return (
    <div>
      <Link href="/settings" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Tally Integration</h1>
          <p className="page-subtitle">
            {d?.config?.company_name || 'Not configured'} · Queue-based sync via desktop agent
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('dashboard')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Dashboard
          </button>
          <button onClick={() => setTab('config')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'config' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Settings2 size={14} className="inline mr-1" />Config
          </button>
        </div>
      </div>

      {tab === 'dashboard' && d && (
        <>
          {/* Status bar */}
          <div className={`rounded-xl p-4 mb-6 flex items-center gap-3 ${d.config?.sync_enabled ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${d.config?.sync_enabled ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <div className="flex-1">
              <span className="text-sm font-medium">{d.config?.sync_enabled ? 'Sync Enabled' : 'Sync Disabled'}</span>
              {d.config?.last_sync_at && (
                <span className="text-xs text-gray-500 ml-3">
                  Last sync: {new Date(d.config.last_sync_at).toLocaleString('en-IN')}
                  {d.config.last_sync_status && ` (${d.config.last_sync_status})`}
                </span>
              )}
            </div>
            {!d.config?.sync_enabled && (
              <span className="text-xs text-yellow-700">Enable in Config tab → run desktop agent</span>
            )}
          </div>

          {/* Queue stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Pending', value: d.stats.pending, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'Processing', value: d.stats.processing, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Success', value: d.stats.success, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Failed', value: d.stats.failed, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Skipped', value: d.stats.skipped, color: 'text-gray-500', bg: 'bg-gray-50' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Coverage */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Vendors', icon: Users, ...d.coverage.vendors },
              { label: 'Items', icon: Package, ...d.coverage.items },
              { label: 'Invoices', icon: FileText, ...d.coverage.invoices },
            ].map(c => {
              const Icon = c.icon
              const pct = c.total > 0 ? Math.round((c.synced / c.total) * 100) : 0
              return (
                <div key={c.label} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{c.label}</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="text-lg font-bold text-gray-800">{c.synced}</span>
                    <span className="text-sm text-gray-400">/ {c.total}</span>
                    <span className="text-xs text-gray-400 ml-auto">{pct}%</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Sync Actions */}
          <h3 className="font-semibold text-gray-700 mb-3">Queue for Sync</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {SYNC_ACTIONS.map(action => {
              const Icon = action.icon
              const isRunning = syncing === action.key
              const typeStats = d.stats.by_type[action.key]
              return (
                <div key={action.key} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900">{action.label}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">{action.description}</p>
                      {typeStats && (
                        <div className="flex gap-2 mt-1.5 text-[10px]">
                          {typeStats.pending > 0 && <span className="text-yellow-600">{typeStats.pending} pending</span>}
                          {typeStats.success > 0 && <span className="text-green-600">{typeStats.success} done</span>}
                          {typeStats.failed > 0 && <span className="text-red-600">{typeStats.failed} failed</span>}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => enqueue(action.key)}
                      disabled={isRunning || syncing !== null}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                    >
                      {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                      Queue
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Failed items */}
          {d.failed_items.length > 0 && (
            <div className="card overflow-hidden mb-6">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-500" />
                <h3 className="font-semibold text-red-600">Failed Items ({d.failed_items.length})</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {d.failed_items.map(item => (
                  <div key={item.id} className="px-5 py-3 flex items-center gap-3">
                    <XCircle size={14} className="text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {item.entity_type.replace(/_/g, ' ')} — {item.entity_ref}
                      </div>
                      <div className="text-xs text-red-500 truncate">{item.error_message}</div>
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">Retry {item.retry_count}/3</span>
                    <button className="text-xs text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0">
                      <RotateCcw size={10} /> Retry
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent sync logs */}
          {d.recent_logs.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-700">Recent Sync Runs</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {d.recent_logs.map((log: any) => (
                  <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                    {log.failed_count > 0
                      ? <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
                      : <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />}
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">{log.total_items} items</span>
                      <span className="text-green-600 text-xs ml-2">✓ {log.success_count}</span>
                      {log.failed_count > 0 && <span className="text-red-600 text-xs ml-1">✗ {log.failed_count}</span>}
                    </div>
                    <span className="text-[10px] text-gray-500 flex-shrink-0">
                      {new Date(log.started_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {d.stats.pending === 0 && d.stats.success === 0 && d.stats.failed === 0 && (
            <div className="card p-8 text-center">
              <Clock size={28} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-1">No sync activity yet</p>
              <p className="text-xs text-gray-400">Use the Queue buttons above to add items, then run the desktop agent</p>
            </div>
          )}
        </>
      )}

      {tab === 'config' && config && (
        <div className="space-y-6">
          {/* Company */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Database size={14} /> Company & Sync
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Tally Company Name (exact match)</label>
                <input
                  value={config.company_name}
                  onChange={e => setConfig({ ...config, company_name: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.sync_enabled}
                    onChange={e => setConfig({ ...config, sync_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Sync</span>
                </label>
              </div>
            </div>
          </div>

          {/* Ledger Mapping */}
          <div className="card p-5">
            <button onClick={() => setConfigOpen(!configOpen)} className="w-full flex items-center justify-between text-left">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <Settings2 size={14} /> Tally Ledger Names
              </h3>
              {configOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {configOpen && (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-gray-500">Must match exactly as they appear in Tally Prime. The agent auto-discovers these on first connect.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {([
                    { key: 'purchase_ledger_pharmacy', label: 'Purchase - Pharmacy' },
                    { key: 'purchase_ledger_surgical', label: 'Purchase - Surgical' },
                    { key: 'purchase_ledger_general', label: 'Purchase - General' },
                    { key: 'cgst_input_ledger', label: 'CGST Input' },
                    { key: 'sgst_input_ledger', label: 'SGST Input' },
                    { key: 'igst_input_ledger', label: 'IGST Input' },
                    { key: 'bank_ledger', label: 'Bank Account' },
                    { key: 'cash_ledger', label: 'Cash' },
                    { key: 'tds_payable_ledger', label: 'TDS Payable' },
                    { key: 'round_off_ledger', label: 'Round Off' },
                  ] as const).map(field => (
                    <div key={field.key}>
                      <label className="text-[11px] font-medium text-gray-500 block mb-1">{field.label}</label>
                      <input
                        value={(config as any)[field.key] || ''}
                        onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
                        className="input w-full text-sm"
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button onClick={saveConfig} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>

          {/* Agent instructions */}
          <div className="card p-5 bg-slate-50 border border-slate-200">
            <h3 className="font-semibold text-gray-700 mb-3">Desktop Agent Setup</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>In Tally Prime → <strong>F12</strong> → Advanced → <strong>Enable HTTP Server = Yes</strong>, Port <strong>9000</strong></li>
              <li>Download <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">tally-bridge-agent.exe</code> to the Tally desktop</li>
              <li>Create a <code className="bg-slate-200 px-1.5 py-0.5 rounded text-xs font-mono">.env</code> file next to the exe:</li>
            </ol>
            <pre className="bg-gray-800 text-green-400 p-3 rounded-lg text-xs overflow-x-auto mt-3 font-mono leading-relaxed">
{`SUPABASE_URL=https://dwukvdtacwvnudqjlwrb.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key-from-supabase>
TALLY_URL=http://localhost:9000
CENTRE_ID=a03bc252-5a33-41e7-85aa-4a63524d814b`}
            </pre>
            <ol start={4} className="text-sm text-gray-600 space-y-2 list-decimal list-inside mt-3">
              <li>Double-click the exe or add to <strong>Windows Task Scheduler</strong> for daily runs</li>
            </ol>
          </div>
        </div>
      )}

      {tab === 'config' && !config && (
        <div className="card p-8 text-center">
          <Database size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-sm text-gray-500">No configuration found. Run the database migration first.</p>
        </div>
      )}
    </div>
  )
}
