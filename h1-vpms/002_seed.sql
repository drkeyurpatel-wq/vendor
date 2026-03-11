-- ============================================================
-- H1 VPMS — SEED DATA
-- Run AFTER 001_schema.sql
-- ============================================================

-- Centres
insert into centres (code, name, city, state) values
  ('SHI', 'Health1 Shilaj', 'Ahmedabad', 'Gujarat'),
  ('VAS', 'Health1 Vastral', 'Ahmedabad', 'Gujarat'),
  ('MOD', 'Health1 Modasa', 'Modasa', 'Gujarat'),
  ('UDA', 'Health1 Udaipur', 'Udaipur', 'Rajasthan'),
  ('GAN', 'Health1 Gandhinagar', 'Gandhinagar', 'Gujarat')
on conflict (code) do nothing;

-- Vendor Categories
insert into vendor_categories (name, code) values
  ('Pharmaceuticals', 'PHARMA'),
  ('Surgical Consumables', 'SURGICAL'),
  ('Medical Equipment & Spares', 'EQUIPMENT'),
  ('Housekeeping & Laundry', 'HOUSEKEEPING'),
  ('Dietary & Nutrition', 'DIETARY'),
  ('IT & Technology', 'IT'),
  ('Diagnostics & Lab Reagents', 'DIAGNOSTICS'),
  ('Infrastructure & AMC', 'INFRA'),
  ('Stationery & Office', 'STATIONERY'),
  ('Other', 'OTHER')
on conflict (code) do nothing;

-- Item Categories (hierarchical)
insert into item_categories (name, code) values
  ('Pharmaceuticals', 'PHARMA'),
  ('Surgical Consumables', 'SURGICAL'),
  ('Medical Devices', 'DEVICES'),
  ('Diagnostics & Reagents', 'DIAGNOSTICS'),
  ('Housekeeping Supplies', 'HOUSEKEEPING'),
  ('Dietary Supplies', 'DIETARY'),
  ('IT Equipment', 'IT'),
  ('Office Supplies', 'OFFICE'),
  ('Capital Equipment', 'CAPEX')
on conflict (code) do nothing;

-- Pharma sub-categories
insert into item_categories (name, code, parent_id) values
  ('Antibiotics', 'PHARMA_ANTIBIOTIC', (select id from item_categories where code = 'PHARMA')),
  ('Analgesics', 'PHARMA_ANALGESIC', (select id from item_categories where code = 'PHARMA')),
  ('Cardiovascular', 'PHARMA_CARDIO', (select id from item_categories where code = 'PHARMA')),
  ('Neurology', 'PHARMA_NEURO', (select id from item_categories where code = 'PHARMA')),
  ('IV Fluids', 'PHARMA_IVFLUID', (select id from item_categories where code = 'PHARMA')),
  ('Anaesthesia', 'PHARMA_ANAES', (select id from item_categories where code = 'PHARMA'))
on conflict (code) do nothing;

-- Surgical sub-categories
insert into item_categories (name, code, parent_id) values
  ('Sutures & Staplers', 'SURGICAL_SUTURE', (select id from item_categories where code = 'SURGICAL')),
  ('Gloves & Drapes', 'SURGICAL_GLOVES', (select id from item_categories where code = 'SURGICAL')),
  ('Implants & Prosthetics', 'SURGICAL_IMPLANT', (select id from item_categories where code = 'SURGICAL')),
  ('Catheters & Tubes', 'SURGICAL_CATHETER', (select id from item_categories where code = 'SURGICAL')),
  ('PPE & Infection Control', 'SURGICAL_PPE', (select id from item_categories where code = 'SURGICAL'))
on conflict (code) do nothing;
