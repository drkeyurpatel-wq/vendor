// ============================================================
// H1 VPMS — Demand Forecasting Algorithms
// ============================================================

export interface MonthlyConsumption {
  month: string // YYYY-MM format
  qty: number
}

export interface ForecastResult {
  month: string
  predicted_qty: number
  confidence: 'high' | 'medium' | 'low'
  method: string
}

export interface ReorderAnalysis {
  reorder_point: number
  safety_stock: number
  eoq: number
  avg_daily_usage: number
  days_of_stock: number | null
  should_reorder: boolean
}

export interface DemandForecast {
  historical: MonthlyConsumption[]
  forecast: ForecastResult[]
  reorder: ReorderAnalysis
  seasonal_indices: number[]
  avg_monthly_consumption: number
}

/**
 * Simple Moving Average
 * Averages the last `period` data points
 */
export function calculateMovingAverage(data: number[], period: number): number {
  if (data.length === 0) return 0
  const effectivePeriod = Math.min(period, data.length)
  const slice = data.slice(-effectivePeriod)
  return slice.reduce((sum, val) => sum + val, 0) / effectivePeriod
}

/**
 * Weighted Moving Average
 * Applies higher weights to more recent data points
 */
export function calculateWeightedAverage(data: number[], weights: number[]): number {
  if (data.length === 0) return 0

  // Align weights to data length (use last N data points where N = weights length)
  const effectiveLen = Math.min(data.length, weights.length)
  const dataSlice = data.slice(-effectiveLen)
  const weightSlice = weights.slice(-effectiveLen)

  const totalWeight = weightSlice.reduce((sum, w) => sum + w, 0)
  if (totalWeight === 0) return 0

  const weightedSum = dataSlice.reduce((sum, val, i) => sum + val * weightSlice[i], 0)
  return weightedSum / totalWeight
}

/**
 * Seasonal Index Calculation
 * Detects monthly patterns by comparing each month's average to the overall average
 * Returns 12 indices (one per month), where 1.0 = average, >1.0 = above average
 */
export function calculateSeasonalIndex(monthlyData: number[]): number[] {
  if (monthlyData.length === 0) return new Array(12).fill(1.0)

  const overallAvg = monthlyData.reduce((s, v) => s + v, 0) / monthlyData.length
  if (overallAvg === 0) return new Array(12).fill(1.0)

  // Group data by month index (0-11)
  const monthBuckets: number[][] = Array.from({ length: 12 }, () => [])

  monthlyData.forEach((qty, i) => {
    const monthIdx = i % 12
    monthBuckets[monthIdx].push(qty)
  })

  return monthBuckets.map(bucket => {
    if (bucket.length === 0) return 1.0
    const monthAvg = bucket.reduce((s, v) => s + v, 0) / bucket.length
    return monthAvg / overallAvg
  })
}

/**
 * Forecast Demand
 * Uses a combination of weighted moving average and seasonal adjustment
 * to predict future demand for the specified number of months
 */
export function forecastDemand(
  historicalConsumption: MonthlyConsumption[],
  forecastMonths: number = 3
): ForecastResult[] {
  if (historicalConsumption.length === 0) {
    return Array.from({ length: forecastMonths }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() + i + 1)
      return {
        month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        predicted_qty: 0,
        confidence: 'low' as const,
        method: 'no_data',
      }
    })
  }

  const quantities = historicalConsumption.map(h => h.qty)
  const seasonalIndices = calculateSeasonalIndex(quantities)

  // Determine confidence based on data availability
  const dataMonths = quantities.length
  const getConfidence = (): 'high' | 'medium' | 'low' => {
    if (dataMonths >= 12) return 'high'
    if (dataMonths >= 6) return 'medium'
    return 'low'
  }

  // Generate weights: exponentially increasing for recent data
  const weights = quantities.map((_, i) => Math.pow(1.3, i))

  // Base forecast using weighted average
  const baseAvg = calculateWeightedAverage(quantities, weights)

  // Determine the last month in historical data to project forward
  const lastMonth = historicalConsumption[historicalConsumption.length - 1].month
  const [lastYear, lastMon] = lastMonth.split('-').map(Number)

  const results: ForecastResult[] = []

  for (let i = 1; i <= forecastMonths; i++) {
    const futureDate = new Date(lastYear, lastMon - 1 + i, 1)
    const futureMonth = futureDate.getMonth() // 0-indexed
    const seasonalFactor = seasonalIndices[futureMonth]

    const predicted = Math.round(baseAvg * seasonalFactor)

    results.push({
      month: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
      predicted_qty: Math.max(0, predicted),
      confidence: getConfidence(),
      method: dataMonths >= 6 ? 'weighted_seasonal' : 'weighted_average',
    })
  }

  return results
}

/**
 * Calculate Reorder Point
 * ROP = (Average Daily Usage x Lead Time in Days) + Safety Stock
 */
export function calculateReorderPoint(
  avgDailyUsage: number,
  leadTimeDays: number,
  safetyStockDays: number
): number {
  const safetyStock = avgDailyUsage * safetyStockDays
  return Math.ceil(avgDailyUsage * leadTimeDays + safetyStock)
}

/**
 * Economic Order Quantity (EOQ)
 * EOQ = sqrt((2 x Annual Demand x Order Cost) / Holding Cost per unit per year)
 */
export function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCost: number
): number {
  if (holdingCost <= 0 || annualDemand <= 0) return 0
  return Math.ceil(Math.sqrt((2 * annualDemand * orderCost) / holdingCost))
}

/**
 * Full demand analysis for an item
 */
export function analyzeDemand(
  historical: MonthlyConsumption[],
  currentStock: number,
  leadTimeDays: number = 14,
  safetyStockDays: number = 7,
  orderCost: number = 500, // default order processing cost in INR
  holdingCostPerUnit: number = 10 // default annual holding cost per unit
): DemandForecast {
  const quantities = historical.map(h => h.qty)
  const avgMonthly = quantities.length > 0
    ? quantities.reduce((s, v) => s + v, 0) / quantities.length
    : 0
  const avgDaily = avgMonthly / 30

  const annualDemand = avgMonthly * 12
  const eoq = calculateEOQ(annualDemand, orderCost, holdingCostPerUnit)
  const rop = calculateReorderPoint(avgDaily, leadTimeDays, safetyStockDays)
  const safetyStock = Math.ceil(avgDaily * safetyStockDays)
  const daysOfStock = avgDaily > 0 ? Math.round(currentStock / avgDaily) : null

  return {
    historical,
    forecast: forecastDemand(historical, 3),
    reorder: {
      reorder_point: rop,
      safety_stock: safetyStock,
      eoq,
      avg_daily_usage: Math.round(avgDaily * 100) / 100,
      days_of_stock: daysOfStock,
      should_reorder: currentStock <= rop,
    },
    seasonal_indices: calculateSeasonalIndex(quantities),
    avg_monthly_consumption: Math.round(avgMonthly * 100) / 100,
  }
}
