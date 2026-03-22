import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginClient } from './LoginClient'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="font-pixel text-[8px] text-gold-dim animate-pulse">LOADING…</div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}
