-- ============================================================
-- H1 VPMS — COMPLETE DATABASE SCHEMA
-- Run this in Supabase SQL Editor (project: dwukvdtacwvnudqjlwrb)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- CENTRES
-- ============================================================
create table if not exists centres (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,       -- SHI, VAS, MOD, UDA, GAN
  name text not null,
  address text,
  city text,
  state text,
  phone text,
  email text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- ============================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null check (role in (
    'group_admin',           -- Keyur — full access
    'group_cao',             -- Tinabhai — group finance
    'unit_cao',              -- Nileshbhai — unit finance
    'unit_purchase_manager', -- Unit purchase staff
    'store_staff',           -- GRN entry
    'finance_staff',         -- Invoice verification
    'vendor'                 -- External vendor portal
  )),
  centre_id uuid references centres(id),  -- null = group-level access
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- VENDOR CATEGORIES
-- ============================================================
create table if not exists vendor_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  is_active boolean default true
);

-- ============================================================
-- VENDOR MASTER
-- ============================================================
create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_code text not null unique,  -- H1V-0001
  legal_name text not null,
  trade_name text,
  category_id uuid references vendor_categories(id),
  gstin text,
  pan text,
  drug_license_no text,
  fssai_no text,
  -- Banking
  bank_name text,
  bank_account_no text,
  bank_ifsc text,
  bank_account_type text check (bank_account_type in ('savings', 'current', 'cc', 'od')),
  bank_verified boolean default false,
  bank_verified_at timestamptz,
  -- Commercial
  credit_period_days integer default 30,
  credit_limit numeric(15,2),
  payment_terms text,
  -- Contact
  primary_contact_name text,
  primary_contact_phone text,
  primary_contact_email text,
  address text,
  city text,
  state text,
  pincode text,
  -- Status
  status text default 'pending' check (status in ('pending','active','inactive','blacklisted','under_review')),
  gstin_verified boolean default false,
  pan_verified boolean default false,
  approved_centres uuid[],  -- array of centre IDs, null = all centres
  -- Portal
  portal_access boolean default false,
  portal_email text,
  -- Meta
  onboarded_by uuid references user_profiles(id),
  approved_by uuid references user_profiles(id),
  approval_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- ============================================================
-- VENDOR DOCUMENTS
-- ============================================================
create table if not exists vendor_documents (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete cascade,
  document_type text not null check (document_type in (
    'gstin_certificate','pan_card','cancelled_cheque',
    'drug_license','fssai_certificate','address_proof','other'
  )),
  file_name text not null,
  file_path text not null,
  file_size integer,
  uploaded_by uuid references user_profiles(id),
  is_verified boolean default false,
  verified_by uuid references user_profiles(id),
  expires_at date,
  created_at timestamptz default now()
);

-- ============================================================
-- ITEM CATEGORIES
-- ============================================================
create table if not exists item_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  parent_id uuid references item_categories(id),
  is_active boolean default true
);

-- ============================================================
-- ITEM MASTER (5000+ SKUs)
-- ============================================================
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  item_code text not null unique,   -- H1I-00001
  generic_name text not null,
  brand_name text,
  category_id uuid references item_categories(id),
  unit text not null,               -- tablets, vials, nos, kg, litre, box, strip
  hsn_code text,
  gst_percent numeric(5,2) default 12,
  shelf_life_days integer,
  is_cold_chain boolean default false,
  is_narcotic boolean default false,
  is_high_alert boolean default false,
  is_active boolean default true,
  ecw_item_code text,               -- eClinicalworks mapping
  tally_item_name text,             -- Tally item name for sync
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

-- ============================================================
-- ITEM CENTRE STOCK (per-centre inventory ledger)
-- ============================================================
create table if not exists item_centre_stock (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items(id),
  centre_id uuid not null references centres(id),
  current_stock numeric(15,3) default 0,
  reorder_level numeric(15,3) default 0,
  max_level numeric(15,3) default 0,
  last_grn_date date,
  last_grn_rate numeric(15,2),
  avg_daily_consumption numeric(15,3),
  updated_at timestamptz default now(),
  unique(item_id, centre_id)
);

-- ============================================================
-- VENDOR-ITEM MAPPING (L1/L2/L3)
-- ============================================================
create table if not exists vendor_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  item_id uuid not null references items(id),
  l_rank integer check (l_rank in (1,2,3)),
  last_quoted_rate numeric(15,2),
  is_preferred boolean default false,
  created_at timestamptz default now(),
  unique(vendor_id, item_id)
);

-- ============================================================
-- PURCHASE INDENTS
-- ============================================================
create table if not exists purchase_indents (
  id uuid primary key default gen_random_uuid(),
  indent_number text not null unique,   -- H1-SHI-IND-2603-001
  centre_id uuid not null references centres(id),
  requested_by uuid not null references user_profiles(id),
  status text default 'draft' check (status in ('draft','submitted','approved','converted_to_po','rejected','cancelled')),
  priority text default 'normal' check (priority in ('low','normal','urgent','emergency')),
  notes text,
  approved_by uuid references user_profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists purchase_indent_items (
  id uuid primary key default gen_random_uuid(),
  indent_id uuid not null references purchase_indents(id) on delete cascade,
  item_id uuid not null references items(id),
  requested_qty numeric(15,3) not null,
  unit text not null,
  current_stock numeric(15,3),
  last_purchase_rate numeric(15,2),
  estimated_value numeric(15,2),
  notes text
);

-- ============================================================
-- PURCHASE ORDERS
-- ============================================================
create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,       -- H1-SHI-PO-2603-001
  centre_id uuid not null references centres(id),
  vendor_id uuid not null references vendors(id),
  indent_id uuid references purchase_indents(id),
  status text default 'draft' check (status in (
    'draft','pending_approval','approved','sent_to_vendor',
    'partially_received','fully_received','cancelled','closed'
  )),
  po_date date default current_date,
  expected_delivery_date date,
  delivery_address text,
  subtotal numeric(15,2) default 0,
  gst_amount numeric(15,2) default 0,
  total_amount numeric(15,2) default 0,
  notes text,
  current_approval_level integer default 0,
  approved_by uuid references user_profiles(id),
  approved_at timestamptz,
  sent_to_vendor_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz
);

create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  item_id uuid not null references items(id),
  ordered_qty numeric(15,3) not null,
  received_qty numeric(15,3) default 0,
  unit text not null,
  rate numeric(15,2) not null,
  gst_percent numeric(5,2) default 0,
  gst_amount numeric(15,2) default 0,
  total_amount numeric(15,2) not null,
  rate_contract_id uuid,
  notes text
);

create table if not exists po_approvals (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  approval_level integer not null,
  approver_id uuid references user_profiles(id),
  approver_role text not null,
  status text not null check (status in ('pending','approved','rejected')),
  comments text,
  actioned_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- GOODS RECEIPT NOTES
-- ============================================================
create table if not exists grns (
  id uuid primary key default gen_random_uuid(),
  grn_number text not null unique,      -- H1-SHI-GRN-2603-001
  centre_id uuid not null references centres(id),
  po_id uuid not null references purchase_orders(id),
  vendor_id uuid not null references vendors(id),
  grn_date date default current_date,
  vendor_invoice_no text,
  vendor_invoice_date date,
  vendor_invoice_amount numeric(15,2),
  status text default 'draft' check (status in ('draft','submitted','verified','discrepancy')),
  notes text,
  received_by uuid references user_profiles(id),
  verified_by uuid references user_profiles(id),
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists grn_items (
  id uuid primary key default gen_random_uuid(),
  grn_id uuid not null references grns(id) on delete cascade,
  po_item_id uuid not null references purchase_order_items(id),
  item_id uuid not null references items(id),
  ordered_qty numeric(15,3) not null,
  received_qty numeric(15,3) not null,
  accepted_qty numeric(15,3) not null,
  rejected_qty numeric(15,3) default 0,
  rejection_reason text,
  batch_no text,
  expiry_date date,
  rate numeric(15,2) not null,
  gst_percent numeric(5,2) default 0,
  total_amount numeric(15,2) not null
);

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_ref text not null unique,     -- H1-SHI-INV-2603-001 (our ref)
  vendor_invoice_no text not null,
  vendor_invoice_date date not null,
  centre_id uuid not null references centres(id),
  vendor_id uuid not null references vendors(id),
  grn_id uuid references grns(id),
  po_id uuid references purchase_orders(id),
  subtotal numeric(15,2) not null,
  gst_amount numeric(15,2) default 0,
  total_amount numeric(15,2) not null,
  -- 3-way matching
  match_status text default 'pending' check (match_status in ('pending','matched','partial_match','mismatch')),
  match_notes text,
  qty_match boolean,
  rate_match boolean,
  gst_match boolean,
  duplicate_check boolean,
  -- Payment
  credit_period_days integer not null default 30,
  due_date date not null,
  payment_status text default 'unpaid' check (payment_status in ('unpaid','partial','paid','disputed','on_hold')),
  paid_amount numeric(15,2) default 0,
  payment_batch_id uuid,
  -- Document
  invoice_file_path text,
  status text default 'pending' check (status in ('pending','approved','rejected','disputed')),
  approved_by uuid references user_profiles(id),
  approved_at timestamptz,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(vendor_id, vendor_invoice_no)
);

-- ============================================================
-- PAYMENT BATCHES (Saturday cycle)
-- ============================================================
create table if not exists payment_batches (
  id uuid primary key default gen_random_uuid(),
  batch_number text not null unique,
  centre_id uuid references centres(id),
  batch_date date not null,
  status text default 'draft' check (status in ('draft','proposed','approved','processed','cancelled')),
  total_amount numeric(15,2) default 0,
  approved_by uuid references user_profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

create table if not exists payment_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references payment_batches(id) on delete cascade,
  invoice_id uuid not null references invoices(id),
  vendor_id uuid not null references vendors(id),
  amount numeric(15,2) not null,
  payment_mode text check (payment_mode in ('neft','rtgs','imps','cheque','upi')),
  utr_number text,
  payment_date date,
  status text default 'pending' check (status in ('pending','processed','failed'))
);

-- ============================================================
-- RATE CONTRACTS
-- ============================================================
create table if not exists rate_contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text not null unique,
  vendor_id uuid not null references vendors(id),
  centre_id uuid references centres(id),
  contract_type text check (contract_type in ('annual','quarterly','spot')),
  valid_from date not null,
  valid_to date not null,
  status text default 'active' check (status in ('draft','active','expired','terminated')),
  approved_by uuid references user_profiles(id),
  created_at timestamptz default now()
);

create table if not exists rate_contract_items (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references rate_contracts(id) on delete cascade,
  item_id uuid not null references items(id),
  rate numeric(15,2) not null,
  unit text not null,
  gst_percent numeric(5,2) default 0,
  l_rank integer check (l_rank in (1,2,3)),
  unique(contract_id, item_id)
);

-- ============================================================
-- STOCK LEDGER (full audit trail)
-- ============================================================
create table if not exists stock_ledger (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references centres(id),
  item_id uuid not null references items(id),
  transaction_type text not null check (transaction_type in (
    'grn','consumption','adjustment','transfer_in','transfer_out','return','opening'
  )),
  quantity numeric(15,3) not null,
  balance_after numeric(15,3) not null,
  reference_id uuid,
  reference_number text,
  notes text,
  created_by uuid references user_profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- VENDOR PERFORMANCE (monthly snapshots)
-- ============================================================
create table if not exists vendor_performance (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id),
  centre_id uuid references centres(id),
  month_year text not null,             -- '2026-03'
  total_pos integer default 0,
  on_time_deliveries integer default 0,
  late_deliveries integer default 0,
  total_grn_lines integer default 0,
  rejected_lines integer default 0,
  total_invoices integer default 0,
  matched_invoices integer default 0,
  disputed_invoices integer default 0,
  score numeric(5,2),
  unique(vendor_id, month_year, centre_id)
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references user_profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- SEQUENCES for auto-numbering
-- ============================================================
create sequence if not exists vendor_code_seq start 1;
create sequence if not exists item_code_seq start 1;
create sequence if not exists po_number_seq start 1;
create sequence if not exists grn_number_seq start 1;
create sequence if not exists indent_number_seq start 1;
create sequence if not exists invoice_ref_seq start 1;
create sequence if not exists batch_number_seq start 1;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table centres enable row level security;
alter table user_profiles enable row level security;
alter table vendors enable row level security;
alter table vendor_documents enable row level security;
alter table items enable row level security;
alter table item_centre_stock enable row level security;
alter table purchase_indents enable row level security;
alter table purchase_orders enable row level security;
alter table grns enable row level security;
alter table invoices enable row level security;
alter table payment_batches enable row level security;
alter table rate_contracts enable row level security;
alter table stock_ledger enable row level security;
alter table activity_log enable row level security;

-- Helper function: get current user's role
create or replace function get_my_role()
returns text as $$
  select role from user_profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper function: get current user's centre_id
create or replace function get_my_centre_id()
returns uuid as $$
  select centre_id from user_profiles where id = auth.uid();
$$ language sql security definer stable;

-- Centres: everyone can read
create policy "centres_read_all" on centres for select using (true);

-- User profiles: users see their own, group admins see all
create policy "profiles_read_own" on user_profiles for select
  using (id = auth.uid() or get_my_role() in ('group_admin','group_cao'));

create policy "profiles_insert_admin" on user_profiles for insert
  with check (get_my_role() = 'group_admin');

create policy "profiles_update_own" on user_profiles for update
  using (id = auth.uid() or get_my_role() = 'group_admin');

-- Vendors: group roles see all, unit roles see vendors for their centre
create policy "vendors_read" on vendors for select
  using (
    deleted_at is null and (
      get_my_role() in ('group_admin','group_cao') or
      (get_my_centre_id() = any(approved_centres)) or
      approved_centres is null
    )
  );

create policy "vendors_insert" on vendors for insert
  with check (get_my_role() in ('group_admin','group_cao','unit_cao','unit_purchase_manager'));

create policy "vendors_update" on vendors for update
  using (get_my_role() in ('group_admin','group_cao','unit_cao'));

-- Items: everyone can read active items
create policy "items_read_all" on items for select
  using (deleted_at is null);

create policy "items_insert" on items for insert
  with check (get_my_role() in ('group_admin','group_cao','unit_purchase_manager'));

-- Purchase Orders: group sees all, units see their own
create policy "po_read" on purchase_orders for select
  using (
    deleted_at is null and (
      get_my_role() in ('group_admin','group_cao') or
      centre_id = get_my_centre_id()
    )
  );

create policy "po_insert" on purchase_orders for insert
  with check (
    get_my_role() in ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff')
    and (get_my_role() in ('group_admin','group_cao') or centre_id = get_my_centre_id())
  );

create policy "po_update" on purchase_orders for update
  using (
    deleted_at is null and (
      get_my_role() in ('group_admin','group_cao') or
      centre_id = get_my_centre_id()
    )
  );

-- GRNs: same pattern as POs
create policy "grn_read" on grns for select
  using (
    get_my_role() in ('group_admin','group_cao') or
    centre_id = get_my_centre_id()
  );

create policy "grn_insert" on grns for insert
  with check (
    get_my_role() in ('group_admin','group_cao','unit_cao','unit_purchase_manager','store_staff') and
    (get_my_role() in ('group_admin','group_cao') or centre_id = get_my_centre_id())
  );

-- Invoices
create policy "invoice_read" on invoices for select
  using (
    get_my_role() in ('group_admin','group_cao') or
    centre_id = get_my_centre_id()
  );

create policy "invoice_insert" on invoices for insert
  with check (
    get_my_role() in ('group_admin','group_cao','unit_cao','finance_staff') and
    (get_my_role() in ('group_admin','group_cao') or centre_id = get_my_centre_id())
  );

-- Item stock: everyone can read their centre's stock
create policy "stock_read" on item_centre_stock for select
  using (
    get_my_role() in ('group_admin','group_cao') or
    centre_id = get_my_centre_id()
  );

-- Activity log: group admins see all, others see own
create policy "activity_read" on activity_log for select
  using (
    get_my_role() in ('group_admin','group_cao') or
    user_id = auth.uid()
  );

create policy "activity_insert" on activity_log for insert
  with check (auth.uid() is not null);

-- Payment batches
create policy "batch_read" on payment_batches for select
  using (
    get_my_role() in ('group_admin','group_cao') or
    centre_id = get_my_centre_id()
  );

-- Stock ledger
create policy "stock_ledger_read" on stock_ledger for select
  using (
    get_my_role() in ('group_admin','group_cao') or
    centre_id = get_my_centre_id()
  );

-- Rate contracts
create policy "rate_contract_read" on rate_contracts for select
  using (
    get_my_role() in ('group_admin','group_cao') or
    centre_id = get_my_centre_id() or
    centre_id is null
  );

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger vendors_updated_at before update on vendors
  for each row execute function update_updated_at();
create trigger items_updated_at before update on items
  for each row execute function update_updated_at();
create trigger po_updated_at before update on purchase_orders
  for each row execute function update_updated_at();
create trigger grn_updated_at before update on grns
  for each row execute function update_updated_at();
create trigger invoice_updated_at before update on invoices
  for each row execute function update_updated_at();
create trigger profiles_updated_at before update on user_profiles
  for each row execute function update_updated_at();

-- Trigger: auto-create user_profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'unit_purchase_manager')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index if not exists idx_vendors_status on vendors(status) where deleted_at is null;
create index if not exists idx_vendors_category on vendors(category_id);
create index if not exists idx_items_category on items(category_id) where deleted_at is null;
create index if not exists idx_items_code on items(item_code);
create index if not exists idx_po_centre on purchase_orders(centre_id) where deleted_at is null;
create index if not exists idx_po_vendor on purchase_orders(vendor_id);
create index if not exists idx_po_status on purchase_orders(status);
create index if not exists idx_grn_po on grns(po_id);
create index if not exists idx_grn_centre on grns(centre_id);
create index if not exists idx_invoice_due_date on invoices(due_date) where payment_status != 'paid';
create index if not exists idx_invoice_vendor on invoices(vendor_id);
create index if not exists idx_stock_centre_item on item_centre_stock(centre_id, item_id);
create index if not exists idx_stock_ledger_item on stock_ledger(item_id, centre_id);
create index if not exists idx_activity_user on activity_log(user_id);
create index if not exists idx_activity_entity on activity_log(entity_type, entity_id);
