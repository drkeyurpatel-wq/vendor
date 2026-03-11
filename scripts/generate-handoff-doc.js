const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, VerticalAlign
} = require('docx');
const fs = require('fs');

const NAVY = "1B3A6B";
const TEAL = "0D7E8A";
const LIGHT_BLUE = "D6EAF8";
const LIGHT_GREEN = "D5F5E3";
const LIGHT_ORANGE = "FDEBD0";
const LIGHT_GRAY = "F2F3F4";
const ORANGE = "E67E22";
const GREEN = "1E8449";

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, color: NAVY, bold: true, size: 30 })],
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 4 } }
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, color: TEAL, bold: true, size: 24 })],
    spacing: { before: 240, after: 100 }
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, color: NAVY, bold: true, size: 22 })],
    spacing: { before: 180, after: 80 }
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, color: opts.color || "333333", bold: opts.bold || false, italics: opts.italic || false })],
    spacing: { before: 60, after: 60 }
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    children: [new TextRun({ text, size: 20, color: "333333" })],
    spacing: { before: 40, after: 40 }
  });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 18, font: "Courier New", color: "1a1a2e" })],
    shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
    spacing: { before: 40, after: 40 },
    indent: { left: 360 }
  });
}

function spacer() {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: 40, after: 40 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function colorBox(title, lines, fill = LIGHT_BLUE, titleColor = NAVY) {
  const children = [
    new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 20, color: titleColor })], spacing: { before: 0, after: 80 } }),
    ...lines.map(l => new Paragraph({ children: [new TextRun({ text: l, size: 19, color: "333333" })], spacing: { before: 20, after: 20 } }))
  ];
  return new Table({
    width: { size: 9200, type: WidthType.DXA },
    columnWidths: [9200],
    rows: [new TableRow({ children: [new TableCell({
      borders, width: { size: 9200, type: WidthType.DXA },
      shading: { fill, type: ShadingType.CLEAR },
      margins: { top: 120, bottom: 100, left: 160, right: 160 },
      children
    })] })]
  });
}

function twoCol(headers, rows, w1 = 3200, w2 = 6000) {
  const tableRows = [new TableRow({ children: headers.map((h, i) => new TableCell({
    borders, width: { size: i === 0 ? w1 : w2, type: WidthType.DXA },
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18 })] })]
  })) })];
  rows.forEach((row, idx) => tableRows.push(new TableRow({ children: row.map((cell, i) => new TableCell({
    borders, width: { size: i === 0 ? w1 : w2, type: WidthType.DXA },
    shading: { fill: idx % 2 === 0 ? "FFFFFF" : LIGHT_GRAY, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: cell, size: 19, color: "333333" })] })]
  })) })));
  return new Table({ width: { size: w1 + w2, type: WidthType.DXA }, columnWidths: [w1, w2], rows: tableRows });
}

function threeCol(headers, rows, widths = [2000, 3600, 3600]) {
  const total = widths.reduce((a, b) => a + b, 0);
  const tableRows = [new TableRow({ children: headers.map((h, i) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: { fill: TEAL, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 18 })] })]
  })) })];
  rows.forEach((row, idx) => tableRows.push(new TableRow({ children: row.map((cell, i) => new TableCell({
    borders, width: { size: widths[i], type: WidthType.DXA },
    shading: { fill: idx % 2 === 0 ? "FFFFFF" : LIGHT_GRAY, type: ShadingType.CLEAR },
    margins: { top: 70, bottom: 70, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: cell, size: 19, color: "333333" })] })]
  })) })));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, rows: tableRows });
}

const doc = new Document({
  numbering: {
    config: [{
      reference: "bullets",
      levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 600, hanging: 300 } } } }]
    }]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: TEAL },
        paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ]
  },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } }
    },
    children: [

      // TITLE
      spacer(), spacer(),
      new Paragraph({ children: [new TextRun({ text: "H1 VPMS \u2014 Project Handoff Document", bold: true, size: 40, color: NAVY })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 } }),
      new Paragraph({ children: [new TextRun({ text: "Health1 Super Speciality Hospitals \u2014 Vendor & Purchase Management System", size: 22, color: "666666" })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 } }),
      new Paragraph({ children: [new TextRun({ text: "For continuation in new Claude Opus 4.6 chat session | March 2026", size: 18, color: "888888" })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 80 } }),
      new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 6, color: TEAL } }, children: [new TextRun("")], spacing: { before: 0, after: 0 } }),
      pageBreak(),

      // SECTION 1: CONTEXT
      h1("1. Project Context"),
      para("This document is a complete handoff summary for the H1 VPMS project \u2014 built by Keyur Patel (MD, Health1) in collaboration with Claude. The purpose is to allow continuation of development in a new Claude session without losing any context."),
      spacer(),
      colorBox("Project Owner", [
        "Name: Keyur Patel \u2014 Managing Director, Health1 Super Speciality Hospitals Pvt. Ltd.",
        "GitHub: drkeyurpatel-wq | Email: drkeyurpatel@gmail.com",
        "Repo: https://github.com/drkeyurpatel-wq/vendor.git",
        "Live URL: https://vendor-rm26gxmw2-drkeyurpatel-6272s-projects.vercel.app",
        "Supabase Project ID: dwukvdtacwvnudqjlwrb",
        "Supabase URL: https://dwukvdtacwvnudqjlwrb.supabase.co",
      ], LIGHT_BLUE, NAVY),
      spacer(),

      h2("1.1 Business Context"),
      bullet("Health1 operates 6 hospital centres: Shilaj (SHI), Vastral (VAS), Modasa (MOD), Udaipur (UDA), Gandhinagar (GAN), 6th TBD"),
      bullet("868 paper beds, 410 operational. 5,000+ SKUs, hundreds of vendors across all centres"),
      bullet("Current state: fragmented \u2014 Tally, paper GRNs, Google Sheets, no unified system"),
      bullet("90% purchasing is unit-level, 10% central"),
      bullet("Key integrations required: Tally (accounting) and eClinicalworks (clinical EMR)"),
      bullet("Saturday payment cycle \u2014 all vendor payments processed on Saturdays"),
      bullet("No budget constraint \u2014 build it right"),
      spacer(),

      h2("1.2 Module Priority (as decided by Keyur)"),
      threeCol(["Priority", "Module", "Status"], [
        ["1", "Vendor Onboarding & KYC", "Day 1 \u2014 LIVE (list + add form)"],
        ["2", "Credit Period & Payment Scheduling", "Day 1 \u2014 LIVE (aging dashboard)"],
        ["3", "PO Creation & Approval Workflow", "Day 1 \u2014 List live, form = placeholder"],
        ["4", "GRN & 3-Way Matching", "Day 3 \u2014 NOT BUILT"],
        ["5", "Stock Levels & Reorder Triggers", "NOT BUILT"],
        ["6", "Rate Contracts & L1/L2/L3 Tendering", "NOT BUILT"],
        ["7", "Vendor Performance Scoring", "NOT BUILT"],
        ["8", "Vendor Self-Service Portal", "NOT BUILT"],
      ], [1200, 3800, 4200]),
      spacer(),
      pageBreak(),

      // SECTION 2: TECH STACK
      h1("2. Technology Stack"),
      twoCol(["Layer", "Choice"], [
        ["Frontend", "Next.js 14 (App Router) with TypeScript + Tailwind CSS"],
        ["Backend", "Next.js API routes (server components for data fetching)"],
        ["Database", "PostgreSQL via Supabase (project: dwukvdtacwvnudqjlwrb)"],
        ["Auth", "Supabase Auth with Row Level Security (RLS)"],
        ["File Storage", "Supabase Storage (KYC docs, invoice PDFs)"],
        ["Hosting", "Vercel (auto-deploy on GitHub push)"],
        ["Styling", "Tailwind CSS + custom CSS classes in globals.css"],
        ["Forms", "react-hook-form + zod validation"],
        ["Notifications", "react-hot-toast"],
        ["Date handling", "date-fns"],
      ]),
      spacer(),

      h2("2.1 Brand Colors"),
      twoCol(["Variable", "Value"], [
        ["Navy (primary)", "#1B3A6B \u2014 sidebar, headings, primary buttons"],
        ["Teal (accent)", "#0D7E8A \u2014 links, secondary buttons, highlights"],
        ["Light Navy", "#EEF2F9 \u2014 card backgrounds"],
        ["Light Teal", "#E6F5F6 \u2014 info boxes"],
      ]),
      spacer(),
      pageBreak(),

      // SECTION 3: FILE STRUCTURE
      h1("3. Project File Structure"),
      para("All source files are in the /src directory. The project uses Next.js App Router with route groups."),
      spacer(),
      colorBox("Complete File Tree", [
        "vendor/                          \u2190 GitHub repo root",
        "\u251C\u2500\u2500 src/",
        "\u2502   \u251C\u2500\u2500 app/",
        "\u2502   \u2502   \u251C\u2500\u2500 (auth)/",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 layout.tsx       \u2190 Auth layout (gradient background)",
        "\u2502   \u2502   \u2502   \u2514\u2500\u2500 login/page.tsx   \u2190 Login page",
        "\u2502   \u2502   \u251C\u2500\u2500 (dashboard)/",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 layout.tsx       \u2190 Dashboard layout (sidebar + topbar)",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 page.tsx         \u2190 Main dashboard with stats",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 vendors/",
        "\u2502   \u2502   \u2502   \u2502   \u251C\u2500\u2500 page.tsx     \u2190 Vendor list with filters",
        "\u2502   \u2502   \u2502   \u2502   \u2514\u2500\u2500 new/page.tsx \u2190 Add vendor form",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 items/",
        "\u2502   \u2502   \u2502   \u2502   \u251C\u2500\u2500 page.tsx     \u2190 Item master list",
        "\u2502   \u2502   \u2502   \u2502   \u2514\u2500\u2500 new/page.tsx \u2190 Add item form",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 purchase-orders/",
        "\u2502   \u2502   \u2502   \u2502   \u251C\u2500\u2500 page.tsx     \u2190 PO list with status filters",
        "\u2502   \u2502   \u2502   \u2502   \u2514\u2500\u2500 new/page.tsx \u2190 PLACEHOLDER \u2014 Day 2 to build",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 grn/",
        "\u2502   \u2502   \u2502   \u2502   \u2514\u2500\u2500 page.tsx     \u2190 PLACEHOLDER \u2014 Day 3 to build",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 finance/",
        "\u2502   \u2502   \u2502   \u2502   \u251C\u2500\u2500 credit/page.tsx  \u2190 Credit period aging dashboard",
        "\u2502   \u2502   \u2502   \u2502   \u251C\u2500\u2500 invoices/page.tsx \u2190 PLACEHOLDER",
        "\u2502   \u2502   \u2502   \u2502   \u2514\u2500\u2500 payments/page.tsx \u2190 PLACEHOLDER",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 reports/page.tsx \u2190 PLACEHOLDER",
        "\u2502   \u2502   \u2502   \u2514\u2500\u2500 settings/users/page.tsx \u2190 PLACEHOLDER",
        "\u2502   \u2502   \u251C\u2500\u2500 api/auth/callback/route.ts \u2190 Supabase auth callback",
        "\u2502   \u2502   \u251C\u2500\u2500 layout.tsx           \u2190 Root layout",
        "\u2502   \u2502   \u2514\u2500\u2500 globals.css          \u2190 All custom CSS classes",
        "\u2502   \u251C\u2500\u2500 components/",
        "\u2502   \u2502   \u2514\u2500\u2500 layout/",
        "\u2502   \u2502       \u251C\u2500\u2500 Sidebar.tsx      \u2190 Left nav (collapsible groups)",
        "\u2502   \u2502       \u2514\u2500\u2500 TopBar.tsx       \u2190 Top header with search + bell",
        "\u2502   \u251C\u2500\u2500 lib/",
        "\u2502   \u2502   \u251C\u2500\u2500 supabase/",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 client.ts        \u2190 Browser Supabase client",
        "\u2502   \u2502   \u2502   \u251C\u2500\u2500 server.ts        \u2190 Server Supabase client",
        "\u2502   \u2502   \u2502   \u2514\u2500\u2500 middleware.ts    \u2190 Session refresh middleware",
        "\u2502   \u2502   \u2514\u2500\u2500 utils.ts             \u2190 formatCurrency, formatDate, cn(), status colors",
        "\u2502   \u251C\u2500\u2500 types/database.ts        \u2190 All TypeScript interfaces + role helpers",
        "\u2502   \u2514\u2500\u2500 middleware.ts            \u2190 Route protection (redirect to /login)",
        "\u251C\u2500\u2500 sql/",
        "\u2502   \u251C\u2500\u2500 001_schema.sql           \u2190 Full DB schema (19 tables)",
        "\u2502   \u2514\u2500\u2500 002_seed.sql             \u2190 Centres + categories seed data",
        "\u251C\u2500\u2500 next.config.mjs",
        "\u251C\u2500\u2500 tailwind.config.ts",
        "\u251C\u2500\u2500 tsconfig.json",
        "\u2514\u2500\u2500 package.json",
      ], "F8FAFC", NAVY),
      spacer(),
      pageBreak(),

      // SECTION 4: DATABASE
      h1("4. Database Schema (19 Tables)"),
      para("All tables are in Supabase PostgreSQL. Row Level Security (RLS) is enabled on all tables. Centre-level data isolation is enforced via RLS policies."),
      spacer(),
      threeCol(["Table", "Purpose", "Key Fields"], [
        ["centres", "The 6 hospital centres", "id, code (SHI/VAS etc), name, city, state"],
        ["user_profiles", "Extends auth.users with role + centre", "id, role, centre_id, full_name"],
        ["vendor_categories", "Pharma / Surgical / Equipment etc", "id, name, code"],
        ["vendors", "Vendor master (core table)", "vendor_code, legal_name, gstin, pan, credit_period_days, status, approved_centres[]"],
        ["vendor_documents", "KYC docs stored in Supabase Storage", "vendor_id, document_type, file_path, is_verified"],
        ["item_categories", "Hierarchical item categories", "id, name, code, parent_id"],
        ["items", "Item master \u2014 5000+ SKUs", "item_code, generic_name, unit, hsn_code, gst_percent, is_narcotic, ecw_item_code"],
        ["item_centre_stock", "Per-centre stock ledger", "item_id, centre_id, current_stock, reorder_level, max_level"],
        ["vendor_items", "Vendor-item mapping with L1/L2/L3", "vendor_id, item_id, l_rank, last_quoted_rate"],
        ["purchase_indents", "Internal purchase requests", "indent_number, centre_id, status, priority"],
        ["purchase_indent_items", "Line items for indents", "indent_id, item_id, requested_qty"],
        ["purchase_orders", "Purchase orders", "po_number, centre_id, vendor_id, status, total_amount, current_approval_level"],
        ["purchase_order_items", "PO line items", "po_id, item_id, ordered_qty, received_qty, rate, gst_percent"],
        ["po_approvals", "Approval trail for POs", "po_id, approval_level, approver_role, status, comments"],
        ["grns", "Goods Receipt Notes", "grn_number, po_id, vendor_invoice_no, status"],
        ["grn_items", "GRN line items", "grn_id, po_item_id, received_qty, accepted_qty, rejected_qty, batch_no, expiry_date"],
        ["invoices", "Vendor invoices with 3-way match", "vendor_invoice_no, grn_id, match_status, due_date, payment_status"],
        ["payment_batches", "Saturday payment batches", "batch_number, batch_date, status, total_amount"],
        ["rate_contracts", "Annual/quarterly rate contracts", "contract_number, vendor_id, valid_from, valid_to, status"],
        ["rate_contract_items", "Items in rate contracts with L-rank", "contract_id, item_id, rate, l_rank"],
        ["stock_ledger", "Full audit trail of stock movements", "item_id, centre_id, transaction_type, quantity, balance_after"],
        ["vendor_performance", "Monthly vendor scorecards", "vendor_id, month_year, score, on_time_deliveries"],
        ["activity_log", "System audit log", "user_id, action, entity_type, entity_id, details"],
      ], [2000, 2800, 4400]),
      spacer(),

      h2("4.1 User Roles (RBAC)"),
      twoCol(["Role", "Access Level"], [
        ["group_admin", "Full access all centres \u2014 Keyur"],
        ["group_cao", "Group finance \u2014 Tinabhai (Group CAO)"],
        ["unit_cao", "Unit finance \u2014 Nileshbhai (CAO)"],
        ["unit_purchase_manager", "PO creation + approval up to Rs 50K"],
        ["store_staff", "GRN entry + stock view only"],
        ["finance_staff", "Invoice verification + payment view"],
        ["vendor", "Vendor portal \u2014 own POs/invoices/payments only"],
      ]),
      spacer(),

      h2("4.2 PO Approval Thresholds"),
      twoCol(["Amount", "Approver Required"], [
        ["Up to Rs 10,000", "Unit Purchase Manager (auto-approved)"],
        ["Rs 10,001 - 50,000", "Unit Purchase Manager"],
        ["Rs 50,001 - 2,00,000", "Unit CAO"],
        ["Rs 2,00,001 - 10,00,000", "Group CAO (Tinabhai)"],
        ["Above Rs 10,00,000", "Group Admin (Keyur)"],
      ]),
      spacer(),
      pageBreak(),

      // SECTION 5: CSS CLASSES
      h1("5. Custom CSS Classes (globals.css)"),
      para("These utility classes are defined in src/app/globals.css and used throughout the app. Always use these \u2014 do not create inline styles."),
      spacer(),
      twoCol(["Class", "Usage"], [
        [".btn-primary", "Teal filled button \u2014 primary actions"],
        [".btn-secondary", "White outlined button \u2014 secondary actions"],
        [".btn-navy", "Navy filled button"],
        [".btn-danger", "Red filled button \u2014 destructive actions"],
        [".card", "White card with border and shadow"],
        [".stat-card", "Dashboard stat card with padding"],
        [".form-input", "Standard text input with focus ring"],
        [".form-select", "Standard select dropdown"],
        [".form-label", "Label above form fields"],
        [".data-table", "Full-width table with navy header"],
        [".badge", "Inline status pill (combine with color classes)"],
        [".page-header", "Flex row: title left, actions right"],
        [".page-title", "Large navy page heading"],
        [".page-subtitle", "Small gray subtitle"],
        [".empty-state", "Centered empty state container"],
        [".spinner", "Teal loading spinner animation"],
      ]),
      spacer(),

      h2("5.1 Status Color Maps (from utils.ts)"),
      para("Import these from @/lib/utils and use with cn() + badge class:"),
      code("VENDOR_STATUS_COLORS: pending=yellow, active=green, inactive=gray, blacklisted=red, under_review=blue"),
      code("PO_STATUS_COLORS: draft=gray, pending_approval=yellow, approved=blue, sent_to_vendor=purple,"),
      code("                  partially_received=orange, fully_received=green, cancelled=red"),
      code("MATCH_STATUS_COLORS: pending=gray, matched=green, partial_match=yellow, mismatch=red"),
      code("PAYMENT_STATUS_COLORS: unpaid=red, partial=yellow, paid=green, disputed=orange, on_hold=gray"),
      spacer(),
      pageBreak(),

      // SECTION 6: KEY PATTERNS
      h1("6. Code Patterns \u2014 Follow These Exactly"),

      h2("6.1 Server Component Data Fetching"),
      para("All list/detail pages are server components. Fetch data directly \u2014 no useEffect."),
      code("// src/app/(dashboard)/vendors/page.tsx"),
      code("import { createClient } from '@/lib/supabase/server'"),
      code("export default async function VendorsPage() {"),
      code("  const supabase = await createClient()"),
      code("  const { data } = await supabase.from('vendors').select('*')"),
      code("  return <div>...</div>"),
      code("}"),
      spacer(),

      h2("6.2 Client Component Forms"),
      para("All forms are client components (add 'use client' at top). Use createClient from @/lib/supabase/client."),
      code("'use client'"),
      code("import { createClient } from '@/lib/supabase/client'"),
      code("import { useRouter } from 'next/navigation'"),
      code("import toast from 'react-hot-toast'"),
      spacer(),

      h2("6.3 Getting Current User in Server Components"),
      code("const supabase = await createClient()"),
      code("const { data: { user } } = await supabase.auth.getUser()"),
      code("if (!user) redirect('/login')"),
      code("const { data: profile } = await supabase"),
      code("  .from('user_profiles')"),
      code("  .select('*, centre:centres(*)')"),
      code("  .eq('id', user.id)"),
      code("  .single()"),
      spacer(),

      h2("6.4 Auto-numbering Pattern"),
      code("const { count } = await supabase.from('vendors').select('*', { count: 'exact', head: true })"),
      code("const vendor_code = `H1V-${String((count ?? 0) + 1).padStart(4, '0')}`"),
      para("Number formats: Vendors=H1V-0001, Items=H1I-00001, PO=H1-SHI-PO-2603-001, GRN=H1-SHI-GRN-2603-001"),
      spacer(),

      h2("6.5 Route Group Structure"),
      code("(auth)  \u2014 pages without sidebar: /login"),
      code("(dashboard) \u2014 pages with sidebar + topbar: everything else"),
      spacer(),
      pageBreak(),

      // SECTION 7: WHAT TO BUILD NEXT
      h1("7. What to Build Next (Day 2 + 3)"),

      h2("Day 2 \u2014 PO Creation & Approval"),
      colorBox("Files to create/replace", [
        "REPLACE: src/app/(dashboard)/purchase-orders/new/page.tsx",
        "CREATE:  src/app/(dashboard)/purchase-orders/[id]/page.tsx",
        "CREATE:  src/app/(dashboard)/vendors/[id]/page.tsx",
        "CREATE:  src/components/ui/VendorSearch.tsx (autocomplete)",
        "CREATE:  src/components/ui/ItemSearch.tsx (autocomplete)",
        "CREATE:  src/app/api/po/approve/route.ts (approval action)",
      ], LIGHT_ORANGE, ORANGE),
      spacer(),
      para("PO creation form must include:", { bold: true }),
      bullet("Centre selector (pre-filled from user's centre)"),
      bullet("Vendor search autocomplete (search by name/code, show category)"),
      bullet("Line items: item search + qty + rate + GST auto-calc + total"),
      bullet("Expected delivery date"),
      bullet("Priority (normal/urgent/emergency)"),
      bullet("On save: auto-generate PO number, determine approval level from total_amount"),
      bullet("Create po_approvals record for required approver"),
      bullet("Approver gets notified (email via Supabase or just in-app for now)"),
      spacer(),
      para("PO detail page must include:", { bold: true }),
      bullet("All PO fields + line items table"),
      bullet("Approval timeline (who approved, when, comments)"),
      bullet("Approve/Reject buttons (only visible to correct approver role)"),
      bullet("'Send to Vendor' button (changes status to sent_to_vendor)"),
      bullet("'Create GRN' button (visible when status = sent_to_vendor or partially_received)"),
      spacer(),

      h2("Day 3 \u2014 GRN & Stock Update"),
      colorBox("Files to create/replace", [
        "REPLACE: src/app/(dashboard)/grn/page.tsx",
        "CREATE:  src/app/(dashboard)/grn/new/page.tsx",
        "CREATE:  src/app/(dashboard)/grn/[id]/page.tsx",
        "CREATE:  src/app/(dashboard)/items/stock/page.tsx",
        "CREATE:  src/app/api/grn/submit/route.ts (stock update logic)",
      ], LIGHT_GREEN, GREEN),
      spacer(),
      para("GRN creation form must include:", { bold: true }),
      bullet("Select PO (only approved/sent POs for this centre)"),
      bullet("GRN date (default today)"),
      bullet("Vendor invoice number + date + amount"),
      bullet("Line items pre-populated from PO \u2014 enter received qty, accepted qty, rejected qty"),
      bullet("Rejection reason if rejected_qty > 0"),
      bullet("Batch number + expiry date per line"),
      bullet("On submit: update item_centre_stock.current_stock, write to stock_ledger, update po received_qty"),
      bullet("If all items fully received: update PO status to fully_received"),
      bullet("If partial: update PO status to partially_received"),
      spacer(),
      para("Stock levels page must include:", { bold: true }),
      bullet("Table: item | centre | current stock | reorder level | status (OK/LOW/OUT)"),
      bullet("Filter by centre, category, status"),
      bullet("'Raise PO' quick action on low-stock items"),
      spacer(),
      pageBreak(),

      // SECTION 8: IMPORTANT RULES
      h1("8. Important Rules for This Project"),
      colorBox("Never violate these", [
        "1. Health1 brand: Navy (#1B3A6B) + Teal (#0D7E8A) always. No other primary colors.",
        "2. Use .data-table class for all tables \u2014 never custom table styles.",
        "3. Use .card class for all white content boxes.",
        "4. Use .btn-primary / .btn-secondary / .btn-navy \u2014 never custom button styles.",
        "5. Server components for data fetching. Client components for forms only.",
        "6. Always check user role before showing approve/edit/delete buttons.",
        "7. All PO/GRN/Invoice numbers must be auto-generated \u2014 never manual entry.",
        "8. Credit period clock starts from GRN date, NOT invoice date.",
        "9. 3-way match must block payment \u2014 never allow payment on mismatched invoice.",
        "10. Never wipe Supabase data on schema changes \u2014 always use ALTER TABLE.",
      ], "FFF3CD", "7D5A00"),
      spacer(),

      h2("8.1 Deployment Workflow"),
      para("Keyur uses GitHub Desktop (no terminal). The workflow is:"),
      bullet("Build new files locally or receive zip from Claude"),
      bullet("Drag files into vendor repo folder (overwrite when asked)"),
      bullet("GitHub Desktop: shows changed files \u2192 Commit to main \u2192 Push origin"),
      bullet("Vercel auto-deploys on push \u2014 live in ~2 minutes"),
      bullet("No manual Vercel config needed \u2014 root directory is set correctly"),
      spacer(),

      h2("8.2 Environment Variables"),
      para("Set in Vercel dashboard (not in code). Never commit .env.local to GitHub."),
      twoCol(["Variable", "Value"], [
        ["NEXT_PUBLIC_SUPABASE_URL", "https://dwukvdtacwvnudqjlwrb.supabase.co"],
        ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGci... (anon key \u2014 safe to use client-side)"],
        ["SUPABASE_SERVICE_ROLE_KEY", "Rotated \u2014 Keyur has the new value (server-side only)"],
      ]),
      spacer(),
      pageBreak(),

      // SECTION 9: REMAINING 10-DAY PLAN
      h1("9. Remaining Build Plan"),
      threeCol(["Day", "Module", "Key Deliverables"], [
        ["Day 2", "PO Creation + Approval", "Full PO form, approval workflow, PO detail page, vendor detail page"],
        ["Day 3", "GRN + Stock", "GRN creation, 3-way stock update, low stock dashboard"],
        ["Day 4", "Invoices + 3-Way Match", "Invoice upload, auto-matching engine, dispute creation"],
        ["Day 5", "Payment Batches", "Saturday batch generation, CAO approval, payment status tracking"],
        ["Day 6", "Rate Contracts", "Rate contract creation, L1/L2/L3 tendering, RFQ workflow"],
        ["Day 7", "Vendor Performance", "Monthly scorecard, KPI calculation, vendor ranking"],
        ["Day 8", "Reports + Analytics", "Spend by category/centre/vendor, aging report, PO status report"],
        ["Day 9", "User Management + Settings", "Create users, assign roles/centres, approval matrix config"],
        ["Day 10", "Polish + Data Import", "Batch vendor/item upload, mobile responsiveness, Shilaj go-live"],
      ], [800, 2800, 5600]),
      spacer(),
      spacer(),

      new Paragraph({
        children: [new TextRun({ text: "H1 VPMS \u2014 Confidential Internal Document | Health1 Super Speciality Hospitals Pvt. Ltd. | March 2026", size: 16, color: "888888", italics: true })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 480, after: 0 }
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/mnt/user-data/outputs/H1_VPMS_Handoff_Day1.docx', buf);
  console.log('Done — Word document generated at /mnt/user-data/outputs/H1_VPMS_Handoff_Day1.docx');
});
