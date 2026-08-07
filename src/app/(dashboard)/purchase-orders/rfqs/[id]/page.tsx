import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cn, formatDate, formatDateTime, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Trophy, Clock, Users } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import {
  rankQuotes,
  lowestRatePerItem,
  isDeadlinePassed,
  COMPARABLE_QUOTE_STATUSES,
  type ComparableQuote,
} from '@/lib/rfq'
import RFQAwardActions from './RFQAwardActions'

export const dynamic = 'force-dynamic'

const RFQ_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  open: 'bg-green-100 text-green-700',
  evaluation: 'bg-blue-100 text-blue-700',
  awarded: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
}

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAuth()
  const { id } = await params

  const { data: rfq } = await supabase
    .from('rfqs')
    .select(
      'id, rfq_number, title, description, status, submission_deadline, delivery_required_by, ' +
      'terms_and_conditions, awarded_at, centre:centres(code, name), ' +
      'category:vendor_categories(name), ' +
      'awarded_vendor:vendors!rfqs_awarded_vendor_id_fkey(id, legal_name), ' +
      'items:rfq_items(id, description, quantity, unit, specifications, sort_order)'
    )
    .eq('id', id)
    .single()

  if (!rfq) notFound()

  const { data: rawQuotes } = await supabase
    .from('rfq_quotes')
    .select(
      'id, vendor_id, status, total_amount, delivery_timeline_days, payment_terms, validity_days, ' +
      'notes, submitted_at, vendor:vendors(legal_name), ' +
      'items:rfq_quote_items(rfq_item_id, unit_rate, gst_percent, total_amount, brand, delivery_days)'
    )
    .eq('rfq_id', id)

  const rfqAny = rfq as any
  const rfqItems = [...(rfqAny.items ?? [])].sort(
    (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  )

  const comparable: ComparableQuote[] = ((rawQuotes ?? []) as any[])
    .filter(q => COMPARABLE_QUOTE_STATUSES.includes(q.status))
    .map(q => ({
      id: q.id,
      vendor_id: q.vendor_id,
      vendor_name: q.vendor?.legal_name ?? 'Unknown vendor',
      status: q.status,
      total_amount: q.total_amount,
      delivery_timeline_days: q.delivery_timeline_days,
      payment_terms: q.payment_terms,
      validity_days: q.validity_days,
      items: (q.items ?? []).map((li: any) => ({
        rfq_item_id: li.rfq_item_id,
        unit_rate: Number(li.unit_rate ?? 0),
        total_amount: Number(li.total_amount ?? 0),
      })),
    }))

  const ranked = rankQuotes(comparable)
  const lowestRates = lowestRatePerItem(comparable)
  const deadlinePassed = isDeadlinePassed(rfqAny.submission_deadline)
  const rateByQuoteAndItem = new Map<string, { unit_rate: number; total_amount: number }>()
  for (const q of comparable) {
    for (const li of q.items) {
      rateByQuoteAndItem.set(`${q.id}:${li.rfq_item_id}`, li)
    }
  }

  return (
    <div>
      <Link
        href="/purchase-orders/rfqs"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 cursor-pointer w-fit"
      >
        <ArrowLeft size={14} aria-hidden="true" /> Back to RFQs
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{rfqAny.rfq_number}</h1>
          <p className="page-subtitle">{rfqAny.title}</p>
        </div>
        <span className={cn('badge', RFQ_STATUS_COLORS[rfqAny.status] ?? 'bg-gray-100 text-gray-700')}>
          {rfqAny.status.replace(/_/g, ' ')}
        </span>
      </div>

      {rfqAny.status === 'awarded' && rfqAny.awarded_vendor && (
        <div className="card p-4 mb-6 border-l-4 border-l-purple-500">
          <div className="flex items-start gap-3">
            <Trophy size={18} className="text-purple-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Awarded to {rfqAny.awarded_vendor.legal_name}
              </p>
              {rfqAny.awarded_at && (
                <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(rfqAny.awarded_at)}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Details</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Centre</dt>
              <dd className="text-gray-900 text-right">{rfqAny.centre?.code ?? 'All centres'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Category</dt>
              <dd className="text-gray-900 text-right">{rfqAny.category?.name ?? 'Every vendor'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Deadline</dt>
              <dd className={cn('text-right', deadlinePassed ? 'text-amber-700 font-medium' : 'text-gray-900')}>
                {formatDateTime(rfqAny.submission_deadline)}
              </dd>
            </div>
            {rfqAny.delivery_required_by && (
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Delivery by</dt>
                <dd className="text-gray-900 text-right">{formatDate(rfqAny.delivery_required_by)}</dd>
              </div>
            )}
          </dl>
          {deadlinePassed && rfqAny.status === 'open' && (
            <p className="flex items-center gap-1.5 text-xs text-amber-700 mt-3">
              <Clock size={12} aria-hidden="true" /> The deadline has passed — vendors can no longer submit.
            </p>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">
            Requested items
          </h2>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <caption className="sr-only">Items this RFQ asks vendors to quote for</caption>
              <thead>
                <tr>
                  <th scope="col">Description</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Specifications</th>
                </tr>
              </thead>
              <tbody>
                {rfqItems.map((it: any) => (
                  <tr key={it.id}>
                    <td className="text-sm text-gray-900">{it.description}</td>
                    <td className="text-sm text-gray-600 whitespace-nowrap">
                      {it.quantity} {it.unit}
                    </td>
                    <td className="text-sm text-gray-600">{it.specifications || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Quote comparison</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {ranked.length === 0
              ? 'No vendor has submitted a quote yet'
              : `${ranked.length} quote${ranked.length === 1 ? '' : 's'} received, cheapest first`}
          </p>
        </div>

        {ranked.length === 0 ? (
          <EmptyState
            icon={<Users size={44} strokeWidth={1.2} />}
            title="No quotes yet"
            description={
              rfqAny.status === 'draft'
                ? 'This RFQ is still a draft. Vendors will only see it once it is open.'
                : 'Vendors in the selected category can see this RFQ in their portal. Quotes will appear here as they submit.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <caption className="sr-only">
                Vendor quotes for {rfqAny.rfq_number}, ranked from lowest total. Per-item cells mark
                the lowest unit rate for that item.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Vendor</th>
                  {rfqItems.map((it: any) => (
                    <th scope="col" key={it.id} className="whitespace-nowrap">
                      {it.description}
                      <span className="block font-normal text-gray-500">
                        {it.quantity} {it.unit}
                      </span>
                    </th>
                  ))}
                  <th scope="col">Total</th>
                  <th scope="col">vs lowest</th>
                  <th scope="col">Delivery</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map(q => (
                  <tr
                    key={q.id}
                    className={cn(
                      'transition-colors duration-150',
                      q.isLowest ? 'bg-green-50/60' : 'hover:bg-gray-50'
                    )}
                  >
                    <th scope="row" className="text-left font-normal">
                      <span className="text-sm font-medium text-gray-900">{q.vendor_name}</span>
                      {q.isLowest && (
                        <span className="badge bg-green-100 text-green-700 text-xs ml-2">Lowest</span>
                      )}
                      {q.rank === 0 && (
                        <span className="badge bg-gray-100 text-gray-700 text-xs ml-2">Not priced</span>
                      )}
                      {q.status === 'awarded' && (
                        <span className="badge bg-purple-100 text-purple-700 text-xs ml-2">Awarded</span>
                      )}
                    </th>

                    {rfqItems.map((it: any) => {
                      const line = rateByQuoteAndItem.get(`${q.id}:${it.id}`)
                      const isLowestRate =
                        !!line && line.unit_rate > 0 && lowestRates.get(it.id) === line.unit_rate
                      return (
                        <td key={it.id} className="whitespace-nowrap">
                          {line && line.unit_rate > 0 ? (
                            <span
                              className={cn(
                                'text-sm',
                                isLowestRate ? 'font-semibold text-green-700' : 'text-gray-700'
                              )}
                            >
                              {formatCurrency(line.unit_rate)}
                              {isLowestRate && <span className="sr-only"> (lowest for this item)</span>}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500">—</span>
                          )}
                        </td>
                      )
                    })}

                    <td className="whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {typeof q.total_amount === 'number' && q.total_amount > 0
                          ? formatCurrency(q.total_amount)
                          : '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {q.rank === 0 ? (
                        <span className="text-sm text-gray-500">—</span>
                      ) : q.isLowest ? (
                        <span className="text-sm text-green-700">—</span>
                      ) : (
                        <span className="text-sm text-gray-600">
                          +{formatCurrency(q.deltaFromBest)}
                          <span className="text-xs text-gray-500 ml-1">({q.deltaPercent}%)</span>
                        </span>
                      )}
                    </td>
                    <td className="text-sm text-gray-600 whitespace-nowrap">
                      {q.delivery_timeline_days ? `${q.delivery_timeline_days} days` : '—'}
                    </td>
                    <td>
                      <RFQAwardActions
                        rfqId={rfqAny.id}
                        rfqStatus={rfqAny.status}
                        quoteId={q.id}
                        quoteStatus={q.status}
                        vendorName={q.vendor_name}
                        total={q.total_amount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
