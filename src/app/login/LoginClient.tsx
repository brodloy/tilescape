'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  signInWithEmail,
  signUpWithEmail,
} from '@/app/actions/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Tab = 'login' | 'register'

export function LoginClient() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'auth_failed' ? 'Authentication failed. Please try again.' : null
  )
  const [success, setSuccess] = useState<string | null>(null)
  const [discordLoading, setDiscordLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  function switchTab(t: Tab) { setTab(t); setError(null); setSuccess(null) }

  async function handleDiscord() {
    setDiscordLoading(true)
    setError(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    })
    if (error || !data?.url) {
      setDiscordLoading(false)
      setError('Could not connect to Discord. Please try again.')
      return
    }
    // Stay in loading state — browser is navigating to Discord
    window.location.href = data.url
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await signInWithEmail(fd)
      if (r?.error) setError(r.error)
    })
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setSuccess(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await signUpWithEmail(fd)
      if (r?.error) setError(r.error)
      if (r?.success) setSuccess(r.success)
    })
  }

  const anyLoading = isPending || discordLoading

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <style>{`
        @media(max-width:1024px){.ll{display:none!important}}
        .dc:hover{background:rgba(88,101,242,0.15)!important;border-color:rgba(88,101,242,0.5)!important}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes tilescroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
      `}</style>

      {/* LEFT */}
      <div className="ll" style={{display:'flex',flexDirection:'column',justifyContent:'space-between',background:'var(--bg2)',borderRight:'1px solid rgba(232,184,75,0.2)',padding:'40px 48px',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:'linear-gradient(rgba(232,184,75,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(232,184,75,0.04) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
        <div style={{position:'absolute',top:'-128px',left:'-128px',width:'600px',height:'600px',borderRadius:'50%',pointerEvents:'none',background:'radial-gradient(circle,rgba(232,184,75,0.07) 0%,transparent 60%)'}}/>

        <Link href="/" style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',gap:'10px',textDecoration:'none'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,6px)',gridTemplateRows:'repeat(3,6px)',gap:'2px'}}>
            {[1,0,1,1,1,0,0,1,1].map((on,i)=><span key={i} style={{display:'block',borderRadius:'1px',background:on?'#e8b84b':'transparent'}}/>)}
          </div>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'20px',color:'#f0e8d8',letterSpacing:'-0.5px'}}>
            Tile<em style={{color:'#e8b84b',fontStyle:'normal'}}>Scape</em>
          </span>
        </Link>

        <div style={{position:'relative',zIndex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'20px'}}>
            <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#3ecf74',boxShadow:'0 0 6px #3ecf74'}}/>
            <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:'7px',color:'#e8b84b',letterSpacing:'1px'}}>2,400+ CLANS ACTIVE</span>
          </div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'52px',lineHeight:0.95,letterSpacing:'-2px',marginBottom:'20px',color:'#f0e8d8'}}>
            Track every<br/><em style={{fontStyle:'normal',color:'#e8b84b'}}>tile.</em><br/>Celebrate every<br/>purple.
          </h2>
          <p style={{color:'#9a8f7a',fontSize:'15px',fontWeight:300,lineHeight:1.7,maxWidth:'340px'}}>
            The modern bingo & event platform for OSRS clans. No spreadsheets — just your boards, your teams, your drops.
          </p>
        </div>

        <div style={{position:'relative',zIndex:1,display:'flex',alignItems:'center',gap:'24px'}}>
          {[{num:'18k+',label:'Members'},{num:'94k+',label:'Tiles Completed'},{num:'6.5k+',label:'Events Hosted'}].map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:'24px'}}>
              {i>0&&<div style={{width:'1px',height:'32px',background:'rgba(232,184,75,0.2)'}}/>}
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'20px',color:'#f0e8d8'}}>{s.num}</div>
                <div style={{fontSize:'12px',color:'#4a4438'}}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT */}
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',minHeight:'100vh',position:'relative'}}>
        <div style={{position:'absolute',bottom:'128px',right:0,width:'500px',height:'500px',borderRadius:'50%',pointerEvents:'none',background:'radial-gradient(circle,rgba(232,184,75,0.04) 0%,transparent 60%)'}}/>

        <div style={{width:'100%',maxWidth:'380px',position:'relative',zIndex:1}}>

          {/* Tab switcher */}
          <div style={{display:'flex',background:'var(--surface)',border:'1px solid rgba(232,184,75,0.2)',borderRadius:'10px',padding:'4px',marginBottom:'28px'}}>
            {(['login','register'] as Tab[]).map(t=>(
              <button key={t} onClick={()=>switchTab(t)} style={{flex:1,padding:'10px',borderRadius:'7px',border:'none',cursor:'pointer',fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'14px',transition:'all .15s',background:tab===t?'var(--surface2)':'none',color:tab===t?'var(--text)':'var(--text2)'}}>
                {t==='login'?'Sign in':'Create account'}
              </button>
            ))}
          </div>

          {/* Discord — primary */}
          <button onClick={handleDiscord} disabled={anyLoading} className="dc"
            style={{width:'100%',height:'52px',display:'flex',alignItems:'center',justifyContent:'center',gap:'12px',background:'rgba(88,101,242,0.08)',border:'1px solid rgba(88,101,242,0.3)',borderRadius:'10px',cursor:anyLoading?'not-allowed':'pointer',opacity:anyLoading?0.6:1,marginBottom:'20px',transition:'all .15s'}}>
            {discordLoading ? (
              <>
                <div style={{width:'18px',height:'18px',border:'2px solid rgba(88,101,242,0.3)',borderTopColor:'#5865F2',borderRadius:'50%',animation:'spin .7s linear infinite'}}/>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'15px',color:'#5865F2'}}>Connecting to Discord…</span>
              </>
            ) : (
              <>
                <svg width="20" height="15" viewBox="0 0 18 14" fill="none">
                  <path d="M15.246 1.177A14.9 14.9 0 0011.55.033a.056.056 0 00-.059.028c-.16.285-.337.657-.461.949a13.75 13.75 0 00-4.062 0 9.596 9.596 0 00-.468-.949.058.058 0 00-.059-.028 14.858 14.858 0 00-3.696 1.144.052.052 0 00-.024.021C.444 4.669-.265 8.059.082 11.406a.062.062 0 00.023.042 14.963 14.963 0 004.496 2.272.058.058 0 00.063-.021c.347-.473.655-.972.92-1.496a.057.057 0 00-.031-.08 9.851 9.851 0 01-1.407-.671.058.058 0 01-.006-.096c.095-.071.19-.144.28-.219a.055.055 0 01.058-.008c2.952 1.347 6.15 1.347 9.066 0a.055.055 0 01.059.007c.09.075.184.149.28.22a.058.058 0 01-.005.095 9.242 9.242 0 01-1.408.67.057.057 0 00-.03.082c.27.523.578 1.022.918 1.495a.057.057 0 00.063.022 14.92 14.92 0 004.503-2.272.058.058 0 00.024-.041c.375-3.877-.628-7.241-2.659-10.208a.046.046 0 00-.023-.021zM6.013 9.388c-.875 0-1.597-.803-1.597-1.789 0-.986.707-1.789 1.597-1.789.897 0 1.612.81 1.597 1.789 0 .986-.707 1.789-1.597 1.789zm5.904 0c-.876 0-1.597-.803-1.597-1.789 0-.986.706-1.789 1.597-1.789.897 0 1.612.81 1.597 1.789 0 .986-.7 1.789-1.597 1.789z" fill="#5865F2"/>
                </svg>
                <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:'15px',color:'#5865F2'}}>Continue with Discord</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'20px'}}>
            <div style={{flex:1,height:'1px',background:'rgba(232,184,75,0.12)'}}/>
            <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:'6px',color:'#4a4438',letterSpacing:'1px'}}>OR</span>
            <div style={{flex:1,height:'1px',background:'rgba(232,184,75,0.12)'}}/>
          </div>

          {/* Error/Success */}
          {error&&<div style={{marginBottom:'16px',padding:'12px 14px',borderRadius:'8px',background:'rgba(232,85,85,0.08)',border:'1px solid rgba(232,85,85,0.2)',color:'#e85555',fontSize:'14px',lineHeight:1.5}}>{error}</div>}
          {success&&<div style={{marginBottom:'16px',padding:'12px 14px',borderRadius:'8px',background:'rgba(62,207,116,0.08)',border:'1px solid rgba(62,207,116,0.2)',color:'#3ecf74',fontSize:'14px',lineHeight:1.5}}>{success}</div>}

          {/* Login */}
          {tab==='login'&&(
            <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'24px',letterSpacing:'-0.5px',marginBottom:'4px'}}>Welcome back.</h1>
                <p style={{color:'#9a8f7a',fontSize:'14px',fontWeight:300}}>Sign in with your email address.</p>
              </div>
              <Input name="email" type="email" label="Email address" placeholder="you@example.com" autoComplete="email" required/>
              <Input name="password" type="password" label="Password" placeholder="Enter your password" autoComplete="current-password" required/>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'14px',color:'#9a8f7a',cursor:'pointer'}}>
                  <input type="checkbox" name="remember" defaultChecked style={{accentColor:'#e8b84b'}}/>
                  Stay signed in
                </label>
                <button type="button" style={{fontSize:'14px',color:'#7a5c1e',background:'none',border:'none',cursor:'pointer'}}>Forgot password?</button>
              </div>
              <Button type="submit" size="lg" loading={isPending} className="w-full">Sign in →</Button>
              <p style={{textAlign:'center',fontSize:'14px',color:'#9a8f7a'}}>
                No account?{' '}
                <button type="button" onClick={()=>switchTab('register')} style={{color:'#e8b84b',fontWeight:600,background:'none',border:'none',cursor:'pointer',fontSize:'14px'}}>Create one free →</button>
              </p>
            </form>
          )}

          {/* Register */}
          {tab==='register'&&(
            <form onSubmit={handleRegister} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <div>
                <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:'24px',letterSpacing:'-0.5px',marginBottom:'4px'}}>Join TileScape.</h1>
                <p style={{color:'#9a8f7a',fontSize:'14px',fontWeight:300}}>Set up your account in seconds.</p>
              </div>
              <Input name="display_name" type="text" label="RuneScape Name (RSN)" placeholder="e.g. Zezima" autoComplete="username" maxLength={12} hint="Max 12 characters · Your in-game display name" required/>
              <Input name="email" type="email" label="Email address" placeholder="you@example.com" autoComplete="email" required/>
              <Input name="password" type="password" label="Password" placeholder="Create a strong password" autoComplete="new-password" required minLength={8}/>
              <label style={{display:'flex',alignItems:'flex-start',gap:'8px',fontSize:'14px',color:'#9a8f7a',cursor:'pointer',lineHeight:1.5}}>
                <input type="checkbox" name="terms" required style={{accentColor:'#e8b84b',marginTop:'2px',flexShrink:0}}/>
                <span>I agree to the <a href="#" style={{color:'#e8b84b'}}>Terms of Service</a> and <a href="#" style={{color:'#e8b84b'}}>Privacy Policy</a></span>
              </label>
              <Button type="submit" size="lg" loading={isPending} className="w-full">Create Account →</Button>
              <p style={{textAlign:'center',fontSize:'14px',color:'#9a8f7a'}}>
                Already have an account?{' '}
                <button type="button" onClick={()=>switchTab('login')} style={{color:'#e8b84b',fontWeight:600,background:'none',border:'none',cursor:'pointer',fontSize:'14px'}}>Sign in →</button>
              </p>
            </form>
          )}
        </div>

        <p style={{position:'absolute',bottom:'24px',fontFamily:"'Press Start 2P',monospace",fontSize:'6px',color:'#4a4438',letterSpacing:'1px'}}>
          © 2025 TileScape · Not affiliated with Jagex
        </p>
      </div>
    </div>
  )
}
