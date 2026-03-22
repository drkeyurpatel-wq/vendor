'use client'

import { SpendByCentreChart, POPipelineChart, CreditAgingChart } from '@/components/dashboard/DashboardCharts'

interface DashboardChartsWrapperProps {
  centreData: { centre: string; amount: number }[]
  pipelineData?: { status: string; count: number; label: string }[]
  agingData?: { bucket: string; amount: number; color: string }[]
}

export default function DashboardChartsWrapper({ centreData, pipelineData, agingData }: DashboardChartsWrapperProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <SpendByCentreChart data={centreData} />
      {pipelineData && pipelineData.length > 0 && (
        <POPipelineChart data={pipelineData} />
      )}
      {agingData && agingData.some(d => d.amount > 0) && (
        <div className="lg:col-span-2">
          <CreditAgingChart data={agingData} />
        </div>
      )}
    </div>
  )
}
