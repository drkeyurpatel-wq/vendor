'use client'

import { CreditAgingChart } from '@/components/dashboard/DashboardCharts'

interface AgingChartsProps {
  agingData: { bucket: string; amount: number; color: string }[]
}

export default function CreditAgingCharts({ agingData }: AgingChartsProps) {
  return <CreditAgingChart data={agingData} />
}
