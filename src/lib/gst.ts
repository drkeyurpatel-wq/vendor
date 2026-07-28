/**
 * GST computation helpers.
 *
 * Place of supply rules (CGST Act s.7/s.8):
 *   - Supplier state === recipient state  → intra-state → CGST + SGST, half each
 *   - Supplier state !== recipient state  → inter-state → IGST at full rate
 *
 * Taxable value (CGST Act s.15(3)(a)):
 *   Trade discount recorded on the invoice at the time of supply is EXCLUDED
 *   from transaction value, so the GST base is net of trade discount.
 *
 *   Cash discount is NOT netted off here. It is normally a post-supply
 *   settlement discount and only reduces taxable value when it is agreed
 *   beforehand and linked to specific invoices. Treat it as a payment-side
 *   adjustment, not a GST-base adjustment.
 */

/** Normalise a state name for comparison — case/spacing/punctuation insensitive. */
export function normaliseState(state: string | null | undefined): string {
  return (state ?? '').trim().toLowerCase().replace(/[^a-z]/g, '')
}

export function isInterState(
  supplierState: string | null | undefined,
  recipientState: string | null | undefined
): boolean {
  const a = normaliseState(supplierState)
  const b = normaliseState(recipientState)
  // If either side is unknown we cannot prove inter-state. Default to
  // intra-state (CGST+SGST), which is the common case for this group, and
  // surface the missing master data rather than silently charging IGST.
  if (!a || !b) return false
  return a !== b
}

/** Round to 2dp using half-up, avoiding binary float drift on .005 cases. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface GstSplit {
  taxable_amount: number
  cgst_percent: number
  cgst_amount: number
  sgst_percent: number
  sgst_amount: number
  igst_percent: number
  igst_amount: number
  gst_amount: number
  total_amount: number
}

/**
 * Split a line's GST.
 *
 * @param taxableAmount Value AFTER trade discount, BEFORE tax.
 * @param gstPercent    Combined GST rate for the item (e.g. 12 for 12%).
 * @param interState    True when supplier and recipient states differ.
 */
export function splitGst(
  taxableAmount: number,
  gstPercent: number,
  interState: boolean
): GstSplit {
  const taxable = round2(taxableAmount)
  const rate = Number.isFinite(gstPercent) ? gstPercent : 0

  if (interState) {
    const igst = round2((taxable * rate) / 100)
    return {
      taxable_amount: taxable,
      cgst_percent: 0,
      cgst_amount: 0,
      sgst_percent: 0,
      sgst_amount: 0,
      igst_percent: rate,
      igst_amount: igst,
      gst_amount: igst,
      total_amount: round2(taxable + igst),
    }
  }

  const half = rate / 2
  const cgst = round2((taxable * half) / 100)
  // Derive SGST from the total rather than recomputing, so CGST+SGST always
  // reconciles to the full GST amount even when the halves do not round evenly.
  const totalGst = round2((taxable * rate) / 100)
  const sgst = round2(totalGst - cgst)

  return {
    taxable_amount: taxable,
    cgst_percent: half,
    cgst_amount: cgst,
    sgst_percent: half,
    sgst_amount: sgst,
    igst_percent: 0,
    igst_amount: 0,
    gst_amount: round2(cgst + sgst),
    total_amount: round2(taxable + cgst + sgst),
  }
}

/**
 * Taxable value for a line: quantity × rate, less trade discount.
 * Accepts either an explicit discount amount or a percentage.
 */
export function lineTaxableAmount(opts: {
  quantity: number
  rate: number
  tradeDiscountAmount?: number | null
  tradeDiscountPercent?: number | null
}): number {
  const gross = (opts.quantity || 0) * (opts.rate || 0)
  const discount =
    opts.tradeDiscountAmount != null && opts.tradeDiscountAmount > 0
      ? opts.tradeDiscountAmount
      : ((opts.tradeDiscountPercent ?? 0) / 100) * gross
  return round2(Math.max(0, gross - (discount || 0)))
}
