import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { whatsappNotificationSchema } from '@/lib/validations'

// ============================================================
// H1 VPMS — WhatsApp Notification API
// Uses WhatsApp Business API (Meta Graph API v18.0)
// ============================================================

const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID
const WHATSAPP_API_VERSION = 'v18.0'
const WHATSAPP_BASE_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`

type WhatsAppTemplate = 'po_created' | 'payment_advice' | 'delivery_reminder'

interface WhatsAppRequest {
  phone: string
  template: WhatsAppTemplate
  params: Record<string, string>
}

/**
 * Normalize Indian phone number to E.164 format.
 * Adds 91 country code if not present.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) return digits
  if (digits.length === 10) return '91' + digits
  return digits
}

/**
 * Map template name to WhatsApp Business API template structure.
 * These templates must be pre-approved in the WhatsApp Business Manager.
 */
function buildTemplatePayload(template: WhatsAppTemplate, params: Record<string, string>) {
  switch (template) {
    case 'po_created':
      return {
        name: 'h1_po_created',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: params.vendor_name || '' },
              { type: 'text', text: params.po_number || '' },
              { type: 'text', text: params.amount || '' },
              { type: 'text', text: params.centre_name || '' },
              { type: 'text', text: params.delivery_date || 'As per PO' },
            ],
          },
        ],
      }

    case 'payment_advice':
      return {
        name: 'h1_payment_advice',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: params.vendor_name || '' },
              { type: 'text', text: params.amount || '' },
              { type: 'text', text: params.payment_date || '' },
              { type: 'text', text: params.utr_number || 'Pending' },
              { type: 'text', text: params.invoice_count || '1' },
            ],
          },
        ],
      }

    case 'delivery_reminder':
      return {
        name: 'h1_delivery_reminder',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: params.vendor_name || '' },
              { type: 'text', text: params.po_number || '' },
              { type: 'text', text: params.delivery_date || '' },
              { type: 'text', text: params.centre_name || '' },
              { type: 'text', text: params.items_summary || '' },
            ],
          },
        ],
      }

    default:
      return null
  }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 10, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if WhatsApp is configured
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_ID) {
    return NextResponse.json(
      { sent: false, reason: 'not_configured' },
      { status: 200 }
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = whatsappNotificationSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { phone, template, params } = parsed.data as WhatsAppRequest

  const normalizedPhone = normalizePhone(phone)
  if (normalizedPhone.length < 10) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const templatePayload = buildTemplatePayload(template, params)
  if (!templatePayload) {
    return NextResponse.json({ error: 'Failed to build template' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `${WHATSAPP_BASE_URL}/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'template',
          template: templatePayload,
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error('[WhatsApp] API error:', result)

      // Log the failure
      await supabase.from('activity_log').insert({
        user_id: user.id,
        action: 'whatsapp_notification_failed',
        entity_type: 'notification',
        entity_id: null,
        details: {
          template,
          phone: normalizedPhone,
          error: result.error?.message || 'Unknown error',
          error_code: result.error?.code || null,
        },
      })

      return NextResponse.json(
        {
          sent: false,
          reason: 'api_error',
          error: result.error?.message || 'WhatsApp API error',
        },
        { status: 200 }
      )
    }

    // Log success
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'whatsapp_notification_sent',
      entity_type: 'notification',
      entity_id: null,
      details: {
        template,
        phone: normalizedPhone,
        message_id: result.messages?.[0]?.id || null,
        params,
      },
    })

    return NextResponse.json({
      sent: true,
      message_id: result.messages?.[0]?.id || null,
      phone: normalizedPhone,
      template,
    })
  } catch (error) {
    console.error('[WhatsApp] Network error:', error)
    return NextResponse.json(
      {
        sent: false,
        reason: 'network_error',
        error: String(error),
      },
      { status: 200 }
    )
  }
}
