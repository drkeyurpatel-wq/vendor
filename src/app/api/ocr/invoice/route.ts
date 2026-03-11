import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 10, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()

  // Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only PDF, PNG, and JPG are allowed.' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop() || 'pdf'
    const filename = `invoices/${user.id}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoice-documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('invoice-documents')
      .getPublicUrl(filename)

    const fileUrl = urlData?.publicUrl || ''

    // ===================================================================
    // OCR EXTRACTION
    // Currently returns simulated/empty data.
    // To enable real OCR, implement one of:
    //
    // Option 1: Google Vision API
    //   - Set GOOGLE_VISION_API_KEY in .env.local
    //   - POST base64 image to https://vision.googleapis.com/v1/images:annotate
    //   - Parse DOCUMENT_TEXT_DETECTION response
    //
    // Option 2: AWS Textract
    //   - Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION in .env.local
    //   - Use @aws-sdk/client-textract AnalyzeExpense API
    //   - Parse ExpenseDocuments response for invoice fields
    //
    // Option 3: Azure Form Recognizer
    //   - Set AZURE_FORM_RECOGNIZER_ENDPOINT, AZURE_FORM_RECOGNIZER_KEY
    //   - Use prebuilt-invoice model
    //
    // After extraction, parse vendor_invoice_no, date, amounts, line items
    // and return them in the structured format below.
    // ===================================================================

    const extractedData = {
      vendor_invoice_no: null,
      invoice_date: null,
      subtotal: null,
      cgst_amount: null,
      sgst_amount: null,
      igst_amount: null,
      total_amount: null,
      vendor_gstin: null,
      items: [] as Array<{
        description: string | null
        hsn_code: string | null
        quantity: number | null
        rate: number | null
        amount: number | null
        gst_percent: number | null
      }>,
    }

    // Audit log
    await supabase.from('activity_log').insert({
      user_id: user.id,
      action: 'invoice_uploaded',
      entity_type: 'invoice',
      details: { file_name: file.name, file_type: file.type, file_size: file.size },
    })

    return NextResponse.json({
      extracted: true,
      confidence: 0.0, // 0 = simulated, no OCR performed
      data: extractedData,
      file_url: fileUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      message: 'OCR service not configured. Configure GOOGLE_VISION_API_KEY for automatic extraction.',
    })
  } catch (err: any) {
    console.error('OCR invoice error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
