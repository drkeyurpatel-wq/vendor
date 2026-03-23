'use client'

import VendorPOActions from '@/components/ui/VendorPOActions'

interface Props { poId: string; poNumber: string; poStatus: string; vendorId: string }

export default function AcknowledgePOButton({ poId, poNumber, poStatus, vendorId }: Props) {
  return <VendorPOActions poId={poId} poNumber={poNumber || ''} poStatus={poStatus || 'sent_to_vendor'} vendorId={vendorId || ''} />
}
