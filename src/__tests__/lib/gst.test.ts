import { splitGst, lineTaxableAmount, isInterState, round2 } from '@/lib/gst'

describe('isInterState (place of supply)', () => {
  it('treats matching states as intra-state', () => {
    expect(isInterState('Gujarat', 'Gujarat')).toBe(false)
  })

  it('ignores case, spacing and punctuation', () => {
    expect(isInterState(' gujarat ', 'Gujarat')).toBe(false)
    expect(isInterState('GUJARAT', 'gujarat')).toBe(false)
  })

  it('detects a genuine inter-state supply', () => {
    // Udaipur is in Rajasthan; Gujarat vendors supplying it are inter-state.
    expect(isInterState('Gujarat', 'Rajasthan')).toBe(true)
  })

  it('defaults to intra-state when either state is unknown', () => {
    // We must not charge IGST on a guess.
    expect(isInterState(null, 'Gujarat')).toBe(false)
    expect(isInterState('Gujarat', undefined)).toBe(false)
    expect(isInterState('', '')).toBe(false)
  })
})

describe('lineTaxableAmount (CGST Act s.15(3)(a))', () => {
  it('is quantity x rate when there is no discount', () => {
    expect(lineTaxableAmount({ quantity: 10, rate: 100 })).toBe(1000)
  })

  it('excludes trade discount given as an amount', () => {
    expect(
      lineTaxableAmount({ quantity: 10, rate: 100, tradeDiscountAmount: 150 })
    ).toBe(850)
  })

  it('excludes trade discount given as a percentage', () => {
    expect(
      lineTaxableAmount({ quantity: 10, rate: 100, tradeDiscountPercent: 15 })
    ).toBe(850)
  })

  it('prefers an explicit discount amount over the percentage', () => {
    expect(
      lineTaxableAmount({
        quantity: 10,
        rate: 100,
        tradeDiscountAmount: 200,
        tradeDiscountPercent: 15,
      })
    ).toBe(800)
  })

  it('never returns a negative taxable value', () => {
    expect(
      lineTaxableAmount({ quantity: 1, rate: 100, tradeDiscountAmount: 500 })
    ).toBe(0)
  })
})

describe('splitGst', () => {
  it('splits intra-state supply into equal CGST and SGST', () => {
    const r = splitGst(1000, 12, false)
    expect(r.cgst_percent).toBe(6)
    expect(r.sgst_percent).toBe(6)
    expect(r.cgst_amount).toBe(60)
    expect(r.sgst_amount).toBe(60)
    expect(r.igst_amount).toBe(0)
    expect(r.total_amount).toBe(1120)
  })

  it('charges IGST at the full rate on inter-state supply', () => {
    const r = splitGst(1000, 12, true)
    expect(r.igst_percent).toBe(12)
    expect(r.igst_amount).toBe(120)
    expect(r.cgst_amount).toBe(0)
    expect(r.sgst_amount).toBe(0)
    expect(r.total_amount).toBe(1120)
  })

  it('keeps CGST + SGST reconciled to the full GST amount when halves do not round evenly', () => {
    // 5% on 1234.57 => 61.7285 total; naive halving would round each to 30.86
    // and lose a paisa against the combined figure.
    const r = splitGst(1234.57, 5, false)
    expect(round2(r.cgst_amount + r.sgst_amount)).toBe(r.gst_amount)
    expect(r.gst_amount).toBe(round2((1234.57 * 5) / 100))
  })

  it('handles a zero-rated item', () => {
    const r = splitGst(1000, 0, false)
    expect(r.gst_amount).toBe(0)
    expect(r.total_amount).toBe(1000)
  })

  it('produces a total that always equals taxable + tax', () => {
    for (const rate of [0, 5, 12, 18, 28]) {
      for (const inter of [true, false]) {
        const r = splitGst(987.65, rate, inter)
        expect(r.total_amount).toBe(round2(r.taxable_amount + r.gst_amount))
      }
    }
  })

  it('applies GST to the post-discount value end to end', () => {
    const taxable = lineTaxableAmount({
      quantity: 10,
      rate: 100,
      tradeDiscountPercent: 15,
    })
    const r = splitGst(taxable, 12, false)
    // 850 base, not 1000 — trade discount is out of the GST base.
    expect(r.taxable_amount).toBe(850)
    expect(r.gst_amount).toBe(102)
    expect(r.total_amount).toBe(952)
  })
})
