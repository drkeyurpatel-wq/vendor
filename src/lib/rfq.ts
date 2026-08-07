/**
 * RFQ evaluation helpers.
 *
 * Comparison maths lives here rather than in the page so it can be tested
 * directly — an award decision moves real money, and a ranking bug would be
 * invisible in a rendered table.
 */

export const RFQ_STATUSES = ['draft', 'open', 'evaluation', 'awarded', 'cancelled', 'closed'] as const
export type RFQStatus = (typeof RFQ_STATUSES)[number]

export const QUOTE_STATUSES = [
  'draft', 'submitted', 'under_evaluation', 'shortlisted', 'awarded', 'rejected',
] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

/** Quote statuses that represent a real, comparable submission. */
export const COMPARABLE_QUOTE_STATUSES: QuoteStatus[] = [
  'submitted', 'under_evaluation', 'shortlisted', 'awarded',
]

export interface QuoteLine {
  rfq_item_id: string
  unit_rate: number
  total_amount: number
}

export interface ComparableQuote {
  id: string
  vendor_id: string
  vendor_name: string
  status: QuoteStatus
  total_amount: number | null
  delivery_timeline_days: number | null
  payment_terms: string | null
  validity_days: number | null
  items: QuoteLine[]
}

export interface RankedQuote extends ComparableQuote {
  /** 1 = lowest total. Ties share a rank, as in standard competition ranking. */
  rank: number
  /** Amount above the lowest quote. 0 for the winner(s). */
  deltaFromBest: number
  /** Percentage above the lowest quote. 0 for the winner(s). */
  deltaPercent: number
  isLowest: boolean
}

/**
 * Rank quotes cheapest-first.
 *
 * Quotes with no total are pushed to the end and never rank first — a missing
 * total means the vendor has not actually priced the RFQ, and treating it as
 * zero would make it win.
 */
export function rankQuotes(quotes: ComparableQuote[]): RankedQuote[] {
  const priced = quotes.filter(q => typeof q.total_amount === 'number' && q.total_amount > 0)
  const unpriced = quotes.filter(q => !(typeof q.total_amount === 'number' && q.total_amount > 0))

  const sorted = [...priced].sort((a, b) => (a.total_amount as number) - (b.total_amount as number))
  const best = sorted.length > 0 ? (sorted[0].total_amount as number) : 0

  const ranked: RankedQuote[] = []
  sorted.forEach((q, idx) => {
    const total = q.total_amount as number
    // Standard competition ranking: equal totals share the earlier rank.
    const prev = ranked[idx - 1]
    const rank = prev && prev.total_amount === total ? prev.rank : idx + 1
    ranked.push({
      ...q,
      rank,
      deltaFromBest: round2(total - best),
      deltaPercent: best > 0 ? round2(((total - best) / best) * 100) : 0,
      isLowest: total === best,
    })
  })

  unpriced.forEach(q => {
    ranked.push({ ...q, rank: 0, deltaFromBest: 0, deltaPercent: 0, isLowest: false })
  })

  return ranked
}

/**
 * Lowest unit rate per RFQ line across all quotes, for per-line highlighting.
 * Returns a map of rfq_item_id -> lowest unit_rate.
 */
export function lowestRatePerItem(quotes: ComparableQuote[]): Map<string, number> {
  const lowest = new Map<string, number>()
  for (const quote of quotes) {
    for (const line of quote.items) {
      if (!(line.unit_rate > 0)) continue
      const current = lowest.get(line.rfq_item_id)
      if (current === undefined || line.unit_rate < current) {
        lowest.set(line.rfq_item_id, line.unit_rate)
      }
    }
  }
  return lowest
}

/**
 * An RFQ can be awarded only once, and only from a state where evaluation is
 * meaningful. Returns null when the award is allowed, or the reason it is not.
 */
export function awardBlockedReason(
  rfqStatus: string,
  quoteStatus: string | undefined
): string | null {
  if (rfqStatus === 'awarded') return 'This RFQ has already been awarded.'
  if (rfqStatus === 'cancelled') return 'This RFQ was cancelled.'
  if (rfqStatus === 'draft') return 'Publish the RFQ before awarding it.'
  if (!quoteStatus) return 'That quote does not belong to this RFQ.'
  if (quoteStatus === 'draft') return 'That quote has not been submitted yet.'
  if (quoteStatus === 'rejected') return 'That quote was rejected.'
  return null
}

/** Deadline has passed, so vendors can no longer submit. */
export function isDeadlinePassed(deadline: string, now: Date = new Date()): boolean {
  const parsed = new Date(deadline)
  if (Number.isNaN(parsed.getTime())) return false
  return parsed.getTime() < now.getTime()
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
