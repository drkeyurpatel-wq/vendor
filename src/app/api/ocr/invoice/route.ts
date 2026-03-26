import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

// ============================================================
// H1 VPMS — Invoice OCR via Claude Vision API
// Uploads file to Supabase Storage, extracts data using Claude
// Falls back to stub if ANTHROPIC_API_KEY not set
// ============================================================

interface ExtractedInvoice {
  vendor_invoice_no: string | null
  invoice_date: string | null
  subtotal: number | null
  cgst_amount: number | null
  sgst_amount: number | null
  igst_amount: number | null
  total_amount: number | null
  vendor_gstin: string | null
  items: Array<{
    description: string | null
    hsn_code: string | null
    quantity: number | null
    rate: number | null
    amount: number | null
    gst_percent: number | null
  }>
}

async function extractWithClaude(base64Data: string, mediaType: string): Promise<{ data: ExtractedInvoice; confidence: number }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('NO_API_KEY')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: mediaType === 'application/pdf' ? 'document' : 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Data },
          },
          {
            type: 'text',
            text: `Extract invoice data from this document. Return ONLY a JSON object with NO markdown formatting, NO backticks, NO explanation — just the raw JSON:

{
  "vendor_invoice_no": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "subtotal": number or null,
  "cgst_amount": number or null,
  "sgst_amount": number or null,
  "igst_amount": number or null,
  "total_amount": number or null,
  "vendor_gstin": "string or null",
  "items": [
    {
      "description": "string",
      "hsn_code": "string or null",
      "quantity": number or null,
      "rate": number or null,
      "amount": number or null,
      "gst_percent": number or null
    }
  ]
}

Rules:
- All amounts in INR (no currency symbols)
- Date in YYYY-MM-DD format
- GSTIN is 15-character alphanumeric
- Return null for fields you cannot confidently extract
- Return empty items array if line items are not readable`,
          },
        ],
      }],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude API error: ${response.status} ${err}`)
  }

  const result = await response.json()
  const text = result.content?.[0]?.text || '{}'

  // Parse JSON — strip markdown fences if present
  const clean = text.replace(/```json\s*|```\s*/g, '').trim()
  const parsed = JSON.parse(clean) as ExtractedInvoice

  // Compute confidence based on how many key fields were extracted
  const fields = [parsed.vendor_invoice_no, parsed.invoice_date, parsed.total_amount, parsed.vendor_gstin]
  const filledFields = fields.filter(f => f !== null && f !== undefined).length
  const confidence = filledFields / fields.length

  return { data: parsed, confidence }
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 10, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { supabase, user, userId } = await requireApiAuth()
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, PNG, JPG allowed' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Upload to Supabase Storage
    const timestamp = Date.now()
    const filename = `invoices/${user.id}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('invoice-documents')
      .upload(filename, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      // Storage bucket may not exist — create a fallback URL
      console.error('Upload error:', uploadError.message)
    }

    const { data: urlData } = supabase.storage
      .from('invoice-documents')
      .getPublicUrl(filename)
    const fileUrl = urlData?.publicUrl || ''

    // Convert to base64 for Claude
    const base64Data = Buffer.from(arrayBuffer).toString('base64')

    // Try Claude extraction
    let extractedData: ExtractedInvoice = {
      vendor_invoice_no: null, invoice_date: null, subtotal: null,
      cgst_amount: null, sgst_amount: null, igst_amount: null,
      total_amount: null, vendor_gstin: null, items: [],
    }
    let confidence = 0
    let message = ''

    try {
      const result = await extractWithClaude(base64Data, file.type)
      extractedData = result.data
      confidence = result.confidence
      message = `Extracted ${Math.round(confidence * 100)}% of key fields`
    } catch (err: any) {
      if (err.message === 'NO_API_KEY') {
        message = 'OCR not configured. Set ANTHROPIC_API_KEY for auto-extraction.'
      } else {
        message = `Extraction failed: ${err.message}. Fill details manually.`
        console.error('OCR extraction error:', err)
      }
    }

    // Audit log
    try {
      await supabase.from('activity_log').insert({
        entity_type: 'invoice', entity_id: 'ocr_upload',
        action: 'invoice_ocr', user_id: user.id,
        details: { file_name: file.name, file_size: file.size, confidence },
      })
    } catch {}

    return NextResponse.json({
      extracted: confidence > 0,
      confidence,
      data: extractedData,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      message,
    })
  } catch (err: any) {
    console.error('OCR invoice error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
