import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(232,184,75,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(232,184,75,0.03) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(232,184,75,0.07) 0%, transparent 65%)' }}
      />

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(3, 7px)', gridTemplateRows: 'repeat(3, 7px)' }}>
            {[1,0,1,1,1,0,0,1,1].map((on, i) => (
              <span key={i} className="block rounded-[1px]" style={{ background: on ? '#e8b84b' : 'transparent' }} />
            ))}
          </div>
          <span className="font-syne font-extrabold text-2xl tracking-tight">
            Tile<span className="text-gold">Scape</span>
          </span>
        </div>

        <h1 className="font-syne font-extrabold text-5xl leading-[0.95] tracking-tight mb-5">
          Run Better<br />Clan <span className="text-gold">Bingos</span>
        </h1>

        <p className="text-text-2 text-lg font-light leading-relaxed mb-8 max-w-md mx-auto">
          The modern event platform built for OSRS clans. Track bingo boards, manage teams, and celebrate every purple drop.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/login">
            <Button size="lg">Create Your Event →</Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="ghost">Sign in</Button>
          </Link>
        </div>

        <p className="mt-6 font-pixel text-[6px] text-text-3 tracking-wider">
          FREE DURING EARLY ACCESS · NOT AFFILIATED WITH JAGEX
        </p>
      </div>
    </div>
  )
}
