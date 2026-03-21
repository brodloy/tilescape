import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { signOut } from '@/app/actions/auth'

export default async function AccountPage() {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('users')
    .select('display_name, email, created_at')
    .eq('id', user.id)
    .single()

  async function updateProfile(formData: FormData) {
    'use server'
    const supabase2 = await createClient()
    const db2 = supabase2 as any
    const { data: { user: u } } = await supabase2.auth.getUser()
    if (!u) return

    const displayName = (formData.get('display_name') as string)?.trim()
    if (displayName) {
      await db2.from('users').update({ display_name: displayName }).eq('id', u.id)
    }
    redirect('/account?updated=1')
  }

  async function updatePassword(formData: FormData) {
    'use server'
    const supabase2 = await createClient()
    const password = formData.get('password') as string
    const confirm = formData.get('confirm') as string
    if (!password || password !== confirm) redirect('/account?error=password_mismatch')
    await supabase2.auth.updateUser({ password })
    redirect('/account?updated=1')
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 h-14 bg-bg2 border-b border-[rgba(232,184,75,0.20)] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="font-syne font-extrabold text-lg tracking-tight">
            Tile<span className="text-gold">Scape</span>
          </Link>
          <span className="text-text-3">/</span>
          <span className="font-syne font-bold text-sm text-text-2">Account</span>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">Sign out</Button>
        </form>
      </header>

      <main className="max-w-xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="font-syne font-extrabold text-2xl tracking-tight mb-1">Account Settings</h1>
          <p className="text-text-2 text-sm">Manage your profile and security.</p>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <span className="font-pixel text-[7px] text-gold tracking-widest">PROFILE</span>
          </CardHeader>
          <CardBody className="p-6">
            <form action={updateProfile} className="space-y-4">
              <Input
                name="display_name"
                label="RuneScape Name (RSN)"
                defaultValue={profile?.display_name ?? ''}
                placeholder="e.g. Zezima"
                maxLength={12}
                hint="Max 12 characters"
              />
              <div>
                <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">Email</label>
                <p className="text-sm text-text-2">{user.email}</p>
                <p className="text-xs text-text-3 mt-0.5">Email cannot be changed here. Contact support if needed.</p>
              </div>
              <div className="flex justify-between items-center pt-2">
                <p className="text-xs text-text-3">
                  Joined {new Date(profile?.created_at ?? '').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <Button type="submit" size="sm">Save Changes</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Password */}
        {user.app_metadata?.provider === 'email' && (
          <Card>
            <CardHeader>
              <span className="font-pixel text-[7px] text-gold tracking-widest">CHANGE PASSWORD</span>
            </CardHeader>
            <CardBody className="p-6">
              <form action={updatePassword} className="space-y-4">
                <Input
                  name="password" type="password" label="New Password"
                  placeholder="At least 8 characters" minLength={8} required
                />
                <Input
                  name="confirm" type="password" label="Confirm Password"
                  placeholder="Repeat new password" minLength={8} required
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm">Update Password</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Danger zone */}
        <Card>
          <CardHeader>
            <span className="font-pixel text-[7px] text-red tracking-widest">DANGER ZONE</span>
          </CardHeader>
          <CardBody className="p-6">
            <p className="text-sm text-text-2 mb-4">
              Deleting your account is permanent and cannot be undone. All events you own will be deleted.
            </p>
            <Button variant="danger" size="sm" disabled>
              Delete Account (coming soon)
            </Button>
          </CardBody>
        </Card>
      </main>
    </div>
  )
}
