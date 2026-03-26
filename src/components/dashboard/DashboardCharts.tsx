'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, Legend
} from 'recharts'
import { cn, formatLakhs, formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

// ─── Colors ───────────────────────────────────────────────

const NAVY = '#1B3A6B'
const TEAL = '#0D7E8A'
const COLORS = ['#1B3A6B', '#0D7E8A', '#5AC1C9', '#849ECE', '#ADBFDF']
const STATUS_COLORS: Record<string, string> = {
  draft: '#94a3b8',
  pending_approval: '#eab308',
  approved: '#3b82f6',
  sent_to_vendor: '#8b5cf6',
  partially_received: '#f97316',
  fully_received: '#22c55e',
  cancelled: '#ef4444',
}

// ─── Chart Card Wrapper ───────────────────────────────────

function ChartCard({ title, subtitle, href, linkText, children, className }: {
  title: string
  subtitle?: string
  href?: string
  linkText?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200/80 shadow-card overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="text-xs text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 font-medium">
            {linkText || 'View all'} <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────

function CustomTooltip({ active, payload, label, valueFormatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-elevated px-3 py-2 text-xs">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-semibold text-gray-800">
            {valueFormatter ? valueFormatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── 1. Spend By Centre ───────────────────────────────────

export function SpendByCentreChart({ data }: {
  data: { centre: string; amount: number }[]
}) {
  if (!data?.length) return <div className="text-sm text-gray-500 text-center py-10">No spend data available</div>
  return (
    <ChartCard title="Spend by centre" subtitle="MTD purchase order value" href="/reports">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="centre"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatLakhs(v)}
          />
          <Tooltip content={<CustomTooltip valueFormatter={formatCurrency} />} />
          <Bar
            dataKey="amount"
            name="PO Value"
            fill={NAVY}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── 2. PO Pipeline Status ────────────────────────────────

export function POPipelineChart({ data }: {
  data: { status: string; count: number; label: string }[]
}) {
  if (!data?.length) return null

  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <ChartCard title="PO pipeline" subtitle={`${total} active purchase orders`} href="/purchase-orders">
      <div className="space-y-3">
        {data.map((item, i) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0
          return (
            <div key={item.status}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
                  />
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">{item.count}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out-expo"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: STATUS_COLORS[item.status] || '#94a3b8',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}

// ─── 3. Credit Aging Chart ────────────────────────────────

export function CreditAgingChart({ data }: {
  data: { bucket: string; amount: number; color: string }[]
}) {
  if (!data?.length) return null
  const total = data.reduce((s, d) => s + d.amount, 0)

  return (
    <ChartCard title="Payables aging" subtitle={`Total outstanding: ${formatLakhs(total)}`} href="/finance/credit">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="bucket"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatLakhs(v)}
          />
          <Tooltip content={<CustomTooltip valueFormatter={formatCurrency} />} />
          <Bar dataKey="amount" name="Outstanding" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

// ─── 4. Stat Card with Trend ──────────────────────────────

export function StatCard({ label, value, sub, icon, bg, href, trend, alert: hasAlert }: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  bg: string
  href: string
  trend?: { value: number; label: string }
  alert?: boolean
}) {
  const trendColor = !trend ? '' : trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-gray-500'
  const TrendIcon = !trend ? null : trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus

  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-card-hover transition-all duration-200 group relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-navy-50 to-transparent -translate-y-8 translate-x-8 pointer-events-none" />

      <div className="flex items-start justify-between mb-3 relative">
        <div className={cn('p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-105', bg)}>
          {icon}
        </div>
        {hasAlert && (
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse-dot" />
        )}
      </div>

      <div className="relative">
        <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
        <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500">{sub}</span>
          {trend && TrendIcon && (
            <span className={cn('flex items-center gap-0.5 text-[10px] font-semibold', trendColor)}>
              <TrendIcon size={10} />
              {Math.abs(trend.value)}% {trend.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── 5. Quick Actions Bar ─────────────────────────────────

export function QuickActions({ actions }: {
  actions: { href: string; icon: React.ReactNode; label: string; variant?: 'primary' | 'navy' | 'secondary' }[]
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {actions.map((action, i) => {
        const cls = action.variant === 'primary' ? 'btn-primary' : action.variant === 'navy' ? 'btn-navy' : 'btn-secondary'
        return (
          <Link key={i} href={action.href} className={cn(cls, 'text-sm')}>
            {action.icon}
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}

// ─── 6. Mini Table Card ───────────────────────────────────

export function MiniTableCard({ title, href, headers, rows, emptyMessage }: {
  title: string
  href?: string
  headers: string[]
  rows: React.ReactNode[][]
  emptyMessage?: string
}) {
  return (
    <ChartCard title={title} href={href}>
      {rows.length > 0 ? (
        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full">
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50/80 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-5 py-2.5 text-sm text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-sm text-gray-500">
          {emptyMessage || 'No data'}
        </div>
      )}
    </ChartCard>
  )
}
