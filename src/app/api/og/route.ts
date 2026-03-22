import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Returns a simple SVG as the OG image — no canvas/sharp needed
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase()

  let eventName = 'TileScape Bingo'
  let description = 'OSRS clan bingo & event tracker'
  let status = 'draft'
  let teamCount = 0
  let tileCount = 0
  let prizePool = 0

  if (code) {
    try {
      const supabase = await createClient()
      const db = supabase as any
      const { data: event } = await db
        .from('events')
        .select('id, name, description, status, prize_pool')
        .eq('invite_code', code)
        .single()

      if (event) {
        eventName = event.name
        description = event.description ?? description
        status = event.status
        prizePool = event.prize_pool ?? 0

        const [{ count: tc }, { count: tm }] = await Promise.all([
          db.from('tiles').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
          db.from('teams').select('id', { count: 'exact', head: true }).eq('event_id', event.id),
        ])
        tileCount = tc ?? 0
        teamCount = tm ?? 0
      }
    } catch {}
  }

  const isLive = status === 'live'
  const gpLabel = prizePool >= 1_000_000_000
    ? `${(prizePool / 1_000_000_000).toFixed(1)}B GP`
    : prizePool >= 1_000_000
      ? `${(prizePool / 1_000_000).toFixed(1)}M GP`
      : prizePool > 0 ? `${Math.round(prizePool / 1000)}K GP` : ''

  // Truncate long names
  const truncate = (s: string, n: number) => s.length > n ? s.slice(0, n - 1) + '…' : s

  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&amp;display=swap');
    </style>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="#0c0a08"/>

  <!-- Grid pattern -->
  <defs>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(232,184,75,0.06)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="url(#grid)"/>

  <!-- Gold accent left bar -->
  <rect x="0" y="0" width="6" height="630" fill="${isLive ? '#3ecf74' : '#e8b84b'}"/>

  <!-- Status badge -->
  <rect x="80" y="72" width="${isLive ? 80 : 90}" height="32" rx="6" fill="${isLive ? 'rgba(62,207,116,0.15)' : 'rgba(154,143,122,0.1)'}"/>
  <rect x="80" y="72" width="${isLive ? 80 : 90}" height="32" rx="6" fill="none" stroke="${isLive ? 'rgba(62,207,116,0.4)' : 'rgba(154,143,122,0.3)'}"/>
  ${isLive ? `<circle cx="100" cy="88" r="4" fill="#3ecf74"/>` : ''}
  <text x="${isLive ? 112 : 125}" y="93" font-family="monospace" font-size="13" font-weight="700" fill="${isLive ? '#3ecf74' : '#9a8f7a'}" text-anchor="middle" letter-spacing="2">${isLive ? 'LIVE' : status.toUpperCase()}</text>

  <!-- Event name -->
  <text x="80" y="200" font-family="'Syne', 'Arial Black', sans-serif" font-size="72" font-weight="800" fill="#f0e8d8" letter-spacing="-2">${truncate(eventName, 24)}</text>

  <!-- Description -->
  <text x="80" y="258" font-family="Arial, sans-serif" font-size="26" font-weight="300" fill="#9a8f7a">${truncate(description, 60)}</text>

  <!-- Stats row -->
  <rect x="80" y="340" width="180" height="80" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(232,184,75,0.12)"/>
  <text x="170" y="378" font-family="'Syne', 'Arial Black', sans-serif" font-size="36" font-weight="800" fill="#e8b84b" text-anchor="middle">${tileCount}</text>
  <text x="170" y="403" font-family="monospace" font-size="11" fill="#4a4438" text-anchor="middle" letter-spacing="1">TILES</text>

  <rect x="280" y="340" width="180" height="80" rx="12" fill="rgba(255,255,255,0.03)" stroke="rgba(232,184,75,0.12)"/>
  <text x="370" y="378" font-family="'Syne', 'Arial Black', sans-serif" font-size="36" font-weight="800" fill="#4b9ef0" text-anchor="middle">${teamCount}</text>
  <text x="370" y="403" font-family="monospace" font-size="11" fill="#4a4438" text-anchor="middle" letter-spacing="1">TEAMS</text>

  ${gpLabel ? `
  <rect x="480" y="340" width="220" height="80" rx="12" fill="rgba(232,184,75,0.06)" stroke="rgba(232,184,75,0.25)"/>
  <text x="590" y="378" font-family="'Syne', 'Arial Black', sans-serif" font-size="36" font-weight="800" fill="#e8b84b" text-anchor="middle">${gpLabel}</text>
  <text x="590" y="403" font-family="monospace" font-size="11" fill="#7a5c1e" text-anchor="middle" letter-spacing="1">PRIZE POOL</text>
  ` : ''}

  <!-- Invite prompt -->
  <rect x="80" y="480" width="460" height="60" rx="10" fill="rgba(232,184,75,0.06)" stroke="rgba(232,184,75,0.2)"/>
  <text x="310" y="516" font-family="monospace" font-size="18" fill="#e8b84b" text-anchor="middle" letter-spacing="2">USE CODE: ${code ?? '????????'}</text>

  <!-- TileScape branding -->
  <text x="1120" y="590" font-family="'Syne', 'Arial Black', sans-serif" font-size="22" font-weight="800" fill="rgba(240,232,216,0.3)" text-anchor="end">TileScape</text>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
