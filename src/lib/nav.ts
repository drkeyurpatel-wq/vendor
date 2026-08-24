import type { UserRole } from '@/types/database'

/**
 * Single source of truth for navigation.
 *
 * Rule: no non-admin role sees more than 7 primary destinations.
 * Everything else stays reachable by URL and by group_admin's Manage
 * section — it is hidden from the sidebar, not removed from the app.
 *
 * Every href below is verified against an existing page.tsx under
 * src/app/(dashboard). Do not add an href without a matching route.
 */

export type NavIconName =
  | 'dashboard' | 'indent' | 'grn' | 'stock' | 'expiry'
  | 'po' | 'vendors' | 'contracts' | 'invoices' | 'schedule'
  | 'payments' | 'debit' | 'overdue' | 'spend' | 'analytics'
  | 'items' | 'inventory' | 'consignment' | 'reports' | 'settings'

export interface NavLink {
  label: string
  href: string
  icon: NavIconName
}

export interface NavGroup {
  label: string
  icon: NavIconName
  children: { label: string; href: string }[]
}

export type NavEntry = NavLink | NavGroup

export const isNavGroup = (e: NavEntry): e is NavGroup =>
  (e as NavGroup).children !== undefined

const DASHBOARD: NavLink = { label: 'Dashboard', href: '/', icon: 'dashboard' }

/** Primary navigation per role. Flat lists — no nesting, no discovery cost. */
const PRIMARY: Record<UserRole, NavLink[]> = {
  store_staff: [
    DASHBOARD,
    { label: 'Indents', href: '/purchase-orders/indents', icon: 'indent' },
    { label: 'GRN', href: '/grn', icon: 'grn' },
    { label: 'Stock Levels', href: '/items/stock', icon: 'stock' },
    { label: 'Expiry Alerts', href: '/inventory/expiry-alerts', icon: 'expiry' },
  ],

  unit_purchase_manager: [
    DASHBOARD,
    { label: 'Indents', href: '/purchase-orders/indents', icon: 'indent' },
    { label: 'Purchase Orders', href: '/purchase-orders', icon: 'po' },
    { label: 'Vendors', href: '/vendors', icon: 'vendors' },
    { label: 'Rate Contracts', href: '/settings/rate-contracts', icon: 'contracts' },
    { label: 'Stock Levels', href: '/items/stock', icon: 'stock' },
  ],

  finance_staff: [
    DASHBOARD,
    { label: 'Invoices', href: '/finance/invoices', icon: 'invoices' },
    { label: 'Payment Schedule', href: '/finance/payments/schedule', icon: 'schedule' },
    { label: 'Payment Batches', href: '/finance/payments', icon: 'payments' },
    { label: 'Debit Notes', href: '/finance/debit-notes', icon: 'debit' },
    { label: 'Vendor Outstanding', href: '/reports/vendor-overdue', icon: 'overdue' },
  ],

  unit_cao: [
    DASHBOARD,
    { label: 'Purchase Orders', href: '/purchase-orders', icon: 'po' },
    { label: 'Invoices', href: '/finance/invoices', icon: 'invoices' },
    { label: 'Centre Spend', href: '/reports/centre-wise-spend', icon: 'spend' },
    { label: 'Stock Levels', href: '/items/stock', icon: 'stock' },
  ],

  group_cao: [
    DASHBOARD,
    { label: 'Purchase Orders', href: '/purchase-orders', icon: 'po' },
    { label: 'Payments', href: '/finance/payments', icon: 'payments' },
    { label: 'Vendor Outstanding', href: '/reports/vendor-overdue', icon: 'overdue' },
    { label: 'Centre Spend', href: '/reports/centre-wise-spend', icon: 'spend' },
    { label: 'Analytics', href: '/analytics', icon: 'analytics' },
  ],

  group_admin: [
    DASHBOARD,
    { label: 'Purchase Orders', href: '/purchase-orders', icon: 'po' },
    { label: 'Payments', href: '/finance/payments', icon: 'payments' },
    { label: 'Vendor Outstanding', href: '/reports/vendor-overdue', icon: 'overdue' },
    { label: 'Centre Spend', href: '/reports/centre-wise-spend', icon: 'spend' },
    { label: 'Analytics', href: '/analytics', icon: 'analytics' },
  ],

  vendor: [
    { label: 'Dashboard', href: '/vendor-portal', icon: 'dashboard' },
    { label: 'Purchase Orders', href: '/vendor-portal/orders', icon: 'po' },
    { label: 'Upload Invoice', href: '/vendor-portal/invoices/upload', icon: 'invoices' },
    { label: 'Invoices', href: '/vendor-portal/invoices', icon: 'invoices' },
    { label: 'Payments', href: '/vendor-portal/payments', icon: 'payments' },
    { label: 'Outstanding', href: '/vendor-portal/outstanding', icon: 'overdue' },
  ],
}

/**
 * Everything else. Rendered only for group_admin, below the primary list.
 * Deduped: Stock Levels lives under Items only; Audit Trail dropped in
 * favour of Audit Log (the page itself is untouched).
 */
const MANAGE: NavGroup[] = [
  {
    label: 'Vendors', icon: 'vendors',
    children: [
      { label: 'Vendor Master', href: '/vendors' },
      { label: 'Categories', href: '/vendors/categories' },
    ],
  },
  {
    label: 'Items / SKUs', icon: 'items',
    children: [
      { label: 'Item Master', href: '/items' },
      { label: 'Categories', href: '/items/categories' },
      { label: 'Stock Levels', href: '/items/stock' },
      { label: 'Consumption Report', href: '/items/consumption' },
      { label: 'Upload Consumption', href: '/items/consumption/upload' },
    ],
  },
  {
    label: 'Purchase', icon: 'po',
    children: [
      { label: 'Indents', href: '/purchase-orders/indents' },
      { label: 'GRN', href: '/grn' },
    ],
  },
  {
    label: 'Finance', icon: 'invoices',
    children: [
      { label: 'Invoices', href: '/finance/invoices' },
      { label: 'Credit Period', href: '/finance/credit' },
      { label: 'Payment Schedule', href: '/finance/payments/schedule' },
      { label: 'Debit Notes', href: '/finance/debit-notes' },
    ],
  },
  {
    label: 'Inventory', icon: 'inventory',
    children: [
      { label: 'Transfers', href: '/inventory/transfers' },
      { label: 'Reorder Engine', href: '/inventory/reorder' },
      { label: 'Expiry Alerts', href: '/inventory/expiry-alerts' },
      { label: 'Forecasting', href: '/inventory/forecasting' },
    ],
  },
  {
    label: 'Consignment', icon: 'consignment',
    children: [
      { label: 'Dashboard', href: '/consignment' },
      { label: 'Receive Challan', href: '/consignment/deposits/new' },
      { label: 'Stock View', href: '/consignment/stock' },
      { label: 'Usage Log', href: '/consignment/usage' },
    ],
  },
  {
    label: 'Reports', icon: 'reports',
    children: [
      { label: 'Overview', href: '/reports' },
      { label: 'GST Summary', href: '/reports/gst-summary' },
      { label: 'PO Aging', href: '/reports/po-aging' },
      { label: 'Item Purchase History', href: '/reports/item-purchase-history' },
      { label: 'Vendor Performance', href: '/reports/vendor-performance' },
    ],
  },
  {
    label: 'Settings', icon: 'settings',
    children: [
      { label: 'Centres', href: '/settings/centres' },
      { label: 'Users', href: '/settings/users' },
      { label: 'Approval Matrix', href: '/settings/approvals' },
      { label: 'Delegations', href: '/settings/delegations' },
      { label: 'Rate Contracts', href: '/settings/rate-contracts' },
      { label: 'Data Import', href: '/settings/data-import' },
      { label: 'Tally Sync', href: '/settings/tally' },
      { label: 'Document Alerts', href: '/settings/document-alerts' },
      { label: 'Audit Log', href: '/settings/audit-log' },
      { label: 'API Docs', href: '/settings/api-docs' },
    ],
  },
]

/** Primary flat items for a role. Falls back to the most restrictive set. */
export function primaryNavFor(role: UserRole): NavLink[] {
  return PRIMARY[role] ?? PRIMARY.store_staff
}

/** Grouped "Manage" section — group_admin only. */
export function manageNavFor(role: UserRole): NavGroup[] {
  return role === 'group_admin' ? MANAGE : []
}

/** Up to 4 items for the mobile bottom bar, drawn from the same source. */
export function mobileNavFor(role: UserRole): NavLink[] {
  return primaryNavFor(role).slice(0, 4)
}
