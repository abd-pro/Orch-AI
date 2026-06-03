import Link from 'next/link'
import OrchLogo from '@/components/OrchLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <OrchLogo size={36} />
        <span className="font-semibold text-xl">orch<span className="text-[#cf7d56]">.AI</span></span>
      </Link>
      {children}
    </div>
  )
}
