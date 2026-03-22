'use client'

import { SpendByCentreChart, POPipelineChart, CreditAgingChart } from '@/components/dashboard/DashboardCharts'

interface ReportsChartsProps {
  centreData: { centre: string; amount: number }[]
  pipelineData: { status: string; count: number; label: string }[]
  agingData: { bucket: string; amount: number; color: string }[]
}

export default function ReportsCharts({ centreData, pipelineData, agingData }: ReportsChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendByCentreChart data={centreData} />
        <POPipelineChart data={pipelineData} />
      </div>
      <CreditAgingChart data={agingData} />
    </div>
  )
}
