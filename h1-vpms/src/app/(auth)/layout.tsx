export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B3A6B] to-[#0D7E8A] flex items-center justify-center p-4">
      {children}
    </div>
  )
}
