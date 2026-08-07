import {
  rankQuotes,
  lowestRatePerItem,
  awardBlockedReason,
  isDeadlinePassed,
  type ComparableQuote,
} from '@/lib/rfq'

function quote(over: Partial<ComparableQuote> & { id: string }): ComparableQuote {
  return {
    vendor_id: `v-${over.id}`,
    vendor_name: `Vendor ${over.id}`,
    status: 'submitted',
    total_amount: 0,
    delivery_timeline_days: null,
    payment_terms: null,
    validity_days: 30,
    items: [],
    ...over,
  }
}

describe('rankQuotes', () => {
  it('returns an empty list for no quotes', () => {
    expect(rankQuotes([])).toEqual([])
  })

  it('ranks cheapest first', () => {
    const ranked = rankQuotes([
      quote({ id: 'b', total_amount: 15000 }),
      quote({ id: 'a', total_amount: 10000 }),
      quote({ id: 'c', total_amount: 20000 }),
    ])
    expect(ranked.map(q => q.id)).toEqual(['a', 'b', 'c'])
    expect(ranked.map(q => q.rank)).toEqual([1, 2, 3])
  })

  it('marks only the cheapest as lowest', () => {
    const ranked = rankQuotes([
      quote({ id: 'a', total_amount: 10000 }),
      quote({ id: 'b', total_amount: 12000 }),
    ])
    expect(ranked[0].isLowest).toBe(true)
    expect(ranked[1].isLowest).toBe(false)
  })

  it('computes the gap to the cheapest quote', () => {
    const ranked = rankQuotes([
      quote({ id: 'a', total_amount: 10000 }),
      quote({ id: 'b', total_amount: 12500 }),
    ])
    expect(ranked[0].deltaFromBest).toBe(0)
    expect(ranked[0].deltaPercent).toBe(0)
    expect(ranked[1].deltaFromBest).toBe(2500)
    expect(ranked[1].deltaPercent).toBe(25)
  })

  it('rounds the percentage gap to two decimals', () => {
    const ranked = rankQuotes([
      quote({ id: 'a', total_amount: 3000 }),
      quote({ id: 'b', total_amount: 3100 }),
    ])
    expect(ranked[1].deltaPercent).toBe(3.33)
  })

  it('gives tied totals the same rank', () => {
    const ranked = rankQuotes([
      quote({ id: 'a', total_amount: 10000 }),
      quote({ id: 'b', total_amount: 10000 }),
      quote({ id: 'c', total_amount: 11000 }),
    ])
    expect(ranked.map(q => q.rank)).toEqual([1, 1, 3])
    expect(ranked[0].isLowest).toBe(true)
    expect(ranked[1].isLowest).toBe(true)
  })

  // A quote with no total has not been priced. Treating a null as zero would
  // let an empty submission beat every real bid.
  it('never ranks an unpriced quote first', () => {
    const ranked = rankQuotes([
      quote({ id: 'empty', total_amount: null }),
      quote({ id: 'real', total_amount: 9000 }),
    ])
    expect(ranked[0].id).toBe('real')
    expect(ranked[0].rank).toBe(1)
    const empty = ranked.find(q => q.id === 'empty')!
    expect(empty.rank).toBe(0)
    expect(empty.isLowest).toBe(false)
  })

  it('treats a zero total as unpriced', () => {
    const ranked = rankQuotes([
      quote({ id: 'zero', total_amount: 0 }),
      quote({ id: 'real', total_amount: 500 }),
    ])
    expect(ranked[0].id).toBe('real')
    expect(ranked.find(q => q.id === 'zero')!.rank).toBe(0)
  })

  it('does not mutate the input array', () => {
    const input = [quote({ id: 'b', total_amount: 200 }), quote({ id: 'a', total_amount: 100 })]
    rankQuotes(input)
    expect(input.map(q => q.id)).toEqual(['b', 'a'])
  })
})

describe('lowestRatePerItem', () => {
  it('picks the lowest unit rate per line', () => {
    const lowest = lowestRatePerItem([
      quote({
        id: 'a',
        total_amount: 100,
        items: [
          { rfq_item_id: 'i1', unit_rate: 10, total_amount: 100 },
          { rfq_item_id: 'i2', unit_rate: 50, total_amount: 500 },
        ],
      }),
      quote({
        id: 'b',
        total_amount: 120,
        items: [
          { rfq_item_id: 'i1', unit_rate: 8, total_amount: 80 },
          { rfq_item_id: 'i2', unit_rate: 60, total_amount: 600 },
        ],
      }),
    ])
    expect(lowest.get('i1')).toBe(8)
    expect(lowest.get('i2')).toBe(50)
  })

  it('ignores unpriced lines', () => {
    const lowest = lowestRatePerItem([
      quote({ id: 'a', items: [{ rfq_item_id: 'i1', unit_rate: 0, total_amount: 0 }] }),
      quote({ id: 'b', items: [{ rfq_item_id: 'i1', unit_rate: 25, total_amount: 25 }] }),
    ])
    expect(lowest.get('i1')).toBe(25)
  })

  it('returns an empty map when nothing is priced', () => {
    expect(lowestRatePerItem([]).size).toBe(0)
  })
})

describe('awardBlockedReason', () => {
  it('allows awarding a submitted quote on an open RFQ', () => {
    expect(awardBlockedReason('open', 'submitted')).toBeNull()
  })

  it('allows awarding during evaluation', () => {
    expect(awardBlockedReason('evaluation', 'shortlisted')).toBeNull()
  })

  it('refuses to award an RFQ twice', () => {
    expect(awardBlockedReason('awarded', 'submitted')).toMatch(/already been awarded/)
  })

  it('refuses a cancelled RFQ', () => {
    expect(awardBlockedReason('cancelled', 'submitted')).toMatch(/cancelled/)
  })

  it('refuses a draft RFQ', () => {
    expect(awardBlockedReason('draft', 'submitted')).toMatch(/Publish/)
  })

  it('refuses a quote that is still a draft', () => {
    expect(awardBlockedReason('open', 'draft')).toMatch(/not been submitted/)
  })

  it('refuses a rejected quote', () => {
    expect(awardBlockedReason('open', 'rejected')).toMatch(/rejected/)
  })

  it('refuses a quote that does not belong to the RFQ', () => {
    expect(awardBlockedReason('open', undefined)).toMatch(/does not belong/)
  })
})

describe('isDeadlinePassed', () => {
  const now = new Date('2026-08-07T12:00:00Z')

  it('is true for a past deadline', () => {
    expect(isDeadlinePassed('2026-08-06T12:00:00Z', now)).toBe(true)
  })

  it('is false for a future deadline', () => {
    expect(isDeadlinePassed('2026-08-08T12:00:00Z', now)).toBe(false)
  })

  it('treats an unparseable deadline as not passed', () => {
    expect(isDeadlinePassed('not-a-date', now)).toBe(false)
  })
})
