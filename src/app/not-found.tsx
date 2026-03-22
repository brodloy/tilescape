import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-center px-6">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{background:'radial-gradient(ellipse, rgba(232,184,75,0.06) 0%, transparent 65%)'}} />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(232,184,75,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative z-10">
        <div className="font-pixel text-[10px] text-gold-dim tracking-widest mb-6">404</div>
        <h1 className="font-syne font-extrabold text-5xl tracking-tight mb-4">Page not found</h1>
        <p className="text-text-2 text-sm font-light mb-10 max-w-xs">
          This page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="px-6 py-3 font-syne font-bold text-sm bg-gold text-bg rounded hover:bg-[#f0c85a] transition-all shadow-[0_0_20px_rgba(232,184,75,0.2)]">
            Go to Dashboard
          </Link>
          <Link href="/" className="px-6 py-3 font-syne font-bold text-sm border border-[rgba(232,184,75,0.20)] rounded text-text-2 hover:text-text hover:border-gold-dim transition-all">
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
