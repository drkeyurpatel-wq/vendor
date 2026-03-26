'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Wifi, WifiOff, RefreshCw, Upload, Download, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface SyncLog { id: string; type: string; status: string; message: string; timestamp: string; count?: number }

export default function TallySettingsPage() {
  const [testing, setTesting] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [logs, setLogs] = useState<SyncLog[]>([])

  async function testConnection() {
    setTesting(true)
    try {
      const res = await fetch('/api/tally/sync', { method: 'GET' })
      if (res.ok) {
        setConnected(true)
        toast.success('Tally server connected')
        addLog('connection_test', 'success', 'Connected to Tally server')
      } else {
        setConnected(false)
        toast.error('Cannot reach Tally server. Check TALLY_SERVER_URL env var.')
        addLog('connection_test', 'failed', 'Connection failed — check server URL and firewall')
      }
    } catch {
      setConnected(false)
      toast.error('Tally server unreachable')
      addLog('connection_test', 'failed', 'Network error — server unreachable')
    }
    setTesting(false)
  }

  async function runSync(type: 'push_pos' | 'push_invoices' | 'sync_vendors' | 'sync_items') {
    setSyncing(type)
    try {
      const endpoint = type.startsWith('push') ? '/api/tally/push' : '/api/tally/sync'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${type.replace(/_/g, ' ')} completed: ${data.count || 0} records`)
        addLog(type, 'success', `${data.count || 0} records synced`, data.count)
      } else {
        toast.error(data.error || 'Sync failed')
        addLog(type, 'failed', data.error || 'Unknown error')
      }
    } catch (err: any) {
      toast.error('Sync failed: ' + (err.message || 'Network error'))
      addLog(type, 'failed', err.message || 'Network error')
    }
    setSyncing(null)
  }

  function addLog(type: string, status: string, message: string, count?: number) {
    setLogs(prev => [{ id: Date.now().toString(), type, status, message, timestamp: new Date().toLocaleString('en-IN'), count }, ...prev].slice(0, 20))
  }

  const SYNC_ACTIONS = [
    { key: 'push_pos', label: 'Push POs to Tally', icon: Upload, description: 'Send approved POs as purchase vouchers', color: 'bg-blue-600 hover:bg-blue-700' },
    { key: 'push_invoices', label: 'Push Invoices to Tally', icon: Upload, description: 'Send matched invoices as purchase bills', color: 'bg-purple-600 hover:bg-purple-700' },
    { key: 'sync_vendors', label: 'Sync Vendors', icon: RefreshCw, description: 'Import/update vendor master from Tally', color: 'bg-teal-600 hover:bg-teal-700' },
    { key: 'sync_items', label: 'Sync Items', icon: Download, description: 'Import/update item master from Tally', color: 'bg-orange-600 hover:bg-orange-700' },
  ] as const

  return (
    <div>
      <Link href="/settings" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Settings
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Tally Integration</h1>
          <p className="page-subtitle">Push purchase data to Tally Prime and sync vendor/item masters</p>
        </div>
      </div>

      {/* Connection Status */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected === true ? 'bg-green-100' : connected === false ? 'bg-red-100' : 'bg-gray-100'}`}>
              {connected === true ? <Wifi size={20} className="text-green-600" /> : connected === false ? <WifiOff size={20} className="text-red-600" /> : <Wifi size={20} className="text-gray-500" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Tally Server Connection</h3>
              <p className="text-xs text-gray-500">
                {connected === true ? 'Connected — ready to sync' : connected === false ? 'Not connected — check TALLY_SERVER_URL' : 'Not tested'}
              </p>
            </div>
          </div>
          <button onClick={testConnection} disabled={testing} className="btn-primary text-sm">
            {testing ? <><Loader2 size={14} className="animate-spin" /> Testing...</> : 'Test Connection'}
          </button>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {SYNC_ACTIONS.map(action => {
          const Icon = action.icon
          const isRunning = syncing === action.key
          return (
            <div key={action.key} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center">
                    <Icon size={16} className="text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{action.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => runSync(action.key)}
                  disabled={isRunning || syncing !== null}
                  className={`text-sm px-3 py-1.5 rounded-lg text-white font-medium transition-colors ${action.color} disabled:opacity-50`}
                >
                  {isRunning ? <Loader2 size={14} className="animate-spin" /> : 'Run'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sync Log */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-navy-600">Sync Log</h3>
        </div>
        {logs.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                {log.status === 'success' ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" /> :
                  log.status === 'failed' ? <XCircle size={14} className="text-red-500 flex-shrink-0" /> :
                  <Clock size={14} className="text-gray-500 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{log.type.replace(/_/g, ' ')}</div>
                  <div className="text-xs text-gray-500">{log.message}</div>
                </div>
                {log.count != null && <span className="badge bg-blue-50 text-blue-700">{log.count} records</span>}
                <span className="text-[10px] text-gray-500 whitespace-nowrap">{log.timestamp}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Clock size={24} className="mx-auto text-gray-500 mb-2" />
            <p className="text-sm text-gray-500">No sync activity yet. Run a sync to see results.</p>
          </div>
        )}
      </div>

      {/* Configuration note */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
        <strong>Configuration:</strong> Set <code className="bg-yellow-100 px-1 rounded">TALLY_SERVER_URL</code> in Vercel environment variables to your Tally Prime HTTP API endpoint (default port 9000). Example: <code className="bg-yellow-100 px-1 rounded">http://192.168.1.100:9000</code>
      </div>
    </div>
  )
}
