import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center px-6">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(232,184,75,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative z-10">
        <div className="font-pixel text-[10px] text-gold-dim tracking-widest mb-6">404</div>
        <h1 className="font-syne font-extrabold text-4xl tracking-tight mb-3">Page not found</h1>
        <p className="text-text-2 text-sm mb-8 max-w-xs">
          This page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="ghost">Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
