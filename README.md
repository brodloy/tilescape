# TileScape — OSRS Clan Bingo & Event Tracker

## Stack
- **Next.js 14** (App Router) — framework
- **Supabase** — Postgres + Auth + Realtime
- **Tailwind CSS** — styling
- **Vercel** — deployment

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**, paste and run `supabase/migrations/001_initial.sql`
3. Go to **Auth → Providers**, enable:
   - **Discord** — add Client ID + Secret from [discord.com/developers](https://discord.com/developers/applications)
   - **Google** — add Client ID + Secret from Google Cloud Console
4. Set the redirect URL in each provider to: `https://your-domain.com/auth/callback`
5. Copy your keys from **Settings → API**

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add all 4 environment variables in Vercel dashboard
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Update the OAuth redirect URLs in Supabase + Discord + Google to your Vercel domain
6. Deploy

---

## Project Structure

```
src/
  app/
    actions/          Server actions (auth, events, teams, completions, tiles)
    auth/callback/    OAuth callback handler
    dashboard/        User's events list
    events/new/       Create event
    events/[id]/      Event board view
    events/[id]/manage/  Tile builder + team manager
    join/             Join via invite code
    login/            Login + register
  components/
    event/            Board components (TileGrid, TeamStandings, MemberList, etc.)
    ui/               Button, Input, Badge, Card
  lib/supabase/       Browser + server + admin clients
  middleware.ts       Route protection + session refresh
  types/database.ts  Full TypeScript types
supabase/
  migrations/001_initial.sql   Full schema + RLS policies
```

---

## Key Features

- **Auth** — Email, Discord OAuth, Google OAuth via Supabase
- **Events** — Create events with invite codes, manage status (draft/live/ended)
- **Teams** — Owner creates teams, assigns members, can delegate mod permissions
- **Bingo Board** — 5×5 grid, OSRS wiki sprites, OSRS template with one click
- **Submissions** — Members submit CDN proof URLs, owner/mods approve or reject
- **Discord Webhooks** — Auto-posts approved drops to your Discord channel
- **Team Standings** — Live leaderboard with 🥇🥈🥉 medals, bingo detection
- **RLS** — All data protected by Supabase Row Level Security policies
