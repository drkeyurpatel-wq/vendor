import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

export async function POST() {
  const supabase = await createClient()

  // Verify user is group_admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'group_admin') {
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

  return NextResponse.json({ success: true, results })
}
