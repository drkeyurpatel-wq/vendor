// ============================================================
// AUTO-GENERATED — DO NOT EDIT BY HAND.
// Source of truth: the live Supabase schema.
// Regenerate: npm run gen:types  (see scripts/gen-db-types.js)
//
// Generated from a snapshot of 54 tables.
// If you change the database, regenerate this file in the same
// commit, or CI (npm run check:drift) will fail the build.
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_log: {
        Row: {
          id: string,
          user_id: string | null,
          action: string,
          entity_type: string,
          entity_id: string | null,
          details: Json | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          user_id?: string | null,
          action: string,
          entity_type: string,
          entity_id?: string | null,
          details?: Json | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          user_id?: string | null,
          action?: string,
          entity_type?: string,
          entity_id?: string | null,
          details?: Json | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'activity_log_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      approval_delegations: {
        Row: {
          id: string,
          delegator_id: string,
          delegate_id: string,
          start_date: string,
          end_date: string,
          reason: string | null,
          is_active: boolean | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          delegator_id: string,
          delegate_id: string,
          start_date: string,
          end_date: string,
          reason?: string | null,
          is_active?: boolean | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          delegator_id?: string,
          delegate_id?: string,
          start_date?: string,
          end_date?: string,
          reason?: string | null,
          is_active?: boolean | null,
          created_at?: string | null
        }
        Relationships: [

        ]
      }
      audit_logs: {
        Row: {
          id: string,
          entity_type: string,
          entity_id: string | null,
          action: string,
          details: Json | null,
          user_id: string | null,
          ip_address: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          entity_type: string,
          entity_id?: string | null,
          action: string,
          details?: Json | null,
          user_id?: string | null,
          ip_address?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          entity_type?: string,
          entity_id?: string | null,
          action?: string,
          details?: Json | null,
          user_id?: string | null,
          ip_address?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      audit_trail: {
        Row: {
          id: string,
          entity_type: string,
          entity_id: string,
          field_name: string,
          old_value: string | null,
          new_value: string | null,
          changed_by: string,
          changed_at: string | null,
          ip_address: string | null,
          user_agent: string | null
        }
        Insert: {
          id?: string,
          entity_type: string,
          entity_id: string,
          field_name: string,
          old_value?: string | null,
          new_value?: string | null,
          changed_by: string,
          changed_at?: string | null,
          ip_address?: string | null,
          user_agent?: string | null
        }
        Update: {
          id?: string,
          entity_type?: string,
          entity_id?: string,
          field_name?: string,
          old_value?: string | null,
          new_value?: string | null,
          changed_by?: string,
          changed_at?: string | null,
          ip_address?: string | null,
          user_agent?: string | null
        }
        Relationships: [

        ]
      }
      batch_stock: {
        Row: {
          id: string,
          item_id: string | null,
          centre_id: string | null,
          batch_number: string | null,
          expiry_date: string | null,
          manufacture_date: string | null,
          grn_id: string | null,
          qty_received: number | null,
          qty_issued: number | null,
          qty_available: number | null,
          rate: number | null,
          mrp: number | null,
          is_active: boolean | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          item_id?: string | null,
          centre_id?: string | null,
          batch_number?: string | null,
          expiry_date?: string | null,
          manufacture_date?: string | null,
          grn_id?: string | null,
          qty_received?: number | null,
          qty_issued?: number | null,
          qty_available?: number | null,
          rate?: number | null,
          mrp?: number | null,
          is_active?: boolean | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          item_id?: string | null,
          centre_id?: string | null,
          batch_number?: string | null,
          expiry_date?: string | null,
          manufacture_date?: string | null,
          grn_id?: string | null,
          qty_received?: number | null,
          qty_issued?: number | null,
          qty_available?: number | null,
          rate?: number | null,
          mrp?: number | null,
          is_active?: boolean | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'batch_stock_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'batch_stock_grn_id_fkey'
            columns: ['grn_id']
            isOneToOne: false
            referencedRelation: 'grns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'batch_stock_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      centres: {
        Row: {
          id: string,
          code: string,
          name: string,
          address: string | null,
          city: string | null,
          state: string | null,
          phone: string | null,
          email: string | null,
          is_active: boolean | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          code: string,
          name: string,
          address?: string | null,
          city?: string | null,
          state?: string | null,
          phone?: string | null,
          email?: string | null,
          is_active?: boolean | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          code?: string,
          name?: string,
          address?: string | null,
          city?: string | null,
          state?: string | null,
          phone?: string | null,
          email?: string | null,
          is_active?: boolean | null,
          created_at?: string | null
        }
        Relationships: [

        ]
      }
      consignment_deposits: {
        Row: {
          id: string,
          deposit_number: string,
          vendor_id: string,
          centre_id: string,
          challan_number: string | null,
          challan_date: string,
          received_by: string | null,
          received_at: string | null,
          location: string | null,
          notes: string | null,
          status: string | null,
          created_at: string | null,
          updated_at: string | null
        }
        Insert: {
          id?: string,
          deposit_number: string,
          vendor_id: string,
          centre_id: string,
          challan_number?: string | null,
          challan_date?: string,
          received_by?: string | null,
          received_at?: string | null,
          location?: string | null,
          notes?: string | null,
          status?: string | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Update: {
          id?: string,
          deposit_number?: string,
          vendor_id?: string,
          centre_id?: string,
          challan_number?: string | null,
          challan_date?: string,
          received_by?: string | null,
          received_at?: string | null,
          location?: string | null,
          notes?: string | null,
          status?: string | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consignment_deposits_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_deposits_received_by_fkey'
            columns: ['received_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_deposits_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      consignment_stock: {
        Row: {
          id: string,
          deposit_id: string,
          item_id: string | null,
          item_description: string,
          category: string,
          brand: string | null,
          model_number: string | null,
          serial_number: string | null,
          lot_number: string | null,
          batch_number: string | null,
          expiry_date: string | null,
          size_spec: string | null,
          mrp: number | null,
          vendor_rate: number,
          gst_percent: number | null,
          qty_deposited: number,
          qty_used: number,
          qty_returned: number,
          qty_available: number | null,
          location: string | null,
          status: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          deposit_id: string,
          item_id?: string | null,
          item_description: string,
          category: string,
          brand?: string | null,
          model_number?: string | null,
          serial_number?: string | null,
          lot_number?: string | null,
          batch_number?: string | null,
          expiry_date?: string | null,
          size_spec?: string | null,
          mrp?: number | null,
          vendor_rate: number,
          gst_percent?: number | null,
          qty_deposited?: number,
          qty_used?: number,
          qty_returned?: number,
          qty_available?: number | null,
          location?: string | null,
          status?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          deposit_id?: string,
          item_id?: string | null,
          item_description?: string,
          category?: string,
          brand?: string | null,
          model_number?: string | null,
          serial_number?: string | null,
          lot_number?: string | null,
          batch_number?: string | null,
          expiry_date?: string | null,
          size_spec?: string | null,
          mrp?: number | null,
          vendor_rate?: number,
          gst_percent?: number | null,
          qty_deposited?: number,
          qty_used?: number,
          qty_returned?: number,
          qty_available?: number | null,
          location?: string | null,
          status?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consignment_stock_deposit_id_fkey'
            columns: ['deposit_id']
            isOneToOne: false
            referencedRelation: 'consignment_deposits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_stock_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      consignment_usage: {
        Row: {
          id: string,
          stock_id: string,
          deposit_id: string,
          centre_id: string,
          patient_name: string,
          patient_uhid: string | null,
          surgeon_name: string | null,
          procedure_name: string | null,
          procedure_date: string,
          procedure_location: string | null,
          qty_used: number,
          usage_notes: string | null,
          logged_by: string | null,
          logged_at: string | null,
          auto_po_id: string | null,
          auto_grn_id: string | null,
          auto_invoice_id: string | null,
          conversion_status: string | null,
          created_at: string | null,
          usage_number: string | null,
          usage_date: string | null,
          ot_number: string | null,
          case_type: string | null,
          notes: string | null,
          po_id: string | null,
          grn_id: string | null,
          invoice_id: string | null,
          created_by: string | null
        }
        Insert: {
          id?: string,
          stock_id: string,
          deposit_id: string,
          centre_id: string,
          patient_name: string,
          patient_uhid?: string | null,
          surgeon_name?: string | null,
          procedure_name?: string | null,
          procedure_date?: string,
          procedure_location?: string | null,
          qty_used?: number,
          usage_notes?: string | null,
          logged_by?: string | null,
          logged_at?: string | null,
          auto_po_id?: string | null,
          auto_grn_id?: string | null,
          auto_invoice_id?: string | null,
          conversion_status?: string | null,
          created_at?: string | null,
          usage_number?: string | null,
          usage_date?: string | null,
          ot_number?: string | null,
          case_type?: string | null,
          notes?: string | null,
          po_id?: string | null,
          grn_id?: string | null,
          invoice_id?: string | null,
          created_by?: string | null
        }
        Update: {
          id?: string,
          stock_id?: string,
          deposit_id?: string,
          centre_id?: string,
          patient_name?: string,
          patient_uhid?: string | null,
          surgeon_name?: string | null,
          procedure_name?: string | null,
          procedure_date?: string,
          procedure_location?: string | null,
          qty_used?: number,
          usage_notes?: string | null,
          logged_by?: string | null,
          logged_at?: string | null,
          auto_po_id?: string | null,
          auto_grn_id?: string | null,
          auto_invoice_id?: string | null,
          conversion_status?: string | null,
          created_at?: string | null,
          usage_number?: string | null,
          usage_date?: string | null,
          ot_number?: string | null,
          case_type?: string | null,
          notes?: string | null,
          po_id?: string | null,
          grn_id?: string | null,
          invoice_id?: string | null,
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consignment_usage_auto_grn_id_fkey'
            columns: ['auto_grn_id']
            isOneToOne: false
            referencedRelation: 'grns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_usage_auto_invoice_id_fkey'
            columns: ['auto_invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_usage_auto_po_id_fkey'
            columns: ['auto_po_id']
            isOneToOne: false
            referencedRelation: 'purchase_orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_usage_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_usage_deposit_id_fkey'
            columns: ['deposit_id']
            isOneToOne: false
            referencedRelation: 'consignment_deposits'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_usage_logged_by_fkey'
            columns: ['logged_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consignment_usage_stock_id_fkey'
            columns: ['stock_id']
            isOneToOne: false
            referencedRelation: 'consignment_stock'
            referencedColumns: ['id']
          }
        ]
      }
      consumption_records: {
        Row: {
          id: string,
          centre_id: string | null,
          item_id: string | null,
          consumption_date: string,
          department: string | null,
          ward: string | null,
          quantity: number,
          unit: string | null,
          rate: number | null,
          total_value: number | null,
          patient_name: string | null,
          ip_number: string | null,
          doctor_name: string | null,
          batch_number: string | null,
          expiry_date: string | null,
          notes: string | null,
          source: string | null,
          uploaded_by: string | null,
          upload_batch_id: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          centre_id?: string | null,
          item_id?: string | null,
          consumption_date: string,
          department?: string | null,
          ward?: string | null,
          quantity: number,
          unit?: string | null,
          rate?: number | null,
          total_value?: number | null,
          patient_name?: string | null,
          ip_number?: string | null,
          doctor_name?: string | null,
          batch_number?: string | null,
          expiry_date?: string | null,
          notes?: string | null,
          source?: string | null,
          uploaded_by?: string | null,
          upload_batch_id?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          centre_id?: string | null,
          item_id?: string | null,
          consumption_date?: string,
          department?: string | null,
          ward?: string | null,
          quantity?: number,
          unit?: string | null,
          rate?: number | null,
          total_value?: number | null,
          patient_name?: string | null,
          ip_number?: string | null,
          doctor_name?: string | null,
          batch_number?: string | null,
          expiry_date?: string | null,
          notes?: string | null,
          source?: string | null,
          uploaded_by?: string | null,
          upload_batch_id?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'consumption_records_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'consumption_records_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      credit_notes: {
        Row: {
          id: string,
          credit_note_number: string | null,
          vendor_id: string | null,
          centre_id: string | null,
          invoice_id: string | null,
          reason: string,
          subtotal: number | null,
          gst_amount: number | null,
          total_amount: number | null,
          status: string | null,
          notes: string | null,
          created_by: string | null,
          created_at: string | null,
          updated_at: string | null,
          tally_voucher_number: string | null,
          tally_synced_at: string | null,
          tally_sync_status: string | null
        }
        Insert: {
          id?: string,
          credit_note_number?: string | null,
          vendor_id?: string | null,
          centre_id?: string | null,
          invoice_id?: string | null,
          reason: string,
          subtotal?: number | null,
          gst_amount?: number | null,
          total_amount?: number | null,
          status?: string | null,
          notes?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          tally_voucher_number?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null
        }
        Update: {
          id?: string,
          credit_note_number?: string | null,
          vendor_id?: string | null,
          centre_id?: string | null,
          invoice_id?: string | null,
          reason?: string,
          subtotal?: number | null,
          gst_amount?: number | null,
          total_amount?: number | null,
          status?: string | null,
          notes?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          tally_voucher_number?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'credit_notes_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'credit_notes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'credit_notes_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'credit_notes_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      daily_stock_summary: {
        Row: {
          id: string,
          centre_id: string,
          item_id: string,
          summary_date: string,
          opening_balance: number,
          issue_qty: number,
          receipt_qty: number,
          return_qty: number,
          adj_qty: number,
          closing_balance: number,
          balance_verified: boolean,
          balance_mismatch: number | null,
          upload_batch_id: string | null,
          uploaded_by: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          centre_id: string,
          item_id: string,
          summary_date: string,
          opening_balance?: number,
          issue_qty?: number,
          receipt_qty?: number,
          return_qty?: number,
          adj_qty?: number,
          closing_balance?: number,
          balance_verified?: boolean,
          balance_mismatch?: number | null,
          upload_batch_id?: string | null,
          uploaded_by?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          centre_id?: string,
          item_id?: string,
          summary_date?: string,
          opening_balance?: number,
          issue_qty?: number,
          receipt_qty?: number,
          return_qty?: number,
          adj_qty?: number,
          closing_balance?: number,
          balance_verified?: boolean,
          balance_mismatch?: number | null,
          upload_batch_id?: string | null,
          uploaded_by?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'daily_stock_summary_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_stock_summary_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'daily_stock_summary_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      debit_note_items: {
        Row: {
          id: string,
          debit_note_id: string | null,
          item_id: string | null,
          quantity: number | null,
          rate: number | null,
          gst_percent: number | null,
          gst_amount: number | null,
          total_amount: number | null,
          reason: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          debit_note_id?: string | null,
          item_id?: string | null,
          quantity?: number | null,
          rate?: number | null,
          gst_percent?: number | null,
          gst_amount?: number | null,
          total_amount?: number | null,
          reason?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          debit_note_id?: string | null,
          item_id?: string | null,
          quantity?: number | null,
          rate?: number | null,
          gst_percent?: number | null,
          gst_amount?: number | null,
          total_amount?: number | null,
          reason?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'debit_note_items_debit_note_id_fkey'
            columns: ['debit_note_id']
            isOneToOne: false
            referencedRelation: 'debit_notes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'debit_note_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      debit_notes: {
        Row: {
          id: string,
          debit_note_number: string | null,
          vendor_id: string | null,
          centre_id: string | null,
          invoice_id: string | null,
          grn_id: string | null,
          reason: string,
          subtotal: number | null,
          gst_amount: number | null,
          total_amount: number | null,
          status: string | null,
          notes: string | null,
          created_by: string | null,
          created_at: string | null,
          updated_at: string | null,
          tally_voucher_number: string | null,
          tally_synced_at: string | null,
          tally_sync_status: string | null
        }
        Insert: {
          id?: string,
          debit_note_number?: string | null,
          vendor_id?: string | null,
          centre_id?: string | null,
          invoice_id?: string | null,
          grn_id?: string | null,
          reason: string,
          subtotal?: number | null,
          gst_amount?: number | null,
          total_amount?: number | null,
          status?: string | null,
          notes?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          tally_voucher_number?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null
        }
        Update: {
          id?: string,
          debit_note_number?: string | null,
          vendor_id?: string | null,
          centre_id?: string | null,
          invoice_id?: string | null,
          grn_id?: string | null,
          reason?: string,
          subtotal?: number | null,
          gst_amount?: number | null,
          total_amount?: number | null,
          status?: string | null,
          notes?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          tally_voucher_number?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'debit_notes_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'debit_notes_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'debit_notes_grn_id_fkey'
            columns: ['grn_id']
            isOneToOne: false
            referencedRelation: 'grns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'debit_notes_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'debit_notes_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      grn_items: {
        Row: {
          id: string,
          grn_id: string,
          po_item_id: string | null,
          item_id: string,
          ordered_qty: number,
          received_qty: number,
          accepted_qty: number,
          rejected_qty: number | null,
          rejection_reason: string | null,
          batch_no: string | null,
          expiry_date: string | null,
          rate: number,
          gst_percent: number | null,
          total_amount: number,
          damaged_qty: number | null,
          short_qty: number | null,
          batch_number: string | null,
          manufacture_date: string | null,
          cgst_amount: number | null,
          sgst_amount: number | null,
          igst_amount: number | null,
          excess_qty: number | null,
          free_qty: number | null,
          damage_reason: string | null,
          receipt_unit: string | null,
          conversion_factor: number | null,
          mrp: number | null,
          manufacturer: string | null,
          storage_location: string | null,
          net_rate: number | null,
          trade_discount_percent: number | null,
          trade_discount_amount: number | null,
          cgst_percent: number | null,
          sgst_percent: number | null,
          igst_percent: number | null,
          gst_amount: number | null,
          hsn_code: string | null,
          qc_status: string | null,
          qc_remarks: string | null
        }
        Insert: {
          id?: string,
          grn_id: string,
          po_item_id?: string | null,
          item_id: string,
          ordered_qty: number,
          received_qty: number,
          accepted_qty: number,
          rejected_qty?: number | null,
          rejection_reason?: string | null,
          batch_no?: string | null,
          expiry_date?: string | null,
          rate: number,
          gst_percent?: number | null,
          total_amount: number,
          damaged_qty?: number | null,
          short_qty?: number | null,
          batch_number?: string | null,
          manufacture_date?: string | null,
          cgst_amount?: number | null,
          sgst_amount?: number | null,
          igst_amount?: number | null,
          excess_qty?: number | null,
          free_qty?: number | null,
          damage_reason?: string | null,
          receipt_unit?: string | null,
          conversion_factor?: number | null,
          mrp?: number | null,
          manufacturer?: string | null,
          storage_location?: string | null,
          net_rate?: number | null,
          trade_discount_percent?: number | null,
          trade_discount_amount?: number | null,
          cgst_percent?: number | null,
          sgst_percent?: number | null,
          igst_percent?: number | null,
          gst_amount?: number | null,
          hsn_code?: string | null,
          qc_status?: string | null,
          qc_remarks?: string | null
        }
        Update: {
          id?: string,
          grn_id?: string,
          po_item_id?: string | null,
          item_id?: string,
          ordered_qty?: number,
          received_qty?: number,
          accepted_qty?: number,
          rejected_qty?: number | null,
          rejection_reason?: string | null,
          batch_no?: string | null,
          expiry_date?: string | null,
          rate?: number,
          gst_percent?: number | null,
          total_amount?: number,
          damaged_qty?: number | null,
          short_qty?: number | null,
          batch_number?: string | null,
          manufacture_date?: string | null,
          cgst_amount?: number | null,
          sgst_amount?: number | null,
          igst_amount?: number | null,
          excess_qty?: number | null,
          free_qty?: number | null,
          damage_reason?: string | null,
          receipt_unit?: string | null,
          conversion_factor?: number | null,
          mrp?: number | null,
          manufacturer?: string | null,
          storage_location?: string | null,
          net_rate?: number | null,
          trade_discount_percent?: number | null,
          trade_discount_amount?: number | null,
          cgst_percent?: number | null,
          sgst_percent?: number | null,
          igst_percent?: number | null,
          gst_amount?: number | null,
          hsn_code?: string | null,
          qc_status?: string | null,
          qc_remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'grn_items_grn_id_fkey'
            columns: ['grn_id']
            isOneToOne: false
            referencedRelation: 'grns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grn_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grn_items_po_item_id_fkey'
            columns: ['po_item_id']
            isOneToOne: false
            referencedRelation: 'purchase_order_items'
            referencedColumns: ['id']
          }
        ]
      }
      grn_return_items: {
        Row: {
          id: string,
          return_id: string | null,
          item_id: string | null,
          grn_item_id: string | null,
          return_qty: number | null,
          reason: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          return_id?: string | null,
          item_id?: string | null,
          grn_item_id?: string | null,
          return_qty?: number | null,
          reason?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          return_id?: string | null,
          item_id?: string | null,
          grn_item_id?: string | null,
          return_qty?: number | null,
          reason?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'grn_return_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grn_return_items_return_id_fkey'
            columns: ['return_id']
            isOneToOne: false
            referencedRelation: 'grn_returns'
            referencedColumns: ['id']
          }
        ]
      }
      grn_returns: {
        Row: {
          id: string,
          return_number: string | null,
          grn_id: string | null,
          vendor_id: string | null,
          centre_id: string | null,
          reason: string,
          status: string | null,
          total_amount: number | null,
          debit_note_id: string | null,
          created_by: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          return_number?: string | null,
          grn_id?: string | null,
          vendor_id?: string | null,
          centre_id?: string | null,
          reason: string,
          status?: string | null,
          total_amount?: number | null,
          debit_note_id?: string | null,
          created_by?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          return_number?: string | null,
          grn_id?: string | null,
          vendor_id?: string | null,
          centre_id?: string | null,
          reason?: string,
          status?: string | null,
          total_amount?: number | null,
          debit_note_id?: string | null,
          created_by?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'grn_returns_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grn_returns_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grn_returns_grn_id_fkey'
            columns: ['grn_id']
            isOneToOne: false
            referencedRelation: 'grns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grn_returns_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      grns: {
        Row: {
          id: string,
          grn_number: string,
          centre_id: string,
          po_id: string | null,
          vendor_id: string,
          grn_date: string | null,
          vendor_invoice_no: string | null,
          vendor_invoice_date: string | null,
          vendor_invoice_amount: number | null,
          status: string | null,
          notes: string | null,
          received_by: string | null,
          verified_by: string | null,
          verified_at: string | null,
          created_at: string | null,
          updated_at: string | null,
          quality_status: string | null,
          qc_checked_by: string | null,
          qc_completed_at: string | null,
          is_return_generated: boolean | null,
          net_amount: number | null,
          total_amount: number | null,
          deleted_at: string | null,
          dc_number: string | null,
          dc_date: string | null,
          lr_number: string | null,
          transport_name: string | null,
          vehicle_number: string | null,
          eway_bill_no: string | null,
          cgst_amount: number | null,
          sgst_amount: number | null,
          igst_amount: number | null,
          discount_amount: number | null
        }
        Insert: {
          id?: string,
          grn_number: string,
          centre_id: string,
          po_id?: string | null,
          vendor_id: string,
          grn_date?: string | null,
          vendor_invoice_no?: string | null,
          vendor_invoice_date?: string | null,
          vendor_invoice_amount?: number | null,
          status?: string | null,
          notes?: string | null,
          received_by?: string | null,
          verified_by?: string | null,
          verified_at?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          quality_status?: string | null,
          qc_checked_by?: string | null,
          qc_completed_at?: string | null,
          is_return_generated?: boolean | null,
          net_amount?: number | null,
          total_amount?: number | null,
          deleted_at?: string | null,
          dc_number?: string | null,
          dc_date?: string | null,
          lr_number?: string | null,
          transport_name?: string | null,
          vehicle_number?: string | null,
          eway_bill_no?: string | null,
          cgst_amount?: number | null,
          sgst_amount?: number | null,
          igst_amount?: number | null,
          discount_amount?: number | null
        }
        Update: {
          id?: string,
          grn_number?: string,
          centre_id?: string,
          po_id?: string | null,
          vendor_id?: string,
          grn_date?: string | null,
          vendor_invoice_no?: string | null,
          vendor_invoice_date?: string | null,
          vendor_invoice_amount?: number | null,
          status?: string | null,
          notes?: string | null,
          received_by?: string | null,
          verified_by?: string | null,
          verified_at?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          quality_status?: string | null,
          qc_checked_by?: string | null,
          qc_completed_at?: string | null,
          is_return_generated?: boolean | null,
          net_amount?: number | null,
          total_amount?: number | null,
          deleted_at?: string | null,
          dc_number?: string | null,
          dc_date?: string | null,
          lr_number?: string | null,
          transport_name?: string | null,
          vehicle_number?: string | null,
          eway_bill_no?: string | null,
          cgst_amount?: number | null,
          sgst_amount?: number | null,
          igst_amount?: number | null,
          discount_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'grns_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grns_po_id_fkey'
            columns: ['po_id']
            isOneToOne: false
            referencedRelation: 'purchase_orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grns_qc_checked_by_fkey'
            columns: ['qc_checked_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grns_received_by_fkey'
            columns: ['received_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grns_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grns_verified_by_fkey'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      hmis_import_log: {
        Row: {
          id: string,
          centre_id: string | null,
          import_type: string,
          file_name: string,
          total_rows: number,
          imported_rows: number,
          skipped_rows: number,
          error_rows: number,
          errors: Json | null,
          uploaded_by: string | null,
          started_at: string | null,
          completed_at: string | null,
          status: string
        }
        Insert: {
          id?: string,
          centre_id?: string | null,
          import_type: string,
          file_name: string,
          total_rows?: number,
          imported_rows?: number,
          skipped_rows?: number,
          error_rows?: number,
          errors?: Json | null,
          uploaded_by?: string | null,
          started_at?: string | null,
          completed_at?: string | null,
          status?: string
        }
        Update: {
          id?: string,
          centre_id?: string | null,
          import_type?: string,
          file_name?: string,
          total_rows?: number,
          imported_rows?: number,
          skipped_rows?: number,
          error_rows?: number,
          errors?: Json | null,
          uploaded_by?: string | null,
          started_at?: string | null,
          completed_at?: string | null,
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: 'hmis_import_log_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'hmis_import_log_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      invoice_items: {
        Row: {
          id: string,
          invoice_id: string | null,
          item_id: string | null,
          po_item_id: string | null,
          grn_item_id: string | null,
          description: string | null,
          hsn_code: string | null,
          quantity: number | null,
          rate: number | null,
          taxable_amount: number | null,
          cgst_percent: number | null,
          cgst_amount: number | null,
          sgst_percent: number | null,
          sgst_amount: number | null,
          igst_percent: number | null,
          igst_amount: number | null,
          total_amount: number | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          invoice_id?: string | null,
          item_id?: string | null,
          po_item_id?: string | null,
          grn_item_id?: string | null,
          description?: string | null,
          hsn_code?: string | null,
          quantity?: number | null,
          rate?: number | null,
          taxable_amount?: number | null,
          cgst_percent?: number | null,
          cgst_amount?: number | null,
          sgst_percent?: number | null,
          sgst_amount?: number | null,
          igst_percent?: number | null,
          igst_amount?: number | null,
          total_amount?: number | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          invoice_id?: string | null,
          item_id?: string | null,
          po_item_id?: string | null,
          grn_item_id?: string | null,
          description?: string | null,
          hsn_code?: string | null,
          quantity?: number | null,
          rate?: number | null,
          taxable_amount?: number | null,
          cgst_percent?: number | null,
          cgst_amount?: number | null,
          sgst_percent?: number | null,
          sgst_amount?: number | null,
          igst_percent?: number | null,
          igst_amount?: number | null,
          total_amount?: number | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'invoice_items_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoice_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      invoices: {
        Row: {
          id: string,
          invoice_ref: string,
          vendor_invoice_no: string | null,
          vendor_invoice_date: string,
          centre_id: string,
          vendor_id: string,
          grn_id: string | null,
          po_id: string | null,
          subtotal: number,
          gst_amount: number | null,
          total_amount: number,
          match_status: string | null,
          match_notes: string | null,
          qty_match: boolean | null,
          rate_match: boolean | null,
          gst_match: boolean | null,
          duplicate_check: boolean | null,
          credit_period_days: number,
          due_date: string,
          payment_status: string | null,
          paid_amount: number | null,
          payment_batch_id: string | null,
          invoice_file_path: string | null,
          status: string | null,
          approved_by: string | null,
          approved_at: string | null,
          created_by: string | null,
          created_at: string | null,
          updated_at: string | null,
          dispute_reason: string | null,
          disputed_at: string | null,
          match_details: Json | null,
          paid_at: string | null,
          tds_amount: number | null,
          advance_adjusted: number | null,
          tally_voucher_number: string | null,
          tally_synced_at: string | null,
          tally_sync_status: string | null,
          cgst_amount: number,
          sgst_amount: number,
          igst_amount: number,
          eway_bill_no: string | null
        }
        Insert: {
          id?: string,
          invoice_ref: string,
          vendor_invoice_no?: string | null,
          vendor_invoice_date: string,
          centre_id: string,
          vendor_id: string,
          grn_id?: string | null,
          po_id?: string | null,
          subtotal?: number,
          gst_amount?: number | null,
          total_amount: number,
          match_status?: string | null,
          match_notes?: string | null,
          qty_match?: boolean | null,
          rate_match?: boolean | null,
          gst_match?: boolean | null,
          duplicate_check?: boolean | null,
          credit_period_days?: number,
          due_date: string,
          payment_status?: string | null,
          paid_amount?: number | null,
          payment_batch_id?: string | null,
          invoice_file_path?: string | null,
          status?: string | null,
          approved_by?: string | null,
          approved_at?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          dispute_reason?: string | null,
          disputed_at?: string | null,
          match_details?: Json | null,
          paid_at?: string | null,
          tds_amount?: number | null,
          advance_adjusted?: number | null,
          tally_voucher_number?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null,
          cgst_amount?: number,
          sgst_amount?: number,
          igst_amount?: number,
          eway_bill_no?: string | null
        }
        Update: {
          id?: string,
          invoice_ref?: string,
          vendor_invoice_no?: string | null,
          vendor_invoice_date?: string,
          centre_id?: string,
          vendor_id?: string,
          grn_id?: string | null,
          po_id?: string | null,
          subtotal?: number,
          gst_amount?: number | null,
          total_amount?: number,
          match_status?: string | null,
          match_notes?: string | null,
          qty_match?: boolean | null,
          rate_match?: boolean | null,
          gst_match?: boolean | null,
          duplicate_check?: boolean | null,
          credit_period_days?: number,
          due_date?: string,
          payment_status?: string | null,
          paid_amount?: number | null,
          payment_batch_id?: string | null,
          invoice_file_path?: string | null,
          status?: string | null,
          approved_by?: string | null,
          approved_at?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          dispute_reason?: string | null,
          disputed_at?: string | null,
          match_details?: Json | null,
          paid_at?: string | null,
          tds_amount?: number | null,
          advance_adjusted?: number | null,
          tally_voucher_number?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null,
          cgst_amount?: number,
          sgst_amount?: number,
          igst_amount?: number,
          eway_bill_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'invoices_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_grn_id_fkey'
            columns: ['grn_id']
            isOneToOne: false
            referencedRelation: 'grns'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_po_id_fkey'
            columns: ['po_id']
            isOneToOne: false
            referencedRelation: 'purchase_orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'invoices_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      item_categories: {
        Row: {
          id: string,
          name: string,
          code: string,
          parent_id: string | null,
          is_active: boolean | null
        }
        Insert: {
          id?: string,
          name: string,
          code: string,
          parent_id?: string | null,
          is_active?: boolean | null
        }
        Update: {
          id?: string,
          name?: string,
          code?: string,
          parent_id?: string | null,
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: 'item_categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'item_categories'
            referencedColumns: ['id']
          }
        ]
      }
      item_centre_stock: {
        Row: {
          id: string,
          item_id: string,
          centre_id: string,
          current_stock: number | null,
          reorder_level: number | null,
          max_level: number | null,
          last_grn_date: string | null,
          last_grn_rate: number | null,
          avg_daily_consumption: number | null,
          updated_at: string | null
        }
        Insert: {
          id?: string,
          item_id: string,
          centre_id: string,
          current_stock?: number | null,
          reorder_level?: number | null,
          max_level?: number | null,
          last_grn_date?: string | null,
          last_grn_rate?: number | null,
          avg_daily_consumption?: number | null,
          updated_at?: string | null
        }
        Update: {
          id?: string,
          item_id?: string,
          centre_id?: string,
          current_stock?: number | null,
          reorder_level?: number | null,
          max_level?: number | null,
          last_grn_date?: string | null,
          last_grn_rate?: number | null,
          avg_daily_consumption?: number | null,
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'item_centre_stock_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'item_centre_stock_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      items: {
        Row: {
          id: string,
          item_code: string,
          generic_name: string,
          brand_name: string | null,
          category_id: string | null,
          unit: string,
          hsn_code: string | null,
          gst_percent: number | null,
          shelf_life_days: number | null,
          is_cold_chain: boolean | null,
          is_narcotic: boolean | null,
          is_high_alert: boolean | null,
          is_active: boolean | null,
          ecw_item_code: string | null,
          tally_item_name: string | null,
          notes: string | null,
          created_at: string | null,
          updated_at: string | null,
          deleted_at: string | null,
          manufacturer: string | null,
          marketed_by: string | null,
          dosage_form: string | null,
          route_of_administration: string | null,
          specification: string | null,
          strength: string | null,
          therapeutic_class: string | null,
          department: string | null,
          major_group: string | null,
          minor_group: string | null,
          item_type: string | null,
          combination_of_drugs: string | null,
          unit_levels: number | null,
          level1_unit: string | null,
          level1_qty_per_unit: number | null,
          level2_unit: string | null,
          level2_qty_per_unit: number | null,
          level3_unit: string | null,
          level3_qty_per_unit: number | null,
          purchase_unit: string | null,
          receipt_unit: string | null,
          issue_unit: string | null,
          qty_conversion: number | null,
          item_nature_abc: string | null,
          item_nature_ved: string | null,
          item_nature_fsn: string | null,
          scheduled_drug: boolean | null,
          scheduled_drug_category: string | null,
          is_high_risk: boolean | null,
          is_dpco: boolean | null,
          is_look_alike: boolean | null,
          is_sound_alike: boolean | null,
          is_consignment: boolean | null,
          is_capital_goods: boolean | null,
          is_emergency_drug: boolean | null,
          is_hazardous: boolean | null,
          is_imported: boolean | null,
          is_immunization: boolean | null,
          is_refrigerated: boolean | null,
          is_cssd_item: boolean | null,
          mrp: number | null,
          barcode: string | null,
          alternate_barcode: string | null,
          snomed_ct_code: string | null,
          ndc_code: string | null,
          consignment_category: string | null,
          snomed_ct_description: string | null,
          gst_slab: string | null,
          cgst_percent: number | null,
          sgst_percent: number | null,
          igst_percent: number | null,
          default_rate: number | null,
          muc_percent: number | null,
          margin_percent: number | null,
          reorder_level: number | null,
          min_stock: number | null,
          max_stock: number | null,
          storage_location: string | null,
          bin_location: string | null,
          safety_stock: number | null,
          reorder_point: number | null,
          lead_time_days: number | null,
          min_order_qty: number | null,
          max_order_qty: number | null,
          alias_names: Json | null,
          is_generic: boolean | null,
          is_kit: boolean | null,
          is_linen: boolean | null,
          is_spare_parts: boolean | null,
          is_stockable: boolean | null,
          is_non_disc: boolean | null,
          is_pharma_approved: boolean | null,
          is_rate_contract: boolean | null,
          is_gst_editable_in_grn: boolean | null,
          is_cp_item: boolean | null,
          is_cpr_item: boolean | null,
          ec_percent: number | null,
          freight: number | null,
          grn_disc_percent: number | null,
          mp_disc_percent: number | null,
          ps_disc_percent: number | null,
          free_period_hours: number | null,
          allow_combination: boolean | null,
          allow_medicine_admin: boolean | null,
          remarks: string | null,
          tally_synced_at: string | null,
          tally_sync_status: string | null,
          hmis_item_id: number | null,
          hmis_item_name: string | null,
          hmis_item_code: string | null,
          conversion_factor: number | null
        }
        Insert: {
          id?: string,
          item_code: string,
          generic_name: string,
          brand_name?: string | null,
          category_id?: string | null,
          unit: string,
          hsn_code?: string | null,
          gst_percent?: number | null,
          shelf_life_days?: number | null,
          is_cold_chain?: boolean | null,
          is_narcotic?: boolean | null,
          is_high_alert?: boolean | null,
          is_active?: boolean | null,
          ecw_item_code?: string | null,
          tally_item_name?: string | null,
          notes?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          deleted_at?: string | null,
          manufacturer?: string | null,
          marketed_by?: string | null,
          dosage_form?: string | null,
          route_of_administration?: string | null,
          specification?: string | null,
          strength?: string | null,
          therapeutic_class?: string | null,
          department?: string | null,
          major_group?: string | null,
          minor_group?: string | null,
          item_type?: string | null,
          combination_of_drugs?: string | null,
          unit_levels?: number | null,
          level1_unit?: string | null,
          level1_qty_per_unit?: number | null,
          level2_unit?: string | null,
          level2_qty_per_unit?: number | null,
          level3_unit?: string | null,
          level3_qty_per_unit?: number | null,
          purchase_unit?: string | null,
          receipt_unit?: string | null,
          issue_unit?: string | null,
          qty_conversion?: number | null,
          item_nature_abc?: string | null,
          item_nature_ved?: string | null,
          item_nature_fsn?: string | null,
          scheduled_drug?: boolean | null,
          scheduled_drug_category?: string | null,
          is_high_risk?: boolean | null,
          is_dpco?: boolean | null,
          is_look_alike?: boolean | null,
          is_sound_alike?: boolean | null,
          is_consignment?: boolean | null,
          is_capital_goods?: boolean | null,
          is_emergency_drug?: boolean | null,
          is_hazardous?: boolean | null,
          is_imported?: boolean | null,
          is_immunization?: boolean | null,
          is_refrigerated?: boolean | null,
          is_cssd_item?: boolean | null,
          mrp?: number | null,
          barcode?: string | null,
          alternate_barcode?: string | null,
          snomed_ct_code?: string | null,
          ndc_code?: string | null,
          consignment_category?: string | null,
          snomed_ct_description?: string | null,
          gst_slab?: string | null,
          cgst_percent?: number | null,
          sgst_percent?: number | null,
          igst_percent?: number | null,
          default_rate?: number | null,
          muc_percent?: number | null,
          margin_percent?: number | null,
          reorder_level?: number | null,
          min_stock?: number | null,
          max_stock?: number | null,
          storage_location?: string | null,
          bin_location?: string | null,
          safety_stock?: number | null,
          reorder_point?: number | null,
          lead_time_days?: number | null,
          min_order_qty?: number | null,
          max_order_qty?: number | null,
          alias_names?: Json | null,
          is_generic?: boolean | null,
          is_kit?: boolean | null,
          is_linen?: boolean | null,
          is_spare_parts?: boolean | null,
          is_stockable?: boolean | null,
          is_non_disc?: boolean | null,
          is_pharma_approved?: boolean | null,
          is_rate_contract?: boolean | null,
          is_gst_editable_in_grn?: boolean | null,
          is_cp_item?: boolean | null,
          is_cpr_item?: boolean | null,
          ec_percent?: number | null,
          freight?: number | null,
          grn_disc_percent?: number | null,
          mp_disc_percent?: number | null,
          ps_disc_percent?: number | null,
          free_period_hours?: number | null,
          allow_combination?: boolean | null,
          allow_medicine_admin?: boolean | null,
          remarks?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null,
          hmis_item_id?: number | null,
          hmis_item_name?: string | null,
          hmis_item_code?: string | null,
          conversion_factor?: number | null
        }
        Update: {
          id?: string,
          item_code?: string,
          generic_name?: string,
          brand_name?: string | null,
          category_id?: string | null,
          unit?: string,
          hsn_code?: string | null,
          gst_percent?: number | null,
          shelf_life_days?: number | null,
          is_cold_chain?: boolean | null,
          is_narcotic?: boolean | null,
          is_high_alert?: boolean | null,
          is_active?: boolean | null,
          ecw_item_code?: string | null,
          tally_item_name?: string | null,
          notes?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          deleted_at?: string | null,
          manufacturer?: string | null,
          marketed_by?: string | null,
          dosage_form?: string | null,
          route_of_administration?: string | null,
          specification?: string | null,
          strength?: string | null,
          therapeutic_class?: string | null,
          department?: string | null,
          major_group?: string | null,
          minor_group?: string | null,
          item_type?: string | null,
          combination_of_drugs?: string | null,
          unit_levels?: number | null,
          level1_unit?: string | null,
          level1_qty_per_unit?: number | null,
          level2_unit?: string | null,
          level2_qty_per_unit?: number | null,
          level3_unit?: string | null,
          level3_qty_per_unit?: number | null,
          purchase_unit?: string | null,
          receipt_unit?: string | null,
          issue_unit?: string | null,
          qty_conversion?: number | null,
          item_nature_abc?: string | null,
          item_nature_ved?: string | null,
          item_nature_fsn?: string | null,
          scheduled_drug?: boolean | null,
          scheduled_drug_category?: string | null,
          is_high_risk?: boolean | null,
          is_dpco?: boolean | null,
          is_look_alike?: boolean | null,
          is_sound_alike?: boolean | null,
          is_consignment?: boolean | null,
          is_capital_goods?: boolean | null,
          is_emergency_drug?: boolean | null,
          is_hazardous?: boolean | null,
          is_imported?: boolean | null,
          is_immunization?: boolean | null,
          is_refrigerated?: boolean | null,
          is_cssd_item?: boolean | null,
          mrp?: number | null,
          barcode?: string | null,
          alternate_barcode?: string | null,
          snomed_ct_code?: string | null,
          ndc_code?: string | null,
          consignment_category?: string | null,
          snomed_ct_description?: string | null,
          gst_slab?: string | null,
          cgst_percent?: number | null,
          sgst_percent?: number | null,
          igst_percent?: number | null,
          default_rate?: number | null,
          muc_percent?: number | null,
          margin_percent?: number | null,
          reorder_level?: number | null,
          min_stock?: number | null,
          max_stock?: number | null,
          storage_location?: string | null,
          bin_location?: string | null,
          safety_stock?: number | null,
          reorder_point?: number | null,
          lead_time_days?: number | null,
          min_order_qty?: number | null,
          max_order_qty?: number | null,
          alias_names?: Json | null,
          is_generic?: boolean | null,
          is_kit?: boolean | null,
          is_linen?: boolean | null,
          is_spare_parts?: boolean | null,
          is_stockable?: boolean | null,
          is_non_disc?: boolean | null,
          is_pharma_approved?: boolean | null,
          is_rate_contract?: boolean | null,
          is_gst_editable_in_grn?: boolean | null,
          is_cp_item?: boolean | null,
          is_cpr_item?: boolean | null,
          ec_percent?: number | null,
          freight?: number | null,
          grn_disc_percent?: number | null,
          mp_disc_percent?: number | null,
          ps_disc_percent?: number | null,
          free_period_hours?: number | null,
          allow_combination?: boolean | null,
          allow_medicine_admin?: boolean | null,
          remarks?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null,
          hmis_item_id?: number | null,
          hmis_item_name?: string | null,
          hmis_item_code?: string | null,
          conversion_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'items_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'item_categories'
            referencedColumns: ['id']
          }
        ]
      }
      major_group_map: {
        Row: {
          hmis_value: string,
          vpms_group: string,
          created_at: string | null
        }
        Insert: {
          hmis_value: string,
          vpms_group: string,
          created_at?: string | null
        }
        Update: {
          hmis_value?: string,
          vpms_group?: string,
          created_at?: string | null
        }
        Relationships: [

        ]
      }
      notifications: {
        Row: {
          id: string,
          user_id: string,
          title: string,
          message: string,
          type: string | null,
          priority: string | null,
          entity_type: string | null,
          entity_id: string | null,
          is_read: boolean | null,
          created_by: string | null,
          created_at: string | null,
          read_at: string | null
        }
        Insert: {
          id?: string,
          user_id: string,
          title: string,
          message: string,
          type?: string | null,
          priority?: string | null,
          entity_type?: string | null,
          entity_id?: string | null,
          is_read?: boolean | null,
          created_by?: string | null,
          created_at?: string | null,
          read_at?: string | null
        }
        Update: {
          id?: string,
          user_id?: string,
          title?: string,
          message?: string,
          type?: string | null,
          priority?: string | null,
          entity_type?: string | null,
          entity_id?: string | null,
          is_read?: boolean | null,
          created_by?: string | null,
          created_at?: string | null,
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      payment_batch_items: {
        Row: {
          id: string,
          batch_id: string,
          invoice_id: string,
          vendor_id: string,
          amount: number,
          payment_mode: string | null,
          utr_number: string | null,
          payment_date: string | null,
          status: string | null,
          tds_percent: number | null,
          tds_amount: number | null,
          debit_note_adj: number | null,
          advance_adj: number | null,
          net_payable: number | null,
          reference_number: string | null
        }
        Insert: {
          id?: string,
          batch_id: string,
          invoice_id: string,
          vendor_id: string,
          amount: number,
          payment_mode?: string | null,
          utr_number?: string | null,
          payment_date?: string | null,
          status?: string | null,
          tds_percent?: number | null,
          tds_amount?: number | null,
          debit_note_adj?: number | null,
          advance_adj?: number | null,
          net_payable?: number | null,
          reference_number?: string | null
        }
        Update: {
          id?: string,
          batch_id?: string,
          invoice_id?: string,
          vendor_id?: string,
          amount?: number,
          payment_mode?: string | null,
          utr_number?: string | null,
          payment_date?: string | null,
          status?: string | null,
          tds_percent?: number | null,
          tds_amount?: number | null,
          debit_note_adj?: number | null,
          advance_adj?: number | null,
          net_payable?: number | null,
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payment_batch_items_batch_id_fkey'
            columns: ['batch_id']
            isOneToOne: false
            referencedRelation: 'payment_batches'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payment_batch_items_invoice_id_fkey'
            columns: ['invoice_id']
            isOneToOne: false
            referencedRelation: 'invoices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payment_batch_items_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      payment_batches: {
        Row: {
          id: string,
          batch_number: string,
          centre_id: string | null,
          batch_date: string,
          status: string | null,
          total_amount: number | null,
          approved_by: string | null,
          approved_at: string | null,
          notes: string | null,
          created_at: string | null,
          payment_mode: string | null,
          bank_account: string | null,
          payment_date: string | null,
          paid_at: string | null,
          paid_by: string | null,
          tally_voucher_number: string | null,
          tally_synced_at: string | null,
          tally_sync_status: string | null
        }
        Insert: {
          id?: string,
          batch_number: string,
          centre_id?: string | null,
          batch_date: string,
          status?: string | null,
          total_amount?: number | null,
          approved_by?: string | null,
          approved_at?: string | null,
          notes?: string | null,
          created_at?: string | null,
          payment_mode?: string | null,
          bank_account?: string | null,
          payment_date?: string | null,
          paid_at?: string | null,
          paid_by?: string | null,
          tally_voucher_number?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null
        }
        Update: {
          id?: string,
          batch_number?: string,
          centre_id?: string | null,
          batch_date?: string,
          status?: string | null,
          total_amount?: number | null,
          approved_by?: string | null,
          approved_at?: string | null,
          notes?: string | null,
          created_at?: string | null,
          payment_mode?: string | null,
          bank_account?: string | null,
          payment_date?: string | null,
          paid_at?: string | null,
          paid_by?: string | null,
          tally_voucher_number?: string | null,
          tally_synced_at?: string | null,
          tally_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payment_batches_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payment_batches_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          }
        ]
      }
      po_approvals: {
        Row: {
          id: string,
          po_id: string,
          approval_level: number,
          approver_id: string | null,
          approver_role: string,
          status: string,
          comments: string | null,
          actioned_at: string | null,
          created_at: string | null,
          sla_deadline: string | null,
          escalated_to: string | null,
          escalated_at: string | null,
          delegated_from: string | null,
          delegation_reason: string | null
        }
        Insert: {
          id?: string,
          po_id: string,
          approval_level: number,
          approver_id?: string | null,
          approver_role: string,
          status: string,
          comments?: string | null,
          actioned_at?: string | null,
          created_at?: string | null,
          sla_deadline?: string | null,
          escalated_to?: string | null,
          escalated_at?: string | null,
          delegated_from?: string | null,
          delegation_reason?: string | null
        }
        Update: {
          id?: string,
          po_id?: string,
          approval_level?: number,
          approver_id?: string | null,
          approver_role?: string,
          status?: string,
          comments?: string | null,
          actioned_at?: string | null,
          created_at?: string | null,
          sla_deadline?: string | null,
          escalated_to?: string | null,
          escalated_at?: string | null,
          delegated_from?: string | null,
          delegation_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'po_approvals_approver_id_fkey'
            columns: ['approver_id']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'po_approvals_po_id_fkey'
            columns: ['po_id']
            isOneToOne: false
            referencedRelation: 'purchase_orders'
            referencedColumns: ['id']
          }
        ]
      }
      purchase_indent_items: {
        Row: {
          id: string,
          indent_id: string,
          item_id: string,
          requested_qty: number,
          unit: string,
          current_stock: number | null,
          last_purchase_rate: number | null,
          estimated_value: number | null,
          notes: string | null
        }
        Insert: {
          id?: string,
          indent_id: string,
          item_id: string,
          requested_qty: number,
          unit: string,
          current_stock?: number | null,
          last_purchase_rate?: number | null,
          estimated_value?: number | null,
          notes?: string | null
        }
        Update: {
          id?: string,
          indent_id?: string,
          item_id?: string,
          requested_qty?: number,
          unit?: string,
          current_stock?: number | null,
          last_purchase_rate?: number | null,
          estimated_value?: number | null,
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'purchase_indent_items_indent_id_fkey'
            columns: ['indent_id']
            isOneToOne: false
            referencedRelation: 'purchase_indents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_indent_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      purchase_indents: {
        Row: {
          id: string,
          indent_number: string,
          centre_id: string,
          requested_by: string | null,
          status: string | null,
          priority: string | null,
          notes: string | null,
          approved_by: string | null,
          approved_at: string | null,
          created_at: string | null,
          updated_at: string | null,
          source: string,
          requested_by_external: string | null
        }
        Insert: {
          id?: string,
          indent_number: string,
          centre_id: string,
          requested_by?: string | null,
          status?: string | null,
          priority?: string | null,
          notes?: string | null,
          approved_by?: string | null,
          approved_at?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          source?: string,
          requested_by_external?: string | null
        }
        Update: {
          id?: string,
          indent_number?: string,
          centre_id?: string,
          requested_by?: string | null,
          status?: string | null,
          priority?: string | null,
          notes?: string | null,
          approved_by?: string | null,
          approved_at?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          source?: string,
          requested_by_external?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'purchase_indents_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_indents_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_indents_requested_by_fkey'
            columns: ['requested_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      purchase_order_items: {
        Row: {
          id: string,
          po_id: string,
          item_id: string,
          ordered_qty: number,
          received_qty: number | null,
          unit: string,
          rate: number,
          gst_percent: number | null,
          gst_amount: number | null,
          total_amount: number,
          rate_contract_id: string | null,
          notes: string | null,
          free_qty: number | null,
          net_rate: number | null,
          mrp: number | null,
          trade_discount_percent: number | null,
          cash_discount_percent: number | null,
          special_discount_percent: number | null,
          cgst_percent: number | null,
          sgst_percent: number | null,
          igst_percent: number | null,
          cgst_amount: number | null,
          sgst_amount: number | null,
          igst_amount: number | null,
          hsn_code: string | null,
          manufacturer: string | null,
          delivery_date: string | null,
          contract_rate: number | null,
          pending_qty: number | null,
          purchase_unit: string | null,
          conversion_factor: number | null,
          base_qty: number | null,
          trade_discount_amount: number | null
        }
        Insert: {
          id?: string,
          po_id: string,
          item_id: string,
          ordered_qty: number,
          received_qty?: number | null,
          unit: string,
          rate: number,
          gst_percent?: number | null,
          gst_amount?: number | null,
          total_amount: number,
          rate_contract_id?: string | null,
          notes?: string | null,
          free_qty?: number | null,
          net_rate?: number | null,
          mrp?: number | null,
          trade_discount_percent?: number | null,
          cash_discount_percent?: number | null,
          special_discount_percent?: number | null,
          cgst_percent?: number | null,
          sgst_percent?: number | null,
          igst_percent?: number | null,
          cgst_amount?: number | null,
          sgst_amount?: number | null,
          igst_amount?: number | null,
          hsn_code?: string | null,
          manufacturer?: string | null,
          delivery_date?: string | null,
          contract_rate?: number | null,
          pending_qty?: number | null,
          purchase_unit?: string | null,
          conversion_factor?: number | null,
          base_qty?: number | null,
          trade_discount_amount?: number | null
        }
        Update: {
          id?: string,
          po_id?: string,
          item_id?: string,
          ordered_qty?: number,
          received_qty?: number | null,
          unit?: string,
          rate?: number,
          gst_percent?: number | null,
          gst_amount?: number | null,
          total_amount?: number,
          rate_contract_id?: string | null,
          notes?: string | null,
          free_qty?: number | null,
          net_rate?: number | null,
          mrp?: number | null,
          trade_discount_percent?: number | null,
          cash_discount_percent?: number | null,
          special_discount_percent?: number | null,
          cgst_percent?: number | null,
          sgst_percent?: number | null,
          igst_percent?: number | null,
          cgst_amount?: number | null,
          sgst_amount?: number | null,
          igst_amount?: number | null,
          hsn_code?: string | null,
          manufacturer?: string | null,
          delivery_date?: string | null,
          contract_rate?: number | null,
          pending_qty?: number | null,
          purchase_unit?: string | null,
          conversion_factor?: number | null,
          base_qty?: number | null,
          trade_discount_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'purchase_order_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_order_items_po_id_fkey'
            columns: ['po_id']
            isOneToOne: false
            referencedRelation: 'purchase_orders'
            referencedColumns: ['id']
          }
        ]
      }
      purchase_orders: {
        Row: {
          id: string,
          po_number: string,
          centre_id: string,
          vendor_id: string,
          indent_id: string | null,
          status: string | null,
          po_date: string | null,
          expected_delivery_date: string | null,
          delivery_address: string | null,
          subtotal: number | null,
          gst_amount: number | null,
          total_amount: number | null,
          notes: string | null,
          current_approval_level: number | null,
          approved_by: string | null,
          approved_at: string | null,
          sent_to_vendor_at: string | null,
          created_by: string | null,
          created_at: string | null,
          updated_at: string | null,
          deleted_at: string | null,
          priority: string | null,
          supply_type: string | null,
          vendor_acknowledged: boolean | null,
          vendor_acknowledged_at: string | null,
          vendor_confirmed_delivery_date: string | null,
          vendor_notes: string | null,
          vendor_dispute: boolean | null,
          vendor_dispute_reason: string | null,
          vendor_dispute_at: string | null,
          cancelled_at: string | null,
          cancellation_reason: string | null,
          closed_at: string | null,
          freight_amount: number | null,
          loading_charges: number | null,
          insurance_charges: number | null,
          other_charges: number | null,
          tds_applicable: boolean | null,
          tds_section: string | null,
          tds_rate: number | null,
          discount_amount: number | null,
          quotation_ref: string | null,
          quotation_date: string | null,
          terms_and_conditions: string | null,
          delivery_instructions: string | null,
          payment_terms: string | null,
          cgst_amount: number | null,
          sgst_amount: number | null,
          igst_amount: number | null,
          net_amount: number | null,
          po_type: string | null,
          short_closed_at: string | null,
          short_close_reason: string | null
        }
        Insert: {
          id?: string,
          po_number: string,
          centre_id: string,
          vendor_id: string,
          indent_id?: string | null,
          status?: string | null,
          po_date?: string | null,
          expected_delivery_date?: string | null,
          delivery_address?: string | null,
          subtotal?: number | null,
          gst_amount?: number | null,
          total_amount?: number | null,
          notes?: string | null,
          current_approval_level?: number | null,
          approved_by?: string | null,
          approved_at?: string | null,
          sent_to_vendor_at?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          deleted_at?: string | null,
          priority?: string | null,
          supply_type?: string | null,
          vendor_acknowledged?: boolean | null,
          vendor_acknowledged_at?: string | null,
          vendor_confirmed_delivery_date?: string | null,
          vendor_notes?: string | null,
          vendor_dispute?: boolean | null,
          vendor_dispute_reason?: string | null,
          vendor_dispute_at?: string | null,
          cancelled_at?: string | null,
          cancellation_reason?: string | null,
          closed_at?: string | null,
          freight_amount?: number | null,
          loading_charges?: number | null,
          insurance_charges?: number | null,
          other_charges?: number | null,
          tds_applicable?: boolean | null,
          tds_section?: string | null,
          tds_rate?: number | null,
          discount_amount?: number | null,
          quotation_ref?: string | null,
          quotation_date?: string | null,
          terms_and_conditions?: string | null,
          delivery_instructions?: string | null,
          payment_terms?: string | null,
          cgst_amount?: number | null,
          sgst_amount?: number | null,
          igst_amount?: number | null,
          net_amount?: number | null,
          po_type?: string | null,
          short_closed_at?: string | null,
          short_close_reason?: string | null
        }
        Update: {
          id?: string,
          po_number?: string,
          centre_id?: string,
          vendor_id?: string,
          indent_id?: string | null,
          status?: string | null,
          po_date?: string | null,
          expected_delivery_date?: string | null,
          delivery_address?: string | null,
          subtotal?: number | null,
          gst_amount?: number | null,
          total_amount?: number | null,
          notes?: string | null,
          current_approval_level?: number | null,
          approved_by?: string | null,
          approved_at?: string | null,
          sent_to_vendor_at?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          deleted_at?: string | null,
          priority?: string | null,
          supply_type?: string | null,
          vendor_acknowledged?: boolean | null,
          vendor_acknowledged_at?: string | null,
          vendor_confirmed_delivery_date?: string | null,
          vendor_notes?: string | null,
          vendor_dispute?: boolean | null,
          vendor_dispute_reason?: string | null,
          vendor_dispute_at?: string | null,
          cancelled_at?: string | null,
          cancellation_reason?: string | null,
          closed_at?: string | null,
          freight_amount?: number | null,
          loading_charges?: number | null,
          insurance_charges?: number | null,
          other_charges?: number | null,
          tds_applicable?: boolean | null,
          tds_section?: string | null,
          tds_rate?: number | null,
          discount_amount?: number | null,
          quotation_ref?: string | null,
          quotation_date?: string | null,
          terms_and_conditions?: string | null,
          delivery_instructions?: string | null,
          payment_terms?: string | null,
          cgst_amount?: number | null,
          sgst_amount?: number | null,
          igst_amount?: number | null,
          net_amount?: number | null,
          po_type?: string | null,
          short_closed_at?: string | null,
          short_close_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'purchase_orders_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_orders_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_orders_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_orders_indent_id_fkey'
            columns: ['indent_id']
            isOneToOne: false
            referencedRelation: 'purchase_indents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchase_orders_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      rate_contract_items: {
        Row: {
          id: string,
          contract_id: string,
          item_id: string,
          rate: number,
          unit: string,
          gst_percent: number | null,
          l_rank: number | null
        }
        Insert: {
          id?: string,
          contract_id: string,
          item_id: string,
          rate: number,
          unit: string,
          gst_percent?: number | null,
          l_rank?: number | null
        }
        Update: {
          id?: string,
          contract_id?: string,
          item_id?: string,
          rate?: number,
          unit?: string,
          gst_percent?: number | null,
          l_rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'rate_contract_items_contract_id_fkey'
            columns: ['contract_id']
            isOneToOne: false
            referencedRelation: 'rate_contracts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rate_contract_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      rate_contracts: {
        Row: {
          id: string,
          contract_number: string,
          vendor_id: string,
          centre_id: string | null,
          contract_type: string | null,
          valid_from: string,
          valid_to: string,
          status: string | null,
          approved_by: string | null,
          created_at: string | null,
          approved_at: string | null,
          termination_reason: string | null,
          updated_at: string | null
        }
        Insert: {
          id?: string,
          contract_number: string,
          vendor_id: string,
          centre_id?: string | null,
          contract_type?: string | null,
          valid_from: string,
          valid_to: string,
          status?: string | null,
          approved_by?: string | null,
          created_at?: string | null,
          approved_at?: string | null,
          termination_reason?: string | null,
          updated_at?: string | null
        }
        Update: {
          id?: string,
          contract_number?: string,
          vendor_id?: string,
          centre_id?: string | null,
          contract_type?: string | null,
          valid_from?: string,
          valid_to?: string,
          status?: string | null,
          approved_by?: string | null,
          created_at?: string | null,
          approved_at?: string | null,
          termination_reason?: string | null,
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'rate_contracts_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rate_contracts_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rate_contracts_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      rfq_items: {
        Row: {
          id: string,
          rfq_id: string,
          item_id: string | null,
          description: string,
          quantity: number,
          unit: string,
          specifications: string | null,
          sort_order: number | null
        }
        Insert: {
          id?: string,
          rfq_id: string,
          item_id?: string | null,
          description: string,
          quantity: number,
          unit: string,
          specifications?: string | null,
          sort_order?: number | null
        }
        Update: {
          id?: string,
          rfq_id?: string,
          item_id?: string | null,
          description?: string,
          quantity?: number,
          unit?: string,
          specifications?: string | null,
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'rfq_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rfq_items_rfq_id_fkey'
            columns: ['rfq_id']
            isOneToOne: false
            referencedRelation: 'rfqs'
            referencedColumns: ['id']
          }
        ]
      }
      rfq_quote_items: {
        Row: {
          id: string,
          quote_id: string,
          rfq_item_id: string,
          unit_rate: number,
          gst_percent: number | null,
          total_amount: number,
          brand: string | null,
          manufacturer: string | null,
          delivery_days: number | null,
          remarks: string | null
        }
        Insert: {
          id?: string,
          quote_id: string,
          rfq_item_id: string,
          unit_rate: number,
          gst_percent?: number | null,
          total_amount: number,
          brand?: string | null,
          manufacturer?: string | null,
          delivery_days?: number | null,
          remarks?: string | null
        }
        Update: {
          id?: string,
          quote_id?: string,
          rfq_item_id?: string,
          unit_rate?: number,
          gst_percent?: number | null,
          total_amount?: number,
          brand?: string | null,
          manufacturer?: string | null,
          delivery_days?: number | null,
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'rfq_quote_items_quote_id_fkey'
            columns: ['quote_id']
            isOneToOne: false
            referencedRelation: 'rfq_quotes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rfq_quote_items_rfq_item_id_fkey'
            columns: ['rfq_item_id']
            isOneToOne: false
            referencedRelation: 'rfq_items'
            referencedColumns: ['id']
          }
        ]
      }
      rfq_quotes: {
        Row: {
          id: string,
          rfq_id: string,
          vendor_id: string,
          status: string,
          total_amount: number | null,
          delivery_timeline_days: number | null,
          payment_terms: string | null,
          validity_days: number | null,
          notes: string | null,
          submitted_at: string | null,
          created_at: string | null,
          updated_at: string | null
        }
        Insert: {
          id?: string,
          rfq_id: string,
          vendor_id: string,
          status?: string,
          total_amount?: number | null,
          delivery_timeline_days?: number | null,
          payment_terms?: string | null,
          validity_days?: number | null,
          notes?: string | null,
          submitted_at?: string | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Update: {
          id?: string,
          rfq_id?: string,
          vendor_id?: string,
          status?: string,
          total_amount?: number | null,
          delivery_timeline_days?: number | null,
          payment_terms?: string | null,
          validity_days?: number | null,
          notes?: string | null,
          submitted_at?: string | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'rfq_quotes_rfq_id_fkey'
            columns: ['rfq_id']
            isOneToOne: false
            referencedRelation: 'rfqs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rfq_quotes_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      rfqs: {
        Row: {
          id: string,
          rfq_number: string,
          centre_id: string | null,
          title: string,
          description: string | null,
          status: string,
          category_id: string | null,
          submission_deadline: string,
          delivery_required_by: string | null,
          terms_and_conditions: string | null,
          created_by: string | null,
          created_at: string | null,
          updated_at: string | null,
          closed_at: string | null,
          awarded_vendor_id: string | null,
          awarded_at: string | null
        }
        Insert: {
          id?: string,
          rfq_number: string,
          centre_id?: string | null,
          title: string,
          description?: string | null,
          status?: string,
          category_id?: string | null,
          submission_deadline: string,
          delivery_required_by?: string | null,
          terms_and_conditions?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          closed_at?: string | null,
          awarded_vendor_id?: string | null,
          awarded_at?: string | null
        }
        Update: {
          id?: string,
          rfq_number?: string,
          centre_id?: string | null,
          title?: string,
          description?: string | null,
          status?: string,
          category_id?: string | null,
          submission_deadline?: string,
          delivery_required_by?: string | null,
          terms_and_conditions?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          closed_at?: string | null,
          awarded_vendor_id?: string | null,
          awarded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'rfqs_awarded_vendor_id_fkey'
            columns: ['awarded_vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rfqs_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'vendor_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rfqs_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'rfqs_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      stock_adjustments: {
        Row: {
          id: string,
          item_id: string | null,
          centre_id: string | null,
          adjustment_type: string,
          quantity: number,
          reason: string | null,
          previous_stock: number | null,
          new_stock: number | null,
          adjusted_by: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          item_id?: string | null,
          centre_id?: string | null,
          adjustment_type: string,
          quantity: number,
          reason?: string | null,
          previous_stock?: number | null,
          new_stock?: number | null,
          adjusted_by?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          item_id?: string | null,
          centre_id?: string | null,
          adjustment_type?: string,
          quantity?: number,
          reason?: string | null,
          previous_stock?: number | null,
          new_stock?: number | null,
          adjusted_by?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_adjustments_adjusted_by_fkey'
            columns: ['adjusted_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_adjustments_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_adjustments_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      stock_ledger: {
        Row: {
          id: string,
          centre_id: string,
          item_id: string,
          transaction_type: string,
          quantity: number,
          balance_after: number,
          reference_id: string | null,
          reference_number: string | null,
          notes: string | null,
          created_by: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          centre_id: string,
          item_id: string,
          transaction_type: string,
          quantity: number,
          balance_after: number,
          reference_id?: string | null,
          reference_number?: string | null,
          notes?: string | null,
          created_by?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          centre_id?: string,
          item_id?: string,
          transaction_type?: string,
          quantity?: number,
          balance_after?: number,
          reference_id?: string | null,
          reference_number?: string | null,
          notes?: string | null,
          created_by?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_ledger_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_ledger_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_ledger_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          }
        ]
      }
      stock_transfer_items: {
        Row: {
          id: string,
          transfer_id: string | null,
          item_id: string | null,
          requested_qty: number | null,
          dispatched_qty: number | null,
          received_qty: number | null,
          unit: string | null,
          rate: number | null,
          batch_number: string | null,
          expiry_date: string | null,
          notes: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          transfer_id?: string | null,
          item_id?: string | null,
          requested_qty?: number | null,
          dispatched_qty?: number | null,
          received_qty?: number | null,
          unit?: string | null,
          rate?: number | null,
          batch_number?: string | null,
          expiry_date?: string | null,
          notes?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          transfer_id?: string | null,
          item_id?: string | null,
          requested_qty?: number | null,
          dispatched_qty?: number | null,
          received_qty?: number | null,
          unit?: string | null,
          rate?: number | null,
          batch_number?: string | null,
          expiry_date?: string | null,
          notes?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_transfer_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_transfer_items_transfer_id_fkey'
            columns: ['transfer_id']
            isOneToOne: false
            referencedRelation: 'stock_transfers'
            referencedColumns: ['id']
          }
        ]
      }
      stock_transfers: {
        Row: {
          id: string,
          transfer_number: string | null,
          from_centre_id: string | null,
          to_centre_id: string | null,
          transfer_date: string | null,
          status: string | null,
          item_count: number | null,
          total_value: number | null,
          notes: string | null,
          approved_at: string | null,
          approved_by: string | null,
          received_at: string | null,
          received_by: string | null,
          created_by: string | null,
          created_at: string | null,
          updated_at: string | null
        }
        Insert: {
          id?: string,
          transfer_number?: string | null,
          from_centre_id?: string | null,
          to_centre_id?: string | null,
          transfer_date?: string | null,
          status?: string | null,
          item_count?: number | null,
          total_value?: number | null,
          notes?: string | null,
          approved_at?: string | null,
          approved_by?: string | null,
          received_at?: string | null,
          received_by?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Update: {
          id?: string,
          transfer_number?: string | null,
          from_centre_id?: string | null,
          to_centre_id?: string | null,
          transfer_date?: string | null,
          status?: string | null,
          item_count?: number | null,
          total_value?: number | null,
          notes?: string | null,
          approved_at?: string | null,
          approved_by?: string | null,
          received_at?: string | null,
          received_by?: string | null,
          created_by?: string | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'stock_transfers_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_transfers_created_by_fkey'
            columns: ['created_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_transfers_from_centre_id_fkey'
            columns: ['from_centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_transfers_received_by_fkey'
            columns: ['received_by']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'stock_transfers_to_centre_id_fkey'
            columns: ['to_centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          }
        ]
      }
      tally_company_config: {
        Row: {
          id: string,
          centre_id: string,
          company_name: string,
          purchase_ledger_pharmacy: string | null,
          purchase_ledger_surgical: string | null,
          purchase_ledger_general: string | null,
          cgst_input_ledger: string | null,
          sgst_input_ledger: string | null,
          igst_input_ledger: string | null,
          bank_ledger: string | null,
          cash_ledger: string | null,
          round_off_ledger: string | null,
          tds_payable_ledger: string | null,
          agent_api_key: string | null,
          sync_enabled: boolean | null,
          last_sync_at: string | null,
          last_sync_status: string | null,
          created_at: string | null,
          updated_at: string | null
        }
        Insert: {
          id?: string,
          centre_id: string,
          company_name?: string,
          purchase_ledger_pharmacy?: string | null,
          purchase_ledger_surgical?: string | null,
          purchase_ledger_general?: string | null,
          cgst_input_ledger?: string | null,
          sgst_input_ledger?: string | null,
          igst_input_ledger?: string | null,
          bank_ledger?: string | null,
          cash_ledger?: string | null,
          round_off_ledger?: string | null,
          tds_payable_ledger?: string | null,
          agent_api_key?: string | null,
          sync_enabled?: boolean | null,
          last_sync_at?: string | null,
          last_sync_status?: string | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Update: {
          id?: string,
          centre_id?: string,
          company_name?: string,
          purchase_ledger_pharmacy?: string | null,
          purchase_ledger_surgical?: string | null,
          purchase_ledger_general?: string | null,
          cgst_input_ledger?: string | null,
          sgst_input_ledger?: string | null,
          igst_input_ledger?: string | null,
          bank_ledger?: string | null,
          cash_ledger?: string | null,
          round_off_ledger?: string | null,
          tds_payable_ledger?: string | null,
          agent_api_key?: string | null,
          sync_enabled?: boolean | null,
          last_sync_at?: string | null,
          last_sync_status?: string | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tally_company_config_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          }
        ]
      }
      tally_sync_log: {
        Row: {
          id: string,
          centre_id: string,
          sync_run_id: string,
          started_at: string,
          completed_at: string | null,
          direction: string,
          total_items: number | null,
          success_count: number | null,
          failed_count: number | null,
          skipped_count: number | null,
          agent_version: string | null,
          notes: string | null
        }
        Insert: {
          id?: string,
          centre_id: string,
          sync_run_id: string,
          started_at?: string,
          completed_at?: string | null,
          direction: string,
          total_items?: number | null,
          success_count?: number | null,
          failed_count?: number | null,
          skipped_count?: number | null,
          agent_version?: string | null,
          notes?: string | null
        }
        Update: {
          id?: string,
          centre_id?: string,
          sync_run_id?: string,
          started_at?: string,
          completed_at?: string | null,
          direction?: string,
          total_items?: number | null,
          success_count?: number | null,
          failed_count?: number | null,
          skipped_count?: number | null,
          agent_version?: string | null,
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tally_sync_log_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          }
        ]
      }
      tally_sync_queue: {
        Row: {
          id: string,
          centre_id: string,
          direction: string,
          entity_type: string,
          entity_id: string | null,
          entity_ref: string | null,
          priority: number | null,
          status: string | null,
          tally_xml_request: string | null,
          tally_xml_response: string | null,
          error_message: string | null,
          retry_count: number | null,
          max_retries: number | null,
          created_at: string | null,
          processed_at: string | null,
          created_by: string | null
        }
        Insert: {
          id?: string,
          centre_id: string,
          direction: string,
          entity_type: string,
          entity_id?: string | null,
          entity_ref?: string | null,
          priority?: number | null,
          status?: string | null,
          tally_xml_request?: string | null,
          tally_xml_response?: string | null,
          error_message?: string | null,
          retry_count?: number | null,
          max_retries?: number | null,
          created_at?: string | null,
          processed_at?: string | null,
          created_by?: string | null
        }
        Update: {
          id?: string,
          centre_id?: string,
          direction?: string,
          entity_type?: string,
          entity_id?: string | null,
          entity_ref?: string | null,
          priority?: number | null,
          status?: string | null,
          tally_xml_request?: string | null,
          tally_xml_response?: string | null,
          error_message?: string | null,
          retry_count?: number | null,
          max_retries?: number | null,
          created_at?: string | null,
          processed_at?: string | null,
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tally_sync_queue_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string,
          full_name: string,
          email: string,
          phone: string | null,
          role: string,
          centre_id: string | null,
          is_active: boolean | null,
          created_at: string | null,
          updated_at: string | null
        }
        Insert: {
          id: string,
          full_name: string,
          email: string,
          phone?: string | null,
          role: string,
          centre_id?: string | null,
          is_active?: boolean | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Update: {
          id?: string,
          full_name?: string,
          email?: string,
          phone?: string | null,
          role?: string,
          centre_id?: string | null,
          is_active?: boolean | null,
          created_at?: string | null,
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_profiles_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_profiles_id_fkey'
            columns: ['id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      vendor_categories: {
        Row: {
          id: string,
          name: string,
          code: string,
          description: string | null,
          is_active: boolean | null
        }
        Insert: {
          id?: string,
          name: string,
          code: string,
          description?: string | null,
          is_active?: boolean | null
        }
        Update: {
          id?: string,
          name?: string,
          code?: string,
          description?: string | null,
          is_active?: boolean | null
        }
        Relationships: [

        ]
      }
      vendor_documents: {
        Row: {
          id: string,
          vendor_id: string,
          document_type: string,
          file_name: string,
          file_path: string,
          file_size: number | null,
          uploaded_by: string | null,
          is_verified: boolean | null,
          verified_by: string | null,
          expires_at: string | null,
          created_at: string | null,
          review_status: string | null,
          reviewed_at: string | null,
          snooze_until: string | null,
          alert_dismissed: boolean | null,
          updated_at: string | null
        }
        Insert: {
          id?: string,
          vendor_id: string,
          document_type: string,
          file_name: string,
          file_path: string,
          file_size?: number | null,
          uploaded_by?: string | null,
          is_verified?: boolean | null,
          verified_by?: string | null,
          expires_at?: string | null,
          created_at?: string | null,
          review_status?: string | null,
          reviewed_at?: string | null,
          snooze_until?: string | null,
          alert_dismissed?: boolean | null,
          updated_at?: string | null
        }
        Update: {
          id?: string,
          vendor_id?: string,
          document_type?: string,
          file_name?: string,
          file_path?: string,
          file_size?: number | null,
          uploaded_by?: string | null,
          is_verified?: boolean | null,
          verified_by?: string | null,
          expires_at?: string | null,
          created_at?: string | null,
          review_status?: string | null,
          reviewed_at?: string | null,
          snooze_until?: string | null,
          alert_dismissed?: boolean | null,
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendor_documents_uploaded_by_fkey'
            columns: ['uploaded_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendor_documents_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendor_documents_verified_by_fkey'
            columns: ['verified_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      vendor_items: {
        Row: {
          id: string,
          vendor_id: string,
          item_id: string,
          l_rank: number | null,
          last_quoted_rate: number | null,
          is_preferred: boolean | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          vendor_id: string,
          item_id: string,
          l_rank?: number | null,
          last_quoted_rate?: number | null,
          is_preferred?: boolean | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          vendor_id?: string,
          item_id?: string,
          l_rank?: number | null,
          last_quoted_rate?: number | null,
          is_preferred?: boolean | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendor_items_item_id_fkey'
            columns: ['item_id']
            isOneToOne: false
            referencedRelation: 'items'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendor_items_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      vendor_notifications: {
        Row: {
          id: string,
          vendor_id: string,
          channel: string,
          template_name: string,
          template_params: Json | null,
          phone: string | null,
          email: string | null,
          status: string,
          provider_message_id: string | null,
          error_message: string | null,
          sent_at: string | null,
          delivered_at: string | null,
          created_at: string | null
        }
        Insert: {
          id?: string,
          vendor_id: string,
          channel: string,
          template_name: string,
          template_params?: Json | null,
          phone?: string | null,
          email?: string | null,
          status?: string,
          provider_message_id?: string | null,
          error_message?: string | null,
          sent_at?: string | null,
          delivered_at?: string | null,
          created_at?: string | null
        }
        Update: {
          id?: string,
          vendor_id?: string,
          channel?: string,
          template_name?: string,
          template_params?: Json | null,
          phone?: string | null,
          email?: string | null,
          status?: string,
          provider_message_id?: string | null,
          error_message?: string | null,
          sent_at?: string | null,
          delivered_at?: string | null,
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendor_notifications_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      vendor_performance: {
        Row: {
          id: string,
          vendor_id: string,
          centre_id: string | null,
          month_year: string,
          total_pos: number | null,
          on_time_deliveries: number | null,
          late_deliveries: number | null,
          total_grn_lines: number | null,
          rejected_lines: number | null,
          total_invoices: number | null,
          matched_invoices: number | null,
          disputed_invoices: number | null,
          score: number | null,
          month: string | null,
          delivery_score: number | null,
          quality_score: number | null,
          price_score: number | null,
          service_score: number | null,
          overall_score: number | null,
          notes: string | null
        }
        Insert: {
          id?: string,
          vendor_id: string,
          centre_id?: string | null,
          month_year: string,
          total_pos?: number | null,
          on_time_deliveries?: number | null,
          late_deliveries?: number | null,
          total_grn_lines?: number | null,
          rejected_lines?: number | null,
          total_invoices?: number | null,
          matched_invoices?: number | null,
          disputed_invoices?: number | null,
          score?: number | null,
          month?: string | null,
          delivery_score?: number | null,
          quality_score?: number | null,
          price_score?: number | null,
          service_score?: number | null,
          overall_score?: number | null,
          notes?: string | null
        }
        Update: {
          id?: string,
          vendor_id?: string,
          centre_id?: string | null,
          month_year?: string,
          total_pos?: number | null,
          on_time_deliveries?: number | null,
          late_deliveries?: number | null,
          total_grn_lines?: number | null,
          rejected_lines?: number | null,
          total_invoices?: number | null,
          matched_invoices?: number | null,
          disputed_invoices?: number | null,
          score?: number | null,
          month?: string | null,
          delivery_score?: number | null,
          quality_score?: number | null,
          price_score?: number | null,
          service_score?: number | null,
          overall_score?: number | null,
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendor_performance_centre_id_fkey'
            columns: ['centre_id']
            isOneToOne: false
            referencedRelation: 'centres'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendor_performance_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      vendor_sessions: {
        Row: {
          id: string,
          vendor_id: string,
          phone: string,
          otp_code: string | null,
          otp_expires_at: string | null,
          otp_attempts: number | null,
          session_token: string | null,
          session_expires_at: string | null,
          last_active_at: string | null,
          created_at: string | null,
          user_agent: string | null,
          ip_address: string | null
        }
        Insert: {
          id?: string,
          vendor_id: string,
          phone: string,
          otp_code?: string | null,
          otp_expires_at?: string | null,
          otp_attempts?: number | null,
          session_token?: string | null,
          session_expires_at?: string | null,
          last_active_at?: string | null,
          created_at?: string | null,
          user_agent?: string | null,
          ip_address?: string | null
        }
        Update: {
          id?: string,
          vendor_id?: string,
          phone?: string,
          otp_code?: string | null,
          otp_expires_at?: string | null,
          otp_attempts?: number | null,
          session_token?: string | null,
          session_expires_at?: string | null,
          last_active_at?: string | null,
          created_at?: string | null,
          user_agent?: string | null,
          ip_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendor_sessions_vendor_id_fkey'
            columns: ['vendor_id']
            isOneToOne: false
            referencedRelation: 'vendors'
            referencedColumns: ['id']
          }
        ]
      }
      vendors: {
        Row: {
          id: string,
          vendor_code: string,
          legal_name: string,
          trade_name: string | null,
          category_id: string | null,
          gstin: string | null,
          pan: string | null,
          drug_license_no: string | null,
          fssai_no: string | null,
          bank_name: string | null,
          bank_account_no: string | null,
          bank_ifsc: string | null,
          bank_account_type: string | null,
          bank_verified: boolean | null,
          bank_verified_at: string | null,
          credit_period_days: number | null,
          credit_limit: number | null,
          payment_terms: string | null,
          primary_contact_name: string | null,
          primary_contact_phone: string | null,
          primary_contact_email: string | null,
          address: string | null,
          city: string | null,
          state: string | null,
          pincode: string | null,
          status: string | null,
          gstin_verified: boolean | null,
          pan_verified: boolean | null,
          approved_centres: string[] | null,
          portal_access: boolean | null,
          portal_email: string | null,
          onboarded_by: string | null,
          approved_by: string | null,
          approval_notes: string | null,
          created_at: string | null,
          updated_at: string | null,
          deleted_at: string | null,
          vendor_type: string | null,
          msme_category: string | null,
          msme_registration_no: string | null,
          tds_applicable: boolean | null,
          tds_section: string | null,
          tds_rate: number | null,
          trade_discount_percent: number | null,
          cash_discount_percent: number | null,
          upi_id: string | null,
          pan_number: string | null,
          default_tds_percent: number | null,
          drug_license_expiry: string | null,
          fssai_expiry: string | null,
          udyam_number: string | null,
          gst_return_status: string | null,
          secondary_contact_name: string | null,
          secondary_contact_phone: string | null,
          secondary_contact_email: string | null,
          secondary_contact_designation: string | null,
          payment_mode_preferred: string | null,
          is_active: boolean | null,
          cash_discount_days: number | null,
          delivery_terms: string | null,
          lower_tds_certificate: string | null,
          lower_tds_rate: number | null,
          lower_tds_valid_till: string | null,
          minimum_order_value: number | null,
          tally_group: string | null,
          tally_ledger_name: string | null,
          created_by: string | null,
          onboarding_status: string | null,
          portal_phone: string | null,
          portal_last_login: string | null,
          portal_login_count: number | null,
          tally_synced_at: string | null,
          tally_outstanding: number | null,
          tally_sync_status: string | null
        }
        Insert: {
          id?: string,
          vendor_code: string,
          legal_name: string,
          trade_name?: string | null,
          category_id?: string | null,
          gstin?: string | null,
          pan?: string | null,
          drug_license_no?: string | null,
          fssai_no?: string | null,
          bank_name?: string | null,
          bank_account_no?: string | null,
          bank_ifsc?: string | null,
          bank_account_type?: string | null,
          bank_verified?: boolean | null,
          bank_verified_at?: string | null,
          credit_period_days?: number | null,
          credit_limit?: number | null,
          payment_terms?: string | null,
          primary_contact_name?: string | null,
          primary_contact_phone?: string | null,
          primary_contact_email?: string | null,
          address?: string | null,
          city?: string | null,
          state?: string | null,
          pincode?: string | null,
          status?: string | null,
          gstin_verified?: boolean | null,
          pan_verified?: boolean | null,
          approved_centres?: string[] | null,
          portal_access?: boolean | null,
          portal_email?: string | null,
          onboarded_by?: string | null,
          approved_by?: string | null,
          approval_notes?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          deleted_at?: string | null,
          vendor_type?: string | null,
          msme_category?: string | null,
          msme_registration_no?: string | null,
          tds_applicable?: boolean | null,
          tds_section?: string | null,
          tds_rate?: number | null,
          trade_discount_percent?: number | null,
          cash_discount_percent?: number | null,
          upi_id?: string | null,
          pan_number?: string | null,
          default_tds_percent?: number | null,
          drug_license_expiry?: string | null,
          fssai_expiry?: string | null,
          udyam_number?: string | null,
          gst_return_status?: string | null,
          secondary_contact_name?: string | null,
          secondary_contact_phone?: string | null,
          secondary_contact_email?: string | null,
          secondary_contact_designation?: string | null,
          payment_mode_preferred?: string | null,
          is_active?: boolean | null,
          cash_discount_days?: number | null,
          delivery_terms?: string | null,
          lower_tds_certificate?: string | null,
          lower_tds_rate?: number | null,
          lower_tds_valid_till?: string | null,
          minimum_order_value?: number | null,
          tally_group?: string | null,
          tally_ledger_name?: string | null,
          created_by?: string | null,
          onboarding_status?: string | null,
          portal_phone?: string | null,
          portal_last_login?: string | null,
          portal_login_count?: number | null,
          tally_synced_at?: string | null,
          tally_outstanding?: number | null,
          tally_sync_status?: string | null
        }
        Update: {
          id?: string,
          vendor_code?: string,
          legal_name?: string,
          trade_name?: string | null,
          category_id?: string | null,
          gstin?: string | null,
          pan?: string | null,
          drug_license_no?: string | null,
          fssai_no?: string | null,
          bank_name?: string | null,
          bank_account_no?: string | null,
          bank_ifsc?: string | null,
          bank_account_type?: string | null,
          bank_verified?: boolean | null,
          bank_verified_at?: string | null,
          credit_period_days?: number | null,
          credit_limit?: number | null,
          payment_terms?: string | null,
          primary_contact_name?: string | null,
          primary_contact_phone?: string | null,
          primary_contact_email?: string | null,
          address?: string | null,
          city?: string | null,
          state?: string | null,
          pincode?: string | null,
          status?: string | null,
          gstin_verified?: boolean | null,
          pan_verified?: boolean | null,
          approved_centres?: string[] | null,
          portal_access?: boolean | null,
          portal_email?: string | null,
          onboarded_by?: string | null,
          approved_by?: string | null,
          approval_notes?: string | null,
          created_at?: string | null,
          updated_at?: string | null,
          deleted_at?: string | null,
          vendor_type?: string | null,
          msme_category?: string | null,
          msme_registration_no?: string | null,
          tds_applicable?: boolean | null,
          tds_section?: string | null,
          tds_rate?: number | null,
          trade_discount_percent?: number | null,
          cash_discount_percent?: number | null,
          upi_id?: string | null,
          pan_number?: string | null,
          default_tds_percent?: number | null,
          drug_license_expiry?: string | null,
          fssai_expiry?: string | null,
          udyam_number?: string | null,
          gst_return_status?: string | null,
          secondary_contact_name?: string | null,
          secondary_contact_phone?: string | null,
          secondary_contact_email?: string | null,
          secondary_contact_designation?: string | null,
          payment_mode_preferred?: string | null,
          is_active?: boolean | null,
          cash_discount_days?: number | null,
          delivery_terms?: string | null,
          lower_tds_certificate?: string | null,
          lower_tds_rate?: number | null,
          lower_tds_valid_till?: string | null,
          minimum_order_value?: number | null,
          tally_group?: string | null,
          tally_ledger_name?: string | null,
          created_by?: string | null,
          onboarding_status?: string | null,
          portal_phone?: string | null,
          portal_last_login?: string | null,
          portal_login_count?: number | null,
          tally_synced_at?: string | null,
          tally_outstanding?: number | null,
          tally_sync_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'vendors_approved_by_fkey'
            columns: ['approved_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendors_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'vendor_categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'vendors_onboarded_by_fkey'
            columns: ['onboarded_by']
            isOneToOne: false
            referencedRelation: 'user_profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      cleanup_vendor_sessions: {
        Args: Record<string, never>
        Returns: undefined
      }
      get_my_centre_id: {
        Args: Record<string, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<string, never>
        Returns: string
      }
      next_sequence_number: {
        Args: {
          seq_name: string
          seq_type: string
          centre_code?: string
        }
        Returns: string
      }
      update_stock_from_grn: {
        Args: {
          p_grn_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      validate_vendor_session: {
        Args: {
          p_token: string
        }
        Returns: Json
      }
      verify_vendor_otp: {
        Args: {
          p_phone: string
          p_otp: string
          p_user_agent?: string
          p_ip_address?: string
        }
        Returns: Json
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// ─── Convenience aliases ────────────────────────────────────
type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']
