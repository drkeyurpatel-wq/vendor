import { createClient } from '@/lib/supabase/server'
import { requireApiAuthWithProfile } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { withApiErrorHandler } from '@/lib/api-error-handler'

// ─── Master Data: Centres ───────────────────────────────────
const CENTRES = [
  { code: 'SHI', name: 'Shilaj',      city: 'Ahmedabad',   state: 'Gujarat',   address: 'Nr Shilaj Circle, Shilaj Road, Ahmedabad',   phone: '+91 79 2717 0001', email: 'shilaj@health1.in',      is_active: true },
  { code: 'VAS', name: 'Vastral',      city: 'Ahmedabad',   state: 'Gujarat',   address: 'Vastral Main Road, Ahmedabad',               phone: '+91 79 2583 0002', email: 'vastral@health1.in',     is_active: true },
  { code: 'MOD', name: 'Modasa',       city: 'Modasa',      state: 'Gujarat',   address: 'Station Road, Modasa, Aravalli',             phone: '+91 2774 242003',  email: 'modasa@health1.in',      is_active: true },
  { code: 'UDA', name: 'Udaipur',      city: 'Udaipur',     state: 'Rajasthan', address: 'Hiran Magri, Sector 11, Udaipur',            phone: '+91 294 248 0004', email: 'udaipur@health1.in',     is_active: true },
  { code: 'GAN', name: 'Gandhinagar',  city: 'Gandhinagar', state: 'Gujarat',   address: 'Sector 21, Gandhinagar',                     phone: '+91 79 2322 0005', email: 'gandhinagar@health1.in', is_active: true },
]

// ─── Master Data: Vendor Categories ─────────────────────────
const VENDOR_CATEGORIES = [
  { code: 'PHARMA',   name: 'Pharmaceuticals',             description: 'Drugs, medicines, and pharmaceutical supplies' },
  { code: 'SURGICAL', name: 'Surgical & Disposables',       description: 'Surgical instruments, sutures, disposable items' },
  { code: 'EQUIP',    name: 'Medical Equipment',            description: 'Diagnostic & therapeutic medical equipment' },
  { code: 'IMPLANT',  name: 'Implants & Prosthetics',       description: 'Orthopaedic implants, stents, prosthetics' },
  { code: 'LAB',      name: 'Laboratory & Diagnostics',     description: 'Lab reagents, kits, diagnostic consumables' },
  { code: 'CONS',     name: 'General Consumables',          description: 'Gloves, syringes, masks, cotton, gauze' },
  { code: 'IT',       name: 'IT & Technology',              description: 'Computers, printers, networking, software licenses' },
  { code: 'FMCG',     name: 'Housekeeping & FMCG',         description: 'Cleaning supplies, toiletries, housekeeping items' },
  { code: 'FURN',     name: 'Furniture & Fixtures',         description: 'Hospital beds, chairs, tables, wardrobes' },
  { code: 'MAINT',    name: 'AMC & Maintenance',            description: 'Annual maintenance contracts, repair services' },
  { code: 'FOOD',     name: 'Food & Dietary',               description: 'Canteen supplies, patient dietary supplies' },
  { code: 'LINEN',    name: 'Linen & Laundry',              description: 'Bed sheets, towels, patient gowns, uniforms' },
  { code: 'STAT',     name: 'Stationery & Printing',        description: 'Office stationery, forms, printing services' },
  { code: 'OTHER',    name: 'Other / Miscellaneous',        description: 'Uncategorised vendor supplies' },
]

// ─── Master Data: Item Categories (hierarchical) ────────────
const ITEM_CATEGORIES: { code: string; name: string; children?: { code: string; name: string }[] }[] = [
  {
    code: 'DRUG', name: 'Drugs & Medicines',
    children: [
      { code: 'DRUG-TAB',  name: 'Tablets & Capsules' },
      { code: 'DRUG-INJ',  name: 'Injectables' },
      { code: 'DRUG-SYR',  name: 'Syrups & Liquids' },
      { code: 'DRUG-OIN',  name: 'Ointments & Creams' },
      { code: 'DRUG-EYE',  name: 'Eye / Ear / Nasal Drops' },
      { code: 'DRUG-IV',   name: 'IV Fluids & Solutions' },
      { code: 'DRUG-ANE',  name: 'Anaesthesia Drugs' },
      { code: 'DRUG-ONCO', name: 'Oncology Drugs' },
    ]
  },
  {
    code: 'SURG', name: 'Surgical Supplies',
    children: [
      { code: 'SURG-SUT', name: 'Sutures' },
      { code: 'SURG-INS', name: 'Surgical Instruments' },
      { code: 'SURG-DRN', name: 'Drains & Catheters' },
      { code: 'SURG-DSP', name: 'Surgical Disposables' },
    ]
  },
  {
    code: 'IMPL', name: 'Implants',
    children: [
      { code: 'IMPL-ORT', name: 'Orthopaedic Implants' },
      { code: 'IMPL-CRD', name: 'Cardiac Stents & Devices' },
      { code: 'IMPL-SPL', name: 'Spinal Implants' },
      { code: 'IMPL-DEN', name: 'Dental Implants' },
    ]
  },
  {
    code: 'CONS', name: 'Consumables',
    children: [
      { code: 'CONS-GLV', name: 'Gloves' },
      { code: 'CONS-MSK', name: 'Masks & PPE' },
      { code: 'CONS-BND', name: 'Bandages & Dressings' },
      { code: 'CONS-NED', name: 'Needles & Syringes' },
      { code: 'CONS-CTN', name: 'Cotton & Gauze' },
    ]
  },
  {
    code: 'DIAG', name: 'Diagnostics & Lab',
    children: [
      { code: 'DIAG-REA', name: 'Lab Reagents' },
      { code: 'DIAG-KIT', name: 'Diagnostic Kits' },
      { code: 'DIAG-SLD', name: 'Slides & Containers' },
      { code: 'DIAG-RAD', name: 'Radiology Consumables' },
    ]
  },
  {
    code: 'EQUIP', name: 'Equipment',
    children: [
      { code: 'EQUIP-MON', name: 'Monitors & Vital Signs' },
      { code: 'EQUIP-VNT', name: 'Ventilators & Respiratory' },
      { code: 'EQUIP-IMG', name: 'Imaging Equipment' },
      { code: 'EQUIP-OT',  name: 'OT Equipment' },
      { code: 'EQUIP-LAB', name: 'Lab Analysers' },
    ]
  },
  { code: 'LINEN', name: 'Linen & Laundry' },
  { code: 'FOOD',  name: 'Food & Dietary Supplies' },
  { code: 'IT',    name: 'IT & Technology' },
  { code: 'STAT',  name: 'Stationery & Office' },
  { code: 'FURN',  name: 'Furniture & Fixtures' },
  { code: 'HSKP',  name: 'Housekeeping Supplies' },
  { code: 'OTHER', name: 'Miscellaneous' },
]

export const POST = withApiErrorHandler(async () => {
  // Block seed endpoint in production
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SEED) {
    return NextResponse.json(
      { error: 'Seed endpoint is disabled in production. Set ALLOW_SEED=1 to enable.' },
      { status: 403 }
    )
  }

  const supabase = await createClient()

  // Verify user is group_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const { data: seedProfile } = await supabase.from('user_profiles').select('role').eq('id', user.id).single()
  if (!seedProfile || seedProfile.role !== 'group_admin') {
    return NextResponse.json({ error: 'Only group_admin can seed data' }, { status: 403 })
  }

  const results: string[] = []

  // ─── Seed Centres ──────────────────────────────
  const { data: existingCentres } = await supabase.from('centres').select('code')
  const existingCentreCodes = new Set((existingCentres ?? []).map(c => c.code))
  const newCentres = CENTRES.filter(c => !existingCentreCodes.has(c.code))

  if (newCentres.length > 0) {
    const { error } = await supabase.from('centres').insert(newCentres)
    if (error) results.push(`Centres error: ${error.message}`)
    else results.push(`Added ${newCentres.length} centres`)
  } else {
    results.push(`Centres: all ${CENTRES.length} already exist`)
  }

  // ─── Seed Vendor Categories ────────────────────
  const { data: existingVC } = await supabase.from('vendor_categories').select('code')
  const existingVCCodes = new Set((existingVC ?? []).map(c => c.code))
  const newVC = VENDOR_CATEGORIES
    .filter(c => !existingVCCodes.has(c.code))
    .map(c => ({ ...c, is_active: true }))

  if (newVC.length > 0) {
    const { error } = await supabase.from('vendor_categories').insert(newVC)
    if (error) results.push(`Vendor categories error: ${error.message}`)
    else results.push(`Added ${newVC.length} vendor categories`)
  } else {
    results.push(`Vendor categories: all ${VENDOR_CATEGORIES.length} already exist`)
  }

  // ─── Seed Item Categories (hierarchical) ───────
  const { data: existingIC } = await supabase.from('item_categories').select('code, id')
  const existingICMap = new Map((existingIC ?? []).map(c => [c.code, c.id]))
  let icAdded = 0

  for (const cat of ITEM_CATEGORIES) {
    let parentId = existingICMap.get(cat.code)

    // Insert parent if missing
    if (!parentId) {
      const { data, error } = await supabase
        .from('item_categories')
        .insert({ code: cat.code, name: cat.name, parent_id: null, is_active: true })
        .select('id')
        .single()

      if (error) {
        results.push(`Item category ${cat.code} error: ${error.message}`)
        continue
      }
      parentId = data.id
      existingICMap.set(cat.code, parentId)
      icAdded++
    }

    // Insert children
    if (cat.children) {
      for (const child of cat.children) {
        if (!existingICMap.has(child.code)) {
          const { data, error } = await supabase
            .from('item_categories')
            .insert({ code: child.code, name: child.name, parent_id: parentId, is_active: true })
            .select('id')
            .single()

          if (error) {
            results.push(`Item sub-category ${child.code} error: ${error.message}`)
          } else {
            existingICMap.set(child.code, data.id)
            icAdded++
          }
        }
      }
    }
  }

  if (icAdded > 0) results.push(`Added ${icAdded} item categories`)
  else results.push(`Item categories: all already exist`)

  // ─── Seed Sample Vendors ─────────────────────────
  const { data: existingVendors } = await supabase.from('vendors').select('vendor_code').is('deleted_at', null)
  const existingVendorCodes = new Set((existingVendors ?? []).map(v => v.vendor_code))

  // Get category IDs for vendor assignment
  const { data: vcData } = await supabase.from('vendor_categories').select('id, code')
  const vcMap = new Map((vcData ?? []).map(c => [c.code, c.id]))

  const SAMPLE_VENDORS = [
    { vendor_code: 'H1V-0001', legal_name: 'Zydus Lifesciences Ltd',       trade_name: 'Zydus Cadila',        vendor_type: 'manufacturer' as const, category_code: 'PHARMA',   gstin: '24AABCZ1234M1Z5', pan: 'AABCZ1234M', city: 'Ahmedabad', state: 'Gujarat', credit_period_days: 45, primary_contact_name: 'Rajesh Mehta',    primary_contact_phone: '+91 98250 10001', primary_contact_email: 'rajesh@zydus.com' },
    { vendor_code: 'H1V-0002', legal_name: 'Sun Pharmaceutical Industries', trade_name: 'Sun Pharma',          vendor_type: 'manufacturer' as const, category_code: 'PHARMA',   gstin: '24AABCS5678N2Z3', pan: 'AABCS5678N', city: 'Vadodara',  state: 'Gujarat', credit_period_days: 30, primary_contact_name: 'Amit Sharma',     primary_contact_phone: '+91 98250 10002', primary_contact_email: 'amit@sunpharma.com' },
    { vendor_code: 'H1V-0003', legal_name: 'Hindustan Syringes & Medical',  trade_name: 'HMD',                 vendor_type: 'manufacturer' as const, category_code: 'CONS',     gstin: '07AABCH9012P3Z1', pan: 'AABCH9012P', city: 'Faridabad', state: 'Haryana', credit_period_days: 30, primary_contact_name: 'Priya Gupta',     primary_contact_phone: '+91 98100 20003', primary_contact_email: 'priya@hmdhealthcare.com' },
    { vendor_code: 'H1V-0004', legal_name: 'Medline India Pvt Ltd',         trade_name: 'Medline',             vendor_type: 'distributor' as const,  category_code: 'SURGICAL', gstin: '24AABCM3456Q4Z9', pan: 'AABCM3456Q', city: 'Ahmedabad', state: 'Gujarat', credit_period_days: 60, primary_contact_name: 'Suresh Patel',    primary_contact_phone: '+91 98250 30004', primary_contact_email: 'suresh@medlineindia.com' },
    { vendor_code: 'H1V-0005', legal_name: 'BPL Medical Technologies',      trade_name: 'BPL Medical',         vendor_type: 'manufacturer' as const, category_code: 'EQUIP',    gstin: '29AABCB7890R5Z7', pan: 'AABCB7890R', city: 'Bangalore', state: 'Karnataka', credit_period_days: 45, primary_contact_name: 'Kiran Kumar',  primary_contact_phone: '+91 98450 40005', primary_contact_email: 'kiran@bplmedical.com' },
    { vendor_code: 'H1V-0006', legal_name: 'Romsons Scientific & Surgical', trade_name: 'Romsons',             vendor_type: 'manufacturer' as const, category_code: 'CONS',     gstin: '09AABCR2345S6Z5', pan: 'AABCR2345S', city: 'Agra',      state: 'Uttar Pradesh', credit_period_days: 30, primary_contact_name: 'Vikram Singh', primary_contact_phone: '+91 95620 50006', primary_contact_email: 'vikram@romsons.com' },
    { vendor_code: 'H1V-0007', legal_name: 'Reckitt Benckiser Healthcare',  trade_name: 'Dettol / Reckitt',    vendor_type: 'manufacturer' as const, category_code: 'FMCG',     gstin: '27AABCR6789T7Z3', pan: 'AABCR6789T', city: 'Mumbai',    state: 'Maharashtra', credit_period_days: 45, primary_contact_name: 'Neha Kapoor',   primary_contact_phone: '+91 98200 60007', primary_contact_email: 'neha@reckitt.com' },
    { vendor_code: 'H1V-0008', legal_name: 'Johnson & Johnson Medical',     trade_name: 'J&J Medical India',   vendor_type: 'manufacturer' as const, category_code: 'IMPLANT',  gstin: '27AABCJ1234U8Z1', pan: 'AABCJ1234U', city: 'Mumbai',    state: 'Maharashtra', credit_period_days: 60, primary_contact_name: 'Deepak Joshi',  primary_contact_phone: '+91 98200 70008', primary_contact_email: 'deepak@jnj.com' },
    { vendor_code: 'H1V-0009', legal_name: 'Agappe Diagnostics Ltd',        trade_name: 'Agappe',              vendor_type: 'manufacturer' as const, category_code: 'LAB',      gstin: '32AABCA5678V9Z9', pan: 'AABCA5678V', city: 'Ernakulam', state: 'Kerala', credit_period_days: 30, primary_contact_name: 'Thomas Mathew',   primary_contact_phone: '+91 98470 80009', primary_contact_email: 'thomas@agappe.com' },
    { vendor_code: 'H1V-0010', legal_name: 'Godrej Interio',                trade_name: 'Godrej Interio',      vendor_type: 'manufacturer' as const, category_code: 'FURN',     gstin: '27AABCG9012W1Z7', pan: 'AABCG9012W', city: 'Mumbai',    state: 'Maharashtra', credit_period_days: 30, primary_contact_name: 'Anjali Desai',  primary_contact_phone: '+91 98200 90010', primary_contact_email: 'anjali@godrejinterio.com' },
  ]

  const newVendors = SAMPLE_VENDORS.filter(v => !existingVendorCodes.has(v.vendor_code))
  let vendorsAdded = 0

  for (const v of newVendors) {
    const { category_code, ...vendorData } = v
    const payload = {
      ...vendorData,
      category_id: vcMap.get(category_code) || null,
      status: 'active',
      address: `${v.city}, ${v.state}`,
      pincode: null,
      bank_name: null,
      bank_account_no: null,
      bank_ifsc: null,
    }
    const { error } = await supabase.from('vendors').insert(payload)
    if (error) results.push(`Vendor ${v.vendor_code} error: ${error.message}`)
    else vendorsAdded++
  }

  if (vendorsAdded > 0) results.push(`Added ${vendorsAdded} sample vendors`)
  else if (newVendors.length === 0) results.push(`Vendors: all ${SAMPLE_VENDORS.length} already exist`)

  // ─── Seed Sample Items ───────────────────────────
  const { data: existingItems } = await supabase.from('items').select('item_code').is('deleted_at', null)
  const existingItemCodes = new Set((existingItems ?? []).map(i => i.item_code))

  // Get category IDs for item assignment
  const { data: icData } = await supabase.from('item_categories').select('id, code')
  const icMap = new Map((icData ?? []).map(c => [c.code, c.id]))

  const SAMPLE_ITEMS = [
    { item_code: 'H1I-00001', generic_name: 'Paracetamol 500mg Tablet',     category_code: 'DRUG-TAB',  unit: 'Tab',    hsn_code: '30049099', gst_rate: 12 },
    { item_code: 'H1I-00002', generic_name: 'Amoxicillin 500mg Capsule',    category_code: 'DRUG-TAB',  unit: 'Cap',    hsn_code: '30041011', gst_rate: 12 },
    { item_code: 'H1I-00003', generic_name: 'Ceftriaxone 1g Injection',     category_code: 'DRUG-INJ',  unit: 'Vial',   hsn_code: '30049099', gst_rate: 12 },
    { item_code: 'H1I-00004', generic_name: 'Normal Saline 500ml IV',       category_code: 'DRUG-IV',   unit: 'Bottle', hsn_code: '30049099', gst_rate: 12 },
    { item_code: 'H1I-00005', generic_name: 'Omeprazole 20mg Capsule',      category_code: 'DRUG-TAB',  unit: 'Cap',    hsn_code: '30049099', gst_rate: 12 },
    { item_code: 'H1I-00006', generic_name: 'Ringer Lactate 500ml',         category_code: 'DRUG-IV',   unit: 'Bottle', hsn_code: '30049099', gst_rate: 12 },
    { item_code: 'H1I-00007', generic_name: 'Disposable Syringe 5ml',       category_code: 'CONS-NED',  unit: 'Pc',     hsn_code: '90183100', gst_rate: 12 },
    { item_code: 'H1I-00008', generic_name: 'Surgical Gloves (Sterile) 7.5', category_code: 'CONS-GLV', unit: 'Pair',   hsn_code: '40151100', gst_rate: 18 },
    { item_code: 'H1I-00009', generic_name: 'N95 Mask',                     category_code: 'CONS-MSK',  unit: 'Pc',     hsn_code: '63079090', gst_rate: 5  },
    { item_code: 'H1I-00010', generic_name: 'Cotton Roll 500g',             category_code: 'CONS-CTN',  unit: 'Roll',   hsn_code: '30059090', gst_rate: 12 },
    { item_code: 'H1I-00011', generic_name: 'Chromic Catgut Suture 2-0',    category_code: 'SURG-SUT',  unit: 'Pc',     hsn_code: '30061010', gst_rate: 12 },
    { item_code: 'H1I-00012', generic_name: 'Foley Catheter 16Fr',          category_code: 'SURG-DRN',  unit: 'Pc',     hsn_code: '90183900', gst_rate: 12 },
    { item_code: 'H1I-00013', generic_name: 'Betadine Solution 500ml',      category_code: 'DRUG-OIN',  unit: 'Bottle', hsn_code: '30049099', gst_rate: 12 },
    { item_code: 'H1I-00014', generic_name: 'Crepe Bandage 6 inch',         category_code: 'CONS-BND',  unit: 'Roll',   hsn_code: '30059010', gst_rate: 12 },
    { item_code: 'H1I-00015', generic_name: 'Pulse Oximeter Probe (Reuse)', category_code: 'EQUIP-MON', unit: 'Pc',     hsn_code: '90189099', gst_rate: 12 },
    { item_code: 'H1I-00016', generic_name: 'Blood Glucose Test Strip',     category_code: 'DIAG-KIT',  unit: 'Strip',  hsn_code: '38220090', gst_rate: 12 },
    { item_code: 'H1I-00017', generic_name: 'Ondansetron 4mg Injection',    category_code: 'DRUG-INJ',  unit: 'Amp',    hsn_code: '30049099', gst_rate: 12 },
    { item_code: 'H1I-00018', generic_name: 'Examination Gloves (Box 100)', category_code: 'CONS-GLV',  unit: 'Box',    hsn_code: '40151900', gst_rate: 18 },
    { item_code: 'H1I-00019', generic_name: 'Surgical Blade No. 22',        category_code: 'SURG-INS',  unit: 'Pc',     hsn_code: '82121090', gst_rate: 18 },
    { item_code: 'H1I-00020', generic_name: 'Bed Sheet Hospital (White)',    category_code: 'LINEN',     unit: 'Pc',     hsn_code: '63023100', gst_rate: 5  },
  ]

  const newItems = SAMPLE_ITEMS.filter(i => !existingItemCodes.has(i.item_code))
  let itemsAdded = 0

  for (const item of newItems) {
    const { category_code, ...itemData } = item
    const { error } = await supabase.from('items').insert({
      ...itemData,
      category_id: icMap.get(category_code) || null,
      is_active: true,
    })
    if (error) results.push(`Item ${item.item_code} error: ${error.message}`)
    else itemsAdded++
  }

  if (itemsAdded > 0) results.push(`Added ${itemsAdded} sample items`)
  else if (newItems.length === 0) results.push(`Items: all ${SAMPLE_ITEMS.length} already exist`)

  // ─── Seed Sample PO ──────────────────────────────
  const { count: poCount } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null)

  if ((poCount ?? 0) === 0) {
    // Get first centre and first vendor for demo PO
    const { data: centreRows } = await supabase.from('centres').select('id, code').eq('is_active', true).order('code').limit(1)
    const { data: vendorRows } = await supabase.from('vendors').select('id, vendor_code').eq('status', 'active').is('deleted_at', null).order('vendor_code').limit(1)
    const { data: itemRows } = await supabase.from('items').select('id, item_code, generic_name, gst_rate').is('deleted_at', null).order('item_code').limit(3)

    if (centreRows?.[0] && vendorRows?.[0] && itemRows && itemRows.length > 0) {
      const centre = centreRows[0]
      const vendor = vendorRows[0]
      const now = new Date()
      const yymm = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}`
      const poNumber = `H1-${centre.code}-PO-${yymm}-001`

      // Line items
      const lineItems = itemRows.map((item, idx) => ({
        item_id: item.id,
        quantity: (idx + 1) * 100,
        unit_rate: [2.5, 8.0, 120.0][idx] ?? 10.0,
        gst_rate: item.gst_rate ?? 12,
      }))

      const subtotal = lineItems.reduce((s, l) => s + l.quantity * l.unit_rate, 0)
      const gstAmount = lineItems.reduce((s, l) => s + l.quantity * l.unit_rate * (l.gst_rate / 100), 0)
      const totalAmount = subtotal + gstAmount

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert({
          po_number: poNumber,
          centre_id: centre.id,
          vendor_id: vendor.id,
          po_date: now.toISOString().split('T')[0],
          expected_delivery_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          status: 'approved',
          subtotal,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          supply_type: 'intra_state',
          payment_terms: 'Net 30',
        })
        .select('id')
        .single()

      if (poError) {
        results.push(`Demo PO error: ${poError.message}`)
      } else {
        // Insert PO line items
        const poLineItems = lineItems.map((l, idx) => ({
          po_id: po.id,
          item_id: l.item_id,
          quantity: l.quantity,
          unit_rate: l.unit_rate,
          gst_rate: l.gst_rate,
          gst_amount: l.quantity * l.unit_rate * (l.gst_rate / 100),
          total_amount: l.quantity * l.unit_rate * (1 + l.gst_rate / 100),
          line_number: idx + 1,
        }))

        const { error: poiError } = await supabase.from('purchase_order_items').insert(poLineItems)
        if (poiError) results.push(`PO line items error: ${poiError.message}`)
        else results.push(`Added demo PO ${poNumber} with ${lineItems.length} line items (₹${totalAmount.toFixed(0)})`)
      }
    } else {
      results.push('Demo PO: skipped (need centres, vendors, and items first)')
    }
  } else {
    results.push(`POs: ${poCount} already exist, skipping demo PO`)
  }

  return NextResponse.json({ success: true, results })
})
