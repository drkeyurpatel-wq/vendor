const fs = require('fs');

// ═══ REALISTIC INDIAN HOSPITAL DATA ═══

const VENDORS = [
  // Pharma Distributors (Gujarat-based)
  { name: 'Zydus Healthcare Ltd', trade: 'Zydus Cadila', cat: 'PHARMA', gstin: '24AABCZ1234M1Z5', pan: 'AABCZ1234M', city: 'Ahmedabad', state: 'Gujarat', pin: '380015', contact: 'Rajesh Mehta', phone: '9825012345', email: 'rajesh@zydus.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0001234', acct: '50100123456789' },
  { name: 'Torrent Pharmaceuticals Ltd', trade: 'Torrent Pharma', cat: 'PHARMA', gstin: '24AABCT5678N1Z3', pan: 'AABCT5678N', city: 'Ahmedabad', state: 'Gujarat', pin: '380054', contact: 'Vivek Shah', phone: '9825023456', email: 'vivek@torrent.com', credit: 45, bank: 'ICICI Bank', ifsc: 'ICIC0002345', acct: '60200234567890' },
  { name: 'Intas Pharmaceuticals Ltd', trade: 'Intas Pharma', cat: 'PHARMA', gstin: '24AABCI9012P1Z1', pan: 'AABCI9012P', city: 'Ahmedabad', state: 'Gujarat', pin: '380061', contact: 'Hiren Patel', phone: '9825034567', email: 'hiren@intas.com', credit: 30, bank: 'Kotak Mahindra', ifsc: 'KKBK0003456', acct: '70300345678901' },
  { name: 'Sun Pharmaceutical Distributors', trade: 'Sun Pharma', cat: 'PHARMA', gstin: '24AABCS3456Q1Z9', pan: 'AABCS3456Q', city: 'Vadodara', state: 'Gujarat', pin: '390007', contact: 'Amit Desai', phone: '9825045678', email: 'amit@sunpharma.com', credit: 30, bank: 'SBI', ifsc: 'SBIN0004567', acct: '80400456789012' },
  { name: 'Cadila Healthcare Ltd', trade: 'Cadila', cat: 'PHARMA', gstin: '24AABCC7890R1Z7', pan: 'AABCC7890R', city: 'Ahmedabad', state: 'Gujarat', pin: '380019', contact: 'Ketan Joshi', phone: '9825056789', email: 'ketan@cadila.com', credit: 45, bank: 'Axis Bank', ifsc: 'UTIB0005678', acct: '90500567890123' },
  { name: 'Alembic Pharmaceuticals Ltd', trade: 'Alembic Pharma', cat: 'PHARMA', gstin: '24AABCA1234S1Z5', pan: 'AABCA1234S', city: 'Vadodara', state: 'Gujarat', pin: '390003', contact: 'Bhavesh Amin', phone: '9825067890', email: 'bhavesh@alembic.com', credit: 30, bank: 'Bank of Baroda', ifsc: 'BARB0006789', acct: '01600678901234' },
  { name: 'Cipla Gujarat Division', trade: 'Cipla', cat: 'PHARMA', gstin: '24AABCC5678T1Z3', pan: 'AABCC5678T', city: 'Ahmedabad', state: 'Gujarat', pin: '380009', contact: 'Nirav Vyas', phone: '9825078901', email: 'nirav@cipla.com', credit: 60, bank: 'HDFC Bank', ifsc: 'HDFC0007890', acct: '11700789012345' },
  { name: 'Dr Reddy\'s Laboratories Agency', trade: 'Dr Reddys', cat: 'PHARMA', gstin: '24AABCD9012U1Z1', pan: 'AABCD9012U', city: 'Ahmedabad', state: 'Gujarat', pin: '380005', contact: 'Suresh Reddy', phone: '9825089012', email: 'suresh@drreddys.com', credit: 45, bank: 'ICICI Bank', ifsc: 'ICIC0008901', acct: '21800890123456' },
  // Surgical / Medical Devices
  { name: 'Johnson & Johnson Medical India', trade: 'J&J Medical', cat: 'SURGICAL', gstin: '24AABCJ3456V1Z9', pan: 'AABCJ3456V', city: 'Ahmedabad', state: 'Gujarat', pin: '380058', contact: 'Prashant Kumar', phone: '9825090123', email: 'prashant@jnj.com', credit: 45, bank: 'Citibank', ifsc: 'CITI0009012', acct: '31900901234567' },
  { name: 'Medtronic India Pvt Ltd', trade: 'Medtronic', cat: 'SURGICAL', gstin: '24AABCM7890W1Z7', pan: 'AABCM7890W', city: 'Mumbai', state: 'Maharashtra', pin: '400093', contact: 'Ankit Sharma', phone: '9825001234', email: 'ankit@medtronic.com', credit: 60, bank: 'Standard Chartered', ifsc: 'SCBL0001234', acct: '42001012345678' },
  { name: 'BD India Pvt Ltd', trade: 'Becton Dickinson', cat: 'SURGICAL', gstin: '24AABCB1234X1Z5', pan: 'AABCB1234X', city: 'Ahmedabad', state: 'Gujarat', pin: '380015', contact: 'Deepak Patel', phone: '9825011234', email: 'deepak@bd.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0011234', acct: '52101123456789' },
  { name: 'B Braun Medical India', trade: 'B Braun', cat: 'SURGICAL', gstin: '24AABCB5678Y1Z3', pan: 'AABCB5678Y', city: 'Ahmedabad', state: 'Gujarat', pin: '380059', contact: 'Manish Thakkar', phone: '9825021234', email: 'manish@bbraun.com', credit: 45, bank: 'Bank of Baroda', ifsc: 'BARB0021234', acct: '62201234567890' },
  { name: 'Romsons International', trade: 'Romsons', cat: 'SURGICAL', gstin: '24AABCR9012Z1Z1', pan: 'AABCR9012Z', city: 'Agra', state: 'Uttar Pradesh', pin: '282001', contact: 'Rakesh Gupta', phone: '9825031234', email: 'rakesh@romsons.com', credit: 30, bank: 'PNB', ifsc: 'PUNB0031234', acct: '72301345678901' },
  { name: 'Polymed Medical Devices', trade: 'Polymed', cat: 'SURGICAL', gstin: '24AABCP3456A1Z9', pan: 'AABCP3456A', city: 'Faridabad', state: 'Haryana', pin: '121003', contact: 'Vinod Sharma', phone: '9825041234', email: 'vinod@polymed.com', credit: 30, bank: 'SBI', ifsc: 'SBIN0041234', acct: '82401456789012' },
  // Equipment
  { name: 'Mindray Medical India', trade: 'Mindray', cat: 'EQUIPMENT', gstin: '24AABCM7890B1Z7', pan: 'AABCM7890B', city: 'Mumbai', state: 'Maharashtra', pin: '400072', contact: 'Chen Wei', phone: '9825051234', email: 'chen@mindray.com', credit: 90, bank: 'HSBC', ifsc: 'HSBC0051234', acct: '92501567890123' },
  { name: 'Philips Healthcare India', trade: 'Philips', cat: 'EQUIPMENT', gstin: '27AABCP1234C1Z5', pan: 'AABCP1234C', city: 'Pune', state: 'Maharashtra', pin: '411006', contact: 'Rahul Khanna', phone: '9825061234', email: 'rahul@philips.com', credit: 90, bank: 'Deutsche Bank', ifsc: 'DEUT0061234', acct: '02601678901234' },
  { name: 'GE Healthcare India', trade: 'GE Healthcare', cat: 'EQUIPMENT', gstin: '29AABCG5678D1Z3', pan: 'AABCG5678D', city: 'Bengaluru', state: 'Karnataka', pin: '560066', contact: 'Priya Nair', phone: '9825071234', email: 'priya@gehealthcare.com', credit: 90, bank: 'Citibank', ifsc: 'CITI0071234', acct: '12701789012345' },
  // Lab / Diagnostics
  { name: 'Roche Diagnostics India', trade: 'Roche', cat: 'DIAGNOSTICS', gstin: '24AABCR1234E1Z1', pan: 'AABCR1234E', city: 'Mumbai', state: 'Maharashtra', pin: '400076', contact: 'Sanjay Mishra', phone: '9825081234', email: 'sanjay@roche.com', credit: 60, bank: 'HDFC Bank', ifsc: 'HDFC0081234', acct: '22801890123456' },
  { name: 'Siemens Healthineers India', trade: 'Siemens', cat: 'DIAGNOSTICS', gstin: '27AABCS5678F1Z9', pan: 'AABCS5678F', city: 'Mumbai', state: 'Maharashtra', pin: '400093', contact: 'Vikram Rao', phone: '9825091234', email: 'vikram@siemens.com', credit: 60, bank: 'Standard Chartered', ifsc: 'SCBL0091234', acct: '32901901234567' },
  { name: 'Transasia Bio-Medicals', trade: 'Transasia', cat: 'DIAGNOSTICS', gstin: '24AABCT9012G1Z7', pan: 'AABCT9012G', city: 'Mumbai', state: 'Maharashtra', pin: '400063', contact: 'Sunil Kumar', phone: '9825002345', email: 'sunil@transasia.com', credit: 45, bank: 'Axis Bank', ifsc: 'UTIB0002345', acct: '43002012345678' },
  // Housekeeping / Facilities
  { name: 'Diversey India Pvt Ltd', trade: 'Diversey', cat: 'HOUSEKEEPING', gstin: '24AABCD3456H1Z5', pan: 'AABCD3456H', city: 'Mumbai', state: 'Maharashtra', pin: '400076', contact: 'Mahesh Yadav', phone: '9825012345', email: 'mahesh@diversey.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0012345', acct: '53103123456789' },
  { name: 'Satguru Enterprises', trade: 'Satguru', cat: 'HOUSEKEEPING', gstin: '24AABCS7890I1Z3', pan: 'AABCS7890I', city: 'Ahmedabad', state: 'Gujarat', pin: '380007', contact: 'Ramesh Suthar', phone: '9825022345', email: 'ramesh@satguru.com', credit: 15, bank: 'SBI', ifsc: 'SBIN0022345', acct: '63203234567890' },
  // Dietary
  { name: 'Nestlé Health Science India', trade: 'Nestle Health', cat: 'DIETARY', gstin: '24AABCN1234J1Z1', pan: 'AABCN1234J', city: 'Gurgaon', state: 'Haryana', pin: '122002', contact: 'Arjun Singh', phone: '9825032345', email: 'arjun@nestle.com', credit: 30, bank: 'ICICI Bank', ifsc: 'ICIC0032345', acct: '73303345678901' },
  { name: 'Abbott Nutrition India', trade: 'Abbott', cat: 'DIETARY', gstin: '24AABCA5678K1Z9', pan: 'AABCA5678K', city: 'Mumbai', state: 'Maharashtra', pin: '400013', contact: 'Pooja Verma', phone: '9825042345', email: 'pooja@abbott.com', credit: 45, bank: 'Kotak Mahindra', ifsc: 'KKBK0042345', acct: '83403456789012' },
  // IT
  { name: 'Dell Technologies India', trade: 'Dell', cat: 'IT', gstin: '29AABCD9012L1Z7', pan: 'AABCD9012L', city: 'Bengaluru', state: 'Karnataka', pin: '560103', contact: 'Arun Krishnan', phone: '9825052345', email: 'arun@dell.com', credit: 30, bank: 'Citibank', ifsc: 'CITI0052345', acct: '93503567890123' },
  { name: 'HP India Sales Pvt Ltd', trade: 'HP', cat: 'IT', gstin: '24AABCH3456M1Z5', pan: 'AABCH3456M', city: 'Ahmedabad', state: 'Gujarat', pin: '380015', contact: 'Sneha Iyer', phone: '9825062345', email: 'sneha@hp.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0062345', acct: '03603678901234' },
  // Stationery
  { name: 'Navneet Education Ltd', trade: 'Navneet', cat: 'STATIONERY', gstin: '24AABCN7890N1Z3', pan: 'AABCN7890N', city: 'Ahmedabad', state: 'Gujarat', pin: '380014', contact: 'Jayesh Modi', phone: '9825072345', email: 'jayesh@navneet.com', credit: 15, bank: 'Bank of Baroda', ifsc: 'BARB0072345', acct: '13703789012345' },
  // Oxygen / Gas
  { name: 'INOX Air Products Ltd', trade: 'INOX', cat: 'EQUIPMENT', gstin: '24AABCI1234O1Z1', pan: 'AABCI1234O', city: 'Vadodara', state: 'Gujarat', pin: '390023', contact: 'Pramod Jain', phone: '9825082345', email: 'pramod@inoxap.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0082345', acct: '23803890123456' },
  // Linen
  { name: 'Welspun Health Linens', trade: 'Welspun', cat: 'HOUSEKEEPING', gstin: '24AABCW5678P1Z9', pan: 'AABCW5678P', city: 'Ahmedabad', state: 'Gujarat', pin: '380052', contact: 'Gaurav Pandya', phone: '9825092345', email: 'gaurav@welspun.com', credit: 30, bank: 'SBI', ifsc: 'SBIN0092345', acct: '33903901234567' },
];

// ═══ ITEMS — Realistic Indian Hospital SKUs ═══

const ITEMS = [
  // ── ANTIBIOTICS ──
  { name: 'Amoxicillin 500mg Capsule', brand: 'Mox', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Zydus Cadila', form: 'Capsule', strength: '500mg', schedule: 'H', rate: 42, cold: false, narcotic: false, high: false },
  { name: 'Azithromycin 500mg Tablet', brand: 'Azee', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Cipla', form: 'Tablet', strength: '500mg', schedule: 'H', rate: 78, cold: false, narcotic: false, high: false },
  { name: 'Ceftriaxone 1g Injection', brand: 'Monocef', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Aristo Pharma', form: 'Injection', strength: '1g', schedule: 'H', rate: 65, cold: true, narcotic: false, high: false },
  { name: 'Meropenem 1g Injection', brand: 'Meronem', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'AstraZeneca', form: 'Injection', strength: '1g', schedule: 'H', rate: 850, cold: true, narcotic: false, high: true },
  { name: 'Piperacillin-Tazobactam 4.5g Inj', brand: 'Tazact', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Alkem', form: 'Injection', strength: '4.5g', schedule: 'H', rate: 420, cold: true, narcotic: false, high: true },
  { name: 'Ciprofloxacin 500mg Tablet', brand: 'Ciplox', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Cipla', form: 'Tablet', strength: '500mg', schedule: 'H', rate: 35, cold: false, narcotic: false, high: false },
  { name: 'Levofloxacin 750mg Tablet', brand: 'Levomac', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Macleods', form: 'Tablet', strength: '750mg', schedule: 'H', rate: 125, cold: false, narcotic: false, high: false },
  { name: 'Vancomycin 500mg Injection', brand: 'Vancoplus', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Intas', form: 'Injection', strength: '500mg', schedule: 'H', rate: 380, cold: true, narcotic: false, high: true },
  { name: 'Colistin 1MIU Injection', brand: 'Colistop', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Venus Remedies', form: 'Injection', strength: '1MIU', schedule: 'H', rate: 1200, cold: true, narcotic: false, high: true },
  { name: 'Linezolid 600mg Tablet', brand: 'Linospan', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Cipla', form: 'Tablet', strength: '600mg', schedule: 'H', rate: 320, cold: false, narcotic: false, high: false },
  { name: 'Metronidazole 400mg Tablet', brand: 'Flagyl', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Abbott', form: 'Tablet', strength: '400mg', schedule: 'H', rate: 18, cold: false, narcotic: false, high: false },
  { name: 'Amikacin 500mg Injection', brand: 'Mikacin', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Aristo', form: 'Injection', strength: '500mg', schedule: 'H', rate: 55, cold: false, narcotic: false, high: false },

  // ── ANALGESICS ──
  { name: 'Paracetamol 500mg Tablet', brand: 'Crocin', cat: 'PHARMA_ANALGESIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'GSK', form: 'Tablet', strength: '500mg', schedule: 'OTC', rate: 12, cold: false, narcotic: false, high: false },
  { name: 'Paracetamol 1g IV Infusion', brand: 'Perfalgan', cat: 'PHARMA_ANALGESIC', unit: 'bottle', hsn: '30042019', gst: 12, mfr: 'Bristol-Myers', form: 'Infusion', strength: '1g/100ml', schedule: 'H', rate: 85, cold: false, narcotic: false, high: false },
  { name: 'Diclofenac 75mg Injection', brand: 'Voveran', cat: 'PHARMA_ANALGESIC', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Novartis', form: 'Injection', strength: '75mg', schedule: 'H', rate: 15, cold: false, narcotic: false, high: false },
  { name: 'Tramadol 50mg Capsule', brand: 'Tramazac', cat: 'PHARMA_ANALGESIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Zydus', form: 'Capsule', strength: '50mg', schedule: 'H', rate: 35, cold: false, narcotic: true, high: false },
  { name: 'Morphine 15mg Injection', brand: 'Morphine Sulphate', cat: 'PHARMA_ANALGESIC', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Rusan Pharma', form: 'Injection', strength: '15mg', schedule: 'X', rate: 42, cold: false, narcotic: true, high: true },
  { name: 'Fentanyl 100mcg Patch', brand: 'Durogesic', cat: 'PHARMA_ANALGESIC', unit: 'patch', hsn: '30042019', gst: 12, mfr: 'Janssen', form: 'Transdermal Patch', strength: '100mcg/hr', schedule: 'X', rate: 950, cold: false, narcotic: true, high: true },

  // ── CARDIOVASCULAR ──
  { name: 'Atorvastatin 20mg Tablet', brand: 'Atorva', cat: 'PHARMA_CARDIO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Zydus Cadila', form: 'Tablet', strength: '20mg', schedule: 'H', rate: 65, cold: false, narcotic: false, high: false },
  { name: 'Clopidogrel 75mg Tablet', brand: 'Clopilet', cat: 'PHARMA_CARDIO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Sun Pharma', form: 'Tablet', strength: '75mg', schedule: 'H', rate: 55, cold: false, narcotic: false, high: false },
  { name: 'Enoxaparin 40mg Injection', brand: 'Clexane', cat: 'PHARMA_CARDIO', unit: 'prefilled', hsn: '30042019', gst: 12, mfr: 'Sanofi', form: 'Injection', strength: '40mg/0.4ml', schedule: 'H', rate: 380, cold: true, narcotic: false, high: true },
  { name: 'Heparin 5000IU/ml Injection', brand: 'Heparin Leo', cat: 'PHARMA_CARDIO', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Leo Pharma', form: 'Injection', strength: '5000IU/ml', schedule: 'H', rate: 120, cold: true, narcotic: false, high: true },
  { name: 'Amlodipine 5mg Tablet', brand: 'Amlong', cat: 'PHARMA_CARDIO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Micro Labs', form: 'Tablet', strength: '5mg', schedule: 'H', rate: 28, cold: false, narcotic: false, high: false },
  { name: 'Metoprolol 50mg Tablet', brand: 'Betaloc', cat: 'PHARMA_CARDIO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'AstraZeneca', form: 'Tablet', strength: '50mg', schedule: 'H', rate: 42, cold: false, narcotic: false, high: false },
  { name: 'Nitroglycerin 5mg/ml Injection', brand: 'Nitrocontin', cat: 'PHARMA_CARDIO', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Sun Pharma', form: 'Injection', strength: '5mg/ml', schedule: 'H', rate: 85, cold: false, narcotic: false, high: true },
  { name: 'Dopamine 200mg Injection', brand: 'Dopamine', cat: 'PHARMA_CARDIO', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Neon Labs', form: 'Injection', strength: '200mg', schedule: 'H', rate: 45, cold: false, narcotic: false, high: true },
  { name: 'Noradrenaline 2mg Injection', brand: 'Norad', cat: 'PHARMA_CARDIO', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Neon Labs', form: 'Injection', strength: '2mg/ml', schedule: 'H', rate: 165, cold: true, narcotic: false, high: true },

  // ── NEUROLOGY ──
  { name: 'Levetiracetam 500mg Tablet', brand: 'Levipil', cat: 'PHARMA_NEURO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Sun Pharma', form: 'Tablet', strength: '500mg', schedule: 'H', rate: 85, cold: false, narcotic: false, high: false },
  { name: 'Phenytoin 100mg Capsule', brand: 'Eptoin', cat: 'PHARMA_NEURO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Abbott', form: 'Capsule', strength: '100mg', schedule: 'H', rate: 22, cold: false, narcotic: false, high: true },
  { name: 'Sodium Valproate 500mg Tablet', brand: 'Encorate', cat: 'PHARMA_NEURO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Sun Pharma', form: 'Tablet', strength: '500mg', schedule: 'H', rate: 65, cold: false, narcotic: false, high: false },
  { name: 'Mannitol 20% 100ml Infusion', brand: 'Mannitol', cat: 'PHARMA_NEURO', unit: 'bottle', hsn: '30049099', gst: 12, mfr: 'Baxter', form: 'Infusion', strength: '20%', schedule: 'H', rate: 45, cold: false, narcotic: false, high: false },

  // ── IV FLUIDS ──
  { name: 'Normal Saline 0.9% 500ml', brand: 'NS', cat: 'PHARMA_IVFLUID', unit: 'bottle', hsn: '30049099', gst: 12, mfr: 'B Braun', form: 'Infusion', strength: '0.9%', schedule: 'H', rate: 28, cold: false, narcotic: false, high: false },
  { name: 'Ringer Lactate 500ml', brand: 'RL', cat: 'PHARMA_IVFLUID', unit: 'bottle', hsn: '30049099', gst: 12, mfr: 'B Braun', form: 'Infusion', strength: 'Compound', schedule: 'H', rate: 32, cold: false, narcotic: false, high: false },
  { name: 'Dextrose 5% in NS 500ml', brand: 'DNS', cat: 'PHARMA_IVFLUID', unit: 'bottle', hsn: '30049099', gst: 12, mfr: 'Baxter', form: 'Infusion', strength: '5%', schedule: 'H', rate: 35, cold: false, narcotic: false, high: false },
  { name: 'Dextrose 25% 100ml', brand: 'D25', cat: 'PHARMA_IVFLUID', unit: 'bottle', hsn: '30049099', gst: 12, mfr: 'Claris', form: 'Infusion', strength: '25%', schedule: 'H', rate: 48, cold: false, narcotic: false, high: false },
  { name: 'Albumin 20% 100ml', brand: 'Human Albumin', cat: 'PHARMA_IVFLUID', unit: 'bottle', hsn: '30021099', gst: 5, mfr: 'Biotest', form: 'Infusion', strength: '20%', schedule: 'H', rate: 4500, cold: true, narcotic: false, high: true },

  // ── ANAESTHESIA ──
  { name: 'Propofol 1% 20ml', brand: 'Diprivan', cat: 'PHARMA_ANAES', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'AstraZeneca', form: 'Injection', strength: '10mg/ml', schedule: 'H', rate: 180, cold: true, narcotic: false, high: true },
  { name: 'Sevoflurane 250ml', brand: 'Sevorane', cat: 'PHARMA_ANAES', unit: 'bottle', hsn: '30042019', gst: 12, mfr: 'Abbott', form: 'Inhalation', strength: '100%', schedule: 'H', rate: 4800, cold: false, narcotic: false, high: true },
  { name: 'Midazolam 5mg/ml Injection', brand: 'Mezolam', cat: 'PHARMA_ANAES', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Neon Labs', form: 'Injection', strength: '5mg/ml', schedule: 'H', rate: 25, cold: false, narcotic: true, high: true },
  { name: 'Atracurium 25mg/2.5ml', brand: 'Tracrium', cat: 'PHARMA_ANAES', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'GSK', form: 'Injection', strength: '25mg', schedule: 'H', rate: 210, cold: true, narcotic: false, high: true },
  { name: 'Bupivacaine 0.5% Heavy 4ml', brand: 'Anawin', cat: 'PHARMA_ANAES', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Neon Labs', form: 'Injection', strength: '0.5%', schedule: 'H', rate: 55, cold: false, narcotic: false, high: false },
  { name: 'Succinylcholine 100mg Injection', brand: 'Scoline', cat: 'PHARMA_ANAES', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'GSK', form: 'Injection', strength: '100mg', schedule: 'H', rate: 35, cold: true, narcotic: false, high: true },

  // ── SURGICAL CONSUMABLES ──
  { name: 'Surgical Gloves Sterile 7.5', brand: 'Supermax', cat: 'SURGICAL_GLOVES', unit: 'pair', hsn: '40151100', gst: 12, mfr: 'Supermax', form: null, strength: '7.5', schedule: null, rate: 18, cold: false, narcotic: false, high: false },
  { name: 'Examination Gloves Nitrile M', brand: 'BD Gloves', cat: 'SURGICAL_GLOVES', unit: 'box', hsn: '40151100', gst: 12, mfr: 'BD', form: null, strength: 'Medium', schedule: null, rate: 280, cold: false, narcotic: false, high: false },
  { name: 'Surgical Drape Universal Pack', brand: 'Sterimed', cat: 'SURGICAL_GLOVES', unit: 'pack', hsn: '63079090', gst: 12, mfr: 'Sterimed', form: null, strength: 'Universal', schedule: null, rate: 450, cold: false, narcotic: false, high: false },
  { name: 'N95 Mask 3M 1860', brand: '3M 1860', cat: 'SURGICAL_PPE', unit: 'nos', hsn: '63079090', gst: 12, mfr: '3M', form: null, strength: 'N95', schedule: null, rate: 95, cold: false, narcotic: false, high: false },
  { name: '3-Ply Surgical Mask', brand: 'Medline', cat: 'SURGICAL_PPE', unit: 'box', hsn: '63079090', gst: 12, mfr: 'Medline', form: null, strength: 'Standard', schedule: null, rate: 120, cold: false, narcotic: false, high: false },

  // ── SUTURES ──
  { name: 'Vicryl 2-0 Suture 75cm', brand: 'Vicryl', cat: 'SURGICAL_SUTURE', unit: 'nos', hsn: '30061000', gst: 12, mfr: 'Ethicon/J&J', form: null, strength: '2-0', schedule: null, rate: 280, cold: false, narcotic: false, high: false },
  { name: 'Ethilon 3-0 Nylon Suture', brand: 'Ethilon', cat: 'SURGICAL_SUTURE', unit: 'nos', hsn: '30061000', gst: 12, mfr: 'Ethicon/J&J', form: null, strength: '3-0', schedule: null, rate: 185, cold: false, narcotic: false, high: false },
  { name: 'Silk 2-0 Braided Suture', brand: 'Mersilk', cat: 'SURGICAL_SUTURE', unit: 'nos', hsn: '30061000', gst: 12, mfr: 'Ethicon/J&J', form: null, strength: '2-0', schedule: null, rate: 95, cold: false, narcotic: false, high: false },
  { name: 'Prolene 4-0 Polypropylene', brand: 'Prolene', cat: 'SURGICAL_SUTURE', unit: 'nos', hsn: '30061000', gst: 12, mfr: 'Ethicon/J&J', form: null, strength: '4-0', schedule: null, rate: 320, cold: false, narcotic: false, high: false },
  { name: 'Skin Stapler 35W', brand: 'Proximate', cat: 'SURGICAL_SUTURE', unit: 'nos', hsn: '90189090', gst: 12, mfr: 'Ethicon/J&J', form: null, strength: '35 Wide', schedule: null, rate: 1850, cold: false, narcotic: false, high: false },

  // ── CATHETERS & TUBES ──
  { name: 'Foley Catheter 16Fr 2-way', brand: 'Romo Foley', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'Romsons', form: null, strength: '16Fr', schedule: null, rate: 45, cold: false, narcotic: false, high: false },
  { name: 'Central Venous Catheter 7Fr Triple', brand: 'Arrow CVC', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'Teleflex', form: null, strength: '7Fr Triple Lumen', schedule: null, rate: 2200, cold: false, narcotic: false, high: false },
  { name: 'Endotracheal Tube 7.5mm Cuffed', brand: 'Portex ETT', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'Smiths Medical', form: null, strength: '7.5mm', schedule: null, rate: 120, cold: false, narcotic: false, high: false },
  { name: 'Ryles Tube 16Fr', brand: 'Romo RT', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'Romsons', form: null, strength: '16Fr', schedule: null, rate: 28, cold: false, narcotic: false, high: false },
  { name: 'IV Cannula 20G', brand: 'BD Venflon', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'BD', form: null, strength: '20G', schedule: null, rate: 22, cold: false, narcotic: false, high: false },
  { name: 'IV Cannula 22G', brand: 'BD Venflon', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'BD', form: null, strength: '22G', schedule: null, rate: 22, cold: false, narcotic: false, high: false },
  { name: 'Chest Drain 28Fr', brand: 'Argyle', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'Covidien', form: null, strength: '28Fr', schedule: null, rate: 450, cold: false, narcotic: false, high: false },

  // ── IMPLANTS ──
  { name: 'DES Stent Xience Prime 3.0x28mm', brand: 'Xience', cat: 'SURGICAL_IMPLANT', unit: 'nos', hsn: '90213100', gst: 5, mfr: 'Abbott', form: null, strength: '3.0x28mm', schedule: null, rate: 28000, cold: false, narcotic: false, high: true },
  { name: 'PTCA Balloon Catheter 2.5x20mm', brand: 'Sprinter', cat: 'SURGICAL_IMPLANT', unit: 'nos', hsn: '90183900', gst: 12, mfr: 'Medtronic', form: null, strength: '2.5x20mm', schedule: null, rate: 8500, cold: false, narcotic: false, high: true },
  { name: 'Guide Wire 0.035 260cm', brand: 'Terumo', cat: 'SURGICAL_IMPLANT', unit: 'nos', hsn: '90183900', gst: 12, mfr: 'Terumo', form: null, strength: '0.035"', schedule: null, rate: 1200, cold: false, narcotic: false, high: false },
  { name: 'Guiding Catheter 6Fr JR4', brand: 'Launcher', cat: 'SURGICAL_IMPLANT', unit: 'nos', hsn: '90183900', gst: 12, mfr: 'Medtronic', form: null, strength: '6Fr JR4', schedule: null, rate: 3500, cold: false, narcotic: false, high: false },
  { name: 'Pacemaker VVI Single Chamber', brand: 'Adapta', cat: 'SURGICAL_IMPLANT', unit: 'nos', hsn: '90213100', gst: 5, mfr: 'Medtronic', form: null, strength: 'Single Chamber', schedule: null, rate: 85000, cold: false, narcotic: false, high: true },

  // ── DIAGNOSTICS ──
  { name: 'CBC Reagent 5-Part Diff (1L)', brand: 'Mindray BC-5000', cat: 'DIAGNOSTICS', unit: 'bottle', hsn: '38220090', gst: 18, mfr: 'Mindray', form: null, strength: '1 Litre', schedule: null, rate: 4200, cold: true, narcotic: false, high: false },
  { name: 'Blood Glucose Strips (50s)', brand: 'Accu-Chek Active', cat: 'DIAGNOSTICS', unit: 'box', hsn: '38220090', gst: 12, mfr: 'Roche', form: null, strength: '50 strips', schedule: null, rate: 750, cold: false, narcotic: false, high: false },
  { name: 'Troponin I Rapid Test Kit', brand: 'SD Biosensor', cat: 'DIAGNOSTICS', unit: 'kit', hsn: '38220090', gst: 12, mfr: 'SD Biosensor', form: null, strength: '25 tests', schedule: null, rate: 3500, cold: true, narcotic: false, high: false },
  { name: 'PT/INR Reagent', brand: 'Stago PT', cat: 'DIAGNOSTICS', unit: 'kit', hsn: '38220090', gst: 18, mfr: 'Stago', form: null, strength: '100 tests', schedule: null, rate: 8500, cold: true, narcotic: false, high: false },
  { name: 'Blood Gas Cartridge ABG', brand: 'i-STAT CG4+', cat: 'DIAGNOSTICS', unit: 'cartridge', hsn: '38220090', gst: 18, mfr: 'Abbott', form: null, strength: '25 tests', schedule: null, rate: 12000, cold: true, narcotic: false, high: false },

  // ── HOUSEKEEPING ──
  { name: 'Surface Disinfectant 5L', brand: 'Bacillocid', cat: 'HOUSEKEEPING', unit: 'can', hsn: '38089490', gst: 18, mfr: 'Bode Chemie', form: null, strength: '5 Litre', schedule: null, rate: 1800, cold: false, narcotic: false, high: false },
  { name: 'Hand Sanitizer Alcohol 500ml', brand: 'Sterillium', cat: 'HOUSEKEEPING', unit: 'bottle', hsn: '38089410', gst: 18, mfr: 'Bode Chemie', form: null, strength: '500ml', schedule: null, rate: 280, cold: false, narcotic: false, high: false },
  { name: 'Biomedical Waste Bags Red 25pcs', brand: 'Supermax', cat: 'HOUSEKEEPING', unit: 'pack', hsn: '39232100', gst: 18, mfr: 'Supermax', form: null, strength: 'Large', schedule: null, rate: 120, cold: false, narcotic: false, high: false },
  { name: 'Bed Sheet Hospital White', brand: 'Welspun', cat: 'HOUSEKEEPING', unit: 'nos', hsn: '63022100', gst: 12, mfr: 'Welspun', form: null, strength: 'Single', schedule: null, rate: 350, cold: false, narcotic: false, high: false },
  { name: 'Patient Gown Disposable', brand: 'Medline', cat: 'HOUSEKEEPING', unit: 'nos', hsn: '63079090', gst: 12, mfr: 'Medline', form: null, strength: 'Universal', schedule: null, rate: 65, cold: false, narcotic: false, high: false },

  // ── DIETARY ──
  { name: 'Ensure Powder 400g Vanilla', brand: 'Ensure', cat: 'DIETARY', unit: 'tin', hsn: '21069099', gst: 18, mfr: 'Abbott', form: null, strength: '400g', schedule: null, rate: 680, cold: false, narcotic: false, high: false },
  { name: 'Fresubin Original 500ml', brand: 'Fresubin', cat: 'DIETARY', unit: 'bottle', hsn: '21069099', gst: 18, mfr: 'Fresenius Kabi', form: null, strength: '500ml', schedule: null, rate: 320, cold: false, narcotic: false, high: false },

  // ── OFFICE/IT ──
  { name: 'A4 Paper 75gsm Ream (500 sheets)', brand: 'JK Copier', cat: 'OFFICE', unit: 'ream', hsn: '48025690', gst: 12, mfr: 'JK Paper', form: null, strength: '500 sheets', schedule: null, rate: 220, cold: false, narcotic: false, high: false },
  { name: 'Printer Toner HP 78A', brand: 'HP 78A', cat: 'OFFICE', unit: 'nos', hsn: '84439990', gst: 18, mfr: 'HP', form: null, strength: 'Standard', schedule: null, rate: 2800, cold: false, narcotic: false, high: false },
];

// ═══ GENERATE SQL ═══

let sql = `-- ============================================================
-- H1 VPMS — COMPREHENSIVE SEED DATA (10-15% SCALE)
-- ${ITEMS.length} items, ${VENDORS.length} vendors, ~200 POs, ~150 GRNs, ~120 invoices
-- Generated: ${new Date().toISOString()}
-- Run in Supabase SQL Editor AFTER 001_schema.sql + 002_seed.sql + 002_hospital_grade_overhaul.sql
-- ============================================================

-- Safety: wrap in transaction
BEGIN;

-- ============================================================
-- VENDORS (${VENDORS.length})
-- ============================================================

`;

VENDORS.forEach((v, i) => {
  const code = `H1V-${String(i + 1).padStart(4, '0')}`;
  sql += `INSERT INTO vendors (vendor_code, legal_name, trade_name, category_id, gstin, pan, city, state, pincode, primary_contact_name, primary_contact_phone, primary_contact_email, credit_period_days, bank_name, bank_ifsc, bank_account_no, bank_account_type, bank_verified, status, gstin_verified, pan_verified, address)
VALUES ('${code}', '${v.name.replace(/'/g, "''")}', '${(v.trade || '').replace(/'/g, "''")}', (SELECT id FROM vendor_categories WHERE code = '${v.cat}'), '${v.gstin}', '${v.pan}', '${v.city}', '${v.state}', '${v.pin}', '${v.contact}', '${v.phone}', '${v.email}', ${v.credit}, '${v.bank}', '${v.ifsc}', '${v.acct}', 'current', true, 'active', true, true, '${v.city}, ${v.state}')
ON CONFLICT (vendor_code) DO NOTHING;\n\n`;
});

sql += `\n-- ============================================================\n-- ITEMS (${ITEMS.length})\n-- ============================================================\n\n`;

ITEMS.forEach((item, i) => {
  const code = `H1I-${String(i + 1).padStart(5, '0')}`;
  sql += `INSERT INTO items (item_code, generic_name, brand_name, category_id, unit, hsn_code, gst_percent, manufacturer, dosage_form, strength, is_cold_chain, is_narcotic, is_high_alert, item_type, department)
VALUES ('${code}', '${item.name.replace(/'/g, "''")}', '${(item.brand || '').replace(/'/g, "''")}', (SELECT id FROM item_categories WHERE code = '${item.cat}'), '${item.unit}', '${item.hsn}', ${item.gst}, '${(item.mfr || '').replace(/'/g, "''")}', ${item.form ? `'${item.form}'` : 'NULL'}, ${item.strength ? `'${item.strength}'` : 'NULL'}, ${item.cold}, ${item.narcotic}, ${item.high}, '${item.form ? 'drug' : 'consumable'}', 'Medical')
ON CONFLICT (item_code) DO NOTHING;\n`;
});

// ═══ PURCHASE ORDERS — 200 POs across 3 months, 5 centres ═══

const CENTRES = ['SHI', 'VAS', 'MOD', 'UDA', 'GAN'];
const CENTRE_WEIGHTS = [0.40, 0.20, 0.12, 0.13, 0.15]; // Shilaj gets most volume
const PO_STATUSES = ['approved', 'sent_to_vendor', 'fully_received', 'fully_received', 'fully_received', 'partially_received', 'pending_approval'];
const PO_COUNT = 200;
const GRN_ITEMS_PER = 4;

sql += `\n\n-- ============================================================\n-- PURCHASE ORDERS (${PO_COUNT}) + LINE ITEMS + GRNs + INVOICES\n-- Using DO block for dynamic ID resolution\n-- ============================================================\n\n`;

sql += `DO $$
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

`;

// Generate POs
for (let po_idx = 0; po_idx < PO_COUNT; po_idx++) {
  // Pick centre based on weights
  let rnd = Math.random();
  let centreIdx = 0;
  let cumWeight = 0;
  for (let c = 0; c < CENTRES.length; c++) {
    cumWeight += CENTRE_WEIGHTS[c];
    if (rnd <= cumWeight) { centreIdx = c; break; }
  }
  const centre = CENTRES[centreIdx];
  
  // Pick random vendor
  const vendorIdx = Math.floor(Math.random() * VENDORS.length);
  const vendor = VENDORS[vendorIdx];
  
  // Random date in Jan-Mar 2026
  const month = Math.floor(Math.random() * 3) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const dateStr = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const ym = `26${String(month).padStart(2, '0')}`;
  const poNum = `H1-${centre}-PO-${ym}-${String(po_idx + 1).padStart(3, '0')}`;
  
  const status = PO_STATUSES[Math.floor(Math.random() * PO_STATUSES.length)];
  const priority = Math.random() < 0.85 ? 'normal' : Math.random() < 0.5 ? 'urgent' : 'emergency';
  
  // Pick 2-6 random items
  const numItems = Math.floor(Math.random() * 5) + 2;
  const selectedItems = [];
  const usedItemIdx = new Set();
  for (let j = 0; j < numItems; j++) {
    let idx;
    do { idx = Math.floor(Math.random() * ITEMS.length); } while (usedItemIdx.has(idx));
    usedItemIdx.add(idx);
    const item = ITEMS[idx];
    const qty = Math.floor(Math.random() * 50) + 5;
    const rate = item.rate * (0.9 + Math.random() * 0.2); // ±10% variation
    selectedItems.push({ idx, item, qty, rate: Math.round(rate * 100) / 100 });
  }

  sql += `  -- PO ${po_idx + 1}: ${poNum} → ${vendor.name.substring(0, 30)}\n`;
  sql += `  SELECT id INTO v_centre_id FROM centres WHERE code = '${centre}';\n`;
  sql += `  SELECT id INTO v_vendor_id FROM vendors WHERE vendor_code = 'H1V-${String(vendorIdx + 1).padStart(4, '0')}';\n`;
  sql += `  v_po_date := '${dateStr}'::date;\n`;
  sql += `  v_total := 0; v_gst_amt := 0;\n\n`;
  
  // Calculate totals
  let poSubtotal = 0;
  let poGst = 0;
  selectedItems.forEach(si => {
    const lineTotal = si.qty * si.rate;
    const lineGst = lineTotal * (si.item.gst / 100);
    poSubtotal += lineTotal;
    poGst += lineGst;
  });
  const poTotal = Math.round((poSubtotal + poGst) * 100) / 100;
  
  sql += `  INSERT INTO purchase_orders (po_number, centre_id, vendor_id, status, po_date, expected_delivery_date, priority, subtotal, gst_amount, total_amount, notes)
  VALUES ('${poNum}', v_centre_id, v_vendor_id, '${status}', v_po_date, v_po_date + interval '${vendor.credit < 30 ? 7 : 14} days', '${priority}', ${Math.round(poSubtotal * 100) / 100}, ${Math.round(poGst * 100) / 100}, ${poTotal}, NULL)
  ON CONFLICT (po_number) DO NOTHING
  RETURNING id INTO v_po_id;\n\n`;

  sql += `  IF v_po_id IS NOT NULL THEN\n`;

  // Insert line items
  selectedItems.forEach((si, liIdx) => {
    const lineTotal = Math.round(si.qty * si.rate * 100) / 100;
    const lineGst = Math.round(lineTotal * (si.item.gst / 100) * 100) / 100;
    const lineTotalWithGst = Math.round((lineTotal + lineGst) * 100) / 100;
    const recvQty = status.includes('received') ? si.qty : (status === 'partially_received' && liIdx === 0 ? Math.floor(si.qty * 0.6) : 0);
    
    sql += `    SELECT id INTO v_item_id FROM items WHERE item_code = 'H1I-${String(si.idx + 1).padStart(5, '0')}';\n`;
    sql += `    INSERT INTO purchase_order_items (po_id, item_id, ordered_qty, received_qty, unit, rate, gst_percent, gst_amount, total_amount)
    VALUES (v_po_id, v_item_id, ${si.qty}, ${recvQty}, '${si.item.unit}', ${si.rate}, ${si.item.gst}, ${lineGst}, ${lineTotalWithGst});\n`;
  });

  // GRN for received POs
  if (status.includes('received')) {
    const grnDate = `${dateStr}::date + interval '${Math.floor(Math.random() * 7) + 2} days'`;
    const grnNum = `H1-${centre}-GRN-${ym}-${String(po_idx + 1).padStart(3, '0')}`;
    
    sql += `\n    -- GRN\n`;
    sql += `    INSERT INTO grns (grn_number, centre_id, po_id, vendor_id, grn_date, status, vendor_invoice_no, vendor_invoice_amount)
    VALUES ('${grnNum}', v_centre_id, v_po_id, v_vendor_id, ${grnDate}, 'verified', 'VINV-${String(po_idx + 1).padStart(4, '0')}', ${poTotal})
    ON CONFLICT (grn_number) DO NOTHING
    RETURNING id INTO v_grn_id;\n\n`;

    // Invoice for fully received
    if (status === 'fully_received' && Math.random() < 0.8) {
      const invNum = `H1-${centre}-INV-${ym}-${String(po_idx + 1).padStart(3, '0')}`;
      const paymentStatus = Math.random() < 0.4 ? 'paid' : Math.random() < 0.6 ? 'unpaid' : 'partial';
      const matchStatus = Math.random() < 0.7 ? 'matched' : Math.random() < 0.5 ? 'partial_match' : 'mismatch';
      const paidAmt = paymentStatus === 'paid' ? poTotal : paymentStatus === 'partial' ? Math.round(poTotal * 0.5) : 0;
      
      sql += `    IF v_grn_id IS NOT NULL THEN\n`;
      sql += `      v_credit_days := ${vendor.credit};\n`;
      sql += `      INSERT INTO invoices (invoice_ref, vendor_invoice_no, vendor_invoice_date, centre_id, vendor_id, grn_id, po_id, subtotal, gst_amount, total_amount, match_status, payment_status, paid_amount, credit_period_days, due_date, status)
      VALUES ('${invNum}', 'VINV-${String(po_idx + 1).padStart(4, '0')}', ${grnDate}, v_centre_id, v_vendor_id, v_grn_id, v_po_id, ${Math.round(poSubtotal * 100) / 100}, ${Math.round(poGst * 100) / 100}, ${poTotal}, '${matchStatus}', '${paymentStatus}', ${paidAmt}, v_credit_days, (${grnDate}) + (v_credit_days || ' days')::interval, 'approved')
      ON CONFLICT (invoice_ref) DO NOTHING;\n`;
      sql += `    END IF;\n`;
    }
  }

  sql += `  END IF;\n\n`;

  // Add stock for some items
  if (status.includes('received')) {
    selectedItems.forEach(si => {
      sql += `  INSERT INTO item_centre_stock (item_id, centre_id, current_stock, reorder_level, max_level, last_grn_date, last_grn_rate)
  VALUES ((SELECT id FROM items WHERE item_code = 'H1I-${String(si.idx + 1).padStart(5, '0')}'), v_centre_id, ${Math.floor(Math.random() * 200) + 10}, ${Math.floor(Math.random() * 30) + 5}, ${Math.floor(Math.random() * 500) + 100}, v_po_date + interval '3 days', ${si.rate})
  ON CONFLICT (item_id, centre_id) DO UPDATE SET
    current_stock = item_centre_stock.current_stock + ${Math.floor(Math.random() * 50) + 10},
    last_grn_date = EXCLUDED.last_grn_date,
    last_grn_rate = EXCLUDED.last_grn_rate;\n`;
    });
  }
  
  sql += `\n`;
}

sql += `END;\n$$;\n\n`;

sql += `COMMIT;\n\n`;
sql += `-- Verify counts\nSELECT 'vendors' as entity, count(*) FROM vendors\nUNION ALL SELECT 'items', count(*) FROM items\nUNION ALL SELECT 'purchase_orders', count(*) FROM purchase_orders\nUNION ALL SELECT 'grns', count(*) FROM grns\nUNION ALL SELECT 'invoices', count(*) FROM invoices\nUNION ALL SELECT 'item_centre_stock', count(*) FROM item_centre_stock\nORDER BY entity;\n`;

fs.writeFileSync('/home/claude/vpms/sql/003_comprehensive_seed.sql', sql);
console.log(`Generated: ${VENDORS.length} vendors, ${ITEMS.length} items, ${PO_COUNT} POs`);
console.log(`File size: ${Math.round(sql.length / 1024)} KB`);
