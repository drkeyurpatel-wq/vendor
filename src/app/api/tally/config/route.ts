import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { supabase } = await requireApiAuth()
  try {
    const { data, error } = await supabase
      .from('tally_company_config')
      .select('*')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ config: data || null })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { supabase, user } = await requireApiAuth()
  try {
    const body = await req.json()
    const {
      company_name,
      purchase_ledger_pharmacy,
      purchase_ledger_surgical,
      purchase_ledger_general,
      cgst_input_ledger,
      sgst_input_ledger,
      igst_input_ledger,
      bank_ledger,
      cash_ledger,
      round_off_ledger,
      tds_payable_ledger,
      sync_enabled,
    } = body

    // Upsert config
    const { data: existing } = await supabase
      .from('tally_company_config')
      .select('id, centre_id')
      .limit(1)
      .single()

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (company_name !== undefined) updateData.company_name = company_name
    if (purchase_ledger_pharmacy !== undefined) updateData.purchase_ledger_pharmacy = purchase_ledger_pharmacy
    if (purchase_ledger_surgical !== undefined) updateData.purchase_ledger_surgical = purchase_ledger_surgical
    if (purchase_ledger_general !== undefined) updateData.purchase_ledger_general = purchase_ledger_general
    if (cgst_input_ledger !== undefined) updateData.cgst_input_ledger = cgst_input_ledger
    if (sgst_input_ledger !== undefined) updateData.sgst_input_ledger = sgst_input_ledger
    if (igst_input_ledger !== undefined) updateData.igst_input_ledger = igst_input_ledger
    if (bank_ledger !== undefined) updateData.bank_ledger = bank_ledger
    if (cash_ledger !== undefined) updateData.cash_ledger = cash_ledger
    if (round_off_ledger !== undefined) updateData.round_off_ledger = round_off_ledger
    if (tds_payable_ledger !== undefined) updateData.tds_payable_ledger = tds_payable_ledger
    if (sync_enabled !== undefined) updateData.sync_enabled = sync_enabled

    if (existing) {
      const { data, error } = await supabase
        .from('tally_company_config')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'tally_config_updated',
        entity_type: 'tally_config',
        entity_id: existing.id,
        details: updateData,
      })

      return NextResponse.json({ config: data })
    } else {
      return NextResponse.json({ error: 'No config found. Run migration first.' }, { status: 404 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
