'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#1B3A6B', '#0D7E8A', '#F59E0B', '#EF4444', '#8B5CF6']

export default function CentreSpendCharts({ chartData, centres }: { chartData: any[]; centres: string[] }) {
  if (chartData.length === 0) return null

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-navy-600 mb-4">Monthly Spend Trend by Centre</h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
          <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} />
          <Legend />
          {centres.map((c, i) => (
            <Bar key={c} dataKey={c} stackId="spend" fill={COLORS[i % COLORS.length]} radius={i === centres.length - 1 ? [4, 4, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
