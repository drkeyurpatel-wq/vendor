import nodemailer from 'nodemailer'

// ============================================================
// H1 VPMS — Email Notification System
// Professional HTML email templates with Health1 branding
// ============================================================

const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM || 'noreply@health1.in'

const NAVY = '#1B3A6B'
const TEAL = '#0D7E8A'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[H1 Email] SMTP not configured — SMTP_HOST, SMTP_USER, SMTP_PASS required. Emails will be skipped.')
    return null
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  })

  return transporter
}

/**
 * Send an email. Returns true if sent, false if skipped or failed.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const transport = getTransporter()

  if (!transport) {
    console.warn(`[H1 Email] Skipping email to ${to}: SMTP not configured`)
    return false
  }

  try {
    await transport.sendMail({
      from: `"Health1 VPMS" <${SMTP_FROM}>`,
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error('[H1 Email] Failed to send email:', error)
    return false
  }
}

// ─── Base HTML Template ──────────────────────────────────────

function wrapTemplate(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:${NAVY};padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">Health1 Super Speciality Hospitals</h1>
              <p style="margin:4px 0 0;color:#a8bdd9;font-size:12px;">Vendor & Purchase Management System</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f9fb;padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#6b7280;font-size:11px;line-height:1.5;">
                This is an automated notification from Health1 VPMS. Please do not reply to this email.<br>
                &copy; ${new Date().getFullYear()} Health1 Super Speciality Hospitals Pvt. Ltd.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

// ─── Email Template Functions ────────────────────────────────

export function poCreatedEmail(
  vendorEmail: string,
  poNumber: string,
  amount: number,
  centreName: string
): { subject: string; html: string } {
  const subject = `[H1] New Purchase Order ${poNumber}`
  const html = wrapTemplate(subject, `
    <h2 style="margin:0 0 16px;color:${NAVY};font-size:18px;">New Purchase Order</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
      A new purchase order has been created for your reference. Please review the details below.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF2F9;border-radius:6px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;width:140px;">PO Number</td>
              <td style="padding:4px 0;color:${NAVY};font-size:14px;font-weight:600;">${poNumber}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Centre</td>
              <td style="padding:4px 0;color:#374151;font-size:14px;">${centreName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Total Amount</td>
              <td style="padding:4px 0;color:${TEAL};font-size:16px;font-weight:700;">${formatINR(amount)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
      Please log in to the vendor portal to view the complete purchase order and confirm delivery timelines.
    </p>
    <p style="margin:16px 0 0;color:#6b7280;font-size:12px;">
      If you have questions, contact the procurement team at the respective centre.
    </p>
  `)
  return { subject, html }
}

export function poApprovedEmail(
  vendorEmail: string,
  poNumber: string
): { subject: string; html: string } {
  const subject = `[H1] Purchase Order ${poNumber} Approved`
  const html = wrapTemplate(subject, `
    <h2 style="margin:0 0 16px;color:${NAVY};font-size:18px;">Purchase Order Approved</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
      Your purchase order has been approved and is ready for fulfillment.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E6F5F6;border-radius:6px;border-left:4px solid ${TEAL};margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0;color:${NAVY};font-size:15px;font-weight:600;">PO Number: ${poNumber}</p>
          <p style="margin:8px 0 0;color:${TEAL};font-size:14px;font-weight:600;">Status: APPROVED</p>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
      Please proceed with the delivery as per the terms mentioned in the purchase order. Ensure all items are delivered with proper documentation including delivery challan, batch details, and e-way bill where applicable.
    </p>
  `)
  return { subject, html }
}

export function grnReceivedEmail(
  vendorEmail: string,
  grnNumber: string,
  poNumber: string
): { subject: string; html: string } {
  const subject = `[H1] Goods Received — GRN ${grnNumber}`
  const html = wrapTemplate(subject, `
    <h2 style="margin:0 0 16px;color:${NAVY};font-size:18px;">Goods Receipt Confirmation</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
      We have received goods against your purchase order. A Goods Receipt Note (GRN) has been generated.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF2F9;border-radius:6px;margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;width:140px;">GRN Number</td>
              <td style="padding:4px 0;color:${NAVY};font-size:14px;font-weight:600;">${grnNumber}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">PO Reference</td>
              <td style="padding:4px 0;color:#374151;font-size:14px;">${poNumber}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#374151;font-size:14px;line-height:1.6;">
      Please submit your invoice referencing the above GRN number. Payment will be processed as per the agreed credit terms from the GRN date.
    </p>
  `)
  return { subject, html }
}

export function paymentProcessedEmail(
  vendorEmail: string,
  amount: number,
  invoices: { invoice_no: string; amount: number }[]
): { subject: string; html: string } {
  const subject = `[H1] Payment Processed — ${formatINR(amount)}`

  let invoiceRows = ''
  invoices.forEach((inv, idx) => {
    invoiceRows += `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${idx + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;">${inv.invoice_no}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#374151;font-size:13px;text-align:right;">${formatINR(inv.amount)}</td>
      </tr>`
  })

  const html = wrapTemplate(subject, `
    <h2 style="margin:0 0 16px;color:${NAVY};font-size:18px;">Payment Processed</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
      A payment has been processed for your invoices. Details are below.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#E6F5F6;border-radius:6px;border-left:4px solid ${TEAL};margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0;color:#6b7280;font-size:13px;">Total Amount Paid</p>
          <p style="margin:4px 0 0;color:${TEAL};font-size:22px;font-weight:700;">${formatINR(amount)}</p>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
      <tr>
        <th style="padding:10px 12px;background-color:${NAVY};color:#ffffff;font-size:12px;text-align:left;font-weight:600;">#</th>
        <th style="padding:10px 12px;background-color:${NAVY};color:#ffffff;font-size:12px;text-align:left;font-weight:600;">Invoice No.</th>
        <th style="padding:10px 12px;background-color:${NAVY};color:#ffffff;font-size:12px;text-align:right;font-weight:600;">Amount</th>
      </tr>
      ${invoiceRows}
    </table>
    <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;">
      Payment details (UTR/Reference number) will be shared separately. Please reconcile in your books accordingly.
    </p>
  `)
  return { subject, html }
}

export function invoiceOverdueEmail(
  staffEmail: string,
  vendorName: string,
  invoiceRef: string,
  daysPastDue: number
): { subject: string; html: string } {
  const urgencyColor = daysPastDue > 30 ? '#dc2626' : daysPastDue > 15 ? '#f59e0b' : '#f97316'

  const subject = `[H1] Overdue Invoice Alert — ${invoiceRef} (${daysPastDue} days)`
  const html = wrapTemplate(subject, `
    <h2 style="margin:0 0 16px;color:${NAVY};font-size:18px;">Overdue Invoice Alert</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.6;">
      The following invoice has exceeded its credit period and requires immediate attention.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:6px;border-left:4px solid ${urgencyColor};margin:0 0 24px;">
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;width:140px;">Invoice Ref</td>
              <td style="padding:4px 0;color:${NAVY};font-size:14px;font-weight:600;">${invoiceRef}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Vendor</td>
              <td style="padding:4px 0;color:#374151;font-size:14px;">${vendorName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Days Past Due</td>
              <td style="padding:4px 0;color:${urgencyColor};font-size:16px;font-weight:700;">${daysPastDue} days</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;">
      Please review this invoice and take necessary action — either schedule for the next Saturday payment batch or flag any discrepancies.
    </p>
  `)
  return { subject, html }
}
