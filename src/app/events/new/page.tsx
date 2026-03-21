import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createEventAction } from '@/app/actions/forms'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export default async function NewEventPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 bg-bg2 border-b border-[rgba(232,184,75,0.20)] px-6 h-14 flex items-center gap-4">
        <Link href="/dashboard" className="text-text-2 hover:text-text text-sm transition-colors">
          ← Dashboard
        </Link>
        <span className="text-text-3">/</span>
        <span className="font-syne font-bold text-sm">New Event</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-2">Create an Event</h1>
          <p className="text-text-2 text-sm">Set up your bingo board, invite your clan, and go live.</p>
        </div>

        <Card>
          <CardHeader>
            <span className="font-pixel text-[7px] text-gold tracking-widest">EVENT DETAILS</span>
          </CardHeader>
          <CardBody className="p-6">
            <form action={createEventAction} className="space-y-5">

              <Input
                name="name"
                label="Event Name"
                placeholder="Dragon Slayers Bingo Week 3"
                required
                maxLength={80}
              />

              <div>
                <label className="block font-pixel text-[7px] text-text-2 tracking-wider mb-2 uppercase">
                  Description <span className="text-text-3">(optional)</span>
                </label>
                <textarea
                  name="description"
                  placeholder="A brief description of the event, rules, prizes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded bg-surface border border-[rgba(232,184,75,0.20)] text-text text-sm placeholder:text-text-3 outline-none resize-none focus:border-gold-dim focus:bg-bg3 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  name="start_date"
                  type="datetime-local"
                  label="Start Date"
                />
                <Input
                  name="end_date"
                  type="datetime-local"
                  label="End Date"
                />
              </div>

              <Input
                name="discord_webhook_url"
                label="Discord Webhook URL"
                placeholder="https://discord.com/api/webhooks/..."
                hint="Optional — posts drop notifications to your Discord channel"
                type="url"
              />

              <div className="pt-2 flex gap-3 justify-end">
                <Link href="/dashboard">
                  <Button type="button" variant="ghost">Cancel</Button>
                </Link>
                <Button type="submit" variant="primary">
                  Create Event →
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <div className="mt-6 p-4 rounded-lg bg-[rgba(232,184,75,0.05)] border border-[rgba(232,184,75,0.12)]">
          <p className="font-pixel text-[6px] text-gold tracking-wider mb-2">WHAT HAPPENS NEXT</p>
          <ul className="text-xs text-text-2 space-y-1.5">
            <li>→ An 8-character invite code is automatically generated</li>
            <li>→ You'll be taken to the event page to add tiles and teams</li>
            <li>→ Share the invite code with your clan to let them join</li>
            <li>→ Set the event live when you're ready</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
