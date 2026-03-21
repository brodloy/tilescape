interface Team { id: string; name: string; color: string }

export function TeamStandings({ teams, tiles }: { teams: Team[]; tiles: any[] }) {
  if (teams.length === 0) return null

  const ranked = teams.map(t => {
    const approved = tiles.filter(
      tile => !tile.free_space && tile.tile_completions?.some((c: any) => c.team_id === t.id && c.status === 'approved')
    )
    const purples = approved.filter(tile => tile.is_purple).length
    const bingos = calcBingos(tiles, t.id)
    return { ...t, done: approved.length, purples, bingos, pct: Math.round(approved.length / Math.max(tiles.filter(t => !t.free_space).length, 1) * 100) }
  }).sort((a, b) => b.done - a.done || b.bingos - a.bingos)

  const medals = ['🥇', '🥈', '🥉']
  const medalGlow = [
    'shadow-[0_0_14px_rgba(255,215,0,0.2)]',
    '',
    '',
  ]

  return (
    <div className="mt-6 max-w-[760px] mx-auto">
      <div className="bg-bg2 border border-[rgba(232,184,75,0.10)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(232,184,75,0.10)]">
          <span className="font-pixel text-[7px] text-gold tracking-widest">⚔ TEAM STANDINGS</span>
          <span className="font-pixel text-[6px] text-text-3">
            {ranked[0]?.done ?? 0} tiles leading
          </span>
        </div>

        {ranked.map((team, rank) => (
          <div
            key={team.id}
            className={`flex items-center gap-3 px-4 py-3 border-b border-[rgba(232,184,75,0.06)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors relative`}
          >
            {/* Left accent */}
            <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r opacity-60" style={{ background: rank === 0 ? '#ffd700' : rank === 1 ? '#c0c0c0' : '#cd7f32' }} />

            {/* Medal */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${medalGlow[rank]}`}
              style={{
                background: rank === 0 ? 'rgba(255,215,0,0.12)' : rank === 1 ? 'rgba(192,192,192,0.08)' : 'rgba(205,127,50,0.08)',
                border: `1px solid ${rank === 0 ? 'rgba(255,215,0,0.3)' : rank === 1 ? 'rgba(192,192,192,0.2)' : 'rgba(205,127,50,0.2)'}`,
                animation: rank === 0 ? 'medalPulse 3s ease-in-out infinite' : undefined,
              }}
            >
              {medals[rank] ?? rank + 1}
            </div>

            {/* Team info + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-[2px]" style={{ background: team.color }} />
                <span className="font-syne font-bold text-sm text-text">{team.name}</span>
              </div>
              <div className="h-2.5 bg-bg3 rounded border border-[rgba(255,255,255,0.04)] overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-700"
                  style={{ width: `${team.pct}%`, background: team.color, position: 'relative' }}
                >
                  <div className="absolute inset-x-0 top-0 h-1/2 rounded bg-white/20" />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="font-syne font-extrabold text-xl leading-none tracking-tight" style={{ color: team.color }}>
                {team.pct}%
              </span>
              <div className="flex gap-1.5">
                <span className="font-pixel text-[5.5px] px-1.5 py-0.5 rounded bg-surface2 border border-[rgba(255,255,255,0.06)] text-text-3">
                  {team.done}/24
                </span>
                {team.bingos > 0 && (
                  <span className="font-pixel text-[5.5px] px-1.5 py-0.5 rounded bg-[rgba(232,184,75,0.1)] border border-[rgba(232,184,75,0.2)] text-gold">
                    {team.bingos} BINGO{team.bingos > 1 ? 'S' : ''}
                  </span>
                )}
                {team.purples > 0 && (
                  <span className="font-pixel text-[5.5px] px-1.5 py-0.5 rounded bg-[rgba(168,117,240,0.1)] border border-[rgba(168,117,240,0.2)] text-purple">
                    {team.purples}⬥
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes medalPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(255,215,0,0.2); }
          50%       { box-shadow: 0 0 24px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.1); }
        }
      `}</style>
    </div>
  )
}

function calcBingos(tiles: any[], teamId: string): number {
  const lines: number[][] = []
  for (let r = 0; r < 5; r++) lines.push([r*5, r*5+1, r*5+2, r*5+3, r*5+4])
  for (let c = 0; c < 5; c++) lines.push([c, c+5, c+10, c+15, c+20])
  lines.push([0, 6, 12, 18, 24])
  lines.push([4, 8, 12, 16, 20])
  const sorted = [...tiles].sort((a, b) => a.position - b.position)
  const check = (i: number) => {
    const t = sorted[i]
    if (!t) return false
    if (t.free_space) return true
    return t.tile_completions?.some((c: any) => c.team_id === teamId && c.status === 'approved') ?? false
  }
  return lines.filter(l => l.every(check)).length
}
