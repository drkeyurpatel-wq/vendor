import { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// H1 VPMS — Centralized Audit Logger
// Writes to activity_log table for complete system traceability
// ============================================================

export type AuditAction =
  // PO actions
  | 'po_created'
  | 'po_submitted'
  | 'po_approved'
  | 'po_approved_level'
  | 'po_rejected'
  | 'po_cancelled'
  | 'po_revised'
  | 'po_sent_to_vendor'
  // GRN actions
  | 'grn_created'
  | 'grn_submitted'
  | 'grn_verified'
  | 'grn_discrepancy_flagged'
  // Invoice actions
  | 'invoice_created'
  | 'invoice_uploaded'
  | 'invoice_matched'
  | 'invoice_disputed'
  // Payment actions
  | 'payment_batch_created'
  | 'payment_batch_approved'
  | 'payment_batch_released'
  | 'payment_processed'
  // Vendor actions
  | 'vendor_created'
  | 'vendor_updated'
  | 'vendor_activated'
  | 'vendor_deactivated'
  | 'vendor_blacklisted'
  | 'vendor_document_uploaded'
  | 'vendor_document_expired'
  // Item actions
  | 'item_created'
  | 'item_updated'
  | 'item_deactivated'
  // Indent actions
  | 'indent_created'
  | 'indent_approved'
  | 'indent_rejected'
  // Stock actions
  | 'stock_adjusted'
  | 'stock_received'
  | 'reorder_triggered'
  // Admin actions
  | 'user_created'
  | 'user_role_changed'
  | 'tenant_created'
  | 'data_imported'
  | 'data_exported'
  | 'bulk_approve_pos'
  | 'bulk_update_items'
  | 'bulk_update_vendor_status'
  // Integration actions
  | 'tally_push'
  | 'tally_sync'
  | 'ocr_processed'
  | 'notification_sent'
  | 'whatsapp_sent'
  | 'document_expiry_check'
  // Generic
  | string

export type EntityType =
  | 'purchase_order'
  | 'purchase'
  | 'grn'
  | 'invoice'
  | 'vendor'
  | 'item'
  | 'payment'
  | 'payment_batch'
  | 'indent'
  | 'stock'
  | 'user'
  | 'tenant'
  | 'document'
  | 'rate_contract'
  | 'system'
  | string

interface AuditEntry {
  user_id: string | null
  action: AuditAction
  entity_type: EntityType
  entity_id?: string | null
  details?: Record<string, unknown> | null
}

/**
 * Log an activity to the audit trail.
 * Non-blocking — failures are logged to console but don't throw.
 */
export async function logActivity(
  supabase: SupabaseClient,
  entry: AuditEntry
): Promise<void> {
  try {
    const { error } = await supabase.from('activity_log').insert({
      user_id: entry.user_id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id || null,
      details: entry.details || null,
    })

    if (error) {
      console.error('[Audit] Failed to log activity:', error.message, entry)
    }
  } catch (err) {
    console.error('[Audit] Unexpected error:', err, entry)
  }
}

/**
 * Log multiple activities in a single batch insert.
 */
export async function logActivities(
  supabase: SupabaseClient,
  entries: AuditEntry[]
): Promise<void> {
  if (entries.length === 0) return

  try {
    const rows = entries.map(e => ({
      user_id: e.user_id,
      action: e.action,
      entity_type: e.entity_type,
      entity_id: e.entity_id || null,
      details: e.details || null,
    }))

    const { error } = await supabase.from('activity_log').insert(rows)

    if (error) {
      console.error('[Audit] Failed to log batch activities:', error.message)
    }
  } catch (err) {
    console.error('[Audit] Unexpected batch error:', err)
  }
}

/**
 * Helper to build a notification payload from an audit entry.
 * Used by the notification system to send real-time alerts.
 */
export function getNotificationForAction(
  action: AuditAction,
  details?: Record<string, unknown> | null
): { title: string; message: string; priority: 'low' | 'normal' | 'high' | 'urgent' } | null {
  switch (action) {
    case 'po_submitted':
      return {
        title: 'PO Submitted for Approval',
        message: `Purchase Order ${details?.po_number || ''} requires your approval`,
        priority: 'high',
      }
    case 'po_approved':
      return {
        title: 'PO Approved',
        message: `Purchase Order ${details?.po_number || ''} has been fully approved`,
        priority: 'normal',
      }
    case 'po_rejected':
      return {
        title: 'PO Rejected',
        message: `Purchase Order ${details?.po_number || ''} was rejected: ${details?.comments || ''}`,
        priority: 'high',
      }
    case 'grn_submitted':
      return {
        title: 'GRN Submitted',
        message: `GRN ${details?.grn_number || ''} submitted — awaiting verification`,
        priority: 'normal',
      }
    case 'grn_discrepancy_flagged':
      return {
        title: 'GRN Discrepancy',
        message: `GRN ${details?.grn_number || ''} flagged with discrepancy`,
        priority: 'urgent',
      }
    case 'invoice_matched':
      if (details?.match_status === 'mismatch') {
        return {
          title: '3-Way Match Failed',
          message: `Invoice ${details?.invoice_ref || ''} has a mismatch — payment blocked`,
          priority: 'urgent',
        }
      }
      return {
        title: 'Invoice Matched',
        message: `Invoice ${details?.invoice_ref || ''} matched successfully`,
        priority: 'low',
      }
    case 'payment_batch_created':
      return {
        title: 'Payment Batch Created',
        message: `New Saturday payment batch ${details?.batch_number || ''} created`,
        priority: 'high',
      }
    case 'vendor_blacklisted':
      return {
        title: 'Vendor Blacklisted',
        message: `Vendor ${details?.vendor_name || ''} has been blacklisted`,
        priority: 'urgent',
      }
    case 'vendor_document_expired':
      return {
        title: 'Vendor Document Expired',
        message: `${details?.document_type || 'Document'} for ${details?.vendor_name || 'vendor'} has expired`,
        priority: 'high',
      }
    case 'reorder_triggered':
      return {
        title: 'Reorder Alert',
        message: `${details?.item_name || 'Item'} at ${details?.centre || ''} below reorder level`,
        priority: 'high',
      }
    default:
      return null
  }
}
