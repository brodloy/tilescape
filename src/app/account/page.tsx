import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import { updateProfile, updatePassword } from '@/app/actions/forms'
import { SubmitButton } from '@/components/ui/SubmitButton'

export default async function AccountPage() {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('users').select('display_name, email, created_at').eq('id', user.id).single()

  const inputClass = "w-full h-12 px-4 rounded bg-bg3 border border-[rgba(232,184,75,0.20)] text-text text-sm placeholder:text-text-3 outline-none focus:border-gold-dim focus:shadow-[0_0_0_3px_rgba(232,184,75,0.08)] transition-all"
  const labelClass = "block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase"
  const cardClass = "bg-surface border border-[rgba(232,184,75,0.12)] rounded-xl overflow-hidden"
  const cardHeaderClass = "px-6 py-4 border-b border-[rgba(232,184,75,0.10)]"

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none" style={{background:'radial-gradient(ellipse, rgba(232,184,75,0.05) 0%, transparent 65%)'}} />

      <header className="sticky top-0 z-50 bg-[rgba(12,10,8,0.85)] backdrop-blur-md border-b border-[rgba(232,184,75,0.20)] px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-syne font-extrabold text-lg tracking-tight">
            Tile<em className="not-italic text-gold">Scape</em>
          </Link>
          <span className="text-text-3">/</span>
          <span className="font-syne font-bold text-sm text-text-2">Account</span>
        </div>
        <form action={signOut}>
          <button type="submit" className="font-pixel text-[6px] text-text-3 hover:text-text-2 transition-colors tracking-wider">SIGN OUT</button>
        </form>
      </header>

      <main className="max-w-xl mx-auto px-6 py-14 space-y-6 relative z-10">
        <div>
          <div className="font-pixel text-[7px] text-gold tracking-widest mb-3 opacity-80">ACCOUNT</div>
          <h1 className="font-syne font-extrabold text-4xl tracking-tight mb-2">Settings</h1>
          <p className="text-text-2 text-sm font-light">Manage your profile and security.</p>
        </div>

        <div className={cardClass}>
          <div className={cardHeaderClass}>
            <span className="font-pixel text-[7px] text-gold tracking-widest">PROFILE</span>
          </div>
          <div className="p-6">
            <form action={updateProfile} className="space-y-4">
              <div>
                <label className={labelClass}>RuneScape Name (RSN)</label>
                <input name="display_name" defaultValue={profile?.display_name ?? ''} placeholder="e.g. Zezima" maxLength={12} className={inputClass} />
                <p className="mt-1.5 text-xs text-text-3">Max 12 characters · Your in-game display name</p>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <p className="text-sm text-text-2 py-2">{user.email}</p>
              </div>
              <div className="flex justify-end pt-2">
                <SubmitButton>Save Changes</SubmitButton>
              </div>
            </form>
          </div>
        </div>

        {user.app_metadata?.provider === 'email' && (
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <span className="font-pixel text-[7px] text-gold tracking-widest">CHANGE PASSWORD</span>
            </div>
            <div className="p-6">
              <form action={updatePassword} className="space-y-4">
                <div>
                  <label className={labelClass}>New Password</label>
                  <input name="password" type="password" placeholder="At least 8 characters" minLength={8} required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input name="confirm" type="password" placeholder="Repeat new password" minLength={8} required className={inputClass} />
                </div>
                <div className="flex justify-end pt-2">
                  <SubmitButton>Update Password</SubmitButton>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-surface border border-[rgba(232,85,85,0.15)] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(232,85,85,0.10)]">
            <span className="font-pixel text-[7px] text-red tracking-widest">DANGER ZONE</span>
          </div>
          <div className="p-6">
            <p className="text-sm text-text-2 font-light mb-4">Deleting your account is permanent. All events you own will also be deleted.</p>
            <button disabled className="font-pixel text-[6px] px-4 py-2.5 rounded bg-[rgba(232,85,85,0.08)] border border-[rgba(232,85,85,0.2)] text-red opacity-50 cursor-not-allowed">
              DELETE ACCOUNT (COMING SOON)
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
