#!/bin/bash
set -e

URL="https://dwukvdtacwvnudqjlwrb.supabase.co/rest/v1"
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dWt2ZHRhY3d2bnVkcWpsd3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyOTAyMywiZXhwIjoyMDg4ODA1MDIzfQ._M1ZU2aKVja9MwhFd87sJUbXulZ60QasU7k9cJpXNog"
H1="apikey: ${KEY}"
H2="Authorization: Bearer ${KEY}"
H3="Content-Type: application/json"
H4="Prefer: return=representation"
H5="Prefer: resolution=merge-duplicates,return=representation"

echo "═══ H1 VPMS LIVE SEED ═══"

# Get category maps
echo "Fetching categories..."
VCATS=$(curl -s "$URL/vendor_categories?select=id,code" -H "$H1" -H "$H2")
ICATS=$(curl -s "$URL/item_categories?select=id,code" -H "$H1" -H "$H2")
CENTRES=$(curl -s "$URL/centres?select=id,code" -H "$H1" -H "$H2")

echo "Vendor cats: $(echo $VCATS | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
echo "Item cats: $(echo $ICATS | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"
echo "Centres: $(echo $CENTRES | python3 -c 'import sys,json;print(len(json.load(sys.stdin)))')"

# Use Python to generate and push the data via REST
python3 << 'PYEOF'
import json, subprocess, random, sys
from datetime import datetime, timedelta

URL = "https://dwukvdtacwvnudqjlwrb.supabase.co/rest/v1"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dWt2ZHRhY3d2bnVkcWpsd3JiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIyOTAyMywiZXhwIjoyMDg4ODA1MDIzfQ._M1ZU2aKVja9MwhFd87sJUbXulZ60QasU7k9cJpXNog"

def api(endpoint, data, method="POST", upsert=False):
    headers = ["-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}", "-H", "Content-Type: application/json"]
    if upsert:
        headers += ["-H", "Prefer: resolution=merge-duplicates,return=representation"]
    else:
        headers += ["-H", "Prefer: return=representation"]
    cmd = ["curl", "-s", "-X", method, f"{URL}/{endpoint}"] + headers + ["-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return json.loads(r.stdout)
    except:
        print(f"  ERROR on {endpoint}: {r.stdout[:200]}")
        return None

def get(endpoint):
    cmd = ["curl", "-s", f"{URL}/{endpoint}", "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}"]
    r = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(r.stdout)

# Load maps
vcats = {c["code"]: c["id"] for c in get("vendor_categories?select=id,code")}
icats = {c["code"]: c["id"] for c in get("item_categories?select=id,code")}
centres = {c["code"]: c["id"] for c in get("centres?select=id,code")}
print(f"Maps loaded: {len(vcats)} vendor cats, {len(icats)} item cats, {len(centres)} centres")

# ═══ VENDORS ═══
VENDORS = [
    ("Zydus Healthcare Ltd", "Zydus Cadila", "PHARMA", "24AABCZ1234M1Z5", "AABCZ1234M", "Ahmedabad", "Gujarat", "380015", "Rajesh Mehta", "9825012345", "rajesh@zydus.com", 30),
    ("Torrent Pharmaceuticals Ltd", "Torrent Pharma", "PHARMA", "24AABCT5678N1Z3", "AABCT5678N", "Ahmedabad", "Gujarat", "380054", "Vivek Shah", "9825023456", "vivek@torrent.com", 45),
    ("Intas Pharmaceuticals Ltd", "Intas Pharma", "PHARMA", "24AABCI9012P1Z1", "AABCI9012P", "Ahmedabad", "Gujarat", "380061", "Hiren Patel", "9825034567", "hiren@intas.com", 30),
    ("Sun Pharmaceutical Distributors", "Sun Pharma", "PHARMA", "24AABCS3456Q1Z9", "AABCS3456Q", "Vadodara", "Gujarat", "390007", "Amit Desai", "9825045678", "amit@sunpharma.com", 30),
    ("Cadila Healthcare Ltd", "Cadila", "PHARMA", "24AABCC7890R1Z7", "AABCC7890R", "Ahmedabad", "Gujarat", "380019", "Ketan Joshi", "9825056789", "ketan@cadila.com", 45),
    ("Cipla Gujarat Division", "Cipla", "PHARMA", "24AABCC5678T1Z3", "AABCC5678T", "Ahmedabad", "Gujarat", "380009", "Nirav Vyas", "9825078901", "nirav@cipla.com", 60),
    ("Johnson & Johnson Medical India", "J&J Medical", "SURGICAL", "24AABCJ3456V1Z9", "AABCJ3456V", "Ahmedabad", "Gujarat", "380058", "Prashant Kumar", "9825090123", "prashant@jnj.com", 45),
    ("Medtronic India Pvt Ltd", "Medtronic", "SURGICAL", "27AABCM7890W1Z7", "AABCM7890W", "Mumbai", "Maharashtra", "400093", "Ankit Sharma", "9825001234", "ankit@medtronic.com", 60),
    ("BD India Pvt Ltd", "Becton Dickinson", "SURGICAL", "24AABCB1234X1Z5", "AABCB1234X", "Ahmedabad", "Gujarat", "380015", "Deepak Patel", "9825011234", "deepak@bd.com", 30),
    ("B Braun Medical India", "B Braun", "SURGICAL", "24AABCB5678Y1Z3", "AABCB5678Y", "Ahmedabad", "Gujarat", "380059", "Manish Thakkar", "9825021234", "manish@bbraun.com", 45),
    ("Romsons International", "Romsons", "SURGICAL", "09AABCR9012Z1Z1", "AABCR9012Z", "Agra", "Uttar Pradesh", "282001", "Rakesh Gupta", "9825031234", "rakesh@romsons.com", 30),
    ("Mindray Medical India", "Mindray", "EQUIP", "27AABCM7890B1Z7", "AABCM7890B", "Mumbai", "Maharashtra", "400072", "Chen Wei", "9825051234", "chen@mindray.com", 90),
    ("Roche Diagnostics India", "Roche", "LAB", "27AABCR1234E1Z1", "AABCR1234E", "Mumbai", "Maharashtra", "400076", "Sanjay Mishra", "9825081234", "sanjay@roche.com", 60),
    ("Transasia Bio-Medicals", "Transasia", "LAB", "27AABCT9012G1Z7", "AABCT9012G", "Mumbai", "Maharashtra", "400063", "Sunil Kumar", "9825002345", "sunil@transasia.com", 45),
    ("Diversey India Pvt Ltd", "Diversey", "HOUSE", "27AABCD3456H1Z5", "AABCD3456H", "Mumbai", "Maharashtra", "400076", "Mahesh Yadav", "9825012346", "mahesh@diversey.com", 30),
    ("Satguru Enterprises", "Satguru", "HOUSE", "24AABCS7890I1Z3", "AABCS7890I", "Ahmedabad", "Gujarat", "380007", "Ramesh Suthar", "9825022345", "ramesh@satguru.com", 15),
    ("Abbott Nutrition India", "Abbott", "PHARMA", "27AABCA5678K1Z9", "AABCA5678K", "Mumbai", "Maharashtra", "400013", "Pooja Verma", "9825042345", "pooja@abbott.com", 45),
    ("Dell Technologies India", "Dell", "IT", "29AABCD9012L1Z7", "AABCD9012L", "Bengaluru", "Karnataka", "560103", "Arun Krishnan", "9825052345", "arun@dell.com", 30),
    ("INOX Air Products Ltd", "INOX", "EQUIP", "24AABCI1234O1Z1", "AABCI1234O", "Vadodara", "Gujarat", "390023", "Pramod Jain", "9825082345", "pramod@inoxap.com", 30),
    ("Welspun Health Linens", "Welspun", "HOUSE", "24AABCW5678P1Z9", "AABCW5678P", "Ahmedabad", "Gujarat", "380052", "Gaurav Pandya", "9825092345", "gaurav@welspun.com", 30),
]

print(f"\nInserting {len(VENDORS)} vendors...")
vendor_rows = []
for i, v in enumerate(VENDORS):
    cat_id = vcats.get(v[2])
    if not cat_id:
        # Try fuzzy match
        for k in vcats:
            if v[2].upper() in k.upper() or k.upper() in v[2].upper():
                cat_id = vcats[k]; break
    vendor_rows.append({
        "vendor_code": f"H1V-{i+1:04d}", "legal_name": v[0], "trade_name": v[1],
        "category_id": cat_id, "gstin": v[3], "pan": v[4],
        "city": v[5], "state": v[6], "pincode": v[7],
        "primary_contact_name": v[8], "primary_contact_phone": v[9], "primary_contact_email": v[10],
        "credit_period_days": v[11], "bank_name": "HDFC Bank", "bank_ifsc": "HDFC0001234",
        "bank_account_no": f"{50100+i}123456789", "bank_account_type": "current",
        "bank_verified": True, "status": "active", "gstin_verified": True, "pan_verified": True,
        "address": f"{v[5]}, {v[6]}",
    })

result = api("vendors", vendor_rows, upsert=True)
if isinstance(result, list):
    vmap = {r["vendor_code"]: r["id"] for r in result}
    print(f"  ✓ {len(result)} vendors inserted")
else:
    # Fetch existing
    result = get("vendors?select=id,vendor_code&order=vendor_code")
    vmap = {r["vendor_code"]: r["id"] for r in result}
    print(f"  ✓ {len(vmap)} vendors (fetched existing)")

# ═══ ITEMS ═══
ITEMS = [
    ("Amoxicillin 500mg Capsule", "Mox", "PHARMA", "strip", "30042019", 12, "Zydus", 42, False, False, False),
    ("Azithromycin 500mg Tablet", "Azee", "PHARMA", "strip", "30042019", 12, "Cipla", 78, False, False, False),
    ("Ceftriaxone 1g Injection", "Monocef", "PHARMA", "vial", "30042019", 12, "Aristo", 65, True, False, False),
    ("Meropenem 1g Injection", "Meronem", "PHARMA", "vial", "30042019", 12, "AstraZeneca", 850, True, False, True),
    ("Piperacillin-Tazobactam 4.5g", "Tazact", "PHARMA", "vial", "30042019", 12, "Alkem", 420, True, False, True),
    ("Ciprofloxacin 500mg Tablet", "Ciplox", "PHARMA", "strip", "30042019", 12, "Cipla", 35, False, False, False),
    ("Vancomycin 500mg Injection", "Vancoplus", "PHARMA", "vial", "30042019", 12, "Intas", 380, True, False, True),
    ("Paracetamol 500mg Tablet", "Crocin", "PHARMA", "strip", "30042019", 12, "GSK", 12, False, False, False),
    ("Paracetamol 1g IV Infusion", "Perfalgan", "PHARMA", "bottle", "30042019", 12, "BMS", 85, False, False, False),
    ("Tramadol 50mg Capsule", "Tramazac", "PHARMA", "strip", "30042019", 12, "Zydus", 35, False, True, False),
    ("Atorvastatin 20mg Tablet", "Atorva", "PHARMA", "strip", "30042019", 12, "Zydus", 65, False, False, False),
    ("Clopidogrel 75mg Tablet", "Clopilet", "PHARMA", "strip", "30042019", 12, "Sun", 55, False, False, False),
    ("Enoxaparin 40mg Injection", "Clexane", "PHARMA", "prefilled", "30042019", 12, "Sanofi", 380, True, False, True),
    ("Heparin 5000IU Injection", "Heparin Leo", "PHARMA", "vial", "30042019", 12, "Leo", 120, True, False, True),
    ("Amlodipine 5mg Tablet", "Amlong", "PHARMA", "strip", "30042019", 12, "Micro", 28, False, False, False),
    ("Dopamine 200mg Injection", "Dopamine", "PHARMA", "ampoule", "30042019", 12, "Neon", 45, False, False, True),
    ("Normal Saline 0.9% 500ml", "NS", "PHARMA", "bottle", "30049099", 12, "BBraun", 28, False, False, False),
    ("Ringer Lactate 500ml", "RL", "PHARMA", "bottle", "30049099", 12, "BBraun", 32, False, False, False),
    ("Propofol 1% 20ml", "Diprivan", "PHARMA", "ampoule", "30042019", 12, "AZ", 180, True, False, True),
    ("Midazolam 5mg Injection", "Mezolam", "PHARMA", "ampoule", "30042019", 12, "Neon", 25, False, True, True),
    ("Surgical Gloves 7.5", "Supermax", "SURGICAL", "pair", "40151100", 12, "Supermax", 18, False, False, False),
    ("Exam Gloves Nitrile M", "BD", "SURGICAL", "box", "40151100", 12, "BD", 280, False, False, False),
    ("N95 Mask 3M 1860", "3M", "SURGICAL", "nos", "63079090", 12, "3M", 95, False, False, False),
    ("Vicryl 2-0 Suture", "Vicryl", "SURGICAL", "nos", "30061000", 12, "Ethicon", 280, False, False, False),
    ("Ethilon 3-0 Suture", "Ethilon", "SURGICAL", "nos", "30061000", 12, "Ethicon", 185, False, False, False),
    ("Foley Catheter 16Fr", "Romsons", "SURGICAL", "nos", "90183100", 12, "Romsons", 45, False, False, False),
    ("CVC 7Fr Triple Lumen", "Arrow", "SURGICAL", "nos", "90183100", 12, "Teleflex", 2200, False, False, False),
    ("IV Cannula 20G", "Venflon", "SURGICAL", "nos", "90183100", 12, "BD", 22, False, False, False),
    ("DES Stent 3.0x28mm", "Xience", "IMPLANT", "nos", "90213100", 5, "Abbott", 28000, False, False, True),
    ("PTCA Balloon 2.5x20mm", "Sprinter", "IMPLANT", "nos", "90183900", 12, "Medtronic", 8500, False, False, True),
    ("CBC Reagent 1L", "Mindray", "LAB", "bottle", "38220090", 18, "Mindray", 4200, True, False, False),
    ("Glucose Strips 50s", "AccuChek", "LAB", "box", "38220090", 12, "Roche", 750, False, False, False),
    ("Disinfectant 5L", "Bacillocid", "HOUSE", "can", "38089490", 18, "Bode", 1800, False, False, False),
    ("Hand Sanitizer 500ml", "Sterillium", "HOUSE", "bottle", "38089410", 18, "Bode", 280, False, False, False),
    ("Bed Sheet White", "Welspun", "HOUSE", "nos", "63022100", 12, "Welspun", 350, False, False, False),
    ("Ensure 400g Vanilla", "Ensure", "PHARMA", "tin", "21069099", 18, "Abbott", 680, False, False, False),
    ("A4 Paper 500 sheets", "JK Copier", "OTHER", "ream", "48025690", 12, "JK", 220, False, False, False),
    ("Printer Toner HP 78A", "HP", "IT", "nos", "84439990", 18, "HP", 2800, False, False, False),
]

print(f"Inserting {len(ITEMS)} items...")
item_rows = []
for i, it in enumerate(ITEMS):
    cat_id = icats.get(it[2])
    if not cat_id:
        for k in icats:
            if it[2].upper() in k.upper(): cat_id = icats[k]; break
    item_rows.append({
        "item_code": f"H1I-{i+1:05d}", "generic_name": it[0], "brand_name": it[1],
        "category_id": cat_id, "unit": it[3], "hsn_code": it[4], "gst_percent": it[5],
        "manufacturer": it[6], "is_cold_chain": it[8], "is_narcotic": it[9],
        "is_high_alert": it[10], "is_active": True,
    })

result = api("items", item_rows, upsert=True)
if isinstance(result, list):
    imap = {r["item_code"]: r["id"] for r in result}
    print(f"  ✓ {len(result)} items")
else:
    result = get("items?select=id,item_code&order=item_code")
    imap = {r["item_code"]: r["id"] for r in result}
    print(f"  ✓ {len(imap)} items (fetched)")

# ═══ POs + GRNs + INVOICES ═══
CW = [("SHI", 0.40), ("VAS", 0.20), ("MOD", 0.12), ("UDA", 0.13), ("GAN", 0.15)]
STATUSES = ["approved", "sent_to_vendor", "fully_received", "fully_received", "fully_received", "partially_received", "pending_approval"]
PO_COUNT = 200
po_ok = grn_ok = inv_ok = stk_ok = 0

print(f"\nGenerating {PO_COUNT} POs...")
for p in range(PO_COUNT):
    rnd = random.random(); cum = 0; cc = "SHI"
    for code, w in CW:
        cum += w
        if rnd <= cum: cc = code; break
    
    vi = random.randint(0, len(VENDORS)-1)
    vc = f"H1V-{vi+1:04d}"
    month = random.randint(1,3)
    day = random.randint(1,28)
    po_date = f"2026-{month:02d}-{day:02d}"
    ym = f"26{month:02d}"
    po_num = f"H1-{cc}-PO-{ym}-{p+1:03d}"
    status = random.choice(STATUSES)
    priority = "normal" if random.random() < 0.85 else ("urgent" if random.random() < 0.5 else "emergency")
    
    n_items = random.randint(2, 5)
    used = set()
    lines = []
    sub = 0; gst_tot = 0
    for _ in range(n_items):
        while True:
            ix = random.randint(0, len(ITEMS)-1)
            if ix not in used: used.add(ix); break
        it = ITEMS[ix]
        qty = random.randint(5, 50)
        rate = round(it[7] * (0.9 + random.random() * 0.2), 2)
        lt = qty * rate
        lg = round(lt * it[5] / 100, 2)
        sub += lt; gst_tot += lg
        recv = qty if "received" in status else (int(qty*0.6) if status=="partially_received" and len(lines)==0 else 0)
        lines.append({"ic": f"H1I-{ix+1:05d}", "qty": qty, "recv": recv, "rate": rate, "unit": it[3], "gst": it[5], "gst_amt": lg, "total": round(lt+lg,2)})
    
    total = round(sub + gst_tot, 2)
    
    if vc not in vmap or centres.get(cc) is None: continue
    
    po = api("purchase_orders", {
        "po_number": po_num, "centre_id": centres[cc], "vendor_id": vmap[vc],
        "status": status, "po_date": po_date, "priority": priority,
        "subtotal": round(sub,2), "gst_amount": round(gst_tot,2), "total_amount": total,
    }, upsert=True)
    
    if not po or not isinstance(po, list) or len(po) == 0: continue
    po_id = po[0]["id"]
    po_ok += 1
    
    li_rows = [{"po_id": po_id, "item_id": imap.get(l["ic"]), "ordered_qty": l["qty"], "received_qty": l["recv"], "unit": l["unit"], "rate": l["rate"], "gst_percent": l["gst"], "gst_amount": l["gst_amt"], "total_amount": l["total"]} for l in lines if imap.get(l["ic"])]
    if li_rows: api("purchase_order_items", li_rows)
    
    if "received" in status:
        gd = random.randint(2,7)
        from datetime import date
        gdate = date(2026, month, day) + timedelta(days=gd)
        gds = gdate.isoformat()
        gnum = f"H1-{cc}-GRN-{ym}-{p+1:03d}"
        grn = api("grns", {
            "grn_number": gnum, "centre_id": centres[cc], "po_id": po_id, "vendor_id": vmap[vc],
            "grn_date": gds, "status": "verified",
            "vendor_invoice_no": f"VINV-{p+1:04d}", "vendor_invoice_amount": total,
        }, upsert=True)
        
        if grn and isinstance(grn, list) and len(grn) > 0:
            grn_id = grn[0]["id"]
            grn_ok += 1
            
            if status == "fully_received" and random.random() < 0.8:
                inv_num = f"H1-{cc}-INV-{ym}-{p+1:03d}"
                ps = "paid" if random.random() < 0.4 else ("unpaid" if random.random() < 0.6 else "partial")
                ms = "matched" if random.random() < 0.7 else ("partial_match" if random.random() < 0.5 else "mismatch")
                pa = total if ps == "paid" else (round(total*0.5) if ps == "partial" else 0)
                dd = gdate + timedelta(days=VENDORS[vi][11])
                inv = api("invoices", {
                    "invoice_ref": inv_num, "vendor_invoice_no": f"VINV-{p+1:04d}",
                    "vendor_invoice_date": gds, "centre_id": centres[cc],
                    "vendor_id": vmap[vc], "grn_id": grn_id, "po_id": po_id,
                    "subtotal": round(sub,2), "gst_amount": round(gst_tot,2), "total_amount": total,
                    "match_status": ms, "payment_status": ps, "paid_amount": pa,
                    "credit_period_days": VENDORS[vi][11], "due_date": dd.isoformat(), "status": "approved",
                }, upsert=True)
                if inv and isinstance(inv, list): inv_ok += 1
        
        for l in lines:
            if not imap.get(l["ic"]): continue
            stk = random.randint(10, 200)
            reorder = random.randint(5, 30)
            api("item_centre_stock", {
                "item_id": imap[l["ic"]], "centre_id": centres[cc],
                "current_stock": stk, "reorder_level": reorder, "max_level": stk*3,
                "last_grn_date": po_date, "last_grn_rate": l["rate"],
            }, upsert=True)
            stk_ok += 1
    
    if (p+1) % 25 == 0: print(f"  ... {p+1}/{PO_COUNT}")

print(f"\n═══ SEED COMPLETE ═══")
print(f"  Vendors:  {len(vmap)}")
print(f"  Items:    {len(imap)}")
print(f"  POs:      {po_ok}")
print(f"  GRNs:     {grn_ok}")
print(f"  Invoices: {inv_ok}")
print(f"  Stock:    {stk_ok} entries")
PYEOF
