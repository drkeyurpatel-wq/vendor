import { jsPDF } from 'jspdf'
import { HEALTH1_LOGO_BASE64, HEALTH1_LOGO_FORMAT } from './logo-base64'

const NAVY: [number, number, number] = [27, 58, 107]
const WHITE: [number, number, number] = [255, 255, 255]

/**
 * Renders the standard Health1 PDF header with logo.
 * Returns the Y position below the header for content to start.
 *
 * Layout:
 * ┌──────────────────────────────────────────┐
 * │ [LOGO]   PURCHASE ORDER                  │  Navy bar
 * │          Health1 Super Speciality...      │
 * │          Centre address                   │
 * └──────────────────────────────────────────┘
 */
export function renderPDFHeader(
  doc: jsPDF,
  title: string,
  centreInfo?: { name?: string; address?: string; city?: string; state?: string } | null
): number {
  const pageWidth = doc.internal.pageSize.getWidth()
  const headerHeight = 32

  // Navy background
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')

  // Logo — left side
  try {
    // Logo image: 400x236 ratio → scale to 22mm height
    const logoH = 18
    const logoW = logoH * (400 / 236)
    doc.addImage(HEALTH1_LOGO_BASE64, HEALTH1_LOGO_FORMAT, 10, 3, logoW, logoH)
  } catch {
    // Fallback if logo fails
    doc.setTextColor(...WHITE)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('H1', 14, 14)
  }

  // Document title — center
  doc.setTextColor(...WHITE)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageWidth / 2 + 10, 13, { align: 'center' })

  // Company name
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Health1 Super Speciality Hospitals Pvt. Ltd.', pageWidth / 2 + 10, 20, { align: 'center' })

  // Centre address
  if (centreInfo?.name) {
    doc.setFontSize(7.5)
    const addressParts = [centreInfo.name, centreInfo.address, centreInfo.city, centreInfo.state].filter(Boolean)
    doc.text(addressParts.join(', '), pageWidth / 2 + 10, 26, { align: 'center' })
  }

  return headerHeight + 6 // return Y position for content below
}
