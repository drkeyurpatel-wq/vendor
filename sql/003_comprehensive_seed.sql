-- ============================================================
-- H1 VPMS — COMPREHENSIVE SEED DATA (10-15% SCALE)
-- 78 items, 29 vendors, ~200 POs, ~150 GRNs, ~120 invoices
-- Generated: 2026-03-22T16:24:21.737Z
-- Run in Supabase SQL Editor AFTER 001_schema.sql + 002_seed.sql + 002_hospital_grade_overhaul.sql
-- ============================================================

-- Safety: wrap in transaction
BEGIN;

-- ============================================================
-- VENDORS (29)
-- ============================================================

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0001', 'Zydus Healthcare Ltd', 'Zydus Cadila', (SELECT id FROM vendor_categories WHERE code = 'PHARMA'), '24AABCZ1234M1Z5', 'AABCZ1234M', 'Ahmedabad', 'Gujarat', '380015', 'Rajesh Mehta', '9825012345', 'rajesh@zydus.com', 30, 'HDFC Bank', 'HDFC0001234', '50100123456789', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0002', 'Torrent Pharmaceuticals Ltd', 'Torrent Pharma', (SELECT id FROM vendor_categories WHERE code = 'PHARMA'), '24AABCT5678N1Z3', 'AABCT5678N', 'Ahmedabad', 'Gujarat', '380054', 'Vivek Shah', '9825023456', 'vivek@torrent.com', 45, 'ICICI Bank', 'ICIC0002345', '60200234567890', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0003', 'Intas Pharmaceuticals Ltd', 'Intas Pharma', (SELECT id FROM vendor_categories WHERE code = 'PHARMA'), '24AABCI9012P1Z1', 'AABCI9012P', 'Ahmedabad', 'Gujarat', '380061', 'Hiren Patel', '9825034567', 'hiren@intas.com', 30, 'Kotak Mahindra', 'KKBK0003456', '70300345678901', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0004', 'Sun Pharmaceutical Distributors', 'Sun Pharma', (SELECT id FROM vendor_categories WHERE code = 'PHARMA'), '24AABCS3456Q1Z9', 'AABCS3456Q', 'Vadodara', 'Gujarat', '390007', 'Amit Desai', '9825045678', 'amit@sunpharma.com', 30, 'SBI', 'SBIN0004567', '80400456789012', 'current', true, 'active', true, true, 'Vadodara, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0005', 'Cadila Healthcare Ltd', 'Cadila', (SELECT id FROM vendor_categories WHERE code = 'PHARMA'), '24AABCC7890R1Z7', 'AABCC7890R', 'Ahmedabad', 'Gujarat', '380019', 'Ketan Joshi', '9825056789', 'ketan@cadila.com', 45, 'Axis Bank', 'UTIB0005678', '90500567890123', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0006', 'Alembic Pharmaceuticals Ltd', 'Alembic Pharma', (SELECT id FROM vendor_categories WHERE code = 'PHARMA'), '24AABCA1234S1Z5', 'AABCA1234S', 'Vadodara', 'Gujarat', '390003', 'Bhavesh Amin', '9825067890', 'bhavesh@alembic.com', 30, 'Bank of Baroda', 'BARB0006789', '01600678901234', 'current', true, 'active', true, true, 'Vadodara, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0007', 'Cipla Gujarat Division', 'Cipla', (SELECT id FROM vendor_categories WHERE code = 'PHARMA'), '24AABCC5678T1Z3', 'AABCC5678T', 'Ahmedabad', 'Gujarat', '380009', 'Nirav Vyas', '9825078901', 'nirav@cipla.com', 60, 'HDFC Bank', 'HDFC0007890', '11700789012345', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0008', 'Dr Reddy''s Laboratories Agency', 'Dr Reddys', (SELECT id FROM vendor_categories WHERE code = 'PHARMA'), '24AABCD9012U1Z1', 'AABCD9012U', 'Ahmedabad', 'Gujarat', '380005', 'Suresh Reddy', '9825089012', 'suresh@drreddys.com', 45, 'ICICI Bank', 'ICIC0008901', '21800890123456', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0009', 'Johnson & Johnson Medical India', 'J&J Medical', (SELECT id FROM vendor_categories WHERE code = 'SURGICAL'), '24AABCJ3456V1Z9', 'AABCJ3456V', 'Ahmedabad', 'Gujarat', '380058', 'Prashant Kumar', '9825090123', 'prashant@jnj.com', 45, 'Citibank', 'CITI0009012', '31900901234567', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0010', 'Medtronic India Pvt Ltd', 'Medtronic', (SELECT id FROM vendor_categories WHERE code = 'SURGICAL'), '24AABCM7890W1Z7', 'AABCM7890W', 'Mumbai', 'Maharashtra', '400093', 'Ankit Sharma', '9825001234', 'ankit@medtronic.com', 60, 'Standard Chartered', 'SCBL0001234', '42001012345678', 'current', true, 'active', true, true, 'Mumbai, Maharashtra')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0011', 'BD India Pvt Ltd', 'Becton Dickinson', (SELECT id FROM vendor_categories WHERE code = 'SURGICAL'), '24AABCB1234X1Z5', 'AABCB1234X', 'Ahmedabad', 'Gujarat', '380015', 'Deepak Patel', '9825011234', 'deepak@bd.com', 30, 'HDFC Bank', 'HDFC0011234', '52101123456789', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0012', 'B Braun Medical India', 'B Braun', (SELECT id FROM vendor_categories WHERE code = 'SURGICAL'), '24AABCB5678Y1Z3', 'AABCB5678Y', 'Ahmedabad', 'Gujarat', '380059', 'Manish Thakkar', '9825021234', 'manish@bbraun.com', 45, 'Bank of Baroda', 'BARB0021234', '62201234567890', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0013', 'Romsons International', 'Romsons', (SELECT id FROM vendor_categories WHERE code = 'SURGICAL'), '24AABCR9012Z1Z1', 'AABCR9012Z', 'Agra', 'Uttar Pradesh', '282001', 'Rakesh Gupta', '9825031234', 'rakesh@romsons.com', 30, 'PNB', 'PUNB0031234', '72301345678901', 'current', true, 'active', true, true, 'Agra, Uttar Pradesh')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0014', 'Polymed Medical Devices', 'Polymed', (SELECT id FROM vendor_categories WHERE code = 'SURGICAL'), '24AABCP3456A1Z9', 'AABCP3456A', 'Faridabad', 'Haryana', '121003', 'Vinod Sharma', '9825041234', 'vinod@polymed.com', 30, 'SBI', 'SBIN0041234', '82401456789012', 'current', true, 'active', true, true, 'Faridabad, Haryana')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0015', 'Mindray Medical India', 'Mindray', (SELECT id FROM vendor_categories WHERE code = 'EQUIPMENT'), '24AABCM7890B1Z7', 'AABCM7890B', 'Mumbai', 'Maharashtra', '400072', 'Chen Wei', '9825051234', 'chen@mindray.com', 90, 'HSBC', 'HSBC0051234', '92501567890123', 'current', true, 'active', true, true, 'Mumbai, Maharashtra')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0016', 'Philips Healthcare India', 'Philips', (SELECT id FROM vendor_categories WHERE code = 'EQUIPMENT'), '27AABCP1234C1Z5', 'AABCP1234C', 'Pune', 'Maharashtra', '411006', 'Rahul Khanna', '9825061234', 'rahul@philips.com', 90, 'Deutsche Bank', 'DEUT0061234', '02601678901234', 'current', true, 'active', true, true, 'Pune, Maharashtra')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0017', 'GE Healthcare India', 'GE Healthcare', (SELECT id FROM vendor_categories WHERE code = 'EQUIPMENT'), '29AABCG5678D1Z3', 'AABCG5678D', 'Bengaluru', 'Karnataka', '560066', 'Priya Nair', '9825071234', 'priya@gehealthcare.com', 90, 'Citibank', 'CITI0071234', '12701789012345', 'current', true, 'active', true, true, 'Bengaluru, Karnataka')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0018', 'Roche Diagnostics India', 'Roche', (SELECT id FROM vendor_categories WHERE code = 'DIAGNOSTICS'), '24AABCR1234E1Z1', 'AABCR1234E', 'Mumbai', 'Maharashtra', '400076', 'Sanjay Mishra', '9825081234', 'sanjay@roche.com', 60, 'HDFC Bank', 'HDFC0081234', '22801890123456', 'current', true, 'active', true, true, 'Mumbai, Maharashtra')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0019', 'Siemens Healthineers India', 'Siemens', (SELECT id FROM vendor_categories WHERE code = 'DIAGNOSTICS'), '27AABCS5678F1Z9', 'AABCS5678F', 'Mumbai', 'Maharashtra', '400093', 'Vikram Rao', '9825091234', 'vikram@siemens.com', 60, 'Standard Chartered', 'SCBL0091234', '32901901234567', 'current', true, 'active', true, true, 'Mumbai, Maharashtra')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0020', 'Transasia Bio-Medicals', 'Transasia', (SELECT id FROM vendor_categories WHERE code = 'DIAGNOSTICS'), '24AABCT9012G1Z7', 'AABCT9012G', 'Mumbai', 'Maharashtra', '400063', 'Sunil Kumar', '9825002345', 'sunil@transasia.com', 45, 'Axis Bank', 'UTIB0002345', '43002012345678', 'current', true, 'active', true, true, 'Mumbai, Maharashtra')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0021', 'Diversey India Pvt Ltd', 'Diversey', (SELECT id FROM vendor_categories WHERE code = 'HOUSEKEEPING'), '24AABCD3456H1Z5', 'AABCD3456H', 'Mumbai', 'Maharashtra', '400076', 'Mahesh Yadav', '9825012345', 'mahesh@diversey.com', 30, 'HDFC Bank', 'HDFC0012345', '53103123456789', 'current', true, 'active', true, true, 'Mumbai, Maharashtra')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0022', 'Satguru Enterprises', 'Satguru', (SELECT id FROM vendor_categories WHERE code = 'HOUSEKEEPING'), '24AABCS7890I1Z3', 'AABCS7890I', 'Ahmedabad', 'Gujarat', '380007', 'Ramesh Suthar', '9825022345', 'ramesh@satguru.com', 15, 'SBI', 'SBIN0022345', '63203234567890', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0023', 'Nestlé Health Science India', 'Nestle Health', (SELECT id FROM vendor_categories WHERE code = 'DIETARY'), '24AABCN1234J1Z1', 'AABCN1234J', 'Gurgaon', 'Haryana', '122002', 'Arjun Singh', '9825032345', 'arjun@nestle.com', 30, 'ICICI Bank', 'ICIC0032345', '73303345678901', 'current', true, 'active', true, true, 'Gurgaon, Haryana')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0024', 'Abbott Nutrition India', 'Abbott', (SELECT id FROM vendor_categories WHERE code = 'DIETARY'), '24AABCA5678K1Z9', 'AABCA5678K', 'Mumbai', 'Maharashtra', '400013', 'Pooja Verma', '9825042345', 'pooja@abbott.com', 45, 'Kotak Mahindra', 'KKBK0042345', '83403456789012', 'current', true, 'active', true, true, 'Mumbai, Maharashtra')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0025', 'Dell Technologies India', 'Dell', (SELECT id FROM vendor_categories WHERE code = 'IT'), '29AABCD9012L1Z7', 'AABCD9012L', 'Bengaluru', 'Karnataka', '560103', 'Arun Krishnan', '9825052345', 'arun@dell.com', 30, 'Citibank', 'CITI0052345', '93503567890123', 'current', true, 'active', true, true, 'Bengaluru, Karnataka')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0026', 'HP India Sales Pvt Ltd', 'HP', (SELECT id FROM vendor_categories WHERE code = 'IT'), '24AABCH3456M1Z5', 'AABCH3456M', 'Ahmedabad', 'Gujarat', '380015', 'Sneha Iyer', '9825062345', 'sneha@hp.com', 30, 'HDFC Bank', 'HDFC0062345', '03603678901234', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0027', 'Navneet Education Ltd', 'Navneet', (SELECT id FROM vendor_categories WHERE code = 'STATIONERY'), '24AABCN7890N1Z3', 'AABCN7890N', 'Ahmedabad', 'Gujarat', '380014', 'Jayesh Modi', '9825072345', 'jayesh@navneet.com', 15, 'Bank of Baroda', 'BARB0072345', '13703789012345', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0028', 'INOX Air Products Ltd', 'INOX', (SELECT id FROM vendor_categories WHERE code = 'EQUIPMENT'), '24AABCI1234O1Z1', 'AABCI1234O', 'Vadodara', 'Gujarat', '390023', 'Pramod Jain', '9825082345', 'pramod@inoxap.com', 30, 'HDFC Bank', 'HDFC0082345', '23803890123456', 'current', true, 'active', true, true, 'Vadodara, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;

INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('H1V-0029', 'Welspun Health Linens', 'Welspun', (SELECT id FROM vendor_categories WHERE code = 'HOUSEKEEPING'), '24AABCW5678P1Z9', 'AABCW5678P', 'Ahmedabad', 'Gujarat', '380052', 'Gaurav Pandya', '9825092345', 'gaurav@welspun.com', 30, 'SBI', 'SBIN0092345', '33903901234567', 'current', true, 'active', true, true, 'Ahmedabad, Gujarat')
ON CONFLICT (vendor_code) DO NOTHING;


-- ============================================================
-- ITEMS (78)
-- ============================================================

INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00001', 'Amoxicillin 500mg Capsule', 'Mox', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'strip', '30042019', 12, 'Zydus Cadila', 'Capsule', '500mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00002', 'Azithromycin 500mg Tablet', 'Azee', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'strip', '30042019', 12, 'Cipla', 'Tablet', '500mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00003', 'Ceftriaxone 1g Injection', 'Monocef', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'vial', '30042019', 12, 'Aristo Pharma', 'Injection', '1g', true, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00004', 'Meropenem 1g Injection', 'Meronem', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'vial', '30042019', 12, 'AstraZeneca', 'Injection', '1g', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00005', 'Piperacillin-Tazobactam 4.5g Inj', 'Tazact', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'vial', '30042019', 12, 'Alkem', 'Injection', '4.5g', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00006', 'Ciprofloxacin 500mg Tablet', 'Ciplox', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'strip', '30042019', 12, 'Cipla', 'Tablet', '500mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00007', 'Levofloxacin 750mg Tablet', 'Levomac', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'strip', '30042019', 12, 'Macleods', 'Tablet', '750mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00008', 'Vancomycin 500mg Injection', 'Vancoplus', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'vial', '30042019', 12, 'Intas', 'Injection', '500mg', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00009', 'Colistin 1MIU Injection', 'Colistop', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'vial', '30042019', 12, 'Venus Remedies', 'Injection', '1MIU', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00010', 'Linezolid 600mg Tablet', 'Linospan', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'strip', '30042019', 12, 'Cipla', 'Tablet', '600mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00011', 'Metronidazole 400mg Tablet', 'Flagyl', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'strip', '30042019', 12, 'Abbott', 'Tablet', '400mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00012', 'Amikacin 500mg Injection', 'Mikacin', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANTIBIOTIC'), 'vial', '30042019', 12, 'Aristo', 'Injection', '500mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00013', 'Paracetamol 500mg Tablet', 'Crocin', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANALGESIC'), 'strip', '30042019', 12, 'GSK', 'Tablet', '500mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00014', 'Paracetamol 1g IV Infusion', 'Perfalgan', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANALGESIC'), 'bottle', '30042019', 12, 'Bristol-Myers', 'Infusion', '1g/100ml', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00015', 'Diclofenac 75mg Injection', 'Voveran', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANALGESIC'), 'ampoule', '30042019', 12, 'Novartis', 'Injection', '75mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00016', 'Tramadol 50mg Capsule', 'Tramazac', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANALGESIC'), 'strip', '30042019', 12, 'Zydus', 'Capsule', '50mg', false, true, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00017', 'Morphine 15mg Injection', 'Morphine Sulphate', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANALGESIC'), 'ampoule', '30042019', 12, 'Rusan Pharma', 'Injection', '15mg', false, true, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00018', 'Fentanyl 100mcg Patch', 'Durogesic', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANALGESIC'), 'patch', '30042019', 12, 'Janssen', 'Transdermal Patch', '100mcg/hr', false, true, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00019', 'Atorvastatin 20mg Tablet', 'Atorva', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'strip', '30042019', 12, 'Zydus Cadila', 'Tablet', '20mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00020', 'Clopidogrel 75mg Tablet', 'Clopilet', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'strip', '30042019', 12, 'Sun Pharma', 'Tablet', '75mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00021', 'Enoxaparin 40mg Injection', 'Clexane', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'prefilled', '30042019', 12, 'Sanofi', 'Injection', '40mg/0.4ml', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00022', 'Heparin 5000IU/ml Injection', 'Heparin Leo', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'vial', '30042019', 12, 'Leo Pharma', 'Injection', '5000IU/ml', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00023', 'Amlodipine 5mg Tablet', 'Amlong', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'strip', '30042019', 12, 'Micro Labs', 'Tablet', '5mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00024', 'Metoprolol 50mg Tablet', 'Betaloc', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'strip', '30042019', 12, 'AstraZeneca', 'Tablet', '50mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00025', 'Nitroglycerin 5mg/ml Injection', 'Nitrocontin', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'ampoule', '30042019', 12, 'Sun Pharma', 'Injection', '5mg/ml', false, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00026', 'Dopamine 200mg Injection', 'Dopamine', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'ampoule', '30042019', 12, 'Neon Labs', 'Injection', '200mg', false, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00027', 'Noradrenaline 2mg Injection', 'Norad', (SELECT id FROM item_categories WHERE code = 'PHARMA_CARDIO'), 'ampoule', '30042019', 12, 'Neon Labs', 'Injection', '2mg/ml', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00028', 'Levetiracetam 500mg Tablet', 'Levipil', (SELECT id FROM item_categories WHERE code = 'PHARMA_NEURO'), 'strip', '30042019', 12, 'Sun Pharma', 'Tablet', '500mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00029', 'Phenytoin 100mg Capsule', 'Eptoin', (SELECT id FROM item_categories WHERE code = 'PHARMA_NEURO'), 'strip', '30042019', 12, 'Abbott', 'Capsule', '100mg', false, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00030', 'Sodium Valproate 500mg Tablet', 'Encorate', (SELECT id FROM item_categories WHERE code = 'PHARMA_NEURO'), 'strip', '30042019', 12, 'Sun Pharma', 'Tablet', '500mg', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00031', 'Mannitol 20% 100ml Infusion', 'Mannitol', (SELECT id FROM item_categories WHERE code = 'PHARMA_NEURO'), 'bottle', '30049099', 12, 'Baxter', 'Infusion', '20%', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00032', 'Normal Saline 0.9% 500ml', 'NS', (SELECT id FROM item_categories WHERE code = 'PHARMA_IVFLUID'), 'bottle', '30049099', 12, 'B Braun', 'Infusion', '0.9%', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00033', 'Ringer Lactate 500ml', 'RL', (SELECT id FROM item_categories WHERE code = 'PHARMA_IVFLUID'), 'bottle', '30049099', 12, 'B Braun', 'Infusion', 'Compound', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00034', 'Dextrose 5% in NS 500ml', 'DNS', (SELECT id FROM item_categories WHERE code = 'PHARMA_IVFLUID'), 'bottle', '30049099', 12, 'Baxter', 'Infusion', '5%', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00035', 'Dextrose 25% 100ml', 'D25', (SELECT id FROM item_categories WHERE code = 'PHARMA_IVFLUID'), 'bottle', '30049099', 12, 'Claris', 'Infusion', '25%', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00036', 'Albumin 20% 100ml', 'Human Albumin', (SELECT id FROM item_categories WHERE code = 'PHARMA_IVFLUID'), 'bottle', '30021099', 5, 'Biotest', 'Infusion', '20%', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00037', 'Propofol 1% 20ml', 'Diprivan', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANAES'), 'ampoule', '30042019', 12, 'AstraZeneca', 'Injection', '10mg/ml', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00038', 'Sevoflurane 250ml', 'Sevorane', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANAES'), 'bottle', '30042019', 12, 'Abbott', 'Inhalation', '100%', false, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00039', 'Midazolam 5mg/ml Injection', 'Mezolam', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANAES'), 'ampoule', '30042019', 12, 'Neon Labs', 'Injection', '5mg/ml', false, true, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00040', 'Atracurium 25mg/2.5ml', 'Tracrium', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANAES'), 'ampoule', '30042019', 12, 'GSK', 'Injection', '25mg', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00041', 'Bupivacaine 0.5% Heavy 4ml', 'Anawin', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANAES'), 'ampoule', '30042019', 12, 'Neon Labs', 'Injection', '0.5%', false, false, false, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00042', 'Succinylcholine 100mg Injection', 'Scoline', (SELECT id FROM item_categories WHERE code = 'PHARMA_ANAES'), 'ampoule', '30042019', 12, 'GSK', 'Injection', '100mg', true, false, true, 'drug', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00043', 'Surgical Gloves Sterile 7.5', 'Supermax', (SELECT id FROM item_categories WHERE code = 'SURGICAL_GLOVES'), 'pair', '40151100', 12, 'Supermax', NULL, '7.5', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00044', 'Examination Gloves Nitrile M', 'BD Gloves', (SELECT id FROM item_categories WHERE code = 'SURGICAL_GLOVES'), 'box', '40151100', 12, 'BD', NULL, 'Medium', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00045', 'Surgical Drape Universal Pack', 'Sterimed', (SELECT id FROM item_categories WHERE code = 'SURGICAL_GLOVES'), 'pack', '63079090', 12, 'Sterimed', NULL, 'Universal', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00046', 'N95 Mask 3M 1860', '3M 1860', (SELECT id FROM item_categories WHERE code = 'SURGICAL_PPE'), 'nos', '63079090', 12, '3M', NULL, 'N95', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00047', '3-Ply Surgical Mask', 'Medline', (SELECT id FROM item_categories WHERE code = 'SURGICAL_PPE'), 'box', '63079090', 12, 'Medline', NULL, 'Standard', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00048', 'Vicryl 2-0 Suture 75cm', 'Vicryl', (SELECT id FROM item_categories WHERE code = 'SURGICAL_SUTURE'), 'nos', '30061000', 12, 'Ethicon/J&J', NULL, '2-0', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00049', 'Ethilon 3-0 Nylon Suture', 'Ethilon', (SELECT id FROM item_categories WHERE code = 'SURGICAL_SUTURE'), 'nos', '30061000', 12, 'Ethicon/J&J', NULL, '3-0', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00050', 'Silk 2-0 Braided Suture', 'Mersilk', (SELECT id FROM item_categories WHERE code = 'SURGICAL_SUTURE'), 'nos', '30061000', 12, 'Ethicon/J&J', NULL, '2-0', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00051', 'Prolene 4-0 Polypropylene', 'Prolene', (SELECT id FROM item_categories WHERE code = 'SURGICAL_SUTURE'), 'nos', '30061000', 12, 'Ethicon/J&J', NULL, '4-0', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00052', 'Skin Stapler 35W', 'Proximate', (SELECT id FROM item_categories WHERE code = 'SURGICAL_SUTURE'), 'nos', '90189090', 12, 'Ethicon/J&J', NULL, '35 Wide', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00053', 'Foley Catheter 16Fr 2-way', 'Romo Foley', (SELECT id FROM item_categories WHERE code = 'SURGICAL_CATHETER'), 'nos', '90183100', 12, 'Romsons', NULL, '16Fr', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00054', 'Central Venous Catheter 7Fr Triple', 'Arrow CVC', (SELECT id FROM item_categories WHERE code = 'SURGICAL_CATHETER'), 'nos', '90183100', 12, 'Teleflex', NULL, '7Fr Triple Lumen', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00055', 'Endotracheal Tube 7.5mm Cuffed', 'Portex ETT', (SELECT id FROM item_categories WHERE code = 'SURGICAL_CATHETER'), 'nos', '90183100', 12, 'Smiths Medical', NULL, '7.5mm', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00056', 'Ryles Tube 16Fr', 'Romo RT', (SELECT id FROM item_categories WHERE code = 'SURGICAL_CATHETER'), 'nos', '90183100', 12, 'Romsons', NULL, '16Fr', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00057', 'IV Cannula 20G', 'BD Venflon', (SELECT id FROM item_categories WHERE code = 'SURGICAL_CATHETER'), 'nos', '90183100', 12, 'BD', NULL, '20G', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00058', 'IV Cannula 22G', 'BD Venflon', (SELECT id FROM item_categories WHERE code = 'SURGICAL_CATHETER'), 'nos', '90183100', 12, 'BD', NULL, '22G', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00059', 'Chest Drain 28Fr', 'Argyle', (SELECT id FROM item_categories WHERE code = 'SURGICAL_CATHETER'), 'nos', '90183100', 12, 'Covidien', NULL, '28Fr', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00060', 'DES Stent Xience Prime 3.0x28mm', 'Xience', (SELECT id FROM item_categories WHERE code = 'SURGICAL_IMPLANT'), 'nos', '90213100', 5, 'Abbott', NULL, '3.0x28mm', false, false, true, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00061', 'PTCA Balloon Catheter 2.5x20mm', 'Sprinter', (SELECT id FROM item_categories WHERE code = 'SURGICAL_IMPLANT'), 'nos', '90183900', 12, 'Medtronic', NULL, '2.5x20mm', false, false, true, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00062', 'Guide Wire 0.035 260cm', 'Terumo', (SELECT id FROM item_categories WHERE code = 'SURGICAL_IMPLANT'), 'nos', '90183900', 12, 'Terumo', NULL, '0.035"', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00063', 'Guiding Catheter 6Fr JR4', 'Launcher', (SELECT id FROM item_categories WHERE code = 'SURGICAL_IMPLANT'), 'nos', '90183900', 12, 'Medtronic', NULL, '6Fr JR4', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00064', 'Pacemaker VVI Single Chamber', 'Adapta', (SELECT id FROM item_categories WHERE code = 'SURGICAL_IMPLANT'), 'nos', '90213100', 5, 'Medtronic', NULL, 'Single Chamber', false, false, true, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00065', 'CBC Reagent 5-Part Diff (1L)', 'Mindray BC-5000', (SELECT id FROM item_categories WHERE code = 'DIAGNOSTICS'), 'bottle', '38220090', 18, 'Mindray', NULL, '1 Litre', true, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00066', 'Blood Glucose Strips (50s)', 'Accu-Chek Active', (SELECT id FROM item_categories WHERE code = 'DIAGNOSTICS'), 'box', '38220090', 12, 'Roche', NULL, '50 strips', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00067', 'Troponin I Rapid Test Kit', 'SD Biosensor', (SELECT id FROM item_categories WHERE code = 'DIAGNOSTICS'), 'kit', '38220090', 12, 'SD Biosensor', NULL, '25 tests', true, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00068', 'PT/INR Reagent', 'Stago PT', (SELECT id FROM item_categories WHERE code = 'DIAGNOSTICS'), 'kit', '38220090', 18, 'Stago', NULL, '100 tests', true, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00069', 'Blood Gas Cartridge ABG', 'i-STAT CG4+', (SELECT id FROM item_categories WHERE code = 'DIAGNOSTICS'), 'cartridge', '38220090', 18, 'Abbott', NULL, '25 tests', true, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00070', 'Surface Disinfectant 5L', 'Bacillocid', (SELECT id FROM item_categories WHERE code = 'HOUSEKEEPING'), 'can', '38089490', 18, 'Bode Chemie', NULL, '5 Litre', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00071', 'Hand Sanitizer Alcohol 500ml', 'Sterillium', (SELECT id FROM item_categories WHERE code = 'HOUSEKEEPING'), 'bottle', '38089410', 18, 'Bode Chemie', NULL, '500ml', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00072', 'Biomedical Waste Bags Red 25pcs', 'Supermax', (SELECT id FROM item_categories WHERE code = 'HOUSEKEEPING'), 'pack', '39232100', 18, 'Supermax', NULL, 'Large', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00073', 'Bed Sheet Hospital White', 'Welspun', (SELECT id FROM item_categories WHERE code = 'HOUSEKEEPING'), 'nos', '63022100', 12, 'Welspun', NULL, 'Single', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00074', 'Patient Gown Disposable', 'Medline', (SELECT id FROM item_categories WHERE code = 'HOUSEKEEPING'), 'nos', '63079090', 12, 'Medline', NULL, 'Universal', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00075', 'Ensure Powder 400g Vanilla', 'Ensure', (SELECT id FROM item_categories WHERE code = 'DIETARY'), 'tin', '21069099', 18, 'Abbott', NULL, '400g', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00076', 'Fresubin Original 500ml', 'Fresubin', (SELECT id FROM item_categories WHERE code = 'DIETARY'), 'bottle', '21069099', 18, 'Fresenius Kabi', NULL, '500ml', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00077', 'A4 Paper 75gsm Ream (500 sheets)', 'JK Copier', (SELECT id FROM item_categories WHERE code = 'OFFICE'), 'ream', '48025690', 12, 'JK Paper', NULL, '500 sheets', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;
INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('H1I-00078', 'Printer Toner HP 78A', 'HP 78A', (SELECT id FROM item_categories WHERE code = 'OFFICE'), 'nos', '84439990', 18, 'HP', NULL, 'Standard', false, false, false, 'consumable', 'Medical')
ON CONFLICT (item_code) DO NOTHING;


-- ============================================================
-- PURCHASE ORDERS (200) + LINE ITEMS + GRNs + INVOICES
-- Using DO block for dynamic ID resolution
-- ============================================================

DO $$
DECLARE
  v_centre_id uuid;
  v_vendor_id uuid;
  v_item_id uuid;
  v_po_id uuid;
  v_grn_id uuid;
  v_inv_id uuid;
  v_po_number text;
  v_grn_number text;
  v_inv_number text;
  v_total numeric;
  v_gst_amt numeric;
  v_rate numeric;
  v_qty numeric;
  v_item_total numeric;
  v_item_gst numeric;
  v_po_date date;
  v_grn_date date;
  v_credit_days int;
BEGIN

  -- PO 1: H1-SHI-PO-2601-001 → BD India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0011';
  v_po_date := '2026-01-14'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-001', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 9894.38, 1187.33, 11081.71, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'nos', 43.97, 12, 116.08, 1083.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'strip', 41.82, 12, 160.59, 1498.83);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'box', 124.24, 12, 536.72, 5009.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'strip', 64.92, 12, 373.94, 3490.1);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-001', v_centre_id, v_po_id, v_vendor_id, 2026-01-14::date + interval '7 days', 'verified', 'VINV-0001', 11081.71)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00053'), v_centre_id, 161, 32, 279, v_po_date + interval '3 days', 43.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00001'), v_centre_id, 139, 24, 295, v_po_date + interval '3 days', 41.82)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00047'), v_centre_id, 48, 13, 153, v_po_date + interval '3 days', 124.24)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 53, 18, 167, v_po_date + interval '3 days', 64.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 2: H1-SHI-PO-2601-002 → Polymed Medical Devices
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0014';
  v_po_date := '2026-01-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-002', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 262013.46, 26896.31, 288909.77, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00063';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'nos', 3488.4, 12, 20930.4, 195350.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 0, 'bottle', 4678.11, 5, 3508.58, 73680.23);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'nos', 44.5, 12, 128.16, 1196.16);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 0, 'bottle', 34.23, 12, 127.34, 1188.47);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00004';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 0, 'vial', 918.08, 12, 1101.7, 10282.5);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 0, 'pack', 130.04, 18, 1100.14, 7212.02);
  END IF;


  -- PO 3: H1-GAN-PO-2603-003 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-03-04'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-003', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 40428.64, 4851.44, 45280.08, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 41, 'vial', 415.23, 12, 2042.93, 19067.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'vial', 57.43, 12, 151.62, 1415.08);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'pack', 417.75, 12, 2656.89, 24797.64);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2603-003', v_centre_id, v_po_id, v_vendor_id, 2026-03-04::date + interval '8 days', 'verified', 'VINV-0003', 45280.08)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 109, 27, 401, v_po_date + interval '3 days', 415.23)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00012'), v_centre_id, 179, 10, 256, v_po_date + interval '3 days', 57.43)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 40,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 24, 17, 551, v_po_date + interval '3 days', 417.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 4: H1-MOD-PO-2603-004 → Sun Pharmaceutical Distributor
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0004';
  v_po_date := '2026-03-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2603-004', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 82701.61, 9924.19, 92625.8, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00016';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'strip', 33.62, 12, 40.34, 376.54);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'strip', 44.78, 12, 112.85, 1053.23);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'vial', 383.75, 12, 2118.3, 19770.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00003';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'vial', 61.13, 12, 249.41, 2327.83);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'strip', 31.55, 12, 132.51, 1236.76);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'kit', 3188.94, 12, 7270.78, 67860.64);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2603-004', v_centre_id, v_po_id, v_vendor_id, 2026-03-07::date + interval '3 days', 'verified', 'VINV-0004', 92625.8)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00016'), v_centre_id, 193, 15, 228, v_po_date + interval '3 days', 33.62)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00001'), v_centre_id, 103, 22, 105, v_po_date + interval '3 days', 44.78)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 136, 26, 232, v_po_date + interval '3 days', 383.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00003'), v_centre_id, 135, 7, 131, v_po_date + interval '3 days', 61.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 48,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00006'), v_centre_id, 84, 8, 431, v_po_date + interval '3 days', 31.55)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 52,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00067'), v_centre_id, 123, 22, 428, v_po_date + interval '3 days', 3188.94)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 45,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 5: H1-SHI-PO-2603-005 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-03-25'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-005', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 34872.19, 4184.66, 39056.85, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 40, 'nos', 331.29, 12, 1590.19, 14841.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00028';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'strip', 78.07, 12, 421.58, 3934.73);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'vial', 348.22, 12, 2172.89, 20280.33);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-005', v_centre_id, v_po_id, v_vendor_id, 2026-03-25::date + interval '2 days', 'verified', 'VINV-0005', 39056.85)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00073'), v_centre_id, 173, 24, 298, v_po_date + interval '3 days', 331.29)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 46,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00028'), v_centre_id, 94, 14, 496, v_po_date + interval '3 days', 78.07)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 31,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00008'), v_centre_id, 191, 27, 278, v_po_date + interval '3 days', 348.22)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 6: H1-SHI-PO-2603-006 → Sun Pharmaceutical Distributor
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0004';
  v_po_date := '2026-03-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-006', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 153621.7, 8664.82, 162286.52, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'bottle', 4812.7, 5, 6978.42, 146546.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00021';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'prefilled', 358.97, 12, 1464.6, 13669.58);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00046';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 18, 'nos', 102.69, 12, 221.81, 2070.23);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-006', v_centre_id, v_po_id, v_vendor_id, 2026-03-06::date + interval '8 days', 'verified', 'VINV-0006', 162286.52)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00036'), v_centre_id, 80, 28, 427, v_po_date + interval '3 days', 4812.7)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 19,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00021'), v_centre_id, 28, 15, 236, v_po_date + interval '3 days', 358.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00046'), v_centre_id, 20, 18, 543, v_po_date + interval '3 days', 102.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 7: H1-GAN-PO-2602-007 → Mindray Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0015';
  v_po_date := '2026-02-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-007', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 354935.07, 58609.64, 413544.71, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'strip', 44.53, 12, 277.87, 2593.43);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 0, 'nos', 279.81, 12, 906.58, 8461.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 0, 'cartridge', 12134.42, 18, 48052.3, 315009.54);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'nos', 2169.65, 12, 9372.89, 87480.29);
  END IF;


  -- PO 8: H1-GAN-PO-2603-008 → Intas Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0003';
  v_po_date := '2026-03-02'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-008', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 426222.4, 51146.69, 477369.09, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 0, 'strip', 19.6, 12, 96.43, 900.03);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00074';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'nos', 71.48, 12, 300.22, 2802.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'nos', 8458.34, 12, 50750.04, 473667.04);
  END IF;


  -- PO 9: H1-UDA-PO-2602-009 → Transasia Bio-Medicals
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0020';
  v_po_date := '2026-02-05'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-009', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 225195.15, 15720.2, 240915.35, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'nos', 494.28, 12, 3143.62, 29340.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'nos', 338.13, 12, 1379.57, 12875.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'ampoule', 169.19, 12, 913.63, 8527.18);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 20, 'patch', 920.69, 12, 2209.66, 20623.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'bottle', 4249.33, 5, 8073.73, 169548.27);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2602-009', v_centre_id, v_po_id, v_vendor_id, 2026-02-05::date + interval '6 days', 'verified', 'VINV-0009', 240915.35)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-UDA-INV-2602-009', 'VINV-0009', 2026-02-05::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 225195.15, 15720.2, 240915.35, 'mismatch', 'partial', 120458, v_credit_days, (2026-02-05::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 158, 24, 520, v_po_date + interval '3 days', 494.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00073'), v_centre_id, 107, 25, 217, v_po_date + interval '3 days', 338.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 175, 21, 544, v_po_date + interval '3 days', 169.19)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00018'), v_centre_id, 77, 12, 303, v_po_date + interval '3 days', 920.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00036'), v_centre_id, 64, 31, 548, v_po_date + interval '3 days', 4249.33)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 10: H1-SHI-PO-2602-010 → Zydus Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0001';
  v_po_date := '2026-02-12'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-010', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 182953.54, 27804.88, 210758.42, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'nos', 2173.59, 12, 3651.63, 34081.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'pack', 111.2, 18, 300.24, 1968.24);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'kit', 3413.66, 12, 6554.23, 61172.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'can', 1843.07, 18, 17251.14, 113090.78);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00057';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 18, 'nos', 22.06, 12, 47.65, 444.73);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-010', v_centre_id, v_po_id, v_vendor_id, 2026-02-12::date + interval '3 days', 'verified', 'VINV-0010', 210758.42)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2602-010', 'VINV-0010', 2026-02-12::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 182953.54, 27804.88, 210758.42, 'matched', 'partial', 105379, v_credit_days, (2026-02-12::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00054'), v_centre_id, 156, 15, 243, v_po_date + interval '3 days', 2173.59)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00072'), v_centre_id, 67, 14, 260, v_po_date + interval '3 days', 111.2)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 33,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00067'), v_centre_id, 69, 17, 109, v_po_date + interval '3 days', 3413.66)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00070'), v_centre_id, 176, 19, 338, v_po_date + interval '3 days', 1843.07)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00057'), v_centre_id, 18, 5, 168, v_po_date + interval '3 days', 22.06)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 11: H1-UDA-PO-2601-011 → Medtronic India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0010';
  v_po_date := '2026-01-19'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-011', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 3956115.05, 198432.61, 4154547.66, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00064';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 0, 'nos', 82232.5, 5, 197358, 4144518);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 0, 'ream', 208.31, 12, 924.9, 8632.37);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'nos', 21.85, 12, 62.93, 587.33);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'ampoule', 14.18, 12, 86.78, 809.96);
  END IF;


  -- PO 12: H1-GAN-PO-2601-012 → Nestlé Health Science India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0023';
  v_po_date := '2026-01-25'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2601-012', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 13138.73, 1576.65, 14715.38, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 0, 'box', 119, 12, 128.52, 1199.52);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 0, 'vial', 348.42, 12, 1421.55, 13267.83);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 0, 'bottle', 44.29, 12, 26.57, 248.02);
  END IF;


  -- PO 13: H1-VAS-PO-2601-013 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-01-11'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-013', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'urgent', 20191.32, 2422.96, 22614.28, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'vial', 424.32, 12, 2291.33, 21385.73);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00032';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'bottle', 30.47, 12, 131.63, 1228.55);
  END IF;


  -- PO 14: H1-SHI-PO-2603-014 → Mindray Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0015';
  v_po_date := '2026-03-26'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-014', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 3779.37, 453.52, 4232.89, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'strip', 40.43, 12, 203.77, 1901.83);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'strip', 63.07, 12, 249.76, 2331.07);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-014', v_centre_id, v_po_id, v_vendor_id, 2026-03-26::date + interval '7 days', 'verified', 'VINV-0014', 4232.89)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00001'), v_centre_id, 71, 25, 400, v_po_date + interval '3 days', 40.43)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00019'), v_centre_id, 178, 8, 258, v_po_date + interval '3 days', 63.07)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 57,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 15: H1-SHI-PO-2601-015 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-01-12'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-015', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 53286.17, 6394.34, 59680.51, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'ampoule', 46.52, 12, 273.54, 2553.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'strip', 56.76, 12, 34.06, 317.86);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'ampoule', 171.48, 12, 288.09, 2688.81);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00004';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'vial', 884.42, 12, 3396.17, 31697.61);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 17, 'nos', 1177.69, 12, 2402.49, 22423.22);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-015', v_centre_id, v_po_id, v_vendor_id, 2026-01-12::date + interval '6 days', 'verified', 'VINV-0015', 59680.51)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2601-015', 'VINV-0015', 2026-01-12::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 53286.17, 6394.34, 59680.51, 'matched', 'paid', 59680.51, v_credit_days, (2026-01-12::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00026'), v_centre_id, 156, 10, 431, v_po_date + interval '3 days', 46.52)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00020'), v_centre_id, 101, 11, 513, v_po_date + interval '3 days', 56.76)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 38, 22, 241, v_po_date + interval '3 days', 171.48)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00004'), v_centre_id, 193, 27, 205, v_po_date + interval '3 days', 884.42)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 46,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00062'), v_centre_id, 158, 7, 285, v_po_date + interval '3 days', 1177.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 16: H1-SHI-PO-2603-016 → Cipla Gujarat Division
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0007';
  v_po_date := '2026-03-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-016', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 30042.58, 3605.11, 33647.69, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 13, 'nos', 23.56, 12, 36.75, 343.03);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'ampoule', 15.3, 12, 18.36, 171.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'strip', 38.16, 12, 247.28, 2307.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'vial', 1131.15, 12, 814.43, 7601.33);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'bottle', 93.28, 12, 537.29, 5014.73);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'nos', 301.08, 12, 1951, 18209.32);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-016', v_centre_id, v_po_id, v_vendor_id, 2026-03-24::date + interval '2 days', 'verified', 'VINV-0016', 33647.69)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00058'), v_centre_id, 132, 29, 246, v_po_date + interval '3 days', 23.56)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 55, 21, 351, v_po_date + interval '3 days', 15.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00006'), v_centre_id, 55, 29, 267, v_po_date + interval '3 days', 38.16)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00009'), v_centre_id, 122, 21, 497, v_po_date + interval '3 days', 1131.15)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 40,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00014'), v_centre_id, 184, 30, 411, v_po_date + interval '3 days', 93.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 10,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00051'), v_centre_id, 114, 22, 509, v_po_date + interval '3 days', 301.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 17: H1-SHI-PO-2601-017 → GE Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0017';
  v_po_date := '2026-01-02'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-017', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 18274.37, 2192.92, 20467.29, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'vial', 443.89, 12, 1225.14, 11434.61);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'nos', 268.83, 12, 967.79, 9032.69);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-017', v_centre_id, v_po_id, v_vendor_id, 2026-01-02::date + interval '2 days', 'verified', 'VINV-0017', 20467.29)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 90;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2601-017', 'VINV-0017', 2026-01-02::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 18274.37, 2192.92, 20467.29, 'matched', 'unpaid', 0, v_credit_days, (2026-01-02::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 73, 32, 128, v_po_date + interval '3 days', 443.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00048'), v_centre_id, 79, 6, 278, v_po_date + interval '3 days', 268.83)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 18: H1-SHI-PO-2601-018 → Philips Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0016';
  v_po_date := '2026-01-11'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-018', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 529.14, 63.5, 592.64, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00029';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'strip', 24.18, 12, 34.82, 324.98);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'strip', 11.38, 12, 28.68, 267.66);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-018', v_centre_id, v_po_id, v_vendor_id, 2026-01-11::date + interval '7 days', 'verified', 'VINV-0018', 592.64)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 90;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2601-018', 'VINV-0018', 2026-01-11::date + interval '7 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 529.14, 63.5, 592.64, 'matched', 'partial', 296, v_credit_days, (2026-01-11::date + interval '7 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00029'), v_centre_id, 41, 24, 549, v_po_date + interval '3 days', 24.18)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 107, 26, 205, v_po_date + interval '3 days', 11.38)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 19: H1-UDA-PO-2603-019 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-03-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2603-019', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 9907.08, 1188.85, 11095.93, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'ampoule', 81.93, 12, 147.47, 1376.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 43, 'ampoule', 183.23, 12, 945.47, 8824.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'ampoule', 15.08, 12, 95.91, 895.15);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2603-019', v_centre_id, v_po_id, v_vendor_id, 2026-03-01::date + interval '3 days', 'verified', 'VINV-0019', 11095.93)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-UDA-INV-2603-019', 'VINV-0019', 2026-03-01::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 9907.08, 1188.85, 11095.93, 'matched', 'unpaid', 0, v_credit_days, (2026-03-01::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00025'), v_centre_id, 195, 18, 426, v_po_date + interval '3 days', 81.93)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 147, 24, 143, v_po_date + interval '3 days', 183.23)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 109, 33, 263, v_po_date + interval '3 days', 15.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 40,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 20: H1-SHI-PO-2601-020 → Sun Pharmaceutical Distributor
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0004';
  v_po_date := '2026-01-20'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-020', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 420285.18, 71946.59, 492231.77, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00038';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 0, 'bottle', 5171.51, 12, 4964.65, 46336.73);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'ampoule', 25.44, 12, 131.27, 1225.19);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 0, 'kit', 8334.41, 18, 57007.36, 373714.94);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 0, 'can', 1901.45, 18, 7529.74, 49361.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00052';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 0, 'nos', 1927.97, 12, 2313.56, 21593.26);
  END IF;


  -- PO 21: H1-GAN-PO-2601-021 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-01-13'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2601-021', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '7 days', 'urgent', 1476002.26, 83128.25, 1559130.51, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00057';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 31, 'nos', 20.75, 12, 77.19, 720.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00032';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'bottle', 27.27, 12, 117.81, 1099.53);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 41, 'can', 1649.9, 18, 12176.26, 79822.16);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00040';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'ampoule', 226.1, 12, 678.3, 6330.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'nos', 30450.55, 5, 70036.27, 1470761.57);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'strip', 18.61, 12, 42.43, 396.02);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2601-021', v_centre_id, v_po_id, v_vendor_id, 2026-01-13::date + interval '4 days', 'verified', 'VINV-0021', 1559130.51)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00057'), v_centre_id, 171, 23, 439, v_po_date + interval '3 days', 20.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00032'), v_centre_id, 115, 12, 373, v_po_date + interval '3 days', 27.27)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00070'), v_centre_id, 183, 24, 450, v_po_date + interval '3 days', 1649.9)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 16,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00040'), v_centre_id, 74, 32, 284, v_po_date + interval '3 days', 226.1)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00060'), v_centre_id, 151, 31, 412, v_po_date + interval '3 days', 30450.55)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00011'), v_centre_id, 16, 10, 493, v_po_date + interval '3 days', 18.61)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 48,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 22: H1-VAS-PO-2601-022 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-01-11'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-022', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 16870, 2149.4, 19019.4, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 7, 'bottle', 297.62, 18, 375, 2458.34);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'ampoule', 43.47, 12, 99.11, 925.04);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'box', 112.42, 12, 728.48, 6799.16);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 31, 'strip', 32.36, 12, 120.38, 1123.54);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 43, 'ampoule', 13.63, 12, 70.33, 656.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00049';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'nos', 196.9, 12, 756.1, 7056.9);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2601-022', v_centre_id, v_po_id, v_vendor_id, 2026-01-11::date + interval '4 days', 'verified', 'VINV-0022', 19019.4)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2601-022', 'VINV-0022', 2026-01-11::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 16870, 2149.4, 19019.4, 'matched', 'unpaid', 0, v_credit_days, (2026-01-11::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 67, 16, 430, v_po_date + interval '3 days', 297.62)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00026'), v_centre_id, 12, 33, 186, v_po_date + interval '3 days', 43.47)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 49,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00047'), v_centre_id, 125, 15, 128, v_po_date + interval '3 days', 112.42)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00006'), v_centre_id, 111, 29, 589, v_po_date + interval '3 days', 32.36)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 179, 17, 155, v_po_date + interval '3 days', 13.63)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 33,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00049'), v_centre_id, 187, 27, 367, v_po_date + interval '3 days', 196.9)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 23: H1-SHI-PO-2601-023 → Mindray Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0015';
  v_po_date := '2026-01-05'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-023', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 11222.84, 1346.74, 12569.58, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 0, 'patch', 959.88, 12, 691.11, 6450.39);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'strip', 80.62, 12, 338.6, 3160.3);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00042';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 0, 'ampoule', 37.4, 12, 40.39, 376.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 0, 'ampoule', 42.69, 12, 276.63, 2581.89);
  END IF;


  -- PO 24: H1-SHI-PO-2601-024 → Zydus Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0001';
  v_po_date := '2026-01-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-024', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 26244.72, 3149.37, 29394.09, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 0, 'strip', 45.68, 12, 43.85, 409.29);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'nos', 341.64, 12, 1844.86, 17218.66);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 0, 'strip', 11.58, 12, 56.97, 531.75);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 0, 'nos', 271.1, 12, 1203.68, 11234.38);
  END IF;


  -- PO 25: H1-SHI-PO-2602-025 → Mindray Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0015';
  v_po_date := '2026-02-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-025', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 361038.2, 32856.72, 393894.92, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 18, 'nos', 2793.28, 18, 9050.23, 59329.27);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'nos', 1236.89, 12, 4898.08, 45715.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'strip', 319.86, 12, 307.07, 2865.95);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'tin', 621.82, 18, 5932.16, 38888.62);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'patch', 902.72, 12, 1624.9, 15165.7);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'bottle', 4908.57, 5, 11044.28, 231929.93);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-025', v_centre_id, v_po_id, v_vendor_id, 2026-02-28::date + interval '2 days', 'verified', 'VINV-0025', 393894.92)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 90;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2602-025', 'VINV-0025', 2026-02-28::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 361038.2, 32856.72, 393894.92, 'matched', 'partial', 196947, v_credit_days, (2026-02-28::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00078'), v_centre_id, 196, 8, 179, v_po_date + interval '3 days', 2793.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00062'), v_centre_id, 22, 6, 441, v_po_date + interval '3 days', 1236.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00010'), v_centre_id, 185, 32, 231, v_po_date + interval '3 days', 319.86)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00075'), v_centre_id, 205, 20, 264, v_po_date + interval '3 days', 621.82)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00018'), v_centre_id, 115, 10, 558, v_po_date + interval '3 days', 902.72)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00036'), v_centre_id, 121, 21, 132, v_po_date + interval '3 days', 4908.57)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 46,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 26: H1-MOD-PO-2603-026 → GE Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0017';
  v_po_date := '2026-03-17'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2603-026', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 22509, 2701.08, 25210.08, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 24, 'nos', 365.57, 12, 1052.84, 9826.52);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 51, 'nos', 269.32, 12, 1648.24, 15383.56);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2603-026', v_centre_id, v_po_id, v_vendor_id, 2026-03-17::date + interval '6 days', 'verified', 'VINV-0026', 25210.08)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 90;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-MOD-INV-2603-026', 'VINV-0026', 2026-03-17::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 22509, 2701.08, 25210.08, 'partial_match', 'partial', 12605, v_credit_days, (2026-03-17::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00073'), v_centre_id, 92, 5, 176, v_po_date + interval '3 days', 365.57)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 51,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00048'), v_centre_id, 200, 28, 506, v_po_date + interval '3 days', 269.32)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 31,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 27: H1-MOD-PO-2603-027 → Alembic Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0006';
  v_po_date := '2026-03-05'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2603-027', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 857000.45, 143968.93, 1000969.38, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'ampoule', 14.71, 12, 8.83, 82.38);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00063';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 50, 'nos', 3246.47, 12, 19478.82, 181802.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'nos', 25.33, 12, 109.43, 1021.31);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'ampoule', 163.05, 12, 313.06, 2921.86);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'cartridge', 12933.61, 18, 123386.64, 808867.97);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'strip', 294.81, 12, 672.17, 6273.56);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2603-027', v_centre_id, v_po_id, v_vendor_id, 2026-03-05::date + interval '6 days', 'verified', 'VINV-0027', 1000969.38)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-MOD-INV-2603-027', 'VINV-0027', 2026-03-05::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 857000.45, 143968.93, 1000969.38, 'mismatch', 'unpaid', 0, v_credit_days, (2026-03-05::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 145, 27, 150, v_po_date + interval '3 days', 14.71)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00063'), v_centre_id, 200, 14, 141, v_po_date + interval '3 days', 3246.47)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00056'), v_centre_id, 120, 13, 366, v_po_date + interval '3 days', 25.33)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 168, 11, 198, v_po_date + interval '3 days', 163.05)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 46,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00069'), v_centre_id, 64, 30, 496, v_po_date + interval '3 days', 12933.61)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00010'), v_centre_id, 72, 33, 208, v_po_date + interval '3 days', 294.81)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 19,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 28: H1-SHI-PO-2602-028 → GE Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0017';
  v_po_date := '2026-02-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-028', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 8200.92, 984.11, 9185.03, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 0, 'box', 285.09, 12, 376.32, 3512.31);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00021';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 0, 'prefilled', 389.61, 12, 607.79, 5672.72);
  END IF;


  -- PO 29: H1-SHI-PO-2602-029 → Sun Pharmaceutical Distributor
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0004';
  v_po_date := '2026-02-23'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-029', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 24249.82, 2909.98, 27159.8, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00022';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 20, 'vial', 117.19, 12, 281.26, 2625.06);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00074';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'nos', 59.28, 12, 213.41, 1991.81);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00046';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'nos', 91.8, 12, 231.34, 2159.14);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'strip', 11.43, 12, 16.46, 153.62);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'strip', 56.21, 12, 229.34, 2140.48);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'vial', 384.56, 12, 1938.18, 18089.7);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-029', v_centre_id, v_po_id, v_vendor_id, 2026-02-23::date + interval '6 days', 'verified', 'VINV-0029', 27159.8)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2602-029', 'VINV-0029', 2026-02-23::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 24249.82, 2909.98, 27159.8, 'matched', 'unpaid', 0, v_credit_days, (2026-02-23::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00022'), v_centre_id, 184, 29, 493, v_po_date + interval '3 days', 117.19)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00074'), v_centre_id, 177, 24, 569, v_po_date + interval '3 days', 59.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00046'), v_centre_id, 11, 16, 166, v_po_date + interval '3 days', 91.8)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 155, 7, 501, v_po_date + interval '3 days', 11.43)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00020'), v_centre_id, 73, 28, 413, v_po_date + interval '3 days', 56.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 48,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 121, 19, 391, v_po_date + interval '3 days', 384.56)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 30: H1-VAS-PO-2602-030 → Cipla Gujarat Division
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0007';
  v_po_date := '2026-02-22'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-030', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 37139.2, 6051.41, 43190.61, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'tin', 738.29, 18, 4784.12, 31362.56);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 0, 'box', 754.34, 12, 1267.29, 11828.05);
  END IF;


  -- PO 31: H1-SHI-PO-2601-031 → Medtronic India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0010';
  v_po_date := '2026-01-26'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-031', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'urgent', 14222.48, 1706.7, 15929.18, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00032';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 44, 'bottle', 29.77, 12, 157.19, 1467.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 24, 'strip', 320.59, 12, 923.3, 8617.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'strip', 29.24, 12, 112.28, 1047.96);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'ampoule', 45.62, 12, 136.86, 1277.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 51, 'strip', 45.42, 12, 277.97, 2594.39);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 24, 'bottle', 34.41, 12, 99.1, 924.94);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-031', v_centre_id, v_po_id, v_vendor_id, 2026-01-26::date + interval '8 days', 'verified', 'VINV-0031', 15929.18)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00032'), v_centre_id, 92, 32, 102, v_po_date + interval '3 days', 29.77)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00010'), v_centre_id, 196, 11, 151, v_po_date + interval '3 days', 320.59)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00023'), v_centre_id, 68, 12, 208, v_po_date + interval '3 days', 29.24)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 40,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00026'), v_centre_id, 130, 34, 312, v_po_date + interval '3 days', 45.62)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00001'), v_centre_id, 80, 33, 339, v_po_date + interval '3 days', 45.42)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00033'), v_centre_id, 129, 22, 567, v_po_date + interval '3 days', 34.41)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 13,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 32: H1-SHI-PO-2603-032 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-03-21'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-032', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 5212.4, 625.49, 5837.89, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 18, 'bottle', 34.3, 12, 74.09, 691.49);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 20, 'ream', 229.75, 12, 551.4, 5146.4);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-032', v_centre_id, v_po_id, v_vendor_id, 2026-03-21::date + interval '7 days', 'verified', 'VINV-0032', 5837.89)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-032', 'VINV-0032', 2026-03-21::date + interval '7 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 5212.4, 625.49, 5837.89, 'partial_match', 'paid', 5837.89, v_credit_days, (2026-03-21::date + interval '7 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 55, 29, 597, v_po_date + interval '3 days', 34.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00077'), v_centre_id, 148, 22, 216, v_po_date + interval '3 days', 229.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 51,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 33: H1-VAS-PO-2603-033 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-03-13'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-033', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '7 days', 'normal', 9812.27, 1177.47, 10989.74, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 0, 'ampoule', 46.71, 12, 173.76, 1621.77);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'ampoule', 185.54, 12, 779.27, 7273.17);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 0, 'nos', 49.22, 12, 224.44, 2094.8);
  END IF;


  -- PO 34: H1-SHI-PO-2601-034 → INOX Air Products Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0028';
  v_po_date := '2026-01-11'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-034', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 83282.88, 14332.56, 97615.44, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 0, 'vial', 392.81, 12, 424.23, 3959.52);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 0, 'bottle', 42.13, 12, 237.61, 2217.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 0, 'strip', 66.76, 12, 424.59, 3962.87);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'can', 1854.11, 18, 13015.85, 85326.14);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 0, 'ampoule', 42.24, 12, 70.96, 662.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00016';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'strip', 37.93, 12, 159.31, 1486.86);
  END IF;


  -- PO 35: H1-SHI-PO-2602-035 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-02-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-035', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 981761.3, 69550.65, 1051311.95, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00038';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'bottle', 4927.44, 12, 31338.52, 292492.84);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'strip', 17.85, 12, 44.98, 419.83);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'bottle', 349.18, 18, 2639.8, 17305.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 39, 'bottle', 48.51, 12, 227.03, 2118.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00003';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'vial', 66.62, 12, 199.86, 1865.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 27, 'nos', 26000.34, 5, 35100.46, 737109.64);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-035', v_centre_id, v_po_id, v_vendor_id, 2026-02-28::date + interval '6 days', 'verified', 'VINV-0035', 1051311.95)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2602-035', 'VINV-0035', 2026-02-28::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 981761.3, 69550.65, 1051311.95, 'matched', 'unpaid', 0, v_credit_days, (2026-02-28::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00038'), v_centre_id, 44, 14, 580, v_po_date + interval '3 days', 4927.44)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00011'), v_centre_id, 88, 7, 100, v_po_date + interval '3 days', 17.85)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 91, 21, 240, v_po_date + interval '3 days', 349.18)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00031'), v_centre_id, 63, 20, 403, v_po_date + interval '3 days', 48.51)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00003'), v_centre_id, 169, 24, 522, v_po_date + interval '3 days', 66.62)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 21,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00060'), v_centre_id, 200, 18, 322, v_po_date + interval '3 days', 26000.34)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 36: H1-MOD-PO-2601-036 → Alembic Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0006';
  v_po_date := '2026-01-04'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-036', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 53152.05, 6378.25, 59530.3, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 0, 'nos', 115.16, 12, 317.84, 2966.52);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00042';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 0, 'ampoule', 37.54, 12, 76.58, 714.76);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 0, 'nos', 1100.51, 12, 5810.69, 54233.13);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 0, 'strip', 57.71, 12, 173.13, 1615.88);
  END IF;


  -- PO 37: H1-UDA-PO-2602-037 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-02-04'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-037', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 95383.37, 11807.11, 107190.48, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'nos', 2298.22, 12, 1654.72, 15444.04);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 47, 'pack', 128.05, 18, 1083.3, 7101.65);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00038';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 7, 'bottle', 4695.3, 12, 3944.05, 36811.15);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'vial', 1294.2, 12, 5125.03, 47833.63);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2602-037', v_centre_id, v_po_id, v_vendor_id, 2026-02-04::date + interval '2 days', 'verified', 'VINV-0037', 107190.48)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00054'), v_centre_id, 58, 8, 399, v_po_date + interval '3 days', 2298.22)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00072'), v_centre_id, 76, 10, 478, v_po_date + interval '3 days', 128.05)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00038'), v_centre_id, 94, 27, 289, v_po_date + interval '3 days', 4695.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 56,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00009'), v_centre_id, 140, 30, 202, v_po_date + interval '3 days', 1294.2)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 38: H1-UDA-PO-2601-038 → HP India Sales Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0026';
  v_po_date := '2026-01-02'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-038', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 20347.27, 2441.67, 22788.94, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'nos', 377.5, 12, 1359, 12684);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 0, 'nos', 20.8, 12, 104.83, 978.43);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 0, 'bottle', 33.12, 12, 79.49, 741.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 0, 'nos', 25.79, 12, 102.13, 953.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'strip', 127.6, 12, 796.22, 7431.42);
  END IF;


  -- PO 39: H1-GAN-PO-2602-039 → Satguru Enterprises
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0022';
  v_po_date := '2026-02-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-039', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '7 days', 'normal', 225945.87, 40162.82, 266108.69, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 51, 'bottle', 4219.01, 18, 38730.51, 253900.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00071';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'bottle', 289.89, 18, 417.44, 2736.56);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00022';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 28, 'vial', 114.17, 12, 383.61, 3580.37);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'bottle', 30.76, 12, 140.27, 1309.15);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 20, 'nos', 29.45, 12, 70.68, 659.68);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'nos', 350.26, 12, 420.31, 3922.91);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2602-039', v_centre_id, v_po_id, v_vendor_id, 2026-02-01::date + interval '6 days', 'verified', 'VINV-0039', 266108.69)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 35, 10, 431, v_po_date + interval '3 days', 4219.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 33,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00071'), v_centre_id, 158, 14, 140, v_po_date + interval '3 days', 289.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00022'), v_centre_id, 89, 9, 561, v_po_date + interval '3 days', 114.17)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00033'), v_centre_id, 171, 34, 335, v_po_date + interval '3 days', 30.76)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00056'), v_centre_id, 114, 10, 568, v_po_date + interval '3 days', 29.45)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 21,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00073'), v_centre_id, 27, 34, 411, v_po_date + interval '3 days', 350.26)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 40: H1-SHI-PO-2601-040 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-01-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-040', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 72513.36, 12955.21, 85468.57, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00041';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 0, 'ampoule', 55.1, 12, 105.79, 987.39);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 0, 'bottle', 29.53, 12, 88.59, 826.84);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 0, 'can', 1729.11, 18, 12760.83, 83654.34);
  END IF;


  -- PO 41: H1-SHI-PO-2603-041 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-03-26'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-041', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'emergency', 3219.47, 386.34, 3605.81, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'ampoule', 27.33, 12, 111.51, 1040.73);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'bottle', 91.61, 12, 274.83, 2565.08);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-041', v_centre_id, v_po_id, v_vendor_id, 2026-03-26::date + interval '5 days', 'verified', 'VINV-0041', 3605.81)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-041', 'VINV-0041', 2026-03-26::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 3219.47, 386.34, 3605.81, 'matched', 'partial', 1803, v_credit_days, (2026-03-26::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00039'), v_centre_id, 180, 22, 171, v_po_date + interval '3 days', 27.33)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00014'), v_centre_id, 178, 18, 185, v_po_date + interval '3 days', 91.61)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 42: H1-VAS-PO-2603-042 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-03-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-042', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 2952769.33, 149464.8, 3102234.13, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 39, 'bottle', 85.65, 12, 400.84, 3741.19);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 47, 'vial', 406.79, 12, 2294.3, 21413.43);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 51, 'nos', 48.89, 12, 299.21, 2792.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'ampoule', 37.92, 12, 136.51, 1274.11);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00064';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'nos', 86078.79, 5, 146333.94, 3073012.8);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2603-042', v_centre_id, v_po_id, v_vendor_id, 2026-03-28::date + interval '7 days', 'verified', 'VINV-0042', 3102234.13)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00014'), v_centre_id, 65, 11, 136, v_po_date + interval '3 days', 85.65)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 71, 6, 551, v_po_date + interval '3 days', 406.79)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00053'), v_centre_id, 36, 26, 222, v_po_date + interval '3 days', 48.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00017'), v_centre_id, 172, 33, 262, v_po_date + interval '3 days', 37.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 11,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00064'), v_centre_id, 110, 11, 327, v_po_date + interval '3 days', 86078.79)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 43: H1-SHI-PO-2601-043 → Satguru Enterprises
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0022';
  v_po_date := '2026-01-21'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-043', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '7 days', 'normal', 35024.12, 4348.53, 39372.65, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 0, 'patch', 942.9, 12, 3281.29, 30625.39);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 0, 'ream', 234.34, 12, 393.69, 3674.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'nos', 21.36, 12, 89.71, 837.31);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 0, 'vial', 49.84, 12, 77.75, 725.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 0, 'strip', 72.07, 12, 69.19, 645.75);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 0, 'pack', 115.58, 18, 436.89, 2864.07);
  END IF;


  -- PO 44: H1-UDA-PO-2601-044 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-01-15'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-044', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '7 days', 'normal', 28134.21, 3376.11, 31510.32, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'ream', 205.7, 12, 863.94, 8063.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 0, 'bottle', 44.32, 12, 255.28, 2382.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 0, 'ampoule', 39.49, 12, 255.9, 2388.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 0, 'nos', 288.57, 12, 1142.74, 10665.55);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 0, 'bottle', 80.88, 12, 300.87, 2808.15);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00022';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 0, 'vial', 116.12, 12, 557.38, 5202.18);
  END IF;


  -- PO 45: H1-VAS-PO-2602-045 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-02-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-045', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'emergency', 59359.92, 10541.62, 69901.54, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 39, 'strip', 61.18, 12, 286.32, 2672.34);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'can', 1899.13, 18, 10255.3, 67229.2);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-045', v_centre_id, v_po_id, v_vendor_id, 2026-02-24::date + interval '4 days', 'verified', 'VINV-0045', 69901.54)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-045', 'VINV-0045', 2026-02-24::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 59359.92, 10541.62, 69901.54, 'matched', 'paid', 69901.54, v_credit_days, (2026-02-24::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00019'), v_centre_id, 147, 18, 275, v_po_date + interval '3 days', 61.18)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00070'), v_centre_id, 38, 26, 166, v_po_date + interval '3 days', 1899.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 48,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 46: H1-SHI-PO-2603-046 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-03-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-046', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 6891.11, 826.93, 7718.04, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00022';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 11, 'vial', 121.74, 12, 160.7, 1499.84);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'strip', 19.46, 12, 14.01, 130.77);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'strip', 85.76, 12, 349.9, 3265.74);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00041';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 43, 'ampoule', 58.59, 12, 302.32, 2821.69);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-046', v_centre_id, v_po_id, v_vendor_id, 2026-03-07::date + interval '3 days', 'verified', 'VINV-0046', 7718.04)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-046', 'VINV-0046', 2026-03-07::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 6891.11, 826.93, 7718.04, 'partial_match', 'unpaid', 0, v_credit_days, (2026-03-07::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00022'), v_centre_id, 58, 16, 244, v_po_date + interval '3 days', 121.74)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00011'), v_centre_id, 184, 16, 504, v_po_date + interval '3 days', 19.46)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00002'), v_centre_id, 93, 18, 516, v_po_date + interval '3 days', 85.76)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00041'), v_centre_id, 87, 14, 428, v_po_date + interval '3 days', 58.59)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 47: H1-UDA-PO-2601-047 → Siemens Healthineers India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0019';
  v_po_date := '2026-01-19'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-047', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 509196.98, 74062.44, 583259.42, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'bottle', 3999.63, 18, 38876.4, 254856.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 28, 'nos', 304.43, 12, 1022.88, 9546.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'bottle', 50.21, 12, 72.3, 674.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'strip', 11.49, 12, 22.06, 205.9);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00052';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'nos', 1934.3, 12, 8820.41, 82323.81);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00038';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 44, 'bottle', 4781.89, 12, 25248.38, 235651.54);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2601-047', v_centre_id, v_po_id, v_vendor_id, 2026-01-19::date + interval '8 days', 'verified', 'VINV-0047', 583259.42)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-UDA-INV-2601-047', 'VINV-0047', 2026-01-19::date + interval '8 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 509196.98, 74062.44, 583259.42, 'partial_match', 'partial', 291630, v_credit_days, (2026-01-19::date + interval '8 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 87, 13, 345, v_po_date + interval '3 days', 3999.63)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00051'), v_centre_id, 148, 12, 265, v_po_date + interval '3 days', 304.43)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00035'), v_centre_id, 93, 22, 380, v_po_date + interval '3 days', 50.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 173, 20, 530, v_po_date + interval '3 days', 11.49)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00052'), v_centre_id, 16, 34, 218, v_po_date + interval '3 days', 1934.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 16,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00038'), v_centre_id, 53, 24, 461, v_po_date + interval '3 days', 4781.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 48: H1-GAN-PO-2602-048 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-02-12'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-048', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 251407.34, 35237.15, 286644.49, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'ampoule', 44.91, 12, 194.01, 1810.77);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'ampoule', 27.19, 12, 97.88, 913.58);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'kit', 3841.96, 12, 19363.48, 180725.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'nos', 261.78, 12, 376.96, 3518.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'nos', 2912.8, 18, 15204.82, 99676.02);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2602-048', v_centre_id, v_po_id, v_vendor_id, 2026-02-12::date + interval '7 days', 'verified', 'VINV-0048', 286644.49)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00026'), v_centre_id, 77, 27, 574, v_po_date + interval '3 days', 44.91)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00039'), v_centre_id, 208, 33, 558, v_po_date + interval '3 days', 27.19)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00067'), v_centre_id, 27, 16, 315, v_po_date + interval '3 days', 3841.96)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 12,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00048'), v_centre_id, 196, 34, 103, v_po_date + interval '3 days', 261.78)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00078'), v_centre_id, 170, 27, 454, v_po_date + interval '3 days', 2912.8)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 49: H1-UDA-PO-2603-049 → Mindray Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0015';
  v_po_date := '2026-03-13'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2603-049', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 111950.96, 13434.12, 125385.08, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00046';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'nos', 98.78, 12, 568.97, 5310.41);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'nos', 304.52, 12, 1096.27, 10231.87);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'nos', 1981.01, 12, 10935.18, 102061.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 18, 'vial', 385.97, 12, 833.7, 7781.16);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2603-049', v_centre_id, v_po_id, v_vendor_id, 2026-03-13::date + interval '7 days', 'verified', 'VINV-0049', 125385.08)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 90;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-UDA-INV-2603-049', 'VINV-0049', 2026-03-13::date + interval '7 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 111950.96, 13434.12, 125385.08, 'mismatch', 'paid', 125385.08, v_credit_days, (2026-03-13::date + interval '7 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00046'), v_centre_id, 186, 11, 224, v_po_date + interval '3 days', 98.78)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00048'), v_centre_id, 173, 25, 407, v_po_date + interval '3 days', 304.52)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 21,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00054'), v_centre_id, 106, 20, 511, v_po_date + interval '3 days', 1981.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 154, 7, 140, v_po_date + interval '3 days', 385.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 50: H1-VAS-PO-2602-050 → Medtronic India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0010';
  v_po_date := '2026-02-02'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-050', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 180597.65, 26750.6, 207348.25, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00071';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 0, 'bottle', 256.06, 18, 1889.72, 12388.18);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00049';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 0, 'nos', 177.52, 12, 1001.21, 9344.65);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00040';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'ampoule', 203.24, 12, 853.61, 7967.01);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 0, 'nos', 8121.62, 12, 8771.35, 81865.93);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 0, 'nos', 2965.98, 18, 13346.91, 87496.41);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 0, 'box', 822.03, 12, 887.79, 8286.06);
  END IF;


  -- PO 51: H1-SHI-PO-2602-051 → Cadila Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0005';
  v_po_date := '2026-02-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-051', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 40638.46, 5562.55, 46201.01, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 43, 'vial', 433.74, 12, 2238.1, 20888.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 51, 'nos', 87.46, 12, 535.26, 4995.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'bottle', 314.48, 18, 1075.52, 7050.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'box', 114.7, 12, 674.44, 6294.74);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'tin', 682.15, 18, 982.3, 6439.5);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'ampoule', 14.83, 12, 56.95, 531.51);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-051', v_centre_id, v_po_id, v_vendor_id, 2026-02-16::date + interval '2 days', 'verified', 'VINV-0051', 46201.01)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2602-051', 'VINV-0051', 2026-02-16::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 40638.46, 5562.55, 46201.01, 'matched', 'paid', 46201.01, v_credit_days, (2026-02-16::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 205, 14, 303, v_po_date + interval '3 days', 433.74)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00050'), v_centre_id, 197, 6, 537, v_po_date + interval '3 days', 87.46)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 57,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 117, 19, 192, v_po_date + interval '3 days', 314.48)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00047'), v_centre_id, 118, 32, 333, v_po_date + interval '3 days', 114.7)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00075'), v_centre_id, 91, 14, 130, v_po_date + interval '3 days', 682.15)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 21,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 174, 34, 458, v_po_date + interval '3 days', 14.83)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 46,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 52: H1-SHI-PO-2602-052 → Zydus Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0001';
  v_po_date := '2026-02-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-052', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 119653.21, 6410.1, 126063.31, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 0, 'ampoule', 165.86, 12, 437.87, 4086.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00003';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 0, 'vial', 61.86, 12, 81.66, 762.12);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 0, 'bottle', 4205.44, 5, 5677.34, 119224.22);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'bottle', 50.77, 12, 213.23, 1990.18);
  END IF;


  -- PO 53: H1-SHI-PO-2603-053 → Sun Pharmaceutical Distributor
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0004';
  v_po_date := '2026-03-12'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-053', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 16199.75, 1943.97, 18143.72, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00041';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'ampoule', 54.19, 12, 136.56, 1274.55);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 41, 'nos', 367.36, 12, 1807.41, 16869.17);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-053', v_centre_id, v_po_id, v_vendor_id, 2026-03-12::date + interval '4 days', 'verified', 'VINV-0053', 18143.72)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-053', 'VINV-0053', 2026-03-12::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 16199.75, 1943.97, 18143.72, 'matched', 'paid', 18143.72, v_credit_days, (2026-03-12::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00041'), v_centre_id, 112, 29, 243, v_po_date + interval '3 days', 54.19)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00073'), v_centre_id, 49, 31, 152, v_po_date + interval '3 days', 367.36)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 54: H1-VAS-PO-2603-054 → Dell Technologies India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0025';
  v_po_date := '2026-03-23'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-054', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 31969.74, 3836.37, 35806.11, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'box', 265.83, 12, 1658.78, 15481.94);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'strip', 40.35, 12, 24.21, 225.96);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00016';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'strip', 32.66, 12, 129.33, 1207.11);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'nos', 462.46, 12, 1831.34, 17092.52);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'nos', 29.18, 12, 147.07, 1372.63);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00043';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'pair', 18.11, 12, 45.64, 425.95);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2603-054', v_centre_id, v_po_id, v_vendor_id, 2026-03-23::date + interval '4 days', 'verified', 'VINV-0054', 35806.11)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2603-054', 'VINV-0054', 2026-03-23::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 31969.74, 3836.37, 35806.11, 'matched', 'unpaid', 0, v_credit_days, (2026-03-23::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00044'), v_centre_id, 18, 32, 239, v_po_date + interval '3 days', 265.83)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00001'), v_centre_id, 83, 26, 466, v_po_date + interval '3 days', 40.35)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 13,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00016'), v_centre_id, 206, 29, 524, v_po_date + interval '3 days', 32.66)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 123, 5, 208, v_po_date + interval '3 days', 462.46)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00056'), v_centre_id, 44, 24, 411, v_po_date + interval '3 days', 29.18)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00043'), v_centre_id, 35, 22, 253, v_po_date + interval '3 days', 18.11)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 55: H1-SHI-PO-2601-055 → B Braun Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0012';
  v_po_date := '2026-01-19'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-055', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 198137.1, 25118.87, 223255.97, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'kit', 3343.86, 12, 8827.79, 82392.71);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 28, 'tin', 642.52, 18, 3238.3, 21228.86);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 50, 'nos', 2043.97, 12, 12263.82, 114462.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'bottle', 313.08, 18, 788.96, 5172.08);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-055', v_centre_id, v_po_id, v_vendor_id, 2026-01-19::date + interval '2 days', 'verified', 'VINV-0055', 223255.97)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00067'), v_centre_id, 175, 17, 194, v_po_date + interval '3 days', 3343.86)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00075'), v_centre_id, 143, 8, 200, v_po_date + interval '3 days', 642.52)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00054'), v_centre_id, 191, 18, 129, v_po_date + interval '3 days', 2043.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 80, 20, 291, v_po_date + interval '3 days', 313.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 47,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 56: H1-VAS-PO-2601-056 → Cipla Gujarat Division
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0007';
  v_po_date := '2026-01-04'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-056', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'urgent', 3628.6, 435.43, 4064.03, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 50, 'nos', 22.28, 12, 133.68, 1247.68);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'strip', 55.88, 12, 301.75, 2816.35);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2601-056', v_centre_id, v_po_id, v_vendor_id, 2026-01-04::date + interval '3 days', 'verified', 'VINV-0056', 4064.03)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00058'), v_centre_id, 25, 20, 282, v_po_date + interval '3 days', 22.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00020'), v_centre_id, 170, 31, 337, v_po_date + interval '3 days', 55.88)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 57: H1-GAN-PO-2603-057 → HP India Sales Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0026';
  v_po_date := '2026-03-19'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-057', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 70178.46, 12556.58, 82735.04, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'nos', 27.37, 12, 151.08, 1410.1);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'kit', 8614.93, 18, 12405.5, 81324.94);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2603-057', v_centre_id, v_po_id, v_vendor_id, 2026-03-19::date + interval '3 days', 'verified', 'VINV-0057', 82735.04)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2603-057', 'VINV-0057', 2026-03-19::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 70178.46, 12556.58, 82735.04, 'matched', 'paid', 82735.04, v_credit_days, (2026-03-19::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00056'), v_centre_id, 101, 12, 422, v_po_date + interval '3 days', 27.37)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00068'), v_centre_id, 65, 13, 312, v_po_date + interval '3 days', 8614.93)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 58: H1-VAS-PO-2603-058 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-03-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-058', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'emergency', 177607.14, 27476.64, 205083.78, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'can', 1975.57, 18, 18491.34, 121220.98);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'vial', 415.28, 12, 2541.51, 23720.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'box', 769.66, 12, 3232.57, 30170.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'patch', 875.67, 12, 3152.41, 29422.51);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 0, 'bottle', 81.67, 12, 58.8, 548.82);
  END IF;


  -- PO 59: H1-SHI-PO-2602-059 → Cipla Gujarat Division
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0007';
  v_po_date := '2026-02-02'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-059', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 551694.98, 98628.07, 650323.05, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 0, 'bottle', 322.28, 18, 406.07, 2662.03);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00040';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 0, 'ampoule', 208.6, 12, 150.19, 1401.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'nos', 305.52, 12, 879.9, 8212.38);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'nos', 89.99, 12, 323.96, 3023.66);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 0, 'cartridge', 10982.76, 18, 96867.94, 635023.18);
  END IF;


  -- PO 60: H1-SHI-PO-2603-060 → Diversey India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0021';
  v_po_date := '2026-03-25'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-060', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 63201.75, 10112.04, 73313.79, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'ampoule', 151.49, 12, 708.97, 6617.08);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 0, 'bottle', 51.74, 12, 211.1, 1970.26);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 0, 'kit', 8426.1, 18, 7583.49, 49713.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 0, 'nos', 379.42, 12, 1229.32, 11473.66);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 0, 'strip', 71.81, 12, 379.16, 3538.8);
  END IF;


  -- PO 61: H1-VAS-PO-2603-061 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-03-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-061', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 153234.64, 18388.16, 171622.8, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00016';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'strip', 31.54, 12, 45.42, 423.9);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'strip', 49.99, 12, 311.94, 2911.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00063';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'nos', 3577.54, 12, 18030.8, 168287.48);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2603-061', v_centre_id, v_po_id, v_vendor_id, 2026-03-24::date + interval '6 days', 'verified', 'VINV-0061', 171622.8)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00016'), v_centre_id, 35, 5, 497, v_po_date + interval '3 days', 31.54)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00020'), v_centre_id, 19, 13, 243, v_po_date + interval '3 days', 49.99)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 49,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00063'), v_centre_id, 97, 28, 465, v_po_date + interval '3 days', 3577.54)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 51,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 62: H1-MOD-PO-2603-062 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-03-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2603-062', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 2193452.81, 114490.53, 2307943.34, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'nos', 2127.72, 12, 7659.79, 71491.39);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00064';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 0, 'nos', 81716.38, 5, 106231.29, 2230857.17);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'ampoule', 78.71, 12, 481.71, 4495.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 0, 'strip', 35.04, 12, 117.73, 1098.85);
  END IF;


  -- PO 63: H1-MOD-PO-2601-063 → Siemens Healthineers India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0019';
  v_po_date := '2026-01-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-063', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 363214.48, 59154.42, 422368.9, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 0, 'nos', 364.04, 12, 1616.34, 15085.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 0, 'cartridge', 12675.65, 18, 43350.72, 284188.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'ampoule', 178.21, 12, 834.02, 7784.21);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 0, 'nos', 2050.89, 12, 9844.27, 91879.87);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'bottle', 32.85, 12, 153.74, 1434.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 0, 'can', 1694.61, 18, 3355.33, 21996.04);
  END IF;


  -- PO 64: H1-SHI-PO-2603-064 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-03-18'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-064', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 650139.34, 32789.98, 682929.32, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 0, 'strip', 59.76, 12, 207.96, 1941);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 0, 'nos', 25843.85, 5, 32304.81, 678401.06);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'strip', 29.41, 12, 158.81, 1482.26);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 0, 'bottle', 49.33, 12, 118.39, 1104.99);
  END IF;


  -- PO 65: H1-SHI-PO-2603-065 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-03-03'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-065', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '7 days', 'normal', 116621.49, 19623.14, 136244.63, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'box', 267.44, 12, 192.56, 1797.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'nos', 1116.18, 12, 2544.89, 23752.31);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'nos', 2535.39, 18, 16885.7, 110695.13);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-065', v_centre_id, v_po_id, v_vendor_id, 2026-03-03::date + interval '3 days', 'verified', 'VINV-0065', 136244.63)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00044'), v_centre_id, 29, 33, 279, v_po_date + interval '3 days', 267.44)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 39,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00062'), v_centre_id, 18, 28, 421, v_po_date + interval '3 days', 1116.18)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00078'), v_centre_id, 198, 18, 102, v_po_date + interval '3 days', 2535.39)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 66: H1-SHI-PO-2603-066 → Transasia Bio-Medicals
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0020';
  v_po_date := '2026-03-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-066', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 164728.58, 19767.43, 184496.01, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00052';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'nos', 1885.77, 12, 11314.62, 105603.12);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 0, 'nos', 459.39, 12, 1764.06, 16464.54);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 0, 'nos', 7962.8, 12, 6688.75, 62428.35);
  END IF;


  -- PO 67: H1-MOD-PO-2602-067 → BD India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0011';
  v_po_date := '2026-02-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2602-067', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 198346.38, 23801.57, 222147.95, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00063';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'nos', 3739.94, 12, 23337.23, 217814.11);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 11, 'ampoule', 24.11, 12, 31.83, 297.04);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'strip', 43.27, 12, 114.23, 1066.17);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'strip', 25.26, 12, 115.19, 1075.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 47, 'bottle', 36.01, 12, 203.1, 1895.57);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2602-067', v_centre_id, v_po_id, v_vendor_id, 2026-02-06::date + interval '5 days', 'verified', 'VINV-0067', 222147.95)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-MOD-INV-2602-067', 'VINV-0067', 2026-02-06::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 198346.38, 23801.57, 222147.95, 'matched', 'paid', 222147.95, v_credit_days, (2026-02-06::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00063'), v_centre_id, 78, 30, 568, v_po_date + interval '3 days', 3739.94)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 48,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00039'), v_centre_id, 76, 20, 332, v_po_date + interval '3 days', 24.11)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 11,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00024'), v_centre_id, 13, 24, 582, v_po_date + interval '3 days', 43.27)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00023'), v_centre_id, 140, 28, 554, v_po_date + interval '3 days', 25.26)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 168, 6, 158, v_po_date + interval '3 days', 36.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 68: H1-UDA-PO-2602-068 → Philips Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0016';
  v_po_date := '2026-02-09'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-068', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 78132.71, 10135.93, 88268.64, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'bottle', 45.85, 12, 192.57, 1797.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'strip', 68.37, 12, 443.04, 4135.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 7, 'bottle', 42.02, 12, 35.3, 329.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'bottle', 301.59, 18, 2280.02, 14946.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'vial', 1221.94, 12, 7185.01, 67060.07);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2602-068', v_centre_id, v_po_id, v_vendor_id, 2026-02-09::date + interval '8 days', 'verified', 'VINV-0068', 88268.64)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 90;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-UDA-INV-2602-068', 'VINV-0068', 2026-02-09::date + interval '8 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 78132.71, 10135.93, 88268.64, 'matched', 'partial', 44134, v_credit_days, (2026-02-09::date + interval '8 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00035'), v_centre_id, 73, 25, 509, v_po_date + interval '3 days', 45.85)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 57, 12, 429, v_po_date + interval '3 days', 68.37)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00031'), v_centre_id, 156, 20, 433, v_po_date + interval '3 days', 42.02)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 152, 20, 297, v_po_date + interval '3 days', 301.59)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00009'), v_centre_id, 10, 13, 491, v_po_date + interval '3 days', 1221.94)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 69: H1-SHI-PO-2601-069 → GE Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0017';
  v_po_date := '2026-01-18'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-069', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 18663.33, 2239.6, 20902.93, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 0, 'nos', 1258.95, 12, 755.37, 7050.12);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 0, 'strip', 18.39, 12, 92.69, 865.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'nos', 331.32, 12, 1391.54, 12987.74);
  END IF;


  -- PO 70: H1-MOD-PO-2603-070 → Cipla Gujarat Division
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0007';
  v_po_date := '2026-03-25'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2603-070', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 1228460.4, 62642.86, 1291103.26, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'ampoule', 192.01, 12, 875.57, 8171.95);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'vial', 53.61, 12, 231.6, 2161.56);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'bottle', 4131.74, 5, 7850.31, 164856.43);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'nos', 127.46, 12, 565.92, 5281.94);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 41, 'nos', 25708, 5, 52701.4, 1106729.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'vial', 435.49, 12, 418.07, 3901.99);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2603-070', v_centre_id, v_po_id, v_vendor_id, 2026-03-25::date + interval '7 days', 'verified', 'VINV-0070', 1291103.26)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-MOD-INV-2603-070', 'VINV-0070', 2026-03-25::date + interval '7 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 1228460.4, 62642.86, 1291103.26, 'partial_match', 'partial', 645552, v_credit_days, (2026-03-25::date + interval '7 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 118, 32, 346, v_po_date + interval '3 days', 192.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00012'), v_centre_id, 30, 10, 201, v_po_date + interval '3 days', 53.61)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00036'), v_centre_id, 173, 23, 567, v_po_date + interval '3 days', 4131.74)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00055'), v_centre_id, 133, 18, 563, v_po_date + interval '3 days', 127.46)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00060'), v_centre_id, 200, 7, 570, v_po_date + interval '3 days', 25708)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 11, 5, 578, v_po_date + interval '3 days', 435.49)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 71: H1-UDA-PO-2601-071 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-01-03'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-071', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 2329.91, 279.59, 2609.5, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'ampoule', 15.72, 12, 15.09, 140.85);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00049';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 13, 'nos', 169.55, 12, 264.5, 2468.65);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2601-071', v_centre_id, v_po_id, v_vendor_id, 2026-01-03::date + interval '4 days', 'verified', 'VINV-0071', 2609.5)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 194, 25, 562, v_po_date + interval '3 days', 15.72)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00049'), v_centre_id, 209, 26, 428, v_po_date + interval '3 days', 169.55)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 72: H1-MOD-PO-2601-072 → B Braun Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0012';
  v_po_date := '2026-01-10'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-072', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 3450214.69, 227193.19, 3677407.88, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'ampoule', 180.17, 12, 454.03, 4237.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 51, 'kit', 8109.27, 18, 74443.1, 488015.87);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'strip', 66.75, 12, 296.37, 2766.12);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00064';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'nos', 83986.88, 5, 151176.38, 3174704.06);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 44, 'ampoule', 155.93, 12, 823.31, 7684.23);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2601-072', v_centre_id, v_po_id, v_vendor_id, 2026-01-10::date + interval '3 days', 'verified', 'VINV-0072', 3677407.88)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-MOD-INV-2601-072', 'VINV-0072', 2026-01-10::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 3450214.69, 227193.19, 3677407.88, 'matched', 'partial', 1838704, v_credit_days, (2026-01-10::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 80, 6, 397, v_po_date + interval '3 days', 180.17)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 39,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00068'), v_centre_id, 171, 11, 200, v_po_date + interval '3 days', 8109.27)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 56,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 133, 13, 520, v_po_date + interval '3 days', 66.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00064'), v_centre_id, 86, 26, 266, v_po_date + interval '3 days', 83986.88)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00027'), v_centre_id, 179, 10, 220, v_po_date + interval '3 days', 155.93)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 73: H1-UDA-PO-2603-073 → Intas Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0003';
  v_po_date := '2026-03-02'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2603-073', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 436898.22, 52427.79, 489326.01, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00021';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'prefilled', 416.25, 12, 1948.05, 18181.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'nos', 9342.05, 12, 50447.07, 470839.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 0, 'nos', 20.94, 12, 32.67, 304.89);
  END IF;


  -- PO 74: H1-VAS-PO-2603-074 → BD India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0011';
  v_po_date := '2026-03-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-074', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'urgent', 10290.66, 1234.88, 11525.54, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'strip', 66.13, 12, 238.07, 2221.97);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'ampoule', 24.89, 12, 14.93, 139.38);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'nos', 110.69, 12, 305.5, 2851.37);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 9, 'ampoule', 175.3, 12, 189.32, 1767.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'box', 289.91, 12, 487.05, 4545.79);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2603-074', v_centre_id, v_po_id, v_vendor_id, 2026-03-27::date + interval '2 days', 'verified', 'VINV-0074', 11525.54)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2603-074', 'VINV-0074', 2026-03-27::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 10290.66, 1234.88, 11525.54, 'matched', 'unpaid', 0, v_credit_days, (2026-03-27::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 71, 29, 236, v_po_date + interval '3 days', 66.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00039'), v_centre_id, 26, 12, 311, v_po_date + interval '3 days', 24.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00055'), v_centre_id, 52, 31, 562, v_po_date + interval '3 days', 110.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 208, 25, 439, v_po_date + interval '3 days', 175.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 39,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00044'), v_centre_id, 49, 17, 566, v_po_date + interval '3 days', 289.91)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 13,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 75: H1-SHI-PO-2601-075 → Zydus Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0001';
  v_po_date := '2026-01-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-075', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'emergency', 7835.79, 940.29, 8776.08, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'bottle', 34.34, 12, 41.21, 384.61);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 31, 'ream', 241.69, 12, 899.09, 8391.48);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-075', v_centre_id, v_po_id, v_vendor_id, 2026-01-16::date + interval '2 days', 'verified', 'VINV-0075', 8776.08)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2601-075', 'VINV-0075', 2026-01-16::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 7835.79, 940.29, 8776.08, 'matched', 'paid', 8776.08, v_credit_days, (2026-01-16::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 148, 8, 583, v_po_date + interval '3 days', 34.34)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00077'), v_centre_id, 22, 18, 131, v_po_date + interval '3 days', 241.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 76: H1-VAS-PO-2603-076 → Diversey India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0021';
  v_po_date := '2026-03-11'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-076', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 815090.08, 135632.62, 950722.7, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 0, 'nos', 323.78, 12, 1593, 14867.98);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 0, 'nos', 8572.58, 12, 20574.19, 192025.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'cartridge', 12607.27, 18, 113465.43, 743828.93);
  END IF;


  -- PO 77: H1-MOD-PO-2601-077 → HP India Sales Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0026';
  v_po_date := '2026-01-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-077', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 198294.12, 23795.29, 222089.41, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'strip', 80.8, 12, 339.36, 3167.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00052';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'nos', 1810.73, 12, 6301.34, 58812.51);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00038';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 31, 'bottle', 4611.45, 12, 17154.59, 160109.54);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2601-077', v_centre_id, v_po_id, v_vendor_id, 2026-01-07::date + interval '6 days', 'verified', 'VINV-0077', 222089.41)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-MOD-INV-2601-077', 'VINV-0077', 2026-01-07::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 198294.12, 23795.29, 222089.41, 'matched', 'paid', 222089.41, v_credit_days, (2026-01-07::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00002'), v_centre_id, 105, 11, 112, v_po_date + interval '3 days', 80.8)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00052'), v_centre_id, 157, 33, 156, v_po_date + interval '3 days', 1810.73)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00038'), v_centre_id, 173, 27, 125, v_po_date + interval '3 days', 4611.45)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 78: H1-VAS-PO-2603-078 → Mindray Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0015';
  v_po_date := '2026-03-03'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-078', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 223346.63, 11292.46, 234639.09, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00043';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'pair', 18.35, 12, 110.1, 1027.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00029';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'strip', 22.31, 12, 104.41, 974.5);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 0, 'nos', 27694.88, 5, 11077.95, 232636.99);
  END IF;


  -- PO 79: H1-SHI-PO-2601-079 → B Braun Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0012';
  v_po_date := '2026-01-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-079', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 18854.32, 2498.27, 21352.59, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00071';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'bottle', 280.66, 18, 707.26, 4636.5);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'strip', 42.28, 12, 167.43, 1562.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'nos', 255.28, 12, 1623.58, 15153.42);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-079', v_centre_id, v_po_id, v_vendor_id, 2026-01-01::date + interval '3 days', 'verified', 'VINV-0079', 21352.59)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00071'), v_centre_id, 29, 31, 265, v_po_date + interval '3 days', 280.66)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00024'), v_centre_id, 163, 25, 494, v_po_date + interval '3 days', 42.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00048'), v_centre_id, 191, 6, 131, v_po_date + interval '3 days', 255.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 19,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 80: H1-MOD-PO-2601-080 → Dell Technologies India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0025';
  v_po_date := '2026-01-11'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-080', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 750708.21, 42881.2, 793589.41, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 0, 'vial', 386.61, 12, 1438.19, 13423.1);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 0, 'nos', 26973.59, 5, 33716.99, 708056.74);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 0, 'nos', 1313.95, 12, 7726.03, 72109.58);
  END IF;


  -- PO 81: H1-VAS-PO-2602-081 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-02-09'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-081', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 32545.33, 3905.44, 36450.77, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'nos', 409.97, 12, 2607.41, 24335.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00028';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 27, 'strip', 81.79, 12, 265, 2473.33);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 13, 'strip', 19.43, 12, 30.31, 282.9);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 47, 'bottle', 41.08, 12, 231.69, 2162.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'ream', 221.56, 12, 771.03, 7196.27);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-081', v_centre_id, v_po_id, v_vendor_id, 2026-02-09::date + interval '7 days', 'verified', 'VINV-0081', 36450.77)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-081', 'VINV-0081', 2026-02-09::date + interval '7 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 32545.33, 3905.44, 36450.77, 'mismatch', 'unpaid', 0, v_credit_days, (2026-02-09::date + interval '7 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 44, 24, 475, v_po_date + interval '3 days', 409.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00028'), v_centre_id, 205, 20, 163, v_po_date + interval '3 days', 81.79)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00011'), v_centre_id, 23, 20, 226, v_po_date + interval '3 days', 19.43)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 12,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00031'), v_centre_id, 57, 18, 259, v_po_date + interval '3 days', 41.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 51,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00077'), v_centre_id, 118, 10, 137, v_po_date + interval '3 days', 221.56)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 82: H1-VAS-PO-2602-082 → Satguru Enterprises
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0022';
  v_po_date := '2026-02-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-082', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '7 days', 'normal', 132907.25, 15948.87, 148856.12, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'nos', 446.96, 12, 1340.88, 12514.88);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'nos', 2113.22, 12, 13693.67, 127807.55);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00041';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 27, 'ampoule', 55.82, 12, 180.86, 1688);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'strip', 130.89, 12, 188.48, 1759.16);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 13, 'strip', 349.35, 12, 544.99, 5086.54);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-082', v_centre_id, v_po_id, v_vendor_id, 2026-02-27::date + interval '8 days', 'verified', 'VINV-0082', 148856.12)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 15;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-082', 'VINV-0082', 2026-02-27::date + interval '8 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 132907.25, 15948.87, 148856.12, 'partial_match', 'paid', 148856.12, v_credit_days, (2026-02-27::date + interval '8 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 186, 33, 369, v_po_date + interval '3 days', 446.96)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00054'), v_centre_id, 52, 6, 550, v_po_date + interval '3 days', 2113.22)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 57,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00041'), v_centre_id, 159, 16, 376, v_po_date + interval '3 days', 55.82)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00007'), v_centre_id, 131, 15, 261, v_po_date + interval '3 days', 130.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00010'), v_centre_id, 118, 24, 269, v_po_date + interval '3 days', 349.35)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 83: H1-SHI-PO-2603-083 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-03-15'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-083', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 127559.93, 16618.12, 144178.05, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 0, 'box', 262.8, 12, 1702.94, 15894.14);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 0, 'vial', 447.9, 12, 1182.46, 11036.26);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'nos', 45.67, 12, 235.66, 2199.47);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 0, 'tin', 704.8, 18, 3932.78, 25781.58);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00038';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 0, 'bottle', 4842.27, 12, 9297.16, 86773.48);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'strip', 44.52, 12, 267.12, 2493.12);
  END IF;


  -- PO 84: H1-SHI-PO-2603-084 → Satguru Enterprises
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0022';
  v_po_date := '2026-03-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-084', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '7 days', 'normal', 23717.68, 2846.12, 26563.8, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'nos', 410.59, 12, 936.15, 8737.36);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'pack', 458.75, 12, 1211.1, 11303.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'strip', 27.67, 12, 63.09, 588.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'nos', 331.14, 12, 635.79, 5934.03);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-084', v_centre_id, v_po_id, v_vendor_id, 2026-03-28::date + interval '4 days', 'verified', 'VINV-0084', 26563.8)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 15;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-084', 'VINV-0084', 2026-03-28::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 23717.68, 2846.12, 26563.8, 'matched', 'partial', 13282, v_credit_days, (2026-03-28::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 151, 9, 559, v_po_date + interval '3 days', 410.59)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 134, 19, 540, v_po_date + interval '3 days', 458.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00023'), v_centre_id, 174, 6, 325, v_po_date + interval '3 days', 27.67)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 13,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00073'), v_centre_id, 61, 6, 203, v_po_date + interval '3 days', 331.14)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 85: H1-SHI-PO-2601-085 → INOX Air Products Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0028';
  v_po_date := '2026-01-05'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-085', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 1964.41, 235.73, 2200.14, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'ampoule', 15.47, 12, 98.39, 918.3);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'strip', 54.5, 12, 137.34, 1281.84);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-085', v_centre_id, v_po_id, v_vendor_id, 2026-01-05::date + interval '2 days', 'verified', 'VINV-0085', 2200.14)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 117, 17, 188, v_po_date + interval '3 days', 15.47)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00020'), v_centre_id, 188, 13, 436, v_po_date + interval '3 days', 54.5)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 86: H1-UDA-PO-2601-086 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-01-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-086', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'emergency', 191914.3, 23123.07, 215037.37, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 0, 'vial', 1252.09, 12, 7362.29, 68714.7);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 0, 'kit', 3380.65, 12, 15010.09, 140094.14);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00028';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'strip', 78.44, 12, 470.64, 4392.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 0, 'pack', 119.68, 18, 280.05, 1835.89);
  END IF;


  -- PO 87: H1-GAN-PO-2602-087 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-02-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-087', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'urgent', 35407.31, 4248.88, 39656.19, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'ampoule', 197.96, 12, 380.08, 3547.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'nos', 276.75, 12, 398.52, 3719.52);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 24, 'nos', 1139.32, 12, 3281.24, 30624.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'bottle', 84.42, 12, 162.09, 1512.81);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'ampoule', 14.97, 12, 26.95, 251.5);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2602-087', v_centre_id, v_po_id, v_vendor_id, 2026-02-06::date + interval '4 days', 'verified', 'VINV-0087', 39656.19)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 152, 29, 141, v_po_date + interval '3 days', 197.96)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 10,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00048'), v_centre_id, 146, 28, 360, v_po_date + interval '3 days', 276.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 33,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00062'), v_centre_id, 166, 18, 374, v_po_date + interval '3 days', 1139.32)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00014'), v_centre_id, 147, 13, 359, v_po_date + interval '3 days', 84.42)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 33, 28, 484, v_po_date + interval '3 days', 14.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 88: H1-MOD-PO-2602-088 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-02-19'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2602-088', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 10092.64, 1211.12, 11303.76, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00032';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'bottle', 29.21, 12, 119.18, 1112.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 11, 'strip', 134.65, 12, 177.74, 1658.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 31, 'bottle', 44.94, 12, 167.18, 1560.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'ampoule', 162.21, 12, 447.7, 4178.53);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'vial', 59.39, 12, 299.33, 2793.71);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2602-088', v_centre_id, v_po_id, v_vendor_id, 2026-02-19::date + interval '8 days', 'verified', 'VINV-0088', 11303.76)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-MOD-INV-2602-088', 'VINV-0088', 2026-02-19::date + interval '8 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 10092.64, 1211.12, 11303.76, 'matched', 'paid', 11303.76, v_credit_days, (2026-02-19::date + interval '8 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00032'), v_centre_id, 43, 15, 174, v_po_date + interval '3 days', 29.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 56,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00007'), v_centre_id, 50, 27, 597, v_po_date + interval '3 days', 134.65)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 16,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00035'), v_centre_id, 10, 29, 559, v_po_date + interval '3 days', 44.94)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00027'), v_centre_id, 80, 22, 543, v_po_date + interval '3 days', 162.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00012'), v_centre_id, 57, 14, 259, v_po_date + interval '3 days', 59.39)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 89: H1-UDA-PO-2602-089 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-02-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-089', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 68068.07, 8168.17, 76236.24, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'kit', 3497.63, 12, 6715.45, 62677.53);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'strip', 69.12, 12, 248.83, 2322.43);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'pack', 452.56, 12, 868.92, 8109.88);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'bottle', 45.56, 12, 207.75, 1939.03);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'bottle', 30.29, 12, 127.22, 1187.37);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2602-089', v_centre_id, v_po_id, v_vendor_id, 2026-02-16::date + interval '5 days', 'verified', 'VINV-0089', 76236.24)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-UDA-INV-2602-089', 'VINV-0089', 2026-02-16::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 68068.07, 8168.17, 76236.24, 'matched', 'paid', 76236.24, v_credit_days, (2026-02-16::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00067'), v_centre_id, 132, 13, 571, v_po_date + interval '3 days', 3497.63)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00019'), v_centre_id, 45, 18, 266, v_po_date + interval '3 days', 69.12)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 138, 18, 310, v_po_date + interval '3 days', 452.56)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00031'), v_centre_id, 20, 19, 580, v_po_date + interval '3 days', 45.56)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00033'), v_centre_id, 201, 13, 469, v_po_date + interval '3 days', 30.29)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 90: H1-MOD-PO-2602-090 → Intas Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0003';
  v_po_date := '2026-02-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2602-090', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'urgent', 1146657.01, 60273.37, 1206930.38, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'box', 822.97, 12, 4740.31, 44242.87);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'box', 117.16, 12, 70.3, 656.1);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00032';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 18, 'bottle', 28.74, 12, 62.08, 579.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'nos', 30684.71, 5, 55232.48, 1159882.04);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'nos', 28.77, 12, 127.74, 1192.23);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'ampoule', 42.16, 12, 40.47, 377.75);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2602-090', v_centre_id, v_po_id, v_vendor_id, 2026-02-28::date + interval '8 days', 'verified', 'VINV-0090', 1206930.38)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00066'), v_centre_id, 60, 20, 507, v_po_date + interval '3 days', 822.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 31,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00047'), v_centre_id, 16, 13, 560, v_po_date + interval '3 days', 117.16)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 47,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00032'), v_centre_id, 44, 32, 466, v_po_date + interval '3 days', 28.74)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00060'), v_centre_id, 101, 17, 406, v_po_date + interval '3 days', 30684.71)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00056'), v_centre_id, 102, 16, 211, v_po_date + interval '3 days', 28.77)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00017'), v_centre_id, 173, 5, 436, v_po_date + interval '3 days', 42.16)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 57,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 91: H1-VAS-PO-2603-091 → Intas Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0003';
  v_po_date := '2026-03-08'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-091', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 6746.34, 809.56, 7555.9, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 17, 'ream', 211.94, 12, 432.36, 4035.34);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'strip', 25.4, 12, 18.29, 170.69);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'strip', 61.04, 12, 358.92, 3349.88);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2603-091', v_centre_id, v_po_id, v_vendor_id, 2026-03-08::date + interval '8 days', 'verified', 'VINV-0091', 7555.9)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2603-091', 'VINV-0091', 2026-03-08::date + interval '8 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 6746.34, 809.56, 7555.9, 'partial_match', 'paid', 7555.9, v_credit_days, (2026-03-08::date + interval '8 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00077'), v_centre_id, 40, 31, 196, v_po_date + interval '3 days', 211.94)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00023'), v_centre_id, 91, 30, 238, v_po_date + interval '3 days', 25.4)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 45,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 80, 14, 269, v_po_date + interval '3 days', 61.04)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 48,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 92: H1-SHI-PO-2603-092 → B Braun Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0012';
  v_po_date := '2026-03-15'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-092', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 155591.46, 18670.98, 174262.44, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00043';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 11, 'pair', 17.94, 12, 23.68, 221.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00063';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'nos', 3699.86, 12, 18647.29, 174041.41);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-092', v_centre_id, v_po_id, v_vendor_id, 2026-03-15::date + interval '5 days', 'verified', 'VINV-0092', 174262.44)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00043'), v_centre_id, 26, 28, 334, v_po_date + interval '3 days', 17.94)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00063'), v_centre_id, 118, 27, 407, v_po_date + interval '3 days', 3699.86)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 49,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 93: H1-SHI-PO-2601-093 → Johnson & Johnson Medical Indi
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0009';
  v_po_date := '2026-01-09'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-093', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 5674.7, 680.96, 6355.66, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'vial', 430.52, 12, 413.3, 3857.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00028';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'strip', 85.79, 12, 267.66, 2498.2);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-093', v_centre_id, v_po_id, v_vendor_id, 2026-01-09::date + interval '5 days', 'verified', 'VINV-0093', 6355.66)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 19, 32, 536, v_po_date + interval '3 days', 430.52)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00028'), v_centre_id, 124, 25, 144, v_po_date + interval '3 days', 85.79)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 13,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 94: H1-SHI-PO-2602-094 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-02-08'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-094', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '7 days', 'normal', 191680.62, 34472.85, 226153.47, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'bottle', 3901.76, 18, 34413.52, 225599.76);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'strip', 13.01, 12, 59.33, 553.71);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-094', v_centre_id, v_po_id, v_vendor_id, 2026-02-08::date + interval '6 days', 'verified', 'VINV-0094', 226153.47)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 172, 27, 345, v_po_date + interval '3 days', 3901.76)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 85, 6, 167, v_po_date + interval '3 days', 13.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 95: H1-SHI-PO-2602-095 → Sun Pharmaceutical Distributor
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0004';
  v_po_date := '2026-02-13'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-095', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 13189.74, 1582.77, 14772.51, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'strip', 11.13, 12, 8.01, 74.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'ampoule', 191.83, 12, 851.73, 7949.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00003';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'vial', 62.64, 12, 157.85, 1473.29);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'strip', 347.99, 12, 334.07, 3117.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00049';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 7, 'nos', 186.82, 12, 156.93, 1464.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'ampoule', 41.21, 12, 74.18, 692.33);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-095', v_centre_id, v_po_id, v_vendor_id, 2026-02-13::date + interval '5 days', 'verified', 'VINV-0095', 14772.51)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2602-095', 'VINV-0095', 2026-02-13::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 13189.74, 1582.77, 14772.51, 'matched', 'paid', 14772.51, v_credit_days, (2026-02-13::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 61, 29, 247, v_po_date + interval '3 days', 11.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 160, 31, 565, v_po_date + interval '3 days', 191.83)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00003'), v_centre_id, 33, 5, 380, v_po_date + interval '3 days', 62.64)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00010'), v_centre_id, 172, 17, 129, v_po_date + interval '3 days', 347.99)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 31,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00049'), v_centre_id, 61, 15, 498, v_po_date + interval '3 days', 186.82)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00026'), v_centre_id, 55, 24, 151, v_po_date + interval '3 days', 41.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 96: H1-VAS-PO-2601-096 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-01-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-096', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 1777.12, 213.25, 1990.37, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'strip', 76.93, 12, 73.85, 689.29);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'bottle', 44.68, 12, 139.4, 1301.08);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2601-096', v_centre_id, v_po_id, v_vendor_id, 2026-01-01::date + interval '2 days', 'verified', 'VINV-0096', 1990.37)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2601-096', 'VINV-0096', 2026-01-01::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 1777.12, 213.25, 1990.37, 'matched', 'unpaid', 0, v_credit_days, (2026-01-01::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00002'), v_centre_id, 182, 29, 553, v_po_date + interval '3 days', 76.93)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 57,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00031'), v_centre_id, 145, 12, 223, v_po_date + interval '3 days', 44.68)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 16,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 97: H1-SHI-PO-2601-097 → Philips Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0016';
  v_po_date := '2026-01-23'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-097', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 60008.19, 9908.24, 69916.43, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'bottle', 3870.77, 18, 5573.91, 36540.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'ream', 232.45, 12, 892.61, 8331.01);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'bottle', 33.52, 12, 209.16, 1952.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'bottle', 89.7, 12, 484.38, 4520.88);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00040';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'ampoule', 208.66, 12, 200.31, 1869.59);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'tin', 744.99, 18, 2547.87, 16702.68);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-097', v_centre_id, v_po_id, v_vendor_id, 2026-01-23::date + interval '4 days', 'verified', 'VINV-0097', 69916.43)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 90;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2601-097', 'VINV-0097', 2026-01-23::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 60008.19, 9908.24, 69916.43, 'matched', 'unpaid', 0, v_credit_days, (2026-01-23::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 201, 12, 152, v_po_date + interval '3 days', 3870.77)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00077'), v_centre_id, 102, 24, 122, v_po_date + interval '3 days', 232.45)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 100, 10, 479, v_po_date + interval '3 days', 33.52)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00014'), v_centre_id, 56, 17, 386, v_po_date + interval '3 days', 89.7)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00040'), v_centre_id, 148, 14, 335, v_po_date + interval '3 days', 208.66)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00075'), v_centre_id, 75, 7, 300, v_po_date + interval '3 days', 744.99)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 45,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 98: H1-GAN-PO-2603-098 → BD India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0011';
  v_po_date := '2026-03-26'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-098', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 189890.22, 13377.16, 203267.38, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'nos', 94.49, 12, 510.25, 4762.3);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 31, 'bottle', 4336.25, 5, 6721.19, 141144.94);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'strip', 39.7, 12, 152.45, 1422.85);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'kit', 3567.43, 12, 5993.28, 55937.3);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2603-098', v_centre_id, v_po_id, v_vendor_id, 2026-03-26::date + interval '5 days', 'verified', 'VINV-0098', 203267.38)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2603-098', 'VINV-0098', 2026-03-26::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 189890.22, 13377.16, 203267.38, 'matched', 'unpaid', 0, v_credit_days, (2026-03-26::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00050'), v_centre_id, 120, 31, 464, v_po_date + interval '3 days', 94.49)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00036'), v_centre_id, 116, 10, 135, v_po_date + interval '3 days', 4336.25)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00001'), v_centre_id, 71, 20, 326, v_po_date + interval '3 days', 39.7)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 12,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00067'), v_centre_id, 92, 30, 132, v_po_date + interval '3 days', 3567.43)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 40,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 99: H1-GAN-PO-2601-099 → BD India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0011';
  v_po_date := '2026-01-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2601-099', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 182997.01, 29765.01, 212762.02, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 31, 'patch', 980.1, 12, 3645.97, 34029.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'ampoule', 23.04, 12, 91.24, 851.56);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00057';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'nos', 24.15, 12, 72.45, 676.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00016';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'strip', 37.86, 12, 27.26, 254.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'pack', 436.11, 12, 2511.99, 23445.27);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'kit', 9292.1, 18, 23416.09, 153505.49);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2601-099', v_centre_id, v_po_id, v_vendor_id, 2026-01-16::date + interval '8 days', 'verified', 'VINV-0099', 212762.02)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2601-099', 'VINV-0099', 2026-01-16::date + interval '8 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 182997.01, 29765.01, 212762.02, 'mismatch', 'partial', 106381, v_credit_days, (2026-01-16::date + interval '8 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00018'), v_centre_id, 162, 29, 478, v_po_date + interval '3 days', 980.1)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00039'), v_centre_id, 73, 22, 566, v_po_date + interval '3 days', 23.04)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00057'), v_centre_id, 59, 27, 146, v_po_date + interval '3 days', 24.15)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00016'), v_centre_id, 49, 26, 123, v_po_date + interval '3 days', 37.86)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 45, 31, 305, v_po_date + interval '3 days', 436.11)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00068'), v_centre_id, 162, 15, 459, v_po_date + interval '3 days', 9292.1)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 100: H1-SHI-PO-2602-100 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-02-15'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-100', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 134018.07, 16401.36, 150419.43, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 0, 'strip', 52.3, 12, 263.59, 2460.19);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 0, 'pack', 108.57, 18, 957.59, 6277.52);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 0, 'kit', 3401.74, 12, 13470.89, 125728.31);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'strip', 67.45, 12, 291.38, 2719.58);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'ampoule', 165.71, 12, 1034.03, 9650.95);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 0, 'box', 114.25, 12, 383.88, 3582.88);
  END IF;


  -- PO 101: H1-SHI-PO-2601-101 → Dell Technologies India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0025';
  v_po_date := '2026-01-18'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-101', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 1335071.45, 67370.97, 1402442.42, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'nos', 44.08, 12, 238.03, 2221.63);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'nos', 113.95, 12, 191.44, 1786.74);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 50, 'nos', 26525.03, 5, 66312.58, 1392564.08);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00046';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'nos', 95.6, 12, 114.72, 1070.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'ampoule', 80.85, 12, 514.21, 4799.26);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-101', v_centre_id, v_po_id, v_vendor_id, 2026-01-18::date + interval '2 days', 'verified', 'VINV-0101', 1402442.42)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00053'), v_centre_id, 124, 17, 513, v_po_date + interval '3 days', 44.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 45,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00055'), v_centre_id, 180, 23, 238, v_po_date + interval '3 days', 113.95)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00060'), v_centre_id, 148, 25, 244, v_po_date + interval '3 days', 26525.03)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00046'), v_centre_id, 154, 12, 573, v_po_date + interval '3 days', 95.6)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00025'), v_centre_id, 207, 24, 478, v_po_date + interval '3 days', 80.85)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 102: H1-MOD-PO-2601-102 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-01-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-102', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 3186580.43, 164765.06, 3351345.49, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'nos', 2800.06, 18, 7056.15, 46256.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'nos', 295.41, 12, 177.25, 1654.3);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'bottle', 49.33, 12, 224.94, 2099.48);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00064';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'nos', 92427.16, 5, 157126.17, 3299649.61);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 24, 'strip', 62.69, 12, 180.55, 1685.11);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2601-102', v_centre_id, v_po_id, v_vendor_id, 2026-01-01::date + interval '3 days', 'verified', 'VINV-0102', 3351345.49)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-MOD-INV-2601-102', 'VINV-0102', 2026-01-01::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 3186580.43, 164765.06, 3351345.49, 'matched', 'unpaid', 0, v_credit_days, (2026-01-01::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00078'), v_centre_id, 28, 19, 507, v_po_date + interval '3 days', 2800.06)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00051'), v_centre_id, 156, 32, 373, v_po_date + interval '3 days', 295.41)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00035'), v_centre_id, 149, 10, 564, v_po_date + interval '3 days', 49.33)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 10,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00064'), v_centre_id, 72, 28, 517, v_po_date + interval '3 days', 92427.16)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 19,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00019'), v_centre_id, 159, 25, 523, v_po_date + interval '3 days', 62.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 103: H1-SHI-PO-2603-103 → Johnson & Johnson Medical Indi
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0009';
  v_po_date := '2026-03-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-103', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 31124.4, 3734.93, 34859.33, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'strip', 81.07, 12, 515.61, 4812.32);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 41, 'nos', 338.01, 12, 1663.01, 15521.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'strip', 124.9, 12, 374.7, 3497.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'bottle', 37.27, 12, 187.84, 1753.18);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00049';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'nos', 172.53, 12, 993.77, 9275.21);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-103', v_centre_id, v_po_id, v_vendor_id, 2026-03-01::date + interval '4 days', 'verified', 'VINV-0103', 34859.33)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00002'), v_centre_id, 201, 25, 179, v_po_date + interval '3 days', 81.07)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 49,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00051'), v_centre_id, 23, 20, 314, v_po_date + interval '3 days', 338.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 56,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00007'), v_centre_id, 109, 16, 298, v_po_date + interval '3 days', 124.9)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 13,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 22, 15, 469, v_po_date + interval '3 days', 37.27)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00049'), v_centre_id, 164, 11, 572, v_po_date + interval '3 days', 172.53)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 104: H1-SHI-PO-2603-104 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-03-22'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-104', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '7 days', 'normal', 1175704.95, 59458.72, 1235163.67, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00028';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 17, 'strip', 82.15, 12, 167.59, 1564.14);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'strip', 41.02, 12, 241.2, 2251.18);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'nos', 30686.42, 5, 58304.2, 1224388.16);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'nos', 443.89, 12, 745.74, 6960.2);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-104', v_centre_id, v_po_id, v_vendor_id, 2026-03-22::date + interval '3 days', 'verified', 'VINV-0104', 1235163.67)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00028'), v_centre_id, 26, 20, 404, v_po_date + interval '3 days', 82.15)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00024'), v_centre_id, 39, 16, 445, v_po_date + interval '3 days', 41.02)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00060'), v_centre_id, 147, 34, 534, v_po_date + interval '3 days', 30686.42)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 150, 14, 164, v_po_date + interval '3 days', 443.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 105: H1-UDA-PO-2602-105 → Alembic Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0006';
  v_po_date := '2026-02-13'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-105', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 19239.09, 2833.55, 22072.64, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 0, 'nos', 47.01, 12, 112.82, 1053.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'strip', 28.56, 12, 147.37, 1375.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 0, 'nos', 492.67, 12, 709.44, 6621.48);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 0, 'ampoule', 44.55, 12, 219.19, 2045.74);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'strip', 16.24, 12, 70.16, 654.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00071';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 0, 'bottle', 282.18, 18, 1574.56, 10322.14);
  END IF;


  -- PO 106: H1-UDA-PO-2603-106 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-03-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2603-106', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 9332.25, 1119.87, 10452.12, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'nos', 86.4, 12, 466.56, 4354.56);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 0, 'strip', 320.25, 12, 653.31, 6097.56);
  END IF;


  -- PO 107: H1-SHI-PO-2601-107 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-01-10'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-107', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 8470.2, 1016.42, 9486.62, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00003';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'vial', 60.12, 12, 36.07, 336.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 44, 'bottle', 37.12, 12, 195.99, 1829.27);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'pack', 408.52, 12, 784.36, 7320.68);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-107', v_centre_id, v_po_id, v_vendor_id, 2026-01-10::date + interval '4 days', 'verified', 'VINV-0107', 9486.62)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00003'), v_centre_id, 163, 24, 584, v_po_date + interval '3 days', 60.12)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 49,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 171, 15, 411, v_po_date + interval '3 days', 37.12)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 192, 14, 208, v_po_date + interval '3 days', 408.52)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 108: H1-MOD-PO-2602-108 → Johnson & Johnson Medical Indi
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0009';
  v_po_date := '2026-02-20'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2602-108', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 151369.87, 26655.67, 178025.54, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 0, 'nos', 379.68, 12, 911.23, 8504.83);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'nos', 2658.24, 18, 24402.64, 159972.88);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00071';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 0, 'bottle', 283.39, 18, 1071.21, 7022.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 0, 'strip', 322.12, 12, 270.58, 2525.42);
  END IF;


  -- PO 109: H1-SHI-PO-2601-109 → Medtronic India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0010';
  v_po_date := '2026-01-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-109', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 182222.03, 22995.09, 205217.12, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 0, 'nos', 7708.27, 12, 11099.91, 103599.15);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 0, 'tin', 696.57, 18, 3385.33, 22192.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'nos', 23.15, 12, 83.34, 777.84);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 0, 'nos', 108.86, 12, 195.95, 1828.85);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'nos', 1319, 12, 8230.56, 76818.56);
  END IF;


  -- PO 110: H1-VAS-PO-2603-110 → HP India Sales Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0026';
  v_po_date := '2026-03-04'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-110', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 138651.3, 24463.16, 163114.46, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 7, 'strip', 43.65, 12, 36.67, 342.22);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'pack', 421.69, 12, 607.23, 5667.51);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'strip', 62.21, 12, 164.23, 1532.85);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 13, 'ampoule', 79.51, 12, 124.04, 1157.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'kit', 9315.48, 18, 23475.01, 153891.73);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'nos', 46.65, 12, 55.98, 522.48);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2603-110', v_centre_id, v_po_id, v_vendor_id, 2026-03-04::date + interval '2 days', 'verified', 'VINV-0110', 163114.46)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2603-110', 'VINV-0110', 2026-03-04::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 138651.3, 24463.16, 163114.46, 'matched', 'partial', 81557, v_credit_days, (2026-03-04::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00024'), v_centre_id, 28, 5, 414, v_po_date + interval '3 days', 43.65)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 208, 23, 141, v_po_date + interval '3 days', 421.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 186, 26, 494, v_po_date + interval '3 days', 62.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 11,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00025'), v_centre_id, 73, 17, 596, v_po_date + interval '3 days', 79.51)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00068'), v_centre_id, 155, 6, 465, v_po_date + interval '3 days', 9315.48)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00053'), v_centre_id, 90, 29, 584, v_po_date + interval '3 days', 46.65)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 48,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 111: H1-SHI-PO-2603-111 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-03-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-111', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '7 days', 'normal', 1221298.7, 67703.07, 1289001.77, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'box', 754.16, 12, 3167.47, 29563.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 0, 'kit', 3790.05, 12, 8186.51, 76407.41);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 0, 'bottle', 42.8, 12, 25.68, 239.68);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 0, 'nos', 29643.9, 5, 56323.41, 1182791.61);
  END IF;


  -- PO 112: H1-MOD-PO-2601-112 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-01-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-112', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 35923.07, 4310.77, 40233.84, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'ampoule', 23.37, 12, 120.59, 1125.5);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'ampoule', 48.48, 12, 290.88, 2714.88);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'strip', 30.41, 12, 87.58, 817.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 0, 'nos', 1134.44, 12, 3811.72, 35576.04);
  END IF;


  -- PO 113: H1-GAN-PO-2603-113 → B Braun Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0012';
  v_po_date := '2026-03-21'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-113', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'urgent', 34694.87, 4163.38, 38858.25, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'nos', 113.41, 12, 340.23, 3175.48);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'box', 733.43, 12, 3696.49, 34500.55);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'ampoule', 45.04, 12, 102.69, 958.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'strip', 33.3, 12, 23.98, 223.78);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2603-113', v_centre_id, v_po_id, v_vendor_id, 2026-03-21::date + interval '8 days', 'verified', 'VINV-0113', 38858.25)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2603-113', 'VINV-0113', 2026-03-21::date + interval '8 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 34694.87, 4163.38, 38858.25, 'matched', 'paid', 38858.25, v_credit_days, (2026-03-21::date + interval '8 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00055'), v_centre_id, 173, 11, 193, v_po_date + interval '3 days', 113.41)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 57,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00066'), v_centre_id, 84, 32, 159, v_po_date + interval '3 days', 733.43)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00026'), v_centre_id, 154, 32, 255, v_po_date + interval '3 days', 45.04)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00006'), v_centre_id, 203, 28, 207, v_po_date + interval '3 days', 33.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 114: H1-UDA-PO-2602-114 → Alembic Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0006';
  v_po_date := '2026-02-10'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-114', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 729328.77, 126954.72, 856283.49, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 0, 'cartridge', 12171.38, 18, 118305.81, 775560.33);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 0, 'strip', 61.66, 12, 88.79, 828.71);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 0, 'kit', 3362.93, 12, 8474.58, 79096.11);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'ampoule', 15.84, 12, 85.54, 798.34);
  END IF;


  -- PO 115: H1-UDA-PO-2602-115 → Diversey India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0021';
  v_po_date := '2026-02-20'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-115', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 4247.91, 509.75, 4757.66, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 39, 'ampoule', 78.19, 12, 365.93, 3415.34);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 50, 'nos', 23.97, 12, 143.82, 1342.32);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2602-115', v_centre_id, v_po_id, v_vendor_id, 2026-02-20::date + interval '2 days', 'verified', 'VINV-0115', 4757.66)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00025'), v_centre_id, 19, 29, 331, v_po_date + interval '3 days', 78.19)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 39,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00058'), v_centre_id, 149, 26, 175, v_po_date + interval '3 days', 23.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 19,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 116: H1-GAN-PO-2603-116 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-03-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-116', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 244191.21, 42329.38, 286520.59, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'bottle', 4430.76, 18, 39079.3, 256186.54);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'strip', 124.86, 12, 284.68, 2657.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'nos', 353.68, 12, 891.27, 8318.55);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00022';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 28, 'vial', 108.57, 12, 364.8, 3404.76);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'bottle', 34.32, 12, 172.97, 1614.41);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'box', 284.51, 12, 1536.35, 14339.3);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2603-116', v_centre_id, v_po_id, v_vendor_id, 2026-03-01::date + interval '8 days', 'verified', 'VINV-0116', 286520.59)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 123, 21, 308, v_po_date + interval '3 days', 4430.76)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00007'), v_centre_id, 97, 31, 473, v_po_date + interval '3 days', 124.86)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00073'), v_centre_id, 192, 22, 177, v_po_date + interval '3 days', 353.68)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 49,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00022'), v_centre_id, 19, 6, 464, v_po_date + interval '3 days', 108.57)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 52,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 58, 20, 323, v_po_date + interval '3 days', 34.32)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00044'), v_centre_id, 129, 23, 384, v_po_date + interval '3 days', 284.51)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 117: H1-GAN-PO-2602-117 → Cipla Gujarat Division
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0007';
  v_po_date := '2026-02-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-117', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 134128.46, 20798.98, 154927.44, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'vial', 1186.93, 12, 5269.97, 49186.38);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 47, 'can', 1667.93, 18, 14110.69, 92503.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00049';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 9, 'nos', 194.65, 12, 210.22, 1962.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'ampoule', 81.62, 12, 519.1, 4844.96);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'ampoule', 164.47, 12, 572.36, 5341.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00029';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'strip', 20.25, 12, 116.64, 1088.64);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2602-117', v_centre_id, v_po_id, v_vendor_id, 2026-02-27::date + interval '3 days', 'verified', 'VINV-0117', 154927.44)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2602-117', 'VINV-0117', 2026-02-27::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 134128.46, 20798.98, 154927.44, 'matched', 'paid', 154927.44, v_credit_days, (2026-02-27::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00009'), v_centre_id, 74, 16, 351, v_po_date + interval '3 days', 1186.93)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00070'), v_centre_id, 138, 13, 452, v_po_date + interval '3 days', 1667.93)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00049'), v_centre_id, 35, 32, 241, v_po_date + interval '3 days', 194.65)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 45,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00025'), v_centre_id, 154, 12, 366, v_po_date + interval '3 days', 81.62)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 192, 28, 592, v_po_date + interval '3 days', 164.47)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00029'), v_centre_id, 23, 11, 102, v_po_date + interval '3 days', 20.25)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 118: H1-VAS-PO-2601-118 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-01-17'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-118', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 1217835.25, 68652.26, 1286487.51, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'vial', 1181.49, 12, 2693.8, 25142.11);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'nos', 478.9, 12, 2815.93, 26282.03);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'nos', 26969.08, 5, 56635.07, 1189336.43);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'tin', 652.58, 18, 5403.36, 35422.04);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'ampoule', 173.6, 12, 1104.1, 10304.9);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2601-118', v_centre_id, v_po_id, v_vendor_id, 2026-01-17::date + interval '3 days', 'verified', 'VINV-0118', 1286487.51)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2601-118', 'VINV-0118', 2026-01-17::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 1217835.25, 68652.26, 1286487.51, 'matched', 'unpaid', 0, v_credit_days, (2026-01-17::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00009'), v_centre_id, 208, 34, 421, v_po_date + interval '3 days', 1181.49)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 14, 9, 372, v_po_date + interval '3 days', 478.9)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00060'), v_centre_id, 104, 18, 127, v_po_date + interval '3 days', 26969.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00075'), v_centre_id, 94, 7, 108, v_po_date + interval '3 days', 652.58)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 79, 21, 460, v_po_date + interval '3 days', 173.6)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 21,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 119: H1-VAS-PO-2601-119 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-01-08'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-119', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'urgent', 82163.09, 14520.24, 96683.33, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00057';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'nos', 23.23, 12, 22.3, 208.14);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'ream', 226.56, 12, 380.62, 3552.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'kit', 7767.78, 18, 13982, 91659.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 9, 'nos', 125.29, 12, 135.31, 1262.92);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2601-119', v_centre_id, v_po_id, v_vendor_id, 2026-01-08::date + interval '2 days', 'verified', 'VINV-0119', 96683.33)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2601-119', 'VINV-0119', 2026-01-08::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 82163.09, 14520.24, 96683.33, 'matched', 'paid', 96683.33, v_credit_days, (2026-01-08::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00057'), v_centre_id, 33, 32, 168, v_po_date + interval '3 days', 23.23)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00077'), v_centre_id, 63, 33, 294, v_po_date + interval '3 days', 226.56)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00068'), v_centre_id, 197, 34, 116, v_po_date + interval '3 days', 7767.78)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00055'), v_centre_id, 51, 33, 532, v_po_date + interval '3 days', 125.29)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 120: H1-SHI-PO-2601-120 → Johnson & Johnson Medical Indi
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0009';
  v_po_date := '2026-01-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-120', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 15986.21, 1918.35, 17904.56, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00041';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 0, 'ampoule', 54.24, 12, 221.3, 2065.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00021';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 0, 'prefilled', 387.64, 12, 1302.47, 12156.39);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00042';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 0, 'ampoule', 31.51, 12, 139.9, 1305.77);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 0, 'strip', 37.51, 12, 54.01, 504.13);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 0, 'vial', 53.94, 12, 200.66, 1872.8);
  END IF;


  -- PO 121: H1-SHI-PO-2602-121 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-02-09'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-121', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'emergency', 17801.74, 2136.21, 19937.95, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00003';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'vial', 64.82, 12, 357.81, 3339.53);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00057';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'nos', 21.88, 12, 120.78, 1127.26);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'strip', 119.93, 12, 690.8, 6447.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'strip', 50.92, 12, 213.86, 1996.06);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 43, 'bottle', 47.75, 12, 246.39, 2299.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 27, 'ampoule', 156.35, 12, 506.57, 4728.02);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-121', v_centre_id, v_po_id, v_vendor_id, 2026-02-09::date + interval '6 days', 'verified', 'VINV-0121', 19937.95)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2602-121', 'VINV-0121', 2026-02-09::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 17801.74, 2136.21, 19937.95, 'matched', 'paid', 19937.95, v_credit_days, (2026-02-09::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00003'), v_centre_id, 187, 19, 403, v_po_date + interval '3 days', 64.82)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00057'), v_centre_id, 133, 12, 277, v_po_date + interval '3 days', 21.88)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 39,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00007'), v_centre_id, 94, 16, 281, v_po_date + interval '3 days', 119.93)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00020'), v_centre_id, 69, 21, 353, v_po_date + interval '3 days', 50.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00031'), v_centre_id, 85, 13, 207, v_po_date + interval '3 days', 47.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00027'), v_centre_id, 90, 8, 421, v_po_date + interval '3 days', 156.35)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 122: H1-SHI-PO-2603-122 → Transasia Bio-Medicals
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0020';
  v_po_date := '2026-03-19'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-122', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 3407.04, 408.84, 3815.88, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00074';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'nos', 71.08, 12, 179.12, 1671.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 43, 'strip', 44.52, 12, 229.72, 2144.08);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-122', v_centre_id, v_po_id, v_vendor_id, 2026-03-19::date + interval '6 days', 'verified', 'VINV-0122', 3815.88)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-122', 'VINV-0122', 2026-03-19::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 3407.04, 408.84, 3815.88, 'matched', 'paid', 3815.88, v_credit_days, (2026-03-19::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00074'), v_centre_id, 186, 9, 454, v_po_date + interval '3 days', 71.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00024'), v_centre_id, 59, 15, 296, v_po_date + interval '3 days', 44.52)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 123: H1-VAS-PO-2602-123 → Cadila Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0005';
  v_po_date := '2026-02-15'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-123', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'emergency', 306344.69, 49479.11, 355823.8, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00029';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'strip', 20.54, 12, 71.48, 667.14);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00043';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'pair', 17.76, 12, 63.94, 596.74);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 11, 'nos', 1987.18, 12, 2623.08, 24482.06);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'kit', 8478.5, 18, 38153.25, 250115.75);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00052';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'nos', 1922.31, 12, 8073.7, 75354.55);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'bottle', 91.42, 12, 493.67, 4607.57);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-123', v_centre_id, v_po_id, v_vendor_id, 2026-02-15::date + interval '6 days', 'verified', 'VINV-0123', 355823.8)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-123', 'VINV-0123', 2026-02-15::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 306344.69, 49479.11, 355823.8, 'mismatch', 'unpaid', 0, v_credit_days, (2026-02-15::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00029'), v_centre_id, 71, 20, 223, v_po_date + interval '3 days', 20.54)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00043'), v_centre_id, 14, 7, 181, v_po_date + interval '3 days', 17.76)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00054'), v_centre_id, 92, 16, 136, v_po_date + interval '3 days', 1987.18)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00068'), v_centre_id, 178, 15, 109, v_po_date + interval '3 days', 8478.5)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00052'), v_centre_id, 134, 33, 310, v_po_date + interval '3 days', 1922.31)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00014'), v_centre_id, 35, 5, 205, v_po_date + interval '3 days', 91.42)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 12,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 124: H1-GAN-PO-2602-124 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-02-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-124', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 3958.95, 475.07, 4434.02, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 0, 'ampoule', 44.85, 12, 37.67, 351.62);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 0, 'nos', 307.35, 12, 295.06, 2753.86);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00042';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'ampoule', 32.95, 12, 142.34, 1328.54);
  END IF;


  -- PO 125: H1-SHI-PO-2603-125 → Dell Technologies India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0025';
  v_po_date := '2026-03-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-125', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 35594.93, 4271.39, 39866.32, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00043';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'pair', 16.22, 12, 70.07, 653.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 0, 'vial', 371.57, 12, 1471.42, 13733.23);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'ream', 201.14, 12, 1255.11, 11714.39);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00003';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'vial', 69.15, 12, 423.2, 3949.85);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'strip', 10.99, 12, 56.71, 529.28);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00021';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 0, 'prefilled', 376.85, 12, 994.88, 9285.58);
  END IF;


  -- PO 126: H1-SHI-PO-2603-126 → Polymed Medical Devices
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0014';
  v_po_date := '2026-03-03'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-126', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 144804.75, 22858.68, 167663.43, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00021';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 0, 'prefilled', 385.61, 12, 879.19, 8205.78);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'nos', 2610.53, 18, 16446.34, 107814.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'bottle', 40.98, 12, 147.53, 1376.93);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'nos', 1193.34, 12, 5155.23, 48115.47);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 27, 0, 'strip', 71.11, 12, 230.4, 2150.37);
  END IF;


  -- PO 127: H1-SHI-PO-2603-127 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-03-23'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-127', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '7 days', 'normal', 9644.02, 1157.28, 10801.3, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00021';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 9, 'prefilled', 364.01, 12, 393.13, 3669.22);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 18, 'nos', 19.88, 12, 42.94, 400.78);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'nos', 25.54, 12, 140.98, 1315.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 9, 'vial', 417.85, 12, 451.28, 4211.93);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00029';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'strip', 23.88, 12, 128.95, 1203.55);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-127', v_centre_id, v_po_id, v_vendor_id, 2026-03-23::date + interval '3 days', 'verified', 'VINV-0127', 10801.3)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00021'), v_centre_id, 67, 9, 152, v_po_date + interval '3 days', 364.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00058'), v_centre_id, 143, 12, 172, v_po_date + interval '3 days', 19.88)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00056'), v_centre_id, 182, 26, 239, v_po_date + interval '3 days', 25.54)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00008'), v_centre_id, 145, 11, 330, v_po_date + interval '3 days', 417.85)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00029'), v_centre_id, 187, 30, 362, v_po_date + interval '3 days', 23.88)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 128: H1-VAS-PO-2601-128 → Nestlé Health Science India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0023';
  v_po_date := '2026-01-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-128', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 62537.29, 8811.05, 71348.34, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'bottle', 36.49, 12, 126.99, 1185.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'bottle', 341.9, 18, 2830.93, 18558.33);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'nos', 2376.01, 12, 4276.82, 39916.97);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00016';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'strip', 31.88, 12, 110.94, 1035.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00071';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'bottle', 262.99, 18, 1088.78, 7137.55);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00074';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'nos', 65.38, 12, 376.59, 3514.83);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2601-128', v_centre_id, v_po_id, v_vendor_id, 2026-01-16::date + interval '2 days', 'verified', 'VINV-0128', 71348.34)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2601-128', 'VINV-0128', 2026-01-16::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 62537.29, 8811.05, 71348.34, 'matched', 'paid', 71348.34, v_credit_days, (2026-01-16::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 147, 26, 212, v_po_date + interval '3 days', 36.49)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 33,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 19, 6, 273, v_po_date + interval '3 days', 341.9)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00054'), v_centre_id, 145, 10, 589, v_po_date + interval '3 days', 2376.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 33,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00016'), v_centre_id, 100, 17, 331, v_po_date + interval '3 days', 31.88)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00071'), v_centre_id, 14, 19, 547, v_po_date + interval '3 days', 262.99)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 11,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00074'), v_centre_id, 139, 20, 384, v_po_date + interval '3 days', 65.38)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 129: H1-GAN-PO-2602-129 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-02-04'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-129', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 20048.76, 2405.85, 22454.61, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 0, 'pack', 484.92, 12, 2153.04, 20095.08);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'strip', 58.52, 12, 252.81, 2359.53);
  END IF;


  -- PO 130: H1-GAN-PO-2603-130 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-03-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-130', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 23178.5, 2781.42, 25959.92, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'nos', 410.07, 12, 2558.84, 23882.48);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 0, 'bottle', 31.69, 12, 53.24, 496.9);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00046';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 0, 'nos', 94.08, 12, 169.34, 1580.54);
  END IF;


  -- PO 131: H1-SHI-PO-2602-131 → Diversey India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0021';
  v_po_date := '2026-02-14'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-131', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'emergency', 50612.43, 6073.49, 56685.92, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'nos', 1312.25, 12, 5668.92, 52909.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 0, 'ampoule', 42.02, 12, 242.04, 2259);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 0, 'strip', 58.89, 12, 162.54, 1517.01);
  END IF;


  -- PO 132: H1-GAN-PO-2602-132 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-02-20'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-132', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '7 days', 'normal', 440935.71, 70443.18, 511378.89, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'kit', 3531.13, 12, 16101.95, 150284.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 43, 'strip', 31.61, 12, 163.11, 1522.34);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'cartridge', 11687.26, 18, 52592.67, 344774.17);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'box', 277.22, 12, 1397.19, 13040.43);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 40, 'strip', 39.22, 12, 188.26, 1757.06);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2602-132', v_centre_id, v_po_id, v_vendor_id, 2026-02-20::date + interval '5 days', 'verified', 'VINV-0132', 511378.89)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 15;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2602-132', 'VINV-0132', 2026-02-20::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 440935.71, 70443.18, 511378.89, 'mismatch', 'paid', 511378.89, v_credit_days, (2026-02-20::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00067'), v_centre_id, 198, 17, 270, v_po_date + interval '3 days', 3531.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00006'), v_centre_id, 155, 26, 144, v_po_date + interval '3 days', 31.61)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00069'), v_centre_id, 189, 5, 471, v_po_date + interval '3 days', 11687.26)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 52,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00044'), v_centre_id, 99, 31, 552, v_po_date + interval '3 days', 277.22)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00001'), v_centre_id, 77, 18, 419, v_po_date + interval '3 days', 39.22)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 47,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 133: H1-GAN-PO-2602-133 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-02-25'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-133', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 7335.69, 880.28, 8215.97, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 0, 'strip', 45.7, 12, 126.13, 1177.23);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'ampoule', 159.81, 12, 460.25, 4295.69);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00042';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'ampoule', 34.47, 12, 186.14, 1737.29);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 0, 'nos', 89.8, 12, 107.76, 1005.76);
  END IF;


  -- PO 134: H1-SHI-PO-2602-134 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-02-14'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-134', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 208657.39, 15983.47, 224640.86, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 24, 'nos', 93.07, 12, 268.04, 2501.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'bottle', 4781.21, 5, 8128.06, 170689.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'can', 1683.96, 18, 6971.59, 45702.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'ampoule', 16.18, 12, 62.13, 579.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 41, 'nos', 112.53, 12, 553.65, 5167.38);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-134', v_centre_id, v_po_id, v_vendor_id, 2026-02-14::date + interval '8 days', 'verified', 'VINV-0134', 224640.86)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00050'), v_centre_id, 136, 11, 288, v_po_date + interval '3 days', 93.07)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00036'), v_centre_id, 166, 31, 172, v_po_date + interval '3 days', 4781.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00070'), v_centre_id, 46, 27, 161, v_po_date + interval '3 days', 1683.96)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 45,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 84, 24, 500, v_po_date + interval '3 days', 16.18)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 39,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00055'), v_centre_id, 128, 30, 423, v_po_date + interval '3 days', 112.53)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 135: H1-MOD-PO-2602-135 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-02-13'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2602-135', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 123873.1, 21236.82, 145109.92, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'vial', 57.92, 12, 222.41, 2075.85);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 20, 'strip', 63.51, 12, 152.42, 1422.62);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'nos', 2528.59, 18, 19116.14, 125316.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 11, 'strip', 30.02, 12, 39.63, 369.85);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 44, 'strip', 19.63, 12, 103.65, 967.37);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'patch', 953.91, 12, 1602.57, 14957.31);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2602-135', v_centre_id, v_po_id, v_vendor_id, 2026-02-13::date + interval '2 days', 'verified', 'VINV-0135', 145109.92)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00012'), v_centre_id, 146, 6, 585, v_po_date + interval '3 days', 57.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00019'), v_centre_id, 101, 16, 266, v_po_date + interval '3 days', 63.51)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00078'), v_centre_id, 117, 5, 525, v_po_date + interval '3 days', 2528.59)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00023'), v_centre_id, 195, 10, 445, v_po_date + interval '3 days', 30.02)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00011'), v_centre_id, 10, 6, 489, v_po_date + interval '3 days', 19.63)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00018'), v_centre_id, 126, 14, 491, v_po_date + interval '3 days', 953.91)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 136: H1-SHI-PO-2602-136 → Sun Pharmaceutical Distributor
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0004';
  v_po_date := '2026-02-08'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-136', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 27915.16, 5007.06, 32922.22, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'tin', 726.86, 18, 4971.72, 32592.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'ampoule', 24.54, 12, 35.34, 329.82);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-136', v_centre_id, v_po_id, v_vendor_id, 2026-02-08::date + interval '3 days', 'verified', 'VINV-0136', 32922.22)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00075'), v_centre_id, 149, 25, 254, v_po_date + interval '3 days', 726.86)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00039'), v_centre_id, 35, 20, 257, v_po_date + interval '3 days', 24.54)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 52,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 137: H1-GAN-PO-2601-137 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-01-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2601-137', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 62576.52, 7509.18, 70085.7, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 0, 'vial', 1260.94, 12, 7263.01, 67788.13);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'bottle', 52.6, 12, 246.17, 2297.57);
  END IF;


  -- PO 138: H1-SHI-PO-2602-138 → Siemens Healthineers India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0019';
  v_po_date := '2026-02-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-138', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 98061.3, 16748.07, 114809.37, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 0, 'nos', 270.96, 12, 390.18, 3641.7);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 0, 'vial', 434.54, 12, 990.75, 9247.01);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'strip', 34.95, 12, 180.34, 1683.19);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 0, 'bottle', 4369.05, 18, 14942.15, 97954.1);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 0, 'ampoule', 88.64, 12, 244.65, 2283.37);
  END IF;


  -- PO 139: H1-SHI-PO-2603-139 → Zydus Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0001';
  v_po_date := '2026-03-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-139', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 40609.56, 4873.15, 45482.71, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 0, 'patch', 879.02, 12, 4324.78, 40364.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 0, 'bottle', 93.26, 12, 548.37, 5118.11);
  END IF;


  -- PO 140: H1-MOD-PO-2601-140 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-01-20'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-140', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 247774.93, 44105.34, 291880.27, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'ampoule', 44.49, 12, 122.79, 1146.06);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'nos', 43.75, 12, 136.5, 1274);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'ampoule', 88.8, 12, 170.5, 1591.3);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'nos', 310.28, 12, 558.5, 5212.7);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 28, 'kit', 8554.97, 18, 43117.05, 282656.21);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2601-140', v_centre_id, v_po_id, v_vendor_id, 2026-01-20::date + interval '3 days', 'verified', 'VINV-0140', 291880.27)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00017'), v_centre_id, 19, 5, 129, v_po_date + interval '3 days', 44.49)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 46,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00053'), v_centre_id, 53, 9, 294, v_po_date + interval '3 days', 43.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 19,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00025'), v_centre_id, 169, 18, 271, v_po_date + interval '3 days', 88.8)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00051'), v_centre_id, 43, 18, 581, v_po_date + interval '3 days', 310.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00068'), v_centre_id, 82, 15, 405, v_po_date + interval '3 days', 8554.97)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 141: H1-VAS-PO-2602-141 → Philips Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0016';
  v_po_date := '2026-02-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-141', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 30569.42, 3993.88, 34563.3, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'ream', 237.3, 12, 427.14, 3986.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00071';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 20, 'bottle', 271.29, 18, 976.64, 6402.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 11, 'ampoule', 14.32, 12, 18.9, 176.42);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'box', 268.5, 12, 1578.78, 14735.28);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 45, 'ampoule', 183.78, 12, 992.41, 9262.51);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-141', v_centre_id, v_po_id, v_vendor_id, 2026-02-07::date + interval '5 days', 'verified', 'VINV-0141', 34563.3)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 90;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-141', 'VINV-0141', 2026-02-07::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 30569.42, 3993.88, 34563.3, 'matched', 'partial', 17282, v_credit_days, (2026-02-07::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00077'), v_centre_id, 157, 12, 503, v_po_date + interval '3 days', 237.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00071'), v_centre_id, 174, 22, 545, v_po_date + interval '3 days', 271.29)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 119, 14, 160, v_po_date + interval '3 days', 14.32)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00044'), v_centre_id, 95, 26, 167, v_po_date + interval '3 days', 268.5)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 85, 32, 379, v_po_date + interval '3 days', 183.78)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 142: H1-VAS-PO-2603-142 → Siemens Healthineers India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0019';
  v_po_date := '2026-03-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-142', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'emergency', 35444.74, 4253.37, 39698.11, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 0, 'strip', 42.61, 12, 30.68, 286.34);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 0, 'strip', 16.28, 12, 103.54, 966.38);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'patch', 1004.94, 12, 3617.78, 33765.98);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 0, 'bottle', 49.4, 12, 320.11, 2987.71);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00022';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 0, 'vial', 125.87, 12, 181.25, 1691.69);
  END IF;


  -- PO 143: H1-SHI-PO-2603-143 → INOX Air Products Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0028';
  v_po_date := '2026-03-11'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-143', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 62887.03, 7546.44, 70433.47, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 0, 'ampoule', 85.67, 12, 164.49, 1535.21);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 0, 'strip', 39.91, 12, 124.52, 1162.18);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'nos', 1093.73, 12, 3937.43, 36749.33);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 0, 'box', 747.75, 12, 3320.01, 30986.76);
  END IF;


  -- PO 144: H1-MOD-PO-2601-144 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-01-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-144', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 236659.3, 41803.24, 278462.54, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'strip', 58.58, 12, 358.51, 3346.09);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00044';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'box', 285.27, 12, 1232.37, 11502.09);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'bottle', 4468.04, 18, 40212.36, 263614.36);
  END IF;


  -- PO 145: H1-SHI-PO-2602-145 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-02-09'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-145', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 10792.92, 1295.15, 12088.07, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'strip', 42.62, 12, 230.15, 2148.05);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'ampoule', 174.02, 12, 1065, 9940.02);
  END IF;


  -- PO 146: H1-MOD-PO-2602-146 → Diversey India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0021';
  v_po_date := '2026-02-02'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2602-146', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 98871.55, 11864.59, 110736.14, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'strip', 34.26, 12, 209.67, 1956.93);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 0, 'strip', 12.35, 12, 74.1, 691.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'kit', 3176.27, 12, 11434.57, 106722.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00046';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 0, 'nos', 89.64, 12, 64.54, 602.38);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 0, 'strip', 75.65, 12, 81.7, 762.55);
  END IF;


  -- PO 147: H1-GAN-PO-2603-147 → Cipla Gujarat Division
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0007';
  v_po_date := '2026-03-15'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-147', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 96599.89, 11707.01, 108306.9, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 0, 'pack', 112.77, 18, 345.08, 2262.17);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 0, 'strip', 130.32, 12, 828.84, 7735.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'ampoule', 40.75, 12, 249.39, 2327.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 0, 'vial', 436.43, 12, 1518.78, 14175.25);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00052';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'nos', 2028.92, 12, 8764.93, 81806.05);
  END IF;


  -- PO 148: H1-SHI-PO-2601-148 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-01-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-148', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '7 days', 'normal', 39552, 4746.24, 44298.24, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00057';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'nos', 19.94, 12, 62.21, 580.65);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'box', 813.53, 12, 4100.19, 38268.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00077';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'ream', 221.15, 12, 583.84, 5449.14);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-148', v_centre_id, v_po_id, v_vendor_id, 2026-01-27::date + interval '3 days', 'verified', 'VINV-0148', 44298.24)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00057'), v_centre_id, 200, 12, 499, v_po_date + interval '3 days', 19.94)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 57,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00066'), v_centre_id, 134, 30, 301, v_po_date + interval '3 days', 813.53)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00077'), v_centre_id, 137, 34, 292, v_po_date + interval '3 days', 221.15)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 46,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 149: H1-VAS-PO-2602-149 → Medtronic India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0010';
  v_po_date := '2026-02-10'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-149', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 38135.42, 4576.25, 42711.67, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 39, 'pack', 475.23, 12, 2224.08, 20758.05);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'strip', 26.66, 12, 108.77, 1015.21);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00074';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 51, 'nos', 59.08, 12, 361.57, 3374.65);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'nos', 475.21, 12, 1881.83, 17563.76);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-149', v_centre_id, v_po_id, v_vendor_id, 2026-02-10::date + interval '5 days', 'verified', 'VINV-0149', 42711.67)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-149', 'VINV-0149', 2026-02-10::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 38135.42, 4576.25, 42711.67, 'matched', 'paid', 42711.67, v_credit_days, (2026-02-10::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 40, 10, 399, v_po_date + interval '3 days', 475.23)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00023'), v_centre_id, 121, 21, 531, v_po_date + interval '3 days', 26.66)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 33,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00074'), v_centre_id, 116, 18, 575, v_po_date + interval '3 days', 59.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 177, 7, 205, v_po_date + interval '3 days', 475.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 30,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 150: H1-SHI-PO-2603-150 → Mindray Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0015';
  v_po_date := '2026-03-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-150', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'urgent', 10159.94, 1219.19, 11379.13, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 0, 'ampoule', 86.37, 12, 62.19, 580.41);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 0, 'vial', 54.94, 12, 191.19, 1784.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 0, 'vial', 383.26, 12, 965.82, 9014.28);
  END IF;


  -- PO 151: H1-SHI-PO-2603-151 → Intas Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0003';
  v_po_date := '2026-03-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-151', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 8284.05, 994.09, 9278.14, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'strip', 51.74, 12, 86.92, 811.28);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'nos', 123.57, 12, 771.08, 7196.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'ampoule', 42.02, 12, 110.93, 1035.37);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 9, 'ampoule', 23.29, 12, 25.15, 234.76);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-151', v_centre_id, v_po_id, v_vendor_id, 2026-03-28::date + interval '5 days', 'verified', 'VINV-0151', 9278.14)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-151', 'VINV-0151', 2026-03-28::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 8284.05, 994.09, 9278.14, 'matched', 'paid', 9278.14, v_credit_days, (2026-03-28::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00020'), v_centre_id, 158, 28, 391, v_po_date + interval '3 days', 51.74)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 21,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00055'), v_centre_id, 71, 32, 577, v_po_date + interval '3 days', 123.57)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 59,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00026'), v_centre_id, 55, 10, 375, v_po_date + interval '3 days', 42.02)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00039'), v_centre_id, 91, 5, 470, v_po_date + interval '3 days', 23.29)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 152: H1-GAN-PO-2601-152 → Johnson & Johnson Medical Indi
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0009';
  v_po_date := '2026-01-05'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2601-152', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 250690.07, 42700.37, 293390.44, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'nos', 1107.46, 12, 3986.86, 37210.66);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00074';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 0, 'nos', 70.6, 12, 449.02, 4190.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'strip', 71.32, 12, 308.1, 2875.62);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 0, 'kit', 8411.71, 18, 37852.7, 248145.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 0, 'strip', 12.9, 12, 52.63, 491.23);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 0, 'ampoule', 42.56, 12, 51.07, 476.67);
  END IF;


  -- PO 153: H1-GAN-PO-2602-153 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-02-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-153', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 54895.7, 6587.48, 61483.18, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'strip', 28.14, 12, 16.88, 157.58);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00004';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 11, 'vial', 829.39, 12, 1094.79, 10218.08);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 44, 'patch', 904.99, 12, 4778.35, 44597.91);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00029';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'strip', 22.69, 12, 57.18, 533.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 44, 'nos', 30.5, 12, 161.04, 1503.04);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00049';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'nos', 181.53, 12, 479.24, 4472.9);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2602-153', v_centre_id, v_po_id, v_vendor_id, 2026-02-07::date + interval '4 days', 'verified', 'VINV-0153', 61483.18)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2602-153', 'VINV-0153', 2026-02-07::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 54895.7, 6587.48, 61483.18, 'matched', 'unpaid', 0, v_credit_days, (2026-02-07::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00023'), v_centre_id, 106, 24, 265, v_po_date + interval '3 days', 28.14)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00004'), v_centre_id, 30, 30, 258, v_po_date + interval '3 days', 829.39)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00018'), v_centre_id, 56, 10, 104, v_po_date + interval '3 days', 904.99)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00029'), v_centre_id, 113, 22, 359, v_po_date + interval '3 days', 22.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00056'), v_centre_id, 85, 5, 580, v_po_date + interval '3 days', 30.5)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00049'), v_centre_id, 33, 13, 461, v_po_date + interval '3 days', 181.53)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 154: H1-GAN-PO-2601-154 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-01-05'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2601-154', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 186892.86, 11299.62, 198192.48, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 5, 'strip', 12.92, 12, 7.75, 72.35);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00028';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 50, 'strip', 93.17, 12, 559.02, 5217.52);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'bottle', 4183.28, 5, 7948.23, 166912.87);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'vial', 387.58, 12, 1348.78, 12588.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'ampoule', 172.51, 12, 1076.46, 10046.98);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'ampoule', 80.94, 12, 359.37, 3354.15);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2601-154', v_centre_id, v_po_id, v_vendor_id, 2026-01-05::date + interval '3 days', 'verified', 'VINV-0154', 198192.48)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 76, 5, 332, v_po_date + interval '3 days', 12.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00028'), v_centre_id, 191, 12, 254, v_po_date + interval '3 days', 93.17)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00036'), v_centre_id, 38, 14, 355, v_po_date + interval '3 days', 4183.28)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 33,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00008'), v_centre_id, 41, 13, 141, v_po_date + interval '3 days', 387.58)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 21,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00027'), v_centre_id, 193, 7, 372, v_po_date + interval '3 days', 172.51)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00025'), v_centre_id, 14, 6, 118, v_po_date + interval '3 days', 80.94)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 155: H1-SHI-PO-2601-155 → GE Healthcare India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0017';
  v_po_date := '2026-01-09'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-155', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 95487.69, 11458.52, 106946.21, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'kit', 3313.51, 12, 10338.15, 96489.41);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'strip', 18.73, 12, 121.37, 1132.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 7, 'vial', 353.73, 12, 297.13, 2773.24);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'box', 127.15, 12, 701.87, 6550.77);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-155', v_centre_id, v_po_id, v_vendor_id, 2026-01-09::date + interval '7 days', 'verified', 'VINV-0155', 106946.21)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00067'), v_centre_id, 83, 27, 203, v_po_date + interval '3 days', 3313.51)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 14,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00011'), v_centre_id, 159, 23, 401, v_po_date + interval '3 days', 18.73)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 13,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00008'), v_centre_id, 85, 12, 446, v_po_date + interval '3 days', 353.73)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00047'), v_centre_id, 160, 9, 382, v_po_date + interval '3 days', 127.15)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 13,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 156: H1-SHI-PO-2603-156 → Johnson & Johnson Medical Indi
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0009';
  v_po_date := '2026-03-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-156', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 33638.75, 4036.65, 37675.4, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'ampoule', 24.41, 12, 125.96, 1175.59);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00046';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'nos', 100.45, 12, 433.94, 4050.14);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 0, 'nos', 405.46, 12, 2335.45, 21797.53);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 0, 'ampoule', 186.18, 12, 938.35, 8757.91);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 0, 'nos', 281.88, 12, 202.95, 1894.23);
  END IF;


  -- PO 157: H1-UDA-PO-2601-157 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-01-19'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-157', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 49533.4, 6160.97, 55694.37, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 31, 31, 'vial', 1248.44, 12, 4644.2, 43345.84);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 39, 'nos', 100.76, 12, 471.56, 4401.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'pack', 113, 18, 650.88, 4266.88);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'ampoule', 41.31, 12, 148.72, 1388.02);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00002';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'strip', 70.58, 12, 245.62, 2292.44);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2601-157', v_centre_id, v_po_id, v_vendor_id, 2026-01-19::date + interval '6 days', 'verified', 'VINV-0157', 55694.37)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00009'), v_centre_id, 49, 33, 164, v_po_date + interval '3 days', 1248.44)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 31,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00050'), v_centre_id, 106, 26, 586, v_po_date + interval '3 days', 100.76)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 49,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00072'), v_centre_id, 47, 11, 361, v_po_date + interval '3 days', 113)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00017'), v_centre_id, 16, 6, 525, v_po_date + interval '3 days', 41.31)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00002'), v_centre_id, 192, 33, 327, v_po_date + interval '3 days', 70.58)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 158: H1-VAS-PO-2602-158 → Polymed Medical Devices
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0014';
  v_po_date := '2026-02-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-158', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'emergency', 1786071.13, 101559.52, 1887630.65, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 0, 'nos', 2937.91, 18, 3172.94, 20800.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'bottle', 48.75, 12, 263.25, 2457);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00067';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'kit', 3796.56, 12, 16401.14, 153077.3);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 0, 'vial', 55.3, 12, 185.81, 1734.21);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 0, 'bottle', 41.96, 12, 231.62, 2161.78);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00064';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 0, 'nos', 81304.76, 5, 81304.76, 1707399.96);
  END IF;


  -- PO 159: H1-VAS-PO-2602-159 → Medtronic India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0010';
  v_po_date := '2026-02-03'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-159', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'urgent', 3972.72, 476.73, 4449.45, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00042';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'ampoule', 35.32, 12, 59.34, 553.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00032';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'bottle', 30.66, 12, 125.09, 1167.53);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'strip', 64.1, 12, 292.3, 2728.1);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-159', v_centre_id, v_po_id, v_vendor_id, 2026-02-03::date + interval '3 days', 'verified', 'VINV-0159', 4449.45)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-159', 'VINV-0159', 2026-02-03::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 3972.72, 476.73, 4449.45, 'matched', 'paid', 4449.45, v_credit_days, (2026-02-03::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00042'), v_centre_id, 149, 23, 421, v_po_date + interval '3 days', 35.32)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00032'), v_centre_id, 203, 31, 362, v_po_date + interval '3 days', 30.66)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 92, 12, 409, v_po_date + interval '3 days', 64.1)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 160: H1-UDA-PO-2602-160 → Transasia Bio-Medicals
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0020';
  v_po_date := '2026-02-13'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-160', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 2526.32, 303.16, 2829.48, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'ampoule', 15.15, 12, 43.63, 407.23);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00041';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 0, 'ampoule', 50, 12, 150, 1400);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00016';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'strip', 38.03, 12, 109.53, 1022.25);
  END IF;


  -- PO 161: H1-SHI-PO-2601-161 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-01-08'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-161', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 49843.35, 5981.2, 55824.55, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00004';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'vial', 930.49, 12, 5694.6, 53149.59);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 0, 'strip', 25.54, 12, 162.43, 1516.05);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00032';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 0, 'bottle', 27.23, 12, 124.17, 1158.91);
  END IF;


  -- PO 162: H1-SHI-PO-2603-162 → Intas Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0003';
  v_po_date := '2026-03-03'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-162', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 6325.92, 759.11, 7085.03, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00022';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'vial', 115.92, 12, 361.67, 3375.59);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00074';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'nos', 69, 12, 397.44, 3709.44);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-162', v_centre_id, v_po_id, v_vendor_id, 2026-03-03::date + interval '6 days', 'verified', 'VINV-0162', 7085.03)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-162', 'VINV-0162', 2026-03-03::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 6325.92, 759.11, 7085.03, 'matched', 'partial', 3543, v_credit_days, (2026-03-03::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00022'), v_centre_id, 156, 17, 306, v_po_date + interval '3 days', 115.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00074'), v_centre_id, 114, 11, 552, v_po_date + interval '3 days', 69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 10,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 163: H1-SHI-PO-2602-163 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-02-19'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-163', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '7 days', 'normal', 314820.77, 50203.71, 365024.48, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00028';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 33, 'strip', 77.33, 12, 306.23, 2858.12);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 41, 41, 'nos', 314.1, 12, 1545.37, 14423.47);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'nos', 9230.39, 12, 11076.47, 103380.37);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 52, 'bottle', 3982.44, 18, 37275.64, 244362.52);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-163', v_centre_id, v_po_id, v_vendor_id, 2026-02-19::date + interval '2 days', 'verified', 'VINV-0163', 365024.48)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00028'), v_centre_id, 37, 11, 307, v_po_date + interval '3 days', 77.33)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 10,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00051'), v_centre_id, 21, 20, 446, v_po_date + interval '3 days', 314.1)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00061'), v_centre_id, 123, 14, 527, v_po_date + interval '3 days', 9230.39)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 32, 30, 181, v_po_date + interval '3 days', 3982.44)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 164: H1-VAS-PO-2603-164 → Sun Pharmaceutical Distributor
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0004';
  v_po_date := '2026-03-11'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-164', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 46413.94, 8152.99, 54566.93, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 44, 0, 'bottle', 346.61, 18, 2745.15, 17995.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00035';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'bottle', 48.56, 12, 303.01, 2828.13);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 0, 'ampoule', 37.89, 12, 100.03, 933.61);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 0, 'tin', 695.11, 18, 5004.79, 32809.19);
  END IF;


  -- PO 165: H1-SHI-PO-2603-165 → B Braun Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0012';
  v_po_date := '2026-03-25'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-165', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 4210041.56, 214014.21, 4424055.77, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00064';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'nos', 90935.33, 5, 209151.26, 4392176.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'bottle', 4502.73, 18, 4862.95, 31879.33);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-165', v_centre_id, v_po_id, v_vendor_id, 2026-03-25::date + interval '4 days', 'verified', 'VINV-0165', 4424055.77)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-165', 'VINV-0165', 2026-03-25::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 4210041.56, 214014.21, 4424055.77, 'matched', 'paid', 4424055.77, v_credit_days, (2026-03-25::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00064'), v_centre_id, 10, 6, 530, v_po_date + interval '3 days', 90935.33)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 48,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 58, 11, 224, v_po_date + interval '3 days', 4502.73)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 166: H1-MOD-PO-2602-166 → Zydus Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0001';
  v_po_date := '2026-02-23'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2602-166', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'emergency', 231958.38, 40983.54, 272941.92, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00071';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 0, 'bottle', 259.35, 18, 1353.81, 8874.96);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 0, 'strip', 292.11, 12, 1121.7, 10469.22);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 0, 'cartridge', 11756.73, 18, 38091.81, 249712.95);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'nos', 27.47, 12, 128.56, 1199.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 0, 'strip', 133.18, 12, 287.67, 2684.91);
  END IF;


  -- PO 167: H1-GAN-PO-2602-167 → Cadila Healthcare Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0005';
  v_po_date := '2026-02-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-167', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'urgent', 971958.86, 69314.65, 1041273.51, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 0, 'nos', 40.77, 12, 264.19, 2465.77);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00062';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 0, 'nos', 1273.5, 12, 3209.22, 29952.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 0, 'strip', 12.69, 12, 18.27, 170.55);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00060';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 0, 'nos', 28524.17, 5, 39933.84, 838610.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 0, 'bottle', 4089.03, 18, 25760.89, 168876.94);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 0, 'ampoule', 152.67, 12, 128.24, 1196.93);
  END IF;


  -- PO 168: H1-SHI-PO-2601-168 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-01-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-168', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '7 days', 'normal', 277839.59, 45895.23, 323734.82, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 53, 'bottle', 3947.95, 18, 37663.44, 246904.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 40, 'patch', 936.04, 12, 4492.99, 41934.59);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 12, 'nos', 456.92, 12, 657.96, 6141);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00008';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 15, 15, 'vial', 409.51, 12, 737.12, 6879.77);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 7, 'strip', 69.45, 12, 58.34, 544.49);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 40, 'pack', 476.12, 12, 2285.38, 21330.18);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-168', v_centre_id, v_po_id, v_vendor_id, 2026-01-28::date + interval '6 days', 'verified', 'VINV-0168', 323734.82)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 15;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2601-168', 'VINV-0168', 2026-01-28::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 277839.59, 45895.23, 323734.82, 'partial_match', 'partial', 161867, v_credit_days, (2026-01-28::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 189, 10, 222, v_po_date + interval '3 days', 3947.95)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00018'), v_centre_id, 189, 19, 226, v_po_date + interval '3 days', 936.04)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 84, 32, 281, v_po_date + interval '3 days', 456.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00008'), v_centre_id, 166, 22, 354, v_po_date + interval '3 days', 409.51)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 70, 28, 218, v_po_date + interval '3 days', 69.45)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 52,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 147, 23, 521, v_po_date + interval '3 days', 476.12)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 56,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 169: H1-VAS-PO-2601-169 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-01-03'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-169', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 33513.39, 4021.61, 37535, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 0, 'bottle', 30.68, 12, 51.54, 481.06);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00073';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 0, 'nos', 365.85, 12, 1273.16, 11882.81);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 0, 'patch', 977.14, 12, 2696.91, 25171.13);
  END IF;


  -- PO 170: H1-UDA-PO-2601-170 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-01-10'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-170', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 133849.07, 16061.89, 149910.96, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 39, 'strip', 315.49, 12, 1476.49, 13780.6);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00052';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 40, 'nos', 1906.75, 12, 9152.4, 85422.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'nos', 23.69, 12, 130.77, 1220.51);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00034';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 40, 'bottle', 31.76, 12, 152.45, 1422.85);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'vial', 1159.86, 12, 5149.78, 48064.6);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2601-170', v_centre_id, v_po_id, v_vendor_id, 2026-01-10::date + interval '5 days', 'verified', 'VINV-0170', 149910.96)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-UDA-INV-2601-170', 'VINV-0170', 2026-01-10::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 133849.07, 16061.89, 149910.96, 'matched', 'partial', 74955, v_credit_days, (2026-01-10::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00010'), v_centre_id, 183, 7, 580, v_po_date + interval '3 days', 315.49)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00052'), v_centre_id, 186, 20, 108, v_po_date + interval '3 days', 1906.75)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00058'), v_centre_id, 28, 21, 486, v_po_date + interval '3 days', 23.69)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00034'), v_centre_id, 136, 24, 433, v_po_date + interval '3 days', 31.76)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00009'), v_centre_id, 54, 28, 124, v_po_date + interval '3 days', 1159.86)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 55,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 171: H1-UDA-PO-2602-171 → Siemens Healthineers India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0019';
  v_po_date := '2026-02-06'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2602-171', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 14515.42, 1741.85, 16257.27, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'strip', 12.92, 12, 34.11, 318.35);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 40, 'nos', 29.89, 12, 143.47, 1339.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 10, 10, 'patch', 876.25, 12, 1051.5, 9814);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00048';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'nos', 305.22, 12, 512.77, 4785.85);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-UDA-GRN-2602-171', v_centre_id, v_po_id, v_vendor_id, 2026-02-06::date + interval '4 days', 'verified', 'VINV-0171', 16257.27)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-UDA-INV-2602-171', 'VINV-0171', 2026-02-06::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 14515.42, 1741.85, 16257.27, 'partial_match', 'unpaid', 0, v_credit_days, (2026-02-06::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 95, 10, 170, v_po_date + interval '3 days', 12.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 47,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00056'), v_centre_id, 205, 20, 177, v_po_date + interval '3 days', 29.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 15,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00018'), v_centre_id, 33, 30, 513, v_po_date + interval '3 days', 876.25)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 51,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00048'), v_centre_id, 78, 32, 349, v_po_date + interval '3 days', 305.22)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 172: H1-GAN-PO-2602-172 → Alembic Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0006';
  v_po_date := '2026-02-20'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2602-172', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'emergency', 154051.6, 19826.62, 173878.22, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'vial', 452.3, 12, 2333.87, 21782.77);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 0, 'strip', 308.74, 12, 926.22, 8644.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 12, 0, 'can', 1861.71, 18, 4021.29, 26361.81);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 0, 'strip', 29.12, 12, 27.96, 260.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00003';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 0, 'vial', 63.64, 12, 213.83, 1995.75);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 11, 0, 'nos', 9320.8, 12, 12303.46, 114832.26);
  END IF;


  -- PO 173: H1-VAS-PO-2602-173 → Polymed Medical Devices
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0014';
  v_po_date := '2026-02-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-173', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 10435.8, 1252.3, 11688.1, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'box', 735, 12, 529.2, 4939.2);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 24, 'ampoule', 178.06, 12, 512.81, 4786.25);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 17, 'nos', 103.08, 12, 210.28, 1962.64);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-173', v_centre_id, v_po_id, v_vendor_id, 2026-02-16::date + interval '4 days', 'verified', 'VINV-0173', 11688.1)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-173', 'VINV-0173', 2026-02-16::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 10435.8, 1252.3, 11688.1, 'partial_match', 'unpaid', 0, v_credit_days, (2026-02-16::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00066'), v_centre_id, 175, 17, 378, v_po_date + interval '3 days', 735)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 109, 18, 326, v_po_date + interval '3 days', 178.06)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 16,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00050'), v_centre_id, 88, 25, 226, v_po_date + interval '3 days', 103.08)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 47,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 174: H1-VAS-PO-2601-174 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-01-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2601-174', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'urgent', 25247.42, 3029.69, 28277.11, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'strip', 16.31, 12, 68.5, 639.35);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00016';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'strip', 38.33, 12, 165.59, 1545.47);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 47, 'strip', 300.11, 12, 1692.62, 15797.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00021';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'prefilled', 353.52, 12, 1102.98, 10294.5);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2601-174', v_centre_id, v_po_id, v_vendor_id, 2026-01-07::date + interval '8 days', 'verified', 'VINV-0174', 28277.11)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2601-174', 'VINV-0174', 2026-01-07::date + interval '8 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 25247.42, 3029.69, 28277.11, 'matched', 'partial', 14139, v_credit_days, (2026-01-07::date + interval '8 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00011'), v_centre_id, 72, 26, 489, v_po_date + interval '3 days', 16.31)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00016'), v_centre_id, 31, 22, 158, v_po_date + interval '3 days', 38.33)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 22,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00010'), v_centre_id, 85, 6, 341, v_po_date + interval '3 days', 300.11)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00021'), v_centre_id, 66, 8, 511, v_po_date + interval '3 days', 353.52)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 175: H1-GAN-PO-2603-175 → Alembic Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0006';
  v_po_date := '2026-03-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-175', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 140730.46, 16887.66, 157618.12, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00063';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'nos', 3815, 12, 16480.8, 153820.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 49, 'strip', 13, 12, 76.44, 713.44);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'nos', 47.47, 12, 45.57, 425.33);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00019';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'strip', 67.82, 12, 284.84, 2658.54);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2603-175', v_centre_id, v_po_id, v_vendor_id, 2026-03-27::date + interval '3 days', 'verified', 'VINV-0175', 157618.12)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2603-175', 'VINV-0175', 2026-03-27::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 140730.46, 16887.66, 157618.12, 'partial_match', 'unpaid', 0, v_credit_days, (2026-03-27::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00063'), v_centre_id, 206, 11, 281, v_po_date + interval '3 days', 3815)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 44, 20, 593, v_po_date + interval '3 days', 13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00053'), v_centre_id, 18, 16, 235, v_po_date + interval '3 days', 47.47)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 26,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00019'), v_centre_id, 197, 22, 583, v_po_date + interval '3 days', 67.82)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 176: H1-VAS-PO-2602-176 → Mindray Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0015';
  v_po_date := '2026-02-25'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-176', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'emergency', 185906.56, 10037.98, 195944.54, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 0, 'box', 116.65, 12, 755.89, 7054.99);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 0, 'strip', 25.29, 12, 63.73, 594.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 39, 0, 'bottle', 4494.8, 5, 8764.86, 184062.06);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 0, 'nos', 104.08, 12, 212.32, 1981.68);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00042';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 0, 'ampoule', 36.99, 12, 213.06, 1988.58);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 0, 'strip', 33.47, 12, 28.11, 262.4);
  END IF;


  -- PO 177: H1-SHI-PO-2603-177 → Cipla Gujarat Division
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0007';
  v_po_date := '2026-03-10'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-177', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 18296.34, 2195.56, 20491.9, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00050';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'nos', 88.06, 12, 570.63, 5325.87);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00040';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'ampoule', 202.57, 12, 1118.19, 10436.41);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00039';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'ampoule', 23.48, 12, 129.61, 1209.69);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00014';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 36, 'bottle', 87.3, 12, 377.14, 3519.94);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-177', v_centre_id, v_po_id, v_vendor_id, 2026-03-10::date + interval '4 days', 'verified', 'VINV-0177', 20491.9)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00050'), v_centre_id, 63, 10, 114, v_po_date + interval '3 days', 88.06)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 16,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00040'), v_centre_id, 34, 8, 137, v_po_date + interval '3 days', 202.57)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00039'), v_centre_id, 203, 16, 171, v_po_date + interval '3 days', 23.48)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 51,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00014'), v_centre_id, 159, 9, 545, v_po_date + interval '3 days', 87.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 178: H1-SHI-PO-2603-178 → Nestlé Health Science India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0023';
  v_po_date := '2026-03-22'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-178', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 2645.12, 317.41, 2962.53, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 36, 0, 'strip', 44.67, 12, 192.97, 1801.09);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 0, 'bottle', 30.5, 12, 124.44, 1161.44);
  END IF;


  -- PO 179: H1-VAS-PO-2603-179 → Diversey India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0021';
  v_po_date := '2026-03-27'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-179', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 108272.32, 17278.41, 125550.73, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 50, 'ampoule', 14.55, 12, 87.3, 814.8);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'nos', 441.53, 12, 1536.52, 14340.89);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 24, 'nos', 2976.2, 18, 12857.18, 84285.98);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00024';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 28, 28, 'strip', 45.99, 12, 154.53, 1442.25);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 47, 'vial', 437.99, 12, 2470.26, 23055.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 40, 40, 'strip', 35.96, 12, 172.61, 1611.01);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2603-179', v_centre_id, v_po_id, v_vendor_id, 2026-03-27::date + interval '7 days', 'verified', 'VINV-0179', 125550.73)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00015'), v_centre_id, 152, 9, 298, v_po_date + interval '3 days', 14.55)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 31,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 181, 12, 327, v_po_date + interval '3 days', 441.53)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00078'), v_centre_id, 15, 22, 428, v_po_date + interval '3 days', 2976.2)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00024'), v_centre_id, 115, 19, 231, v_po_date + interval '3 days', 45.99)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00005'), v_centre_id, 130, 33, 261, v_po_date + interval '3 days', 437.99)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 17,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00006'), v_centre_id, 101, 32, 249, v_po_date + interval '3 days', 35.96)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 180: H1-SHI-PO-2601-180 → Navneet Education Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0027';
  v_po_date := '2026-01-25'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-180', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '7 days', 'normal', 53883.26, 6465.99, 60349.25, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'ampoule', 181.21, 12, 1000.28, 9335.94);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00006';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'strip', 35.3, 12, 33.89, 316.29);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00054';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 20, 'nos', 2263.26, 12, 5431.82, 50697.02);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-180', v_centre_id, v_po_id, v_vendor_id, 2026-01-25::date + interval '8 days', 'verified', 'VINV-0180', 60349.25)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00037'), v_centre_id, 100, 25, 534, v_po_date + interval '3 days', 181.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00006'), v_centre_id, 151, 29, 435, v_po_date + interval '3 days', 35.3)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00054'), v_centre_id, 201, 22, 509, v_po_date + interval '3 days', 2263.26)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 51,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 181: H1-SHI-PO-2603-181 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-03-08'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-181', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 15742.5, 1889.1, 17631.6, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00059';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'nos', 438.05, 12, 420.53, 3924.93);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00010';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 35, 35, 'strip', 349.66, 12, 1468.57, 13706.67);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-181', v_centre_id, v_po_id, v_vendor_id, 2026-03-08::date + interval '5 days', 'verified', 'VINV-0181', 17631.6)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-181', 'VINV-0181', 2026-03-08::date + interval '5 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 15742.5, 1889.1, 17631.6, 'mismatch', 'paid', 17631.6, v_credit_days, (2026-03-08::date + interval '5 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00059'), v_centre_id, 15, 34, 481, v_po_date + interval '3 days', 438.05)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 36,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00010'), v_centre_id, 149, 14, 384, v_po_date + interval '3 days', 349.66)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 182: H1-GAN-PO-2603-182 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-03-07'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-182', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 258893.1, 15161.12, 274054.22, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00036';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 48, 'bottle', 4856.37, 5, 11655.29, 244761.05);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00040';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 50, 50, 'ampoule', 199.13, 12, 1194.78, 11151.28);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'bottle', 311.63, 18, 1234.05, 8089.91);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'nos', 326.18, 12, 900.26, 8402.4);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'nos', 24.13, 12, 75.29, 702.67);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00057';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'nos', 20.13, 12, 101.46, 946.92);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2603-182', v_centre_id, v_po_id, v_vendor_id, 2026-03-07::date + interval '6 days', 'verified', 'VINV-0182', 274054.22)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2603-182', 'VINV-0182', 2026-03-07::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 258893.1, 15161.12, 274054.22, 'mismatch', 'unpaid', 0, v_credit_days, (2026-03-07::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00036'), v_centre_id, 40, 11, 188, v_po_date + interval '3 days', 4856.37)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00040'), v_centre_id, 51, 14, 415, v_po_date + interval '3 days', 199.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 56,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 185, 32, 515, v_po_date + interval '3 days', 311.63)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 45,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00051'), v_centre_id, 137, 16, 142, v_po_date + interval '3 days', 326.18)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 47,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00058'), v_centre_id, 41, 17, 464, v_po_date + interval '3 days', 24.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 41,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00057'), v_centre_id, 183, 27, 358, v_po_date + interval '3 days', 20.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 183: H1-VAS-PO-2602-183 → Diversey India Pvt Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0021';
  v_po_date := '2026-02-22'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2602-183', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 132806.38, 23536.14, 156342.52, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'bottle', 3958.01, 18, 22798.14, 149454.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'pack', 439.29, 12, 738.01, 6888.07);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2602-183', v_centre_id, v_po_id, v_vendor_id, 2026-02-22::date + interval '6 days', 'verified', 'VINV-0183', 156342.52)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2602-183', 'VINV-0183', 2026-02-22::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 132806.38, 23536.14, 156342.52, 'partial_match', 'paid', 156342.52, v_credit_days, (2026-02-22::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 115, 5, 229, v_po_date + interval '3 days', 3958.01)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 51,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 22, 7, 532, v_po_date + interval '3 days', 439.29)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 24,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 184: H1-SHI-PO-2603-184 → Roche Diagnostics India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0018';
  v_po_date := '2026-03-16'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-184', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 10124.79, 1718.67, 11843.46, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 13, 'ampoule', 38.21, 12, 59.61, 556.34);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00023';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 30, 'strip', 29.65, 12, 106.74, 996.24);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 26, 26, 'bottle', 322.88, 18, 1511.08, 9905.96);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00029';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'strip', 21.48, 12, 41.24, 384.92);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2603-184', v_centre_id, v_po_id, v_vendor_id, 2026-03-16::date + interval '6 days', 'verified', 'VINV-0184', 11843.46)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 60;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2603-184', 'VINV-0184', 2026-03-16::date + interval '6 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 10124.79, 1718.67, 11843.46, 'matched', 'paid', 11843.46, v_credit_days, (2026-03-16::date + interval '6 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00017'), v_centre_id, 120, 29, 520, v_po_date + interval '3 days', 38.21)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 25,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00023'), v_centre_id, 202, 31, 369, v_po_date + interval '3 days', 29.65)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 40,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 195, 33, 559, v_po_date + interval '3 days', 322.88)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 11,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00029'), v_centre_id, 65, 17, 432, v_po_date + interval '3 days', 21.48)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 10,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 185: H1-GAN-PO-2603-185 → Dr Reddy's Laboratories Agency
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0008';
  v_po_date := '2026-03-10'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2603-185', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'urgent', 3728637.21, 212003.71, 3940640.92, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00064';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 38, 'nos', 92682.36, 5, 176096.48, 3698026.16);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 32, 'bottle', 46.98, 12, 180.4, 1683.76);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 17, 'cartridge', 10884.63, 18, 33306.97, 218345.68);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 13, 'ampoule', 45.86, 12, 71.54, 667.72);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 21, 'box', 728.34, 12, 1835.42, 17130.56);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'strip', 125.71, 12, 512.9, 4787.04);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-GAN-GRN-2603-185', v_centre_id, v_po_id, v_vendor_id, 2026-03-10::date + interval '4 days', 'verified', 'VINV-0185', 3940640.92)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-GAN-INV-2603-185', 'VINV-0185', 2026-03-10::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 3728637.21, 212003.71, 3940640.92, 'matched', 'paid', 3940640.92, v_credit_days, (2026-03-10::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00064'), v_centre_id, 195, 17, 412, v_po_date + interval '3 days', 92682.36)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 32,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00031'), v_centre_id, 108, 21, 310, v_po_date + interval '3 days', 46.98)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 28,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00069'), v_centre_id, 132, 30, 534, v_po_date + interval '3 days', 10884.63)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00026'), v_centre_id, 110, 34, 275, v_po_date + interval '3 days', 45.86)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00066'), v_centre_id, 185, 13, 522, v_po_date + interval '3 days', 728.34)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 47,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00007'), v_centre_id, 45, 20, 301, v_po_date + interval '3 days', 125.71)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 31,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 186: H1-SHI-PO-2601-186 → Polymed Medical Devices
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0014';
  v_po_date := '2026-01-20'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-186', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 70149.97, 12338.89, 82488.86, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00028';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'strip', 88.92, 12, 576.2, 5377.88);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00078';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'nos', 2841.23, 18, 11762.69, 77110.98);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-186', v_centre_id, v_po_id, v_vendor_id, 2026-01-20::date + interval '3 days', 'verified', 'VINV-0186', 82488.86)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 30;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2601-186', 'VINV-0186', 2026-01-20::date + interval '3 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 70149.97, 12338.89, 82488.86, 'matched', 'unpaid', 0, v_credit_days, (2026-01-20::date + interval '3 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00028'), v_centre_id, 178, 17, 579, v_po_date + interval '3 days', 88.92)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 12,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00078'), v_centre_id, 17, 24, 313, v_po_date + interval '3 days', 2841.23)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 54,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 187: H1-SHI-PO-2602-187 → Satguru Enterprises
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0022';
  v_po_date := '2026-02-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-187', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '7 days', 'urgent', 127219.18, 21118.09, 148337.27, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00058';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 0, 'nos', 20.92, 12, 80.33, 749.77);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00018';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'patch', 916.83, 12, 2640.47, 24644.39);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 0, 'bottle', 4433.17, 18, 17555.35, 115085.09);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 0, 'strip', 19.12, 12, 11.47, 107.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 0, 'ampoule', 85.76, 12, 391.07, 3649.95);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 0, 'ampoule', 183.08, 12, 439.39, 4100.99);
  END IF;


  -- PO 188: H1-GAN-PO-2601-188 → Romsons International
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0013';
  v_po_date := '2026-01-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2601-188', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 39224.36, 4706.92, 43931.28, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00047';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 0, 'box', 111.68, 12, 629.88, 5878.84);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 0, 'nos', 123.82, 12, 193.16, 1802.82);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00004';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 33, 0, 'vial', 834.46, 12, 3304.46, 30841.64);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00040';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'ampoule', 201.19, 12, 579.43, 5407.99);
  END IF;


  -- PO 189: H1-MOD-PO-2603-189 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-03-24'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2603-189', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 7313.29, 877.59, 8190.88, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 6, 6, 'strip', 11.53, 12, 8.3, 77.48);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00027';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 47, 'ampoule', 154.13, 12, 869.29, 8113.4);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2603-189', v_centre_id, v_po_id, v_vendor_id, 2026-03-24::date + interval '6 days', 'verified', 'VINV-0189', 8190.88)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00013'), v_centre_id, 112, 9, 268, v_po_date + interval '3 days', 11.53)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 47,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00027'), v_centre_id, 182, 16, 156, v_po_date + interval '3 days', 154.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 18,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 190: H1-GAN-PO-2601-190 → Polymed Medical Devices
  SELECT id INTO v_centre_id FROM centres WHERE code = 'GAN';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0014';
  v_po_date := '2026-01-22'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-GAN-PO-2601-190', v_centre_id, v_vendor_id, 'pending_approval', v_po_date, v_po_date + interval '14 days', 'normal', 39416.48, 4729.98, 44146.46, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00009';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 21, 0, 'vial', 1127.15, 12, 2840.42, 26510.57);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00005';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 38, 0, 'vial', 379.83, 12, 1732.02, 16165.56);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00056';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 43, 0, 'nos', 30.53, 12, 157.53, 1470.32);
  END IF;


  -- PO 191: H1-MOD-PO-2601-191 → Transasia Bio-Medicals
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0020';
  v_po_date := '2026-01-05'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-191', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 355869.45, 63308.65, 419178.1, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00076';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 20, 20, 'bottle', 315.89, 18, 1137.2, 7455);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00022';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 54, 'vial', 112.25, 12, 727.38, 6788.88);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 37, 37, 'kit', 9110.47, 18, 60675.73, 397763.12);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00004';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 7, 7, 'vial', 914.68, 12, 768.33, 7171.09);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-MOD-GRN-2601-191', v_centre_id, v_po_id, v_vendor_id, 2026-01-05::date + interval '7 days', 'verified', 'VINV-0191', 419178.1)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00076'), v_centre_id, 93, 25, 162, v_po_date + interval '3 days', 315.89)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 20,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00022'), v_centre_id, 59, 19, 581, v_po_date + interval '3 days', 112.25)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 42,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00068'), v_centre_id, 105, 9, 132, v_po_date + interval '3 days', 9110.47)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 39,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00004'), v_centre_id, 85, 24, 286, v_po_date + interval '3 days', 914.68)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 45,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 192: H1-SHI-PO-2603-192 → Welspun Health Linens
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0029';
  v_po_date := '2026-03-12'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-192', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 10978.93, 1317.47, 12296.4, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00037';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 0, 'ampoule', 174.98, 12, 272.97, 2547.71);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00004';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 0, 'vial', 827.86, 12, 894.09, 8344.83);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00057';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 53, 0, 'nos', 23.65, 12, 150.41, 1403.86);
  END IF;


  -- PO 193: H1-UDA-PO-2601-193 → Dell Technologies India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'UDA';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0025';
  v_po_date := '2026-01-05'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-UDA-PO-2601-193', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'urgent', 43003.23, 5160.39, 48163.62, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00033';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 30, 0, 'bottle', 30.73, 12, 110.63, 1032.53);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00020';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 0, 'strip', 51.96, 12, 56.12, 523.76);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00066';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 52, 0, 'box', 769.18, 12, 4799.68, 44797.04);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00042';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 47, 0, 'ampoule', 34.39, 12, 193.96, 1810.29);
  END IF;


  -- PO 194: H1-SHI-PO-2602-194 → Siemens Healthineers India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0019';
  v_po_date := '2026-02-22'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-194', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 5151.4, 618.17, 5769.57, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00051';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 13, 0, 'nos', 346.62, 12, 540.73, 5046.79);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00013';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 0, 'strip', 13.06, 12, 29.78, 277.92);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00011';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 24, 0, 'strip', 16.55, 12, 47.66, 444.86);
  END IF;


  -- PO 195: H1-SHI-PO-2602-195 → Torrent Pharmaceuticals Ltd
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0002';
  v_po_date := '2026-02-20'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2602-195', v_centre_id, v_vendor_id, 'partially_received', v_po_date, v_po_date + interval '14 days', 'normal', 143140.01, 25673.11, 168813.12, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00072';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 51, 'pack', 124.46, 18, 1142.54, 7490);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00065';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 19, 'bottle', 3991.43, 18, 13650.69, 89487.86);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00074';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 22, 22, 'nos', 69.77, 12, 184.19, 1719.13);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 34, 'can', 1747.66, 18, 10695.68, 70116.12);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2602-195', v_centre_id, v_po_id, v_vendor_id, 2026-02-20::date + interval '4 days', 'verified', 'VINV-0195', 168813.12)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00072'), v_centre_id, 42, 15, 336, v_po_date + interval '3 days', 124.46)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 35,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00065'), v_centre_id, 39, 22, 205, v_po_date + interval '3 days', 3991.43)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 37,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00074'), v_centre_id, 46, 15, 580, v_po_date + interval '3 days', 69.77)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 58,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00070'), v_centre_id, 203, 27, 467, v_po_date + interval '3 days', 1747.66)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 53,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 196: H1-SHI-PO-2603-196 → B Braun Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0012';
  v_po_date := '2026-03-01'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2603-196', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 441649.24, 68519.17, 510168.41, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00015';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 48, 0, 'ampoule', 15.58, 12, 89.74, 837.58);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00063';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 51, 0, 'nos', 3500.07, 12, 21420.43, 199924);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 19, 0, 'nos', 46.34, 12, 105.66, 986.12);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00001';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 0, 'strip', 40.09, 12, 81.78, 763.31);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00068';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 32, 0, 'kit', 8083.99, 18, 46563.78, 305251.46);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00031';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 49, 0, 'bottle', 43.84, 12, 257.78, 2405.94);
  END IF;


  -- PO 197: H1-MOD-PO-2601-197 → Transasia Bio-Medicals
  SELECT id INTO v_centre_id FROM centres WHERE code = 'MOD';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0020';
  v_po_date := '2026-01-10'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-MOD-PO-2601-197', v_centre_id, v_vendor_id, 'sent_to_vendor', v_po_date, v_po_date + interval '14 days', 'normal', 764884.36, 134063.58, 898947.94, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00017';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 0, 'ampoule', 42.03, 12, 85.74, 800.25);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00069';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 54, 0, 'cartridge', 12831.02, 18, 124717.51, 817592.59);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00026';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 34, 0, 'ampoule', 46.92, 12, 191.43, 1786.71);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00075';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 17, 0, 'tin', 691.13, 18, 2114.86, 13864.07);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00063';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 18, 0, 'nos', 3219.46, 12, 6954.03, 64904.31);
  END IF;


  -- PO 198: H1-SHI-PO-2601-198 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-01-14'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-198', v_centre_id, v_vendor_id, 'approved', v_po_date, v_po_date + interval '14 days', 'normal', 13558.85, 2215.47, 15774.32, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 5, 0, 'can', 1961.35, 18, 1765.22, 11571.97);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00025';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 45, 0, 'ampoule', 83.38, 12, 450.25, 4202.35);
  END IF;


  -- PO 199: H1-VAS-PO-2603-199 → B Braun Medical India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'VAS';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0012';
  v_po_date := '2026-03-13'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-VAS-PO-2603-199', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'emergency', 435038.34, 55617.45, 490655.79, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00055';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 16, 16, 'nos', 125.85, 12, 241.63, 2255.23);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00061';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 42, 42, 'nos', 8564.02, 12, 43162.66, 402851.5);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 29, 29, 'can', 1961.41, 18, 10238.56, 67119.45);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00053';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 8, 8, 'nos', 42.22, 12, 40.53, 378.29);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00007';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 46, 46, 'strip', 114.13, 12, 630, 5879.98);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00045';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 23, 23, 'pack', 472.49, 12, 1304.07, 12171.34);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-VAS-GRN-2603-199', v_centre_id, v_po_id, v_vendor_id, 2026-03-13::date + interval '4 days', 'verified', 'VINV-0199', 490655.79)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-VAS-INV-2603-199', 'VINV-0199', 2026-03-13::date + interval '4 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 435038.34, 55617.45, 490655.79, 'matched', 'unpaid', 0, v_credit_days, (2026-03-13::date + interval '4 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00055'), v_centre_id, 104, 31, 298, v_po_date + interval '3 days', 125.85)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 44,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00061'), v_centre_id, 46, 21, 413, v_po_date + interval '3 days', 8564.02)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 43,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00070'), v_centre_id, 76, 19, 373, v_po_date + interval '3 days', 1961.41)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 10,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00053'), v_centre_id, 168, 22, 591, v_po_date + interval '3 days', 42.22)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 34,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00007'), v_centre_id, 39, 5, 464, v_po_date + interval '3 days', 114.13)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 29,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00045'), v_centre_id, 145, 14, 290, v_po_date + interval '3 days', 472.49)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 23,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

  -- PO 200: H1-SHI-PO-2601-200 → Abbott Nutrition India
  SELECT id INTO v_centre_id FROM centres WHERE code = 'SHI';
  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-0024';
  v_po_date := '2026-01-28'::date;
  v_total := 0; v_gst_amt := 0;

  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('H1-SHI-PO-2601-200', v_centre_id, v_vendor_id, 'fully_received', v_po_date, v_po_date + interval '14 days', 'normal', 26778.78, 4701.46, 31480.24, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;

  IF v_po_id IS NOT NULL THEN
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00030';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 9, 9, 'strip', 65.68, 12, 70.93, 662.05);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00012';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 25, 25, 'vial', 55.5, 12, 166.5, 1554);
    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-00070';
    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, 14, 14, 'can', 1771.44, 18, 4464.03, 29264.19);

    -- GRN
    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('H1-SHI-GRN-2601-200', v_centre_id, v_po_id, v_vendor_id, 2026-01-28::date + interval '2 days', 'verified', 'VINV-0200', 31480.24)
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;

    IF v_grn_id IS NOT NULL THEN
      v_credit_days := 45;
      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('H1-SHI-INV-2601-200', 'VINV-0200', 2026-01-28::date + interval '2 days', v_centre_id, v_vendor_id, v_grn_id, v_po_id, 26778.78, 4701.46, 31480.24, 'matched', 'partial', 15740, v_credit_days, (2026-01-28::date + interval '2 days') + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;
    END IF;
  END IF;

  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00030'), v_centre_id, 65, 14, 239, v_po_date + interval '3 days', 65.68)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 38,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00012'), v_centre_id, 118, 12, 274, v_po_date + interval '3 days', 55.5)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 27,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;
  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-00070'), v_centre_id, 154, 13, 246, v_po_date + interval '3 days', 1771.44)
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + 50,
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;

END;
$$;

COMMIT;

-- Verify counts
SELECT 'vendors' as entity, count(*) FROM vendors
UNION ALL SELECT 'items', count(*) FROM items
UNION ALL SELECT 'purchase_orders', count(*) FROM purchase_orders
UNION ALL SELECT 'grns', count(*) FROM grns
UNION ALL SELECT 'invoices', count(*) FROM invoices
UNION ALL SELECT 'item_centre_stock', count(*) FROM item_centre_stock
ORDER BY entity;
