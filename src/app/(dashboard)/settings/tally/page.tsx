'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, CheckCircle2, XCircle, RefreshCcw,
  Upload, Download, Server, Activity, FileText, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime } from '@/lib/utils'

interface SyncLogEntry {
  id: string
  action: string
  entity_type: string
  details: any
  created_at: string
}

interface ConnectionStatus {
  connected: boolean
  url?: string
  error?: string
  message?: string
}

export default function TallySettingsPage() {
  const supabase = createClient()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [testing, setTesting] = useState(false)
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [pushing, setPushing] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    loadSyncLogs()
  }, [])

  async function loadSyncLogs() {
    setLoadingLogs(true)
    const { data } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, details, created_at')
      .in('action', [
        'tally_push_success', 'tally_push_failed', 'tally_push_error',
        'tally_sync_success', 'tally_sync_failed', 'tally_sync_error',
        'tally_test_success', 'tally_test_failed',
      ])
      .order('created_at', { ascending: false })
      .limit(20)

    setSyncLogs(data || [])
    setLoadingLogs(false)
  }

  async function testConnection() {
    setTesting(true)
    setConnectionStatus(null)

    try {
      const res = await fetch('/api/tally/test')
      const data = await res.json()
      setConnectionStatus(data)

      // Log the test attempt
      try {
        await supabase.from('audit_logs').insert({
          action: data.connected ? 'tally_test_success' : 'tally_test_failed',
          entity_type: 'tally',
          details: data,
        })
      } catch {
        // Non-blocking
      }

      if (data.connected) {
        toast.success('Tally server is reachable')
      } else {
        toast.error(data.error || 'Connection failed')
      }
    } catch {
      setConnectionStatus({ connected: false, error: 'Network error' })
      toast.error('Failed to test connection')
    }

    setTesting(false)
    loadSyncLogs()
  }

  async function pushToTally(entityType: 'purchase_order' | 'invoice') {
    setPushing(entityType)

    try {
      // Fetch recent entities to push
      let entities: any[] = []
      if (entityType === 'purchase_order') {
        const { data } = await supabase
          .from('purchase_orders')
          .select('id')
          .in('status', ['approved', 'sent_to_vendor'])
          .is('tally_voucher_no', null)
          .order('created_at', { ascending: false })
          .limit(50)
        entities = data || []
      } else {
        const { data } = await supabase
          .from('invoices')
          .select('id')
          .eq('status', 'approved')
          .is('tally_voucher_no', null)
          .order('created_at', { ascending: false })
          .limit(50)
        entities = data || []
      }

      if (entities.length === 0) {
        toast('No new records to push to Tally', { icon: '📋' })
        setPushing(null)
        return
      }

      let successCount = 0
      let failCount = 0

      for (const entity of entities) {
        try {
          const res = await fetch('/api/tally/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entity_type: entityType, entity_id: entity.id }),
          })
          if (res.ok) {
            successCount++
          } else {
            failCount++
          }
        } catch {
          failCount++
        }
      }

      if (failCount === 0) {
        toast.success(`Pushed ${successCount} ${entityType === 'purchase_order' ? 'POs' : 'invoices'} to Tally`)
      } else {
        toast(`${successCount} pushed, ${failCount} failed`, { icon: '⚠️' })
      }
    } catch {
      toast.error('Push to Tally failed')
    }

    setPushing(null)
    loadSyncLogs()
  }

  async function syncMasters(type: 'vendors' | 'items') {
    setSyncing(type)

    try {
      const res = await fetch('/api/tally/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_type: type }),
      })
      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || `${type} synced to Tally successfully`)
      } else {
        toast.error(data.error || `Failed to sync ${type}`)
      }
    } catch {
      toast.error(`Network error during ${type} sync`)
    }

    setSyncing(null)
    loadSyncLogs()
  }

  function getLogStatusColor(action: string): string {
    if (action.includes('success')) return 'text-green-600 bg-green-50'
    if (action.includes('failed') || action.includes('error')) return 'text-red-600 bg-red-50'
    return 'text-gray-600 bg-gray-50'
  }

  function getLogStatusIcon(action: string) {
    if (action.includes('success')) return <CheckCircle2 size={14} className="text-green-500" />
    if (action.includes('failed') || action.includes('error')) return <XCircle size={14} className="text-red-500" />
    return <Activity size={14} className="text-gray-400" />
  }

  function formatAction(action: string): string {
    return action
      .replace('tally_', '')
      .replace('_', ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <div className="max-w-5xl">
      <div className="page-header">
        <div>
          <Link href="/settings/users" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft size={14} /> Settings
          </Link>
          <h1 className="page-title">Tally Integration</h1>
          <p className="page-subtitle">
            Connect VPMS with Tally Prime for accounting sync
          </p>
        </div>
      </div>

      {/* Connection Test */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Server size={18} className="text-[#1B3A6B]" /> Connection Status
          </h2>
          <button onClick={testConnection} disabled={testing} className="btn-primary">
            {testing ? (
              <><Loader2 size={16} className="animate-spin" /> Testing...</>
            ) : (
              <><RefreshCcw size={16} /> Test Connection</>
            )}
          </button>
        </div>

        {connectionStatus ? (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            connectionStatus.connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {connectionStatus.connected ? (
              <CheckCircle2 size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div className={`font-medium ${connectionStatus.connected ? 'text-green-800' : 'text-red-800'}`}>
                {connectionStatus.connected ? 'Connected' : 'Not Connected'}
              </div>
              <div className="text-sm text-gray-600 mt-0.5">
                {connectionStatus.message || connectionStatus.error}
              </div>
              {connectionStatus.url && (
                <div className="text-xs text-gray-500 font-mono mt-1">{connectionStatus.url}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-500">
            Click &quot;Test Connection&quot; to verify Tally server connectivity.
            Ensure Tally Prime is running with HTTP server enabled (default port 9000).
          </div>
        )}
      </div>

      {/* Sync Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Push to Tally */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Upload size={18} className="text-[#0D7E8A]" /> Push to Tally
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => pushToTally('purchase_order')}
              disabled={pushing !== null}
              className="btn-navy w-full justify-center"
            >
              {pushing === 'purchase_order' ? (
                <><Loader2 size={16} className="animate-spin" /> Pushing POs...</>
              ) : (
                <><FileText size={16} /> Push Purchase Orders</>
              )}
            </button>
            <button
              onClick={() => pushToTally('invoice')}
              disabled={pushing !== null}
              className="btn-navy w-full justify-center"
            >
              {pushing === 'invoice' ? (
                <><Loader2 size={16} className="animate-spin" /> Pushing Invoices...</>
              ) : (
                <><FileText size={16} /> Push Invoices</>
              )}
            </button>
            <p className="text-xs text-gray-400">
              Pushes approved POs/invoices that haven&apos;t been synced to Tally yet.
            </p>
          </div>
        </div>

        {/* Sync Masters */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Download size={18} className="text-[#0D7E8A]" /> Sync Masters
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => syncMasters('vendors')}
              disabled={syncing !== null}
              className="btn-navy w-full justify-center"
            >
              {syncing === 'vendors' ? (
                <><Loader2 size={16} className="animate-spin" /> Syncing Vendors...</>
              ) : (
                <><RefreshCcw size={16} /> Sync Vendor Ledgers</>
              )}
            </button>
            <button
              onClick={() => syncMasters('items')}
              disabled={syncing !== null}
              className="btn-navy w-full justify-center"
            >
              {syncing === 'items' ? (
                <><Loader2 size={16} className="animate-spin" /> Syncing Items...</>
              ) : (
                <><RefreshCcw size={16} /> Sync Stock Items</>
              )}
            </button>
            <p className="text-xs text-gray-400">
              Creates/updates vendor ledgers and stock items in Tally from VPMS master data.
            </p>
          </div>
        </div>
      </div>

      {/* Sync Log */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-[#1B3A6B] flex items-center gap-2">
            <Clock size={16} /> Sync Log
          </h2>
          <button onClick={loadSyncLogs} className="text-xs text-[#0D7E8A] hover:underline flex items-center gap-1">
            <RefreshCcw size={12} /> Refresh
          </button>
        </div>

        {loadingLogs ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={20} className="animate-spin text-gray-400" />
          </div>
        ) : syncLogs.length === 0 ? (
          <div className="empty-state py-12">
            <Activity size={36} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No sync activity yet</p>
            <p className="text-sm text-gray-400 mt-1">Tally sync attempts will appear here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {syncLogs.map(log => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                {getLogStatusIcon(log.action)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getLogStatusColor(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                    {log.entity_type && log.entity_type !== 'tally' && (
                      <span className="text-xs text-gray-500 capitalize">{log.entity_type.replace(/_/g, ' ')}</span>
                    )}
                  </div>
                  {log.details && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {typeof log.details === 'string'
                        ? log.details
                        : log.details.message || log.details.error || log.details.voucher_no
                          ? `${log.details.voucher_no ? `Voucher: ${log.details.voucher_no}` : ''}${log.details.error ? `Error: ${log.details.error}` : ''}${log.details.message || ''}`
                          : JSON.stringify(log.details).slice(0, 100)
                      }
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {formatDateTime(new Date(log.created_at))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
