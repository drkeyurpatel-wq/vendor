import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
    const sheetName = wb.SheetNames[0]
    const sheet = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ columns: [], rows: [] })
    }

    // Extract column names from the first row's keys
    const columns = Object.keys(rows[0])

    // Return first 5 rows for preview
    const previewRows = rows.slice(0, 5).map(row => {
      const cleanRow: Record<string, string> = {}
      columns.forEach(col => {
        cleanRow[col] = String(row[col] ?? '').slice(0, 100) // Truncate long values
      })
      return cleanRow
    })

    return NextResponse.json({
      columns,
      rows: previewRows,
      totalRows: rows.length,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to parse file' },
      { status: 400 }
    )
  }
}
