// ============================================================
// H1 VPMS — WhatsApp Notification Abstraction Layer
// Pluggable: Gupshup / Wati / Interakt / Custom
// Set WHATSAPP_PROVIDER env var to switch providers
// ============================================================

import { createClient as createAdminClient } from '@supabase/supabase-js'

// ─── Provider Config ─────────────────────────────────────────

function getSupabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type WhatsAppProvider = 'gupshup' | 'wati' | 'interakt' | 'console'

const PROVIDER = (process.env.WHATSAPP_PROVIDER || 'console') as WhatsAppProvider

// Gupshup
const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME
const GUPSHUP_SOURCE_NUMBER = process.env.GUPSHUP_SOURCE_NUMBER

// Wati
const WATI_API_URL = process.env.WATI_API_URL
const WATI_API_KEY = process.env.WATI_API_KEY

// Interakt
const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY

// ─── Templates ───────────────────────────────────────────────

export type TemplateName =
  | 'vendor_otp'
  | 'po_notification'
  | 'payment_confirmation'
  | 'invoice_status_update'
  | 'dispute_alert'

interface TemplateConfig {
  gupshup: string
  wati: string
  interakt: string
  defaultMessage: (params: Record<string, string>) => string
}

const TEMPLATES: Record<TemplateName, TemplateConfig> = {
  vendor_otp: {
    gupshup: 'vendor_otp_v1',
    wati: 'vendor_otp_v1',
    interakt: 'vendor_otp_v1',
    defaultMessage: (p) => `Your Health1 Vendor Portal OTP: ${p.otp}. Valid for 10 minutes. Do not share this code.`,
  },
  po_notification: {
    gupshup: 'new_po_v1',
    wati: 'new_po_v1',
    interakt: 'new_po_v1',
    defaultMessage: (p) => `Health1: New PO #${p.po_number} for ${p.amount}. View at ${p.link}`,
  },
  payment_confirmation: {
    gupshup: 'payment_confirmed_v1',
    wati: 'payment_confirmed_v1',
    interakt: 'payment_confirmed_v1',
    defaultMessage: (p) => `Health1: Payment of ${p.amount} released. UTR: ${p.utr}. View at ${p.link}`,
  },
  invoice_status_update: {
    gupshup: 'invoice_status_v1',
    wati: 'invoice_status_v1',
    interakt: 'invoice_status_v1',
    defaultMessage: (p) => `Health1: Invoice #${p.invoice_ref} status changed to ${p.status}. View at ${p.link}`,
  },
  dispute_alert: {
    gupshup: 'dispute_alert_v1',
    wati: 'dispute_alert_v1',
    interakt: 'dispute_alert_v1',
    defaultMessage: (p) => `Health1: Dispute raised on PO #${p.po_number}. Action needed. View at ${p.link}`,
  },
}

// ─── Provider Implementations ────────────────────────────────

async function sendViaGupshup(phone: string, template: TemplateName, params: Record<string, string>): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!GUPSHUP_API_KEY || !GUPSHUP_APP_NAME || !GUPSHUP_SOURCE_NUMBER) {
    return { success: false, error: 'Gupshup not configured' }
  }

  const formattedPhone = phone.startsWith('91') ? phone : `91${phone.replace(/^\+/, '')}`

  const body = new URLSearchParams({
    channel: 'whatsapp',
    source: GUPSHUP_SOURCE_NUMBER,
    destination: formattedPhone,
    'src.name': GUPSHUP_APP_NAME,
    template: JSON.stringify({
      id: TEMPLATES[template].gupshup,
      params: Object.values(params),
    }),
  })

  try {
    const res = await fetch('https://api.gupshup.io/wa/api/v1/template/msg', {
      method: 'POST',
      headers: {
        apikey: GUPSHUP_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })
    const data = await res.json()
    if (data.status === 'submitted') {
      return { success: true, messageId: data.messageId }
    }
    return { success: false, error: data.message || JSON.stringify(data) }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

async function sendViaWati(phone: string, template: TemplateName, params: Record<string, string>): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!WATI_API_URL || !WATI_API_KEY) {
    return { success: false, error: 'Wati not configured' }
  }

  const formattedPhone = phone.startsWith('91') ? phone : `91${phone.replace(/^\+/, '')}`

  try {
    const res = await fetch(`${WATI_API_URL}/api/v1/sendTemplateMessage?whatsappNumber=${formattedPhone}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WATI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_name: TEMPLATES[template].wati,
        broadcast_name: `h1_${template}`,
        parameters: Object.entries(params).map(([name, value]) => ({ name, value })),
      }),
    })
    const data = await res.json()
    return data.result ? { success: true, messageId: data.result } : { success: false, error: data.message }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

async function sendViaInterakt(phone: string, template: TemplateName, params: Record<string, string>): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!INTERAKT_API_KEY) {
    return { success: false, error: 'Interakt not configured' }
  }

  const formattedPhone = phone.replace(/^\+?91/, '')

  try {
    const res = await fetch('https://api.interakt.ai/v1/public/message/', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${INTERAKT_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        countryCode: '+91',
        phoneNumber: formattedPhone,
        type: 'Template',
        template: {
          name: TEMPLATES[template].interakt,
          languageCode: 'en',
          bodyValues: Object.values(params),
        },
      }),
    })
    const data = await res.json()
    return data.result ? { success: true, messageId: data.id } : { success: false, error: data.message }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

async function sendViaConsole(phone: string, template: TemplateName, params: Record<string, string>): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const message = TEMPLATES[template].defaultMessage(params)
  console.log(`[WhatsApp Console] To: ${phone} | Template: ${template} | Message: ${message}`)
  return { success: true, messageId: `console-${Date.now()}` }
}

// ─── Main Send Function ──────────────────────────────────────

export async function sendWhatsApp(
  vendorId: string,
  phone: string,
  template: TemplateName,
  params: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {

  // Send via configured provider
  let result: { success: boolean; messageId?: string; error?: string }

  switch (PROVIDER) {
    case 'gupshup':
      result = await sendViaGupshup(phone, template, params)
      break
    case 'wati':
      result = await sendViaWati(phone, template, params)
      break
    case 'interakt':
      result = await sendViaInterakt(phone, template, params)
      break
    default:
      result = await sendViaConsole(phone, template, params)
  }

  // Log to vendor_notifications table
  try {
    const admin = getSupabaseAdmin()
    await admin.from('vendor_notifications').insert({
      vendor_id: vendorId,
      channel: 'whatsapp',
      template_name: template,
      template_params: params,
      phone,
      status: result.success ? 'sent' : 'failed',
      provider_message_id: result.messageId || null,
      error_message: result.error || null,
      sent_at: result.success ? new Date().toISOString() : null,
    })
  } catch (logErr) {
    console.error('[WhatsApp] Failed to log notification:', logErr)
  }

  return result
}

// ─── OTP Convenience Function ────────────────────────────────

export async function sendOTP(vendorId: string, phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  return sendWhatsApp(vendorId, phone, 'vendor_otp', { otp })
}
