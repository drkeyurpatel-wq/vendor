import { NextRequest, NextResponse } from 'next/server'
import { requireApiAuth } from '@/lib/auth'
import { withApiErrorHandler } from '@/lib/api-error-handler'

// POST — create or update vendor-item mapping
export const POST = withApiErrorHandler(async (req: NextRequest) => {
  const { supabase } = await requireApiAuth()
  const body = await req.json()
  const { vendor_id, item_id, l_rank, last_quoted_rate, is_preferred } = body

  if (!vendor_id || !item_id) {
    return NextResponse.json({ error: 'vendor_id and item_id required' }, { status: 400 })
  }

  // Auto-determine l_rank if not provided
  let rank = l_rank
  if (!rank) {
    const { data: existing } = await supabase
      .from('vendor_items')
      .select('l_rank')
      .eq('item_id', item_id)
      .order('l_rank', { ascending: true })
    const usedRanks = new Set((existing || []).map((e: any) => e.l_rank))
    rank = [1, 2, 3].find(r => !usedRanks.has(r)) || 3
  }

  const { data, error } = await supabase
    .from('vendor_items')
    .upsert({
      vendor_id,
      item_id,
      l_rank: rank,
      last_quoted_rate: last_quoted_rate || null,
      is_preferred: is_preferred ?? (rank === 1),
    }, { onConflict: 'vendor_id,item_id' })
    .select('id, l_rank, last_quoted_rate, is_preferred')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, ...data })
})

// DELETE — remove a mapping by id
export const DELETE = withApiErrorHandler(async (req: NextRequest) => {
  const { supabase } = await requireApiAuth()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('vendor_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
})
