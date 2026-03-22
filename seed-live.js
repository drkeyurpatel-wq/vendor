const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://dwukvdtacwvnudqjlwrb.supabase.co';
const SUPABASE_KEY = process.env.SUPA_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ═══ DATA ═══

const VENDORS = [
  { name: 'Zydus Healthcare Ltd', trade: 'Zydus Cadila', cat: 'PHARMA', gstin: '24AABCZ1234M1Z5', pan: 'AABCZ1234M', city: 'Ahmedabad', state: 'Gujarat', pin: '380015', contact: 'Rajesh Mehta', phone: '9825012345', email: 'rajesh@zydus.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0001234', acct: '50100123456789' },
  { name: 'Torrent Pharmaceuticals Ltd', trade: 'Torrent Pharma', cat: 'PHARMA', gstin: '24AABCT5678N1Z3', pan: 'AABCT5678N', city: 'Ahmedabad', state: 'Gujarat', pin: '380054', contact: 'Vivek Shah', phone: '9825023456', email: 'vivek@torrent.com', credit: 45, bank: 'ICICI Bank', ifsc: 'ICIC0002345', acct: '60200234567890' },
  { name: 'Intas Pharmaceuticals Ltd', trade: 'Intas Pharma', cat: 'PHARMA', gstin: '24AABCI9012P1Z1', pan: 'AABCI9012P', city: 'Ahmedabad', state: 'Gujarat', pin: '380061', contact: 'Hiren Patel', phone: '9825034567', email: 'hiren@intas.com', credit: 30, bank: 'Kotak Mahindra', ifsc: 'KKBK0003456', acct: '70300345678901' },
  { name: 'Sun Pharmaceutical Distributors', trade: 'Sun Pharma', cat: 'PHARMA', gstin: '24AABCS3456Q1Z9', pan: 'AABCS3456Q', city: 'Vadodara', state: 'Gujarat', pin: '390007', contact: 'Amit Desai', phone: '9825045678', email: 'amit@sunpharma.com', credit: 30, bank: 'SBI', ifsc: 'SBIN0004567', acct: '80400456789012' },
  { name: 'Cadila Healthcare Ltd', trade: 'Cadila', cat: 'PHARMA', gstin: '24AABCC7890R1Z7', pan: 'AABCC7890R', city: 'Ahmedabad', state: 'Gujarat', pin: '380019', contact: 'Ketan Joshi', phone: '9825056789', email: 'ketan@cadila.com', credit: 45, bank: 'Axis Bank', ifsc: 'UTIB0005678', acct: '90500567890123' },
  { name: 'Cipla Gujarat Division', trade: 'Cipla', cat: 'PHARMA', gstin: '24AABCC5678T1Z3', pan: 'AABCC5678T', city: 'Ahmedabad', state: 'Gujarat', pin: '380009', contact: 'Nirav Vyas', phone: '9825078901', email: 'nirav@cipla.com', credit: 60, bank: 'HDFC Bank', ifsc: 'HDFC0007890', acct: '11700789012345' },
  { name: 'Johnson & Johnson Medical India', trade: 'J&J Medical', cat: 'SURGICAL', gstin: '24AABCJ3456V1Z9', pan: 'AABCJ3456V', city: 'Ahmedabad', state: 'Gujarat', pin: '380058', contact: 'Prashant Kumar', phone: '9825090123', email: 'prashant@jnj.com', credit: 45, bank: 'Citibank', ifsc: 'CITI0009012', acct: '31900901234567' },
  { name: 'Medtronic India Pvt Ltd', trade: 'Medtronic', cat: 'SURGICAL', gstin: '27AABCM7890W1Z7', pan: 'AABCM7890W', city: 'Mumbai', state: 'Maharashtra', pin: '400093', contact: 'Ankit Sharma', phone: '9825001234', email: 'ankit@medtronic.com', credit: 60, bank: 'Standard Chartered', ifsc: 'SCBL0001234', acct: '42001012345678' },
  { name: 'BD India Pvt Ltd', trade: 'Becton Dickinson', cat: 'SURGICAL', gstin: '24AABCB1234X1Z5', pan: 'AABCB1234X', city: 'Ahmedabad', state: 'Gujarat', pin: '380015', contact: 'Deepak Patel', phone: '9825011234', email: 'deepak@bd.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0011234', acct: '52101123456789' },
  { name: 'B Braun Medical India', trade: 'B Braun', cat: 'SURGICAL', gstin: '24AABCB5678Y1Z3', pan: 'AABCB5678Y', city: 'Ahmedabad', state: 'Gujarat', pin: '380059', contact: 'Manish Thakkar', phone: '9825021234', email: 'manish@bbraun.com', credit: 45, bank: 'Bank of Baroda', ifsc: 'BARB0021234', acct: '62201234567890' },
  { name: 'Romsons International', trade: 'Romsons', cat: 'SURGICAL', gstin: '09AABCR9012Z1Z1', pan: 'AABCR9012Z', city: 'Agra', state: 'Uttar Pradesh', pin: '282001', contact: 'Rakesh Gupta', phone: '9825031234', email: 'rakesh@romsons.com', credit: 30, bank: 'PNB', ifsc: 'PUNB0031234', acct: '72301345678901' },
  { name: 'Mindray Medical India', trade: 'Mindray', cat: 'EQUIPMENT', gstin: '27AABCM7890B1Z7', pan: 'AABCM7890B', city: 'Mumbai', state: 'Maharashtra', pin: '400072', contact: 'Chen Wei', phone: '9825051234', email: 'chen@mindray.com', credit: 90, bank: 'HSBC', ifsc: 'HSBC0051234', acct: '92501567890123' },
  { name: 'Philips Healthcare India', trade: 'Philips', cat: 'EQUIPMENT', gstin: '27AABCP1234C1Z5', pan: 'AABCP1234C', city: 'Pune', state: 'Maharashtra', pin: '411006', contact: 'Rahul Khanna', phone: '9825061234', email: 'rahul@philips.com', credit: 90, bank: 'Deutsche Bank', ifsc: 'DEUT0061234', acct: '02601678901234' },
  { name: 'Roche Diagnostics India', trade: 'Roche', cat: 'DIAGNOSTICS', gstin: '27AABCR1234E1Z1', pan: 'AABCR1234E', city: 'Mumbai', state: 'Maharashtra', pin: '400076', contact: 'Sanjay Mishra', phone: '9825081234', email: 'sanjay@roche.com', credit: 60, bank: 'HDFC Bank', ifsc: 'HDFC0081234', acct: '22801890123456' },
  { name: 'Transasia Bio-Medicals', trade: 'Transasia', cat: 'DIAGNOSTICS', gstin: '27AABCT9012G1Z7', pan: 'AABCT9012G', city: 'Mumbai', state: 'Maharashtra', pin: '400063', contact: 'Sunil Kumar', phone: '9825002345', email: 'sunil@transasia.com', credit: 45, bank: 'Axis Bank', ifsc: 'UTIB0002345', acct: '43002012345678' },
  { name: 'Diversey India Pvt Ltd', trade: 'Diversey', cat: 'HOUSEKEEPING', gstin: '27AABCD3456H1Z5', pan: 'AABCD3456H', city: 'Mumbai', state: 'Maharashtra', pin: '400076', contact: 'Mahesh Yadav', phone: '9825012345', email: 'mahesh@diversey.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0012345', acct: '53103123456789' },
  { name: 'Satguru Enterprises', trade: 'Satguru', cat: 'HOUSEKEEPING', gstin: '24AABCS7890I1Z3', pan: 'AABCS7890I', city: 'Ahmedabad', state: 'Gujarat', pin: '380007', contact: 'Ramesh Suthar', phone: '9825022345', email: 'ramesh@satguru.com', credit: 15, bank: 'SBI', ifsc: 'SBIN0022345', acct: '63203234567890' },
  { name: 'Abbott Nutrition India', trade: 'Abbott', cat: 'DIETARY', gstin: '27AABCA5678K1Z9', pan: 'AABCA5678K', city: 'Mumbai', state: 'Maharashtra', pin: '400013', contact: 'Pooja Verma', phone: '9825042345', email: 'pooja@abbott.com', credit: 45, bank: 'Kotak Mahindra', ifsc: 'KKBK0042345', acct: '83403456789012' },
  { name: 'Dell Technologies India', trade: 'Dell', cat: 'IT', gstin: '29AABCD9012L1Z7', pan: 'AABCD9012L', city: 'Bengaluru', state: 'Karnataka', pin: '560103', contact: 'Arun Krishnan', phone: '9825052345', email: 'arun@dell.com', credit: 30, bank: 'Citibank', ifsc: 'CITI0052345', acct: '93503567890123' },
  { name: 'INOX Air Products Ltd', trade: 'INOX', cat: 'EQUIPMENT', gstin: '24AABCI1234O1Z1', pan: 'AABCI1234O', city: 'Vadodara', state: 'Gujarat', pin: '390023', contact: 'Pramod Jain', phone: '9825082345', email: 'pramod@inoxap.com', credit: 30, bank: 'HDFC Bank', ifsc: 'HDFC0082345', acct: '23803890123456' },
];

const ITEMS = [
  { name: 'Amoxicillin 500mg Capsule', brand: 'Mox', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Zydus Cadila', rate: 42, cold: false, narcotic: false, high: false },
  { name: 'Azithromycin 500mg Tablet', brand: 'Azee', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Cipla', rate: 78, cold: false, narcotic: false, high: false },
  { name: 'Ceftriaxone 1g Injection', brand: 'Monocef', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Aristo Pharma', rate: 65, cold: true, narcotic: false, high: false },
  { name: 'Meropenem 1g Injection', brand: 'Meronem', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'AstraZeneca', rate: 850, cold: true, narcotic: false, high: true },
  { name: 'Piperacillin-Tazobactam 4.5g Inj', brand: 'Tazact', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Alkem', rate: 420, cold: true, narcotic: false, high: true },
  { name: 'Ciprofloxacin 500mg Tablet', brand: 'Ciplox', cat: 'PHARMA_ANTIBIOTIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Cipla', rate: 35, cold: false, narcotic: false, high: false },
  { name: 'Vancomycin 500mg Injection', brand: 'Vancoplus', cat: 'PHARMA_ANTIBIOTIC', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Intas', rate: 380, cold: true, narcotic: false, high: true },
  { name: 'Paracetamol 500mg Tablet', brand: 'Crocin', cat: 'PHARMA_ANALGESIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'GSK', rate: 12, cold: false, narcotic: false, high: false },
  { name: 'Paracetamol 1g IV Infusion', brand: 'Perfalgan', cat: 'PHARMA_ANALGESIC', unit: 'bottle', hsn: '30042019', gst: 12, mfr: 'Bristol-Myers', rate: 85, cold: false, narcotic: false, high: false },
  { name: 'Tramadol 50mg Capsule', brand: 'Tramazac', cat: 'PHARMA_ANALGESIC', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Zydus', rate: 35, cold: false, narcotic: true, high: false },
  { name: 'Atorvastatin 20mg Tablet', brand: 'Atorva', cat: 'PHARMA_CARDIO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Zydus Cadila', rate: 65, cold: false, narcotic: false, high: false },
  { name: 'Clopidogrel 75mg Tablet', brand: 'Clopilet', cat: 'PHARMA_CARDIO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Sun Pharma', rate: 55, cold: false, narcotic: false, high: false },
  { name: 'Enoxaparin 40mg Injection', brand: 'Clexane', cat: 'PHARMA_CARDIO', unit: 'prefilled', hsn: '30042019', gst: 12, mfr: 'Sanofi', rate: 380, cold: true, narcotic: false, high: true },
  { name: 'Heparin 5000IU/ml Injection', brand: 'Heparin Leo', cat: 'PHARMA_CARDIO', unit: 'vial', hsn: '30042019', gst: 12, mfr: 'Leo Pharma', rate: 120, cold: true, narcotic: false, high: true },
  { name: 'Amlodipine 5mg Tablet', brand: 'Amlong', cat: 'PHARMA_CARDIO', unit: 'strip', hsn: '30042019', gst: 12, mfr: 'Micro Labs', rate: 28, cold: false, narcotic: false, high: false },
  { name: 'Dopamine 200mg Injection', brand: 'Dopamine', cat: 'PHARMA_CARDIO', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Neon Labs', rate: 45, cold: false, narcotic: false, high: true },
  { name: 'Normal Saline 0.9% 500ml', brand: 'NS', cat: 'PHARMA_IVFLUID', unit: 'bottle', hsn: '30049099', gst: 12, mfr: 'B Braun', rate: 28, cold: false, narcotic: false, high: false },
  { name: 'Ringer Lactate 500ml', brand: 'RL', cat: 'PHARMA_IVFLUID', unit: 'bottle', hsn: '30049099', gst: 12, mfr: 'B Braun', rate: 32, cold: false, narcotic: false, high: false },
  { name: 'Dextrose 5% in NS 500ml', brand: 'DNS', cat: 'PHARMA_IVFLUID', unit: 'bottle', hsn: '30049099', gst: 12, mfr: 'Baxter', rate: 35, cold: false, narcotic: false, high: false },
  { name: 'Propofol 1% 20ml', brand: 'Diprivan', cat: 'PHARMA_ANAES', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'AstraZeneca', rate: 180, cold: true, narcotic: false, high: true },
  { name: 'Midazolam 5mg/ml Injection', brand: 'Mezolam', cat: 'PHARMA_ANAES', unit: 'ampoule', hsn: '30042019', gst: 12, mfr: 'Neon Labs', rate: 25, cold: false, narcotic: true, high: true },
  { name: 'Surgical Gloves Sterile 7.5', brand: 'Supermax', cat: 'SURGICAL_GLOVES', unit: 'pair', hsn: '40151100', gst: 12, mfr: 'Supermax', rate: 18, cold: false, narcotic: false, high: false },
  { name: 'Examination Gloves Nitrile M', brand: 'BD Gloves', cat: 'SURGICAL_GLOVES', unit: 'box', hsn: '40151100', gst: 12, mfr: 'BD', rate: 280, cold: false, narcotic: false, high: false },
  { name: 'N95 Mask 3M 1860', brand: '3M 1860', cat: 'SURGICAL_PPE', unit: 'nos', hsn: '63079090', gst: 12, mfr: '3M', rate: 95, cold: false, narcotic: false, high: false },
  { name: 'Vicryl 2-0 Suture 75cm', brand: 'Vicryl', cat: 'SURGICAL_SUTURE', unit: 'nos', hsn: '30061000', gst: 12, mfr: 'Ethicon/J&J', rate: 280, cold: false, narcotic: false, high: false },
  { name: 'Ethilon 3-0 Nylon Suture', brand: 'Ethilon', cat: 'SURGICAL_SUTURE', unit: 'nos', hsn: '30061000', gst: 12, mfr: 'Ethicon/J&J', rate: 185, cold: false, narcotic: false, high: false },
  { name: 'Foley Catheter 16Fr 2-way', brand: 'Romo Foley', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'Romsons', rate: 45, cold: false, narcotic: false, high: false },
  { name: 'Central Venous Catheter 7Fr', brand: 'Arrow CVC', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'Teleflex', rate: 2200, cold: false, narcotic: false, high: false },
  { name: 'IV Cannula 20G', brand: 'BD Venflon', cat: 'SURGICAL_CATHETER', unit: 'nos', hsn: '90183100', gst: 12, mfr: 'BD', rate: 22, cold: false, narcotic: false, high: false },
  { name: 'DES Stent Xience 3.0x28mm', brand: 'Xience', cat: 'SURGICAL_IMPLANT', unit: 'nos', hsn: '90213100', gst: 5, mfr: 'Abbott', rate: 28000, cold: false, narcotic: false, high: true },
  { name: 'PTCA Balloon 2.5x20mm', brand: 'Sprinter', cat: 'SURGICAL_IMPLANT', unit: 'nos', hsn: '90183900', gst: 12, mfr: 'Medtronic', rate: 8500, cold: false, narcotic: false, high: true },
  { name: 'CBC Reagent 5-Part (1L)', brand: 'Mindray BC-5000', cat: 'DIAGNOSTICS', unit: 'bottle', hsn: '38220090', gst: 18, mfr: 'Mindray', rate: 4200, cold: true, narcotic: false, high: false },
  { name: 'Blood Glucose Strips (50s)', brand: 'Accu-Chek', cat: 'DIAGNOSTICS', unit: 'box', hsn: '38220090', gst: 12, mfr: 'Roche', rate: 750, cold: false, narcotic: false, high: false },
  { name: 'Surface Disinfectant 5L', brand: 'Bacillocid', cat: 'HOUSEKEEPING', unit: 'can', hsn: '38089490', gst: 18, mfr: 'Bode Chemie', rate: 1800, cold: false, narcotic: false, high: false },
  { name: 'Hand Sanitizer 500ml', brand: 'Sterillium', cat: 'HOUSEKEEPING', unit: 'bottle', hsn: '38089410', gst: 18, mfr: 'Bode Chemie', rate: 280, cold: false, narcotic: false, high: false },
  { name: 'Bed Sheet Hospital White', brand: 'Welspun', cat: 'HOUSEKEEPING', unit: 'nos', hsn: '63022100', gst: 12, mfr: 'Welspun', rate: 350, cold: false, narcotic: false, high: false },
  { name: 'Ensure Powder 400g Vanilla', brand: 'Ensure', cat: 'DIETARY', unit: 'tin', hsn: '21069099', gst: 18, mfr: 'Abbott', rate: 680, cold: false, narcotic: false, high: false },
  { name: 'A4 Paper 75gsm (500 sheets)', brand: 'JK Copier', cat: 'OFFICE', unit: 'ream', hsn: '48025690', gst: 12, mfr: 'JK Paper', rate: 220, cold: false, narcotic: false, high: false },
];

const CENTRES_W = [
  { code: 'SHI', weight: 0.40 },
  { code: 'VAS', weight: 0.20 },
  { code: 'MOD', weight: 0.12 },
  { code: 'UDA', weight: 0.13 },
  { code: 'GAN', weight: 0.15 },
];

// ═══ MAIN ═══

async function seed() {
  console.log('Starting seed...');
  
  // 1. Get category IDs
  const { data: vendorCats } = await supabase.from('vendor_categories').select('id, code');
  const { data: itemCats } = await supabase.from('item_categories').select('id, code');
  const { data: centres } = await supabase.from('centres').select('id, code');
  
  const vcMap = Object.fromEntries(vendorCats.map(c => [c.code, c.id]));
  const icMap = Object.fromEntries(itemCats.map(c => [c.code, c.id]));
  const cMap = Object.fromEntries(centres.map(c => [c.code, c.id]));
  
  console.log(`Categories: ${vendorCats.length} vendor, ${itemCats.length} item, ${centres.length} centres`);

  // 2. Insert vendors
  console.log(`Inserting ${VENDORS.length} vendors...`);
  const vendorRows = VENDORS.map((v, i) => ({
    vendor_code: `H1V-${String(i + 1).padStart(4, '0')}`,
    legal_name: v.name, trade_name: v.trade,
    category_id: vcMap[v.cat],
    gstin: v.gstin, pan: v.pan, city: v.city, state: v.state, pincode: v.pin,
    primary_contact_name: v.contact, primary_contact_phone: v.phone, primary_contact_email: v.email,
    credit_period_days: v.credit,
    bank_name: v.bank, bank_ifsc: v.ifsc, bank_account_no: v.acct, bank_account_type: 'current',
    bank_verified: true, status: 'active', gstin_verified: true, pan_verified: true,
    address: `${v.city}, ${v.state}`,
  }));
  
  const { data: insertedVendors, error: vErr } = await supabase.from('vendors').upsert(vendorRows, { onConflict: 'vendor_code' }).select('id, vendor_code');
  if (vErr) { console.error('Vendor error:', vErr); return; }
  console.log(`  ✓ ${insertedVendors.length} vendors`);
  const vMap = Object.fromEntries(insertedVendors.map(v => [v.vendor_code, v.id]));

  // 3. Insert items
  console.log(`Inserting ${ITEMS.length} items...`);
  const itemRows = ITEMS.map((item, i) => ({
    item_code: `H1I-${String(i + 1).padStart(5, '0')}`,
    generic_name: item.name, brand_name: item.brand,
    category_id: icMap[item.cat] || null,
    unit: item.unit, hsn_code: item.hsn, gst_percent: item.gst,
    manufacturer: item.mfr,
    is_cold_chain: item.cold, is_narcotic: item.narcotic, is_high_alert: item.high,
    is_active: true,
  }));
  
  const { data: insertedItems, error: iErr } = await supabase.from('items').upsert(itemRows, { onConflict: 'item_code' }).select('id, item_code');
  if (iErr) { console.error('Item error:', iErr); return; }
  console.log(`  ✓ ${insertedItems.length} items`);
  const iMap = Object.fromEntries(insertedItems.map(it => [it.item_code, it.id]));

  // 4. Generate POs
  const PO_COUNT = 200;
  const PO_STATUSES = ['approved', 'sent_to_vendor', 'fully_received', 'fully_received', 'fully_received', 'partially_received', 'pending_approval'];
  
  let poCount = 0, grnCount = 0, invCount = 0, stockCount = 0;
  
  console.log(`Generating ${PO_COUNT} POs with GRNs, invoices, stock...`);
  
  for (let p = 0; p < PO_COUNT; p++) {
    // Pick centre
    let rnd = Math.random(), cum = 0, centreCode = 'SHI';
    for (const c of CENTRES_W) { cum += c.weight; if (rnd <= cum) { centreCode = c.code; break; } }
    
    const vendorIdx = Math.floor(Math.random() * VENDORS.length);
    const vendor = VENDORS[vendorIdx];
    const vendorCode = `H1V-${String(vendorIdx + 1).padStart(4, '0')}`;
    
    const month = Math.floor(Math.random() * 3) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    const poDate = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const ym = `26${String(month).padStart(2, '0')}`;
    const poNum = `H1-${centreCode}-PO-${ym}-${String(p + 1).padStart(3, '0')}`;
    const status = PO_STATUSES[Math.floor(Math.random() * PO_STATUSES.length)];
    const priority = Math.random() < 0.85 ? 'normal' : Math.random() < 0.5 ? 'urgent' : 'emergency';
    
    // Pick items
    const numItems = Math.floor(Math.random() * 4) + 2;
    const usedIdx = new Set();
    const lineItems = [];
    let subtotal = 0, gstTotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      let idx; do { idx = Math.floor(Math.random() * ITEMS.length); } while (usedIdx.has(idx));
      usedIdx.add(idx);
      const item = ITEMS[idx];
      const qty = Math.floor(Math.random() * 50) + 5;
      const rate = Math.round(item.rate * (0.9 + Math.random() * 0.2) * 100) / 100;
      const lineTotal = qty * rate;
      const lineGst = Math.round(lineTotal * item.gst / 100 * 100) / 100;
      subtotal += lineTotal;
      gstTotal += lineGst;
      const recvQty = status.includes('received') ? qty : (status === 'partially_received' && j === 0 ? Math.floor(qty * 0.6) : 0);
      lineItems.push({
        itemCode: `H1I-${String(idx + 1).padStart(5, '0')}`,
        qty, recvQty, rate, unit: item.unit, gst: item.gst,
        gstAmt: lineGst, total: Math.round((lineTotal + lineGst) * 100) / 100,
      });
    }
    
    const total = Math.round((subtotal + gstTotal) * 100) / 100;
    
    // Insert PO
    const { data: po, error: poErr } = await supabase.from('purchase_orders').upsert({
      po_number: poNum, centre_id: cMap[centreCode], vendor_id: vMap[vendorCode],
      status, po_date: poDate, priority,
      subtotal: Math.round(subtotal * 100) / 100,
      gst_amount: Math.round(gstTotal * 100) / 100,
      total_amount: total,
    }, { onConflict: 'po_number' }).select('id').single();
    
    if (poErr || !po) continue;
    poCount++;
    
    // Insert line items
    const liRows = lineItems.map(li => ({
      po_id: po.id, item_id: iMap[li.itemCode],
      ordered_qty: li.qty, received_qty: li.recvQty,
      unit: li.unit, rate: li.rate,
      gst_percent: li.gst, gst_amount: li.gstAmt, total_amount: li.total,
    }));
    await supabase.from('purchase_order_items').insert(liRows);
    
    // GRN for received
    if (status.includes('received')) {
      const grnDays = Math.floor(Math.random() * 7) + 2;
      const grnDate = new Date(poDate);
      grnDate.setDate(grnDate.getDate() + grnDays);
      const grnDateStr = grnDate.toISOString().split('T')[0];
      const grnNum = `H1-${centreCode}-GRN-${ym}-${String(p + 1).padStart(3, '0')}`;
      
      const { data: grn } = await supabase.from('grns').upsert({
        grn_number: grnNum, centre_id: cMap[centreCode], po_id: po.id, vendor_id: vMap[vendorCode],
        grn_date: grnDateStr, status: 'verified',
        vendor_invoice_no: `VINV-${String(p + 1).padStart(4, '0')}`,
        vendor_invoice_amount: total,
      }, { onConflict: 'grn_number' }).select('id').single();
      
      if (grn) {
        grnCount++;
        
        // Invoice (80% of fully received)
        if (status === 'fully_received' && Math.random() < 0.8) {
          const invNum = `H1-${centreCode}-INV-${ym}-${String(p + 1).padStart(3, '0')}`;
          const payStatus = Math.random() < 0.4 ? 'paid' : Math.random() < 0.6 ? 'unpaid' : 'partial';
          const matchStatus = Math.random() < 0.7 ? 'matched' : Math.random() < 0.5 ? 'partial_match' : 'mismatch';
          const paidAmt = payStatus === 'paid' ? total : payStatus === 'partial' ? Math.round(total * 0.5) : 0;
          const dueDate = new Date(grnDateStr);
          dueDate.setDate(dueDate.getDate() + vendor.credit);
          
          const { error: invErr } = await supabase.from('invoices').upsert({
            invoice_ref: invNum,
            vendor_invoice_no: `VINV-${String(p + 1).padStart(4, '0')}`,
            vendor_invoice_date: grnDateStr,
            centre_id: cMap[centreCode], vendor_id: vMap[vendorCode],
            grn_id: grn.id, po_id: po.id,
            subtotal: Math.round(subtotal * 100) / 100,
            gst_amount: Math.round(gstTotal * 100) / 100,
            total_amount: total,
            match_status: matchStatus, payment_status: payStatus, paid_amount: paidAmt,
            credit_period_days: vendor.credit,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'approved',
          }, { onConflict: 'invoice_ref' });
          
          if (!invErr) invCount++;
        }
      }
      
      // Stock
      for (const li of lineItems) {
        const stock = Math.floor(Math.random() * 200) + 10;
        const reorder = Math.floor(Math.random() * 30) + 5;
        await supabase.from('item_centre_stock').upsert({
          item_id: iMap[li.itemCode], centre_id: cMap[centreCode],
          current_stock: stock, reorder_level: reorder, max_level: stock * 3,
          last_grn_date: poDate, last_grn_rate: li.rate,
        }, { onConflict: 'item_id,centre_id' });
        stockCount++;
      }
    }
    
    if ((p + 1) % 50 === 0) console.log(`  ... ${p + 1}/${PO_COUNT} POs`);
  }
  
  console.log(`\n═══ SEED COMPLETE ═══`);
  console.log(`  Vendors:  ${insertedVendors.length}`);
  console.log(`  Items:    ${insertedItems.length}`);
  console.log(`  POs:      ${poCount}`);
  console.log(`  GRNs:     ${grnCount}`);
  console.log(`  Invoices: ${invCount}`);
  console.log(`  Stock:    ${stockCount} entries`);
}

seed().catch(console.error);
