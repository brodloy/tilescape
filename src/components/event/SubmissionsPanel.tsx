import { reviewCompletion } from '@/app/actions/completions'
import { Button } from '@/components/ui/Button'

interface Submission {
  id: string
  proof_url: string
  status: string
  submitted_at: string
  tiles: { name: string; is_purple: boolean; source_raid: string | null }
  teams: { name: string; color: string }
  users: { display_name: string }
}

interface Props {
  submissions: any[]
}

export function SubmissionsPanel({ submissions }: Props) {
  if (submissions.length === 0) return null

  return (
    <div className="border-b border-[rgba(232,184,75,0.10)]">
      <div className="px-4 py-3 border-b border-[rgba(232,184,75,0.08)] flex items-center justify-between">
        <span className="font-pixel text-[7px] text-gold tracking-widest">PENDING REVIEW</span>
        <span className="font-pixel text-[7px] text-gold bg-[rgba(232,184,75,0.1)] border border-[rgba(232,184,75,0.2)] px-2 py-0.5 rounded">
          {submissions.length}
        </span>
      </div>

      <div className="divide-y divide-[rgba(232,184,75,0.06)] max-h-72 overflow-y-auto">
        {submissions.map(sub => {
          const tile = sub.tiles as any
          const team = sub.teams as any
          const user = sub.users as any

          return (
            <div key={sub.id} className="p-3">
              <div className="flex items-start gap-2.5 mb-2">
                {/* Proof thumbnail */}
                <a href={sub.proof_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  <div className="w-12 h-12 rounded border border-[rgba(232,184,75,0.15)] bg-surface overflow-hidden">
                    <img
                      src={sub.proof_url}
                      alt="Proof"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const el = e.target as HTMLImageElement
                        el.src = ''
                        el.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-text-3 text-[10px]">IMG</div>'
                      }}
                    />
                  </div>
                </a>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {tile?.is_purple && (
                      <span className="font-pixel text-[5px] text-purple">⬥</span>
                    )}
                    <span className="font-syne font-bold text-xs text-text truncate">{tile?.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-2">
                    <span className="font-medium" style={{ color: team?.color }}>{team?.name}</span>
                    <span className="text-text-3">·</span>
                    <span>{user?.display_name}</span>
                  </div>
                  <div className="text-[9px] text-text-3 mt-0.5">
                    {new Date(sub.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-1.5">
                <form action={async () => {
                  'use server'
                  await reviewCompletion(sub.id, 'approved')
                }} className="flex-1">
                  <button
                    type="submit"
                    className="w-full font-pixel text-[6px] py-1.5 rounded bg-[rgba(62,207,116,0.1)] border border-[rgba(62,207,116,0.25)] text-green hover:bg-[rgba(62,207,116,0.18)] transition-colors"
                  >
                    ✓ APPROVE
                  </button>
                </form>
                <form action={async () => {
                  'use server'
                  await reviewCompletion(sub.id, 'rejected')
                }} className="flex-1">
                  <button
                    type="submit"
                    className="w-full font-pixel text-[6px] py-1.5 rounded bg-[rgba(232,85,85,0.08)] border border-[rgba(232,85,85,0.2)] text-red hover:bg-[rgba(232,85,85,0.15)] transition-colors"
                  >
                    ✕ REJECT
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
