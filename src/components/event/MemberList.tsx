import { assignMemberToTeam } from '@/app/actions/teams'

interface User { id: string; display_name: string; avatar_url?: string | null }
interface EventMember { id: string; role: string; joined_at: string; users: User }
interface TeamMemberRecord { id: string; event_members: { id: string } }
interface Team { id: string; name: string; color: string; team_members: TeamMemberRecord[] }

interface Props {
  members: EventMember[]
  teams: Team[]
  currentUserId: string
  isOwnerOrMod: boolean
  eventId: string
}

export function MemberList({ members, teams, currentUserId, isOwnerOrMod, eventId }: Props) {
  // Build a map: event_member_id → team
  const memberTeamMap = new Map<string, Team>()
  teams.forEach(t => {
    t.team_members?.forEach((tm: any) => {
      if (tm.event_members?.id) {
        memberTeamMap.set(tm.event_members.id, t)
      }
    })
  })

  const sorted = [...members].sort((a, b) => {
    if (a.role === 'owner') return -1
    if (b.role === 'owner') return 1
    return 0
  })

  return (
    <div className="p-4 flex-1">
      <p className="font-pixel text-[6px] text-text-3 tracking-widest mb-3 uppercase">
        Members ({members.length})
      </p>
      <div className="space-y-1">
        {sorted.map(member => {
          const user = member.users as User
          const team = memberTeamMap.get(member.id)
          const isCurrentUser = user.id === currentUserId

          return (
            <div key={member.id} className="flex items-center gap-2.5 py-1.5 hover:bg-surface rounded px-1.5 transition-colors group">
              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 border flex items-center justify-center font-pixel text-[7px]"
                style={{
                  background: team ? `${team.color}22` : 'var(--surface2)',
                  borderColor: team ? `${team.color}55` : 'rgba(255,255,255,0.06)',
                  color: team?.color ?? '#4a4438',
                }}
              >
                {user.display_name.substring(0, 2).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-medium truncate ${isCurrentUser ? 'text-gold' : 'text-text'}`}>
                    {user.display_name}
                    {isCurrentUser && ' (you)'}
                  </span>
                  {member.role === 'owner' && (
                    <span className="font-pixel text-[5px] text-gold-dim">OWNER</span>
                  )}
                  {member.role === 'moderator' && (
                    <span className="font-pixel text-[5px] text-[#4b9ef0]">MOD</span>
                  )}
                </div>
                {team ? (
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-[1px]" style={{ background: team.color }} />
                    <span className="text-[10px] text-text-3">{team.name}</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-text-3">Unassigned</span>
                )}
              </div>

              {/* Assign team dropdown — owner/mod only */}
              {isOwnerOrMod && member.role !== 'owner' && (
                <form action={async (formData: FormData) => {
                  'use server'
                  const teamId = formData.get('team_id') as string
                  await assignMemberToTeam(member.id, teamId, eventId)
                }}>
                  <select
                    name="team_id"
                    defaultValue={team?.id ?? ''}
                    onChange={e => {
                      const form = e.target.closest('form') as HTMLFormElement
                      form?.requestSubmit()
                    }}
                    className="text-[10px] bg-surface2 border border-[rgba(232,184,75,0.12)] rounded px-1.5 py-1 text-text-2 outline-none hover:border-[rgba(232,184,75,0.25)] transition-colors cursor-pointer"
                  >
                    <option value="">No team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </form>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
