import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, action } = body

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    // Validate phone format: must be E.164 (+91XXXXXXXXXX)
    if (!/^\+91\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number. Use +91 followed by 10 digits.' }, { status: 400 })
    }

    const supabase = await createClient()

    if (action === 'send') {
      // Verify this phone belongs to a store_staff user before sending OTP
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, role, phone')
        .eq('phone', phone)
        .single()

      if (!profile) {
        return NextResponse.json(
          { error: 'This phone number is not registered. Contact your administrator.' },
          { status: 404 }
        )
      }

      if (profile.role !== 'store_staff' && profile.role !== 'unit_purchase_manager') {
        return NextResponse.json(
          { error: 'Phone OTP login is only available for store staff and purchase managers.' },
          { status: 403 }
        )
      }

      const { error } = await supabase.auth.signInWithOtp({ phone })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ message: 'OTP sent successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
