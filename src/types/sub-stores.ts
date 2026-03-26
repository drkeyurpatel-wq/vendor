// ============================================================
// H1 VPMS — Sub-Store Types
// ============================================================

export interface SubStore {
  id: string
  centre_id: string
  code: 'MAIN' | 'OT' | 'CATH' | 'ICU' | 'CSSD' | 'WARD'
  name: string
  is_active: boolean
  created_at: string
  centre?: { code: string; name: string }
}

export interface ItemSubstoreStock {
  id: string
  item_id: string
  sub_store_id: string
  current_stock: number
  reorder_level: number
  max_level: number
  last_transfer_date: string | null
  updated_at: string
  item?: { item_code: string; generic_name: string; unit: string }
  sub_store?: SubStore
}

export interface SubstoreTransfer {
  id: string
  transfer_number: string
  from_sub_store_id: string
  to_sub_store_id: string
  from_centre_id: string
  to_centre_id: string
  transfer_date: string
  status: 'requested' | 'dispatched' | 'received' | 'cancelled'
  item_count: number
  total_value: number
  notes: string | null
  created_by: string
  approved_by: string | null
  approved_at: string | null
  received_by: string | null
  received_at: string | null
  created_at: string
  updated_at: string
  from_sub_store?: SubStore
  to_sub_store?: SubStore
}

export const SUB_STORE_CODES = ['MAIN', 'OT', 'CATH', 'ICU', 'CSSD', 'WARD'] as const
export type SubStoreCode = typeof SUB_STORE_CODES[number]

export const SUB_STORE_LABELS: Record<SubStoreCode, string> = {
  MAIN: 'Main Store',
  OT: 'OT Store',
  CATH: 'Cathlab Store',
  ICU: 'ICU Store',
  CSSD: 'CSSD Store',
  WARD: 'Ward Store',
}
