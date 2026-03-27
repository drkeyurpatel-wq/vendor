import { requireVendorAuth } from '@/lib/vendor-auth'
import VendorPortalShell from '@/components/vendor/VendorPortalShell'
import { Toaster } from 'react-hot-toast'

export default async function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  const { legalName, vendorCode } = await requireVendorAuth()

  return (
    <>
      <VendorPortalShell vendorName={legalName} vendorCode={vendorCode}>
        {children}
      </VendorPortalShell>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { fontSize: '14px' } }} />
    </>
  )
}
