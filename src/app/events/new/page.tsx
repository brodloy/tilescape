import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createEventVoid } from '@/app/actions/forms'
import { SubmitButton } from '@/components/ui/SubmitButton'

export default async function NewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none" style={{background:'radial-gradient(ellipse, rgba(232,184,75,0.06) 0%, transparent 65%)'}} />

      <header className="sticky top-0 z-50 bg-[rgba(12,10,8,0.85)] backdrop-blur-md border-b border-[rgba(232,184,75,0.20)] px-6 h-16 flex items-center gap-4">
        <Link href="/dashboard" className="text-text-2 hover:text-text text-sm transition-colors">← Dashboard</Link>
        <span className="text-text-3">/</span>
        <span className="font-syne font-bold text-sm">New Event</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-14 relative z-10">
        <div className="mb-10">
          <div className="font-pixel text-[7px] text-gold tracking-widest mb-3 opacity-80">CREATE EVENT</div>
          <h1 className="font-syne font-extrabold text-4xl tracking-tight mb-2">Create an Event</h1>
          <p className="text-text-2 text-sm font-light">Set up your bingo board, invite your clan, and go live.</p>
        </div>

        <div className="bg-surface border border-[rgba(232,184,75,0.12)] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[rgba(232,184,75,0.10)]">
            <span className="font-pixel text-[7px] text-gold tracking-widest">EVENT DETAILS</span>
          </div>
          <div className="p-6">
            <form action={createEventVoid} className="space-y-5">
              <div>
                <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">Event Name</label>
                <input name="name" placeholder="Dragon Slayers Bingo Week 3" required maxLength={80}
                  className="w-full h-12 px-4 rounded bg-bg3 border border-[rgba(232,184,75,0.20)] text-text text-sm placeholder:text-text-3 outline-none focus:border-gold-dim focus:shadow-[0_0_0_3px_rgba(232,184,75,0.08)] transition-all" />
              </div>
              <div>
                <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">Description <span className="text-text-3">(optional)</span></label>
                <textarea name="description" placeholder="A brief description of the event, rules, prizes..." rows={3}
                  className="w-full px-4 py-3 rounded bg-bg3 border border-[rgba(232,184,75,0.20)] text-text text-sm placeholder:text-text-3 outline-none resize-none focus:border-gold-dim focus:shadow-[0_0_0_3px_rgba(232,184,75,0.08)] transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">Start Date</label>
                  <input name="start_date" type="datetime-local"
                    className="w-full h-12 px-4 rounded bg-bg3 border border-[rgba(232,184,75,0.20)] text-text text-sm outline-none focus:border-gold-dim transition-all" />
                </div>
                <div>
                  <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">End Date</label>
                  <input name="end_date" type="datetime-local"
                    className="w-full h-12 px-4 rounded bg-bg3 border border-[rgba(232,184,75,0.20)] text-text text-sm outline-none focus:border-gold-dim transition-all" />
                </div>
              </div>
              <div>
                <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">Discord Webhook URL</label>
                <input name="discord_webhook_url" type="url" placeholder="https://discord.com/api/webhooks/..."
                  className="w-full h-12 px-4 rounded bg-bg3 border border-[rgba(232,184,75,0.20)] text-text text-sm placeholder:text-text-3 outline-none focus:border-gold-dim transition-all" />
                <p className="mt-1.5 text-xs text-text-3">Optional — posts drop notifications to your Discord channel</p>
              </div>
              <div className="pt-2 flex gap-3 justify-end">
                <Link href="/dashboard" className="h-10 px-4 inline-flex items-center font-syne font-bold text-sm border border-[rgba(232,184,75,0.20)] rounded text-text-2 hover:text-text hover:border-gold-dim transition-all">
                  Cancel
                </Link>
                <SubmitButton>Create Event →</SubmitButton>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-[rgba(232,184,75,0.04)] border border-[rgba(232,184,75,0.10)]">
          <p className="font-pixel text-[6px] text-gold tracking-wider mb-2.5">WHAT HAPPENS NEXT</p>
          <ul className="text-xs text-text-2 space-y-1.5 font-light">
            <li>→ An 8-character invite code is automatically generated</li>
            <li>→ You will be taken to the event page to add tiles and teams</li>
            <li>→ Share the invite code with your clan to let them join</li>
            <li>→ Set the event live when you are ready</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
