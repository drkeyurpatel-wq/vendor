import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import {
  sendEmail,
  poCreatedEmail,
  poApprovedEmail,
  grnReceivedEmail,
  paymentProcessedEmail,
  invoiceOverdueEmail,
} from '@/lib/email'
import { rateLimit } from '@/lib/rate-limit'
import { notificationSendSchema } from '@/lib/validations'

// ============================================================
// H1 VPMS — Notification Dispatch API
// Sends email notifications and logs to activity_log
// ============================================================

type NotificationType =
  | 'po_created'
  | 'po_approved'
  | 'grn_received'
  | 'payment_processed'
  | 'invoice_overdue'

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

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = notificationSendSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { type, data } = parsed.data as { type: NotificationType; data: Record<string, unknown> }

  try {
    let emailSent = false
    let recipientEmail = ''
    let emailSubject = ''

    switch (type) {
      case 'po_created': {
        const poId = data.po_id as string
        if (!poId) return NextResponse.json({ error: 'po_id required' }, { status: 400 })

        const { data: po } = await supabase
          .from('purchase_orders')
          .select('po_number, total_amount, vendor:vendors(primary_contact_email, legal_name), centre:centres(name)')
          .eq('id', poId)
          .single()

        if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

        const vendor = po.vendor as unknown as any
        const centre = po.centre as unknown as any
        recipientEmail = (vendor?.primary_contact_email as string) || ''

        if (recipientEmail) {
          const template = poCreatedEmail(
            recipientEmail,
            po.po_number,
            po.total_amount,
            (centre?.name as string) || 'Health1'
          )
          emailSubject = template.subject
          emailSent = await sendEmail(recipientEmail, template.subject, template.html)
        }

        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'notification_po_created',
          entity_type: 'purchase_order',
          entity_id: poId,
          details: {
            email_sent: emailSent,
            recipient: recipientEmail || null,
            po_number: po.po_number,
          },
        })
        break
      }

      case 'po_approved': {
        const poId = data.po_id as string
        if (!poId) return NextResponse.json({ error: 'po_id required' }, { status: 400 })

        const { data: po } = await supabase
          .from('purchase_orders')
          .select('po_number, vendor:vendors(primary_contact_email)')
          .eq('id', poId)
          .single()

        if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

        const vendor = po.vendor as any
        recipientEmail = (vendor?.primary_contact_email as string) || ''

        if (recipientEmail) {
          const template = poApprovedEmail(recipientEmail, po.po_number)
          emailSubject = template.subject
          emailSent = await sendEmail(recipientEmail, template.subject, template.html)
        }

        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'notification_po_approved',
          entity_type: 'purchase_order',
          entity_id: poId,
          details: {
            email_sent: emailSent,
            recipient: recipientEmail || null,
            po_number: po.po_number,
          },
        })
        break
      }

      case 'grn_received': {
        const grnId = data.grn_id as string
        if (!grnId) return NextResponse.json({ error: 'grn_id required' }, { status: 400 })

        const { data: grn } = await supabase
          .from('grns')
          .select('grn_number, po:purchase_orders(po_number), vendor:vendors(primary_contact_email)')
          .eq('id', grnId)
          .single()

        if (!grn) return NextResponse.json({ error: 'GRN not found' }, { status: 404 })

        const vendor = grn.vendor as any
        const po = grn.po as any
        recipientEmail = (vendor?.primary_contact_email as string) || ''

        if (recipientEmail) {
          const template = grnReceivedEmail(
            recipientEmail,
            grn.grn_number,
            (po?.po_number as string) || 'N/A'
          )
          emailSubject = template.subject
          emailSent = await sendEmail(recipientEmail, template.subject, template.html)
        }

        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'notification_grn_received',
          entity_type: 'grn',
          entity_id: grnId,
          details: {
            email_sent: emailSent,
            recipient: recipientEmail || null,
            grn_number: grn.grn_number,
          },
        })
        break
      }

      case 'payment_processed': {
        const batchId = data.batch_id as string
        const vendorId = data.vendor_id as string
        if (!batchId) return NextResponse.json({ error: 'batch_id required' }, { status: 400 })

        // Get vendor email
        let vendorEmail = ''
        if (vendorId) {
          const { data: vendor } = await supabase
            .from('vendors')
            .select('primary_contact_email')
            .eq('id', vendorId)
            .single()
          vendorEmail = (vendor?.primary_contact_email as string) || ''
        }

        // Get batch items for this vendor
        const batchQuery = supabase
          .from('payment_batch_items')
          .select('amount, invoice:invoices(vendor_invoice_no, total_amount, vendor_id)')
          .eq('batch_id', batchId)

        const { data: batchItems } = await batchQuery

        // Filter to vendor if specified
        const relevantItems = vendorId
          ? (batchItems || []).filter((bi: Record<string, unknown>) => {
              const inv = bi.invoice as any
              return inv && inv.vendor_id === vendorId
            })
          : batchItems || []

        const totalAmount = relevantItems.reduce(
          (sum: number, bi: Record<string, unknown>) => sum + ((bi.amount as number) || 0), 0
        )

        const invoiceList = relevantItems.map((bi: Record<string, unknown>) => {
          const inv = bi.invoice as any
          return {
            invoice_no: (inv?.vendor_invoice_no as string) || 'N/A',
            amount: (bi.amount as number) || 0,
          }
        })

        recipientEmail = vendorEmail

        if (recipientEmail && invoiceList.length > 0) {
          const template = paymentProcessedEmail(recipientEmail, totalAmount, invoiceList)
          emailSubject = template.subject
          emailSent = await sendEmail(recipientEmail, template.subject, template.html)
        }

        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'notification_payment_processed',
          entity_type: 'payment_batch',
          entity_id: batchId,
          details: {
            email_sent: emailSent,
            recipient: recipientEmail || null,
            vendor_id: vendorId || null,
            total_amount: totalAmount,
            invoice_count: invoiceList.length,
          },
        })
        break
      }

      case 'invoice_overdue': {
        const invoiceId = data.invoice_id as string
        const staffEmailAddr = data.staff_email as string
        if (!invoiceId) return NextResponse.json({ error: 'invoice_id required' }, { status: 400 })

        const { data: invoice } = await supabase
          .from('invoices')
          .select('invoice_ref, due_date, vendor:vendors(legal_name)')
          .eq('id', invoiceId)
          .single()

        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

        const vendor = invoice.vendor as any
        const vendorName = (vendor?.legal_name as string) || 'Unknown Vendor'
        const dueDate = new Date(invoice.due_date)
        const daysPastDue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        recipientEmail = staffEmailAddr || ''

        if (recipientEmail && daysPastDue > 0) {
          const template = invoiceOverdueEmail(recipientEmail, vendorName, invoice.invoice_ref, daysPastDue)
          emailSubject = template.subject
          emailSent = await sendEmail(recipientEmail, template.subject, template.html)
        }

        await supabase.from('activity_log').insert({
          user_id: user.id,
          action: 'notification_invoice_overdue',
          entity_type: 'invoice',
          entity_id: invoiceId,
          details: {
            email_sent: emailSent,
            recipient: recipientEmail || null,
            invoice_ref: invoice.invoice_ref,
            days_past_due: daysPastDue,
            vendor_name: vendorName,
          },
        })
        break
      }
    }

    return NextResponse.json({
      success: true,
      email_sent: emailSent,
      recipient: recipientEmail || null,
      subject: emailSubject || null,
    })
  } catch (error) {
    console.error('[Notifications] Error processing notification:', error)
    return NextResponse.json(
      { error: 'Failed to process notification', details: String(error) },
      { status: 500 }
    )
  }
}
