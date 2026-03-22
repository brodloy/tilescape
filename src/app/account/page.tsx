import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/ui/AppNav'
import { Avatar } from '@/components/ui/Avatar'
import { AccountClient } from './AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()
  const db = supabase as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('users').select('display_name, avatar_url, created_at').eq('id', user.id).single()

  const isDiscord = user.identities?.some((i: any) => i.provider === 'discord')
  const memberSince = new Date(profile?.created_at ?? user.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'DM Sans',sans-serif" }}>
      <AppNav
        displayName={profile?.display_name ?? ''}
        avatarUrl={profile?.avatar_url}
        context={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link href="/dashboard" style={{ fontSize: '14px', color: '#9a8f7a', textDecoration: 'none' }}>Dashboard</Link>
            <span style={{ color: '#4a4438' }}>/</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '14px', color: 'var(--text)' }}>Account</span>
          </div>
        }
      />

      <main style={{ maxWidth: '560px', margin: '0 auto', padding: '96px 24px 80px' }}>

        {/* Profile hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', padding: '28px', background: 'var(--surface)', border: '1px solid rgba(232,184,75,0.12)', borderRadius: '18px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, #e8b84b, #3ecf74)' }} />
          <Avatar src={profile?.avatar_url} name={profile?.display_name ?? '?'} size={72} color="#e8b84b" />
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '28px', letterSpacing: '-0.8px', color: '#f0e8d8', marginBottom: '4px' }}>
              {profile?.display_name ?? 'Adventurer'}
            </h1>
            <div style={{ fontSize: '14px', color: '#4a4438' }}>Member since {memberSince}</div>
            {isDiscord && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <svg width="14" height="11" viewBox="0 0 18 14" fill="none">
                  <path d="M15.246 1.177A14.9 14.9 0 0011.55.033a.056.056 0 00-.059.028c-.16.285-.337.657-.461.949a13.75 13.75 0 00-4.062 0 9.596 9.596 0 00-.468-.949.058.058 0 00-.059-.028 14.858 14.858 0 00-3.696 1.144.052.052 0 00-.024.021C.444 4.669-.265 8.059.082 11.406a.062.062 0 00.023.042 14.963 14.963 0 004.496 2.272.058.058 0 00.063-.021c.347-.473.655-.972.92-1.496a.057.057 0 00-.031-.08 9.851 9.851 0 01-1.407-.671.058.058 0 01-.006-.096c.095-.071.19-.144.28-.219a.055.055 0 01.058-.008c2.952 1.347 6.15 1.347 9.066 0a.055.055 0 01.059.007c.09.075.184.149.28.22a.058.058 0 01-.005.095 9.242 9.242 0 01-1.408.67.057.057 0 00-.03.082c.27.523.578 1.022.918 1.495a.057.057 0 00.063.022 14.92 14.92 0 004.503-2.272.058.058 0 00.024-.041c.375-3.877-.628-7.241-2.659-10.208a.046.046 0 00-.023-.021z" fill="#5865F2"/>
                </svg>
                <span style={{ fontSize: '13px', color: '#5865F2' }}>Discord account</span>
              </div>
            )}
          </div>
        </div>

        <AccountClient
          displayName={profile?.display_name ?? ''}
          email={user.email ?? ''}
          isDiscord={!!isDiscord}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </main>
    </div>
  )
}
