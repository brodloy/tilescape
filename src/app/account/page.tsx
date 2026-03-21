import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { signOut } from '@/app/actions/auth'
import { updateProfile, updatePassword } from '@/app/actions/forms'

export default async function AccountPage() {
  const supabase = await createClient()
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('users').select('display_name, email, created_at').eq('id', user.id).single()

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

        <Card>
          <CardHeader>
            <span className="font-pixel text-[7px] text-gold tracking-widest">PROFILE</span>
          </CardHeader>
          <CardBody className="p-6">
            <form action={updateProfile} className="space-y-4">
              <Input name="display_name" label="RuneScape Name (RSN)"
                defaultValue={profile?.display_name ?? ''} placeholder="e.g. Zezima"
                maxLength={12} hint="Max 12 characters" />
              <div>
                <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">Email</label>
                <p className="text-sm text-text-2">{user.email}</p>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" size="sm">Save Changes</Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {user.app_metadata?.provider === 'email' && (
          <Card>
            <CardHeader>
              <span className="font-pixel text-[7px] text-gold tracking-widest">CHANGE PASSWORD</span>
            </CardHeader>
            <CardBody className="p-6">
              <form action={updatePassword} className="space-y-4">
                <Input name="password" type="password" label="New Password"
                  placeholder="At least 8 characters" minLength={8} required />
                <Input name="confirm" type="password" label="Confirm Password"
                  placeholder="Repeat new password" minLength={8} required />
                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm">Update Password</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <span className="font-pixel text-[7px] text-red tracking-widest">DANGER ZONE</span>
          </CardHeader>
          <CardBody className="p-6">
            <p className="text-sm text-text-2 mb-4">
              Deleting your account is permanent. All events you own will also be deleted.
            </p>
            <Button variant="danger" size="sm" disabled>Delete Account (coming soon)</Button>
          </CardBody>
        </Card>
      </main>
    </div>
  )
}
