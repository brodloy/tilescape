-- ============================================================
-- TileScape Database Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

-- Users (mirrors auth.users, populated via trigger)
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  display_name text not null,
  avatar_url  text,
  created_at  timestamptz default now() not null
);

-- Events
create table public.events (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  description         text,
  created_by          uuid not null references public.users(id) on delete cascade,
  start_date          timestamptz,
  end_date            timestamptz,
  invite_code         text not null unique,
  status              text not null default 'draft' check (status in ('draft', 'live', 'ended')),
  discord_webhook_url text,
  created_at          timestamptz default now() not null
);

-- Event Members
create table public.event_members (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references public.events(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  role       text not null default 'member' check (role in ('owner', 'moderator', 'member')),
  joined_at  timestamptz default now() not null,
  unique(event_id, user_id)
);

-- Teams
create table public.teams (
  id         uuid primary key default uuid_generate_v4(),
  event_id   uuid not null references public.events(id) on delete cascade,
  name       text not null,
  color      text not null default '#e8b84b',
  created_at timestamptz default now() not null
);

-- Team Members
create table public.team_members (
  id              uuid primary key default uuid_generate_v4(),
  team_id         uuid not null references public.teams(id) on delete cascade,
  event_member_id uuid not null references public.event_members(id) on delete cascade,
  unique(team_id, event_member_id)
);

-- Tiles
create table public.tiles (
  id          uuid primary key default uuid_generate_v4(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text not null,
  source_raid text,
  is_purple   boolean not null default false,
  sprite_url  text,
  points      integer not null default 1,
  position    integer not null, -- 0-24 for 5x5 grid
  free_space  boolean not null default false,
  created_at  timestamptz default now() not null,
  unique(event_id, position)
);

-- Tile Completions
create table public.tile_completions (
  id           uuid primary key default uuid_generate_v4(),
  tile_id      uuid not null references public.tiles(id) on delete cascade,
  team_id      uuid not null references public.teams(id) on delete cascade,
  submitted_by uuid not null references public.users(id) on delete cascade,
  proof_url    text not null,
  status       text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz default now() not null,
  reviewed_at  timestamptz,
  reviewed_by  uuid references public.users(id),
  unique(tile_id, team_id) -- one completion per tile per team
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────

create index idx_events_created_by       on public.events(created_by);
create index idx_events_invite_code      on public.events(invite_code);
create index idx_event_members_event_id  on public.event_members(event_id);
create index idx_event_members_user_id   on public.event_members(user_id);
create index idx_teams_event_id          on public.teams(event_id);
create index idx_team_members_team_id    on public.team_members(team_id);
create index idx_tiles_event_id          on public.tiles(event_id);
create index idx_tile_completions_tile   on public.tile_completions(tile_id);
create index idx_tile_completions_team   on public.tile_completions(team_id);
create index idx_tile_completions_status on public.tile_completions(status);

-- ─────────────────────────────────────────
-- TRIGGER: auto-create user profile on signup
-- ─────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

alter table public.users            enable row level security;
alter table public.events           enable row level security;
alter table public.event_members    enable row level security;
alter table public.teams            enable row level security;
alter table public.team_members     enable row level security;
alter table public.tiles            enable row level security;
alter table public.tile_completions enable row level security;

-- ── users ──
-- Anyone can read their own profile
create policy "Users can read own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Event members can see each other's profiles
create policy "Event members can see each other"
  on public.users for select
  using (
    exists (
      select 1 from public.event_members em1
      join public.event_members em2 on em1.event_id = em2.event_id
      where em1.user_id = auth.uid()
        and em2.user_id = public.users.id
    )
  );

-- ── events ──
-- Anyone authenticated can create events
create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() = created_by);

-- Members can read events they belong to
create policy "Members can read their events"
  on public.events for select
  using (
    exists (
      select 1 from public.event_members
      where event_id = public.events.id
        and user_id = auth.uid()
    )
  );

-- Owner can update their events
create policy "Owner can update events"
  on public.events for update
  using (auth.uid() = created_by);

-- Owner can delete their events
create policy "Owner can delete events"
  on public.events for delete
  using (auth.uid() = created_by);

-- ── event_members ──
-- Members can see who's in their events
create policy "Members can view event members"
  on public.event_members for select
  using (
    exists (
      select 1 from public.event_members em
      where em.event_id = public.event_members.event_id
        and em.user_id = auth.uid()
    )
  );

-- Anyone can join an event (via invite code — validated in API)
create policy "Users can join events"
  on public.event_members for insert
  with check (auth.uid() = user_id);

-- Owner/moderator can update member roles
create policy "Owner can update member roles"
  on public.event_members for update
  using (
    exists (
      select 1 from public.event_members em
      where em.event_id = public.event_members.event_id
        and em.user_id = auth.uid()
        and em.role in ('owner', 'moderator')
    )
  );

-- Owner can remove members
create policy "Owner can remove members"
  on public.event_members for delete
  using (
    exists (
      select 1 from public.event_members em
      where em.event_id = public.event_members.event_id
        and em.user_id = auth.uid()
        and em.role = 'owner'
    )
  );

-- ── teams ──
-- Members can read teams in their events
create policy "Members can view teams"
  on public.teams for select
  using (
    exists (
      select 1 from public.event_members
      where event_id = public.teams.event_id
        and user_id = auth.uid()
    )
  );

-- Owner/moderator can manage teams
create policy "Owner can manage teams"
  on public.teams for all
  using (
    exists (
      select 1 from public.event_members
      where event_id = public.teams.event_id
        and user_id = auth.uid()
        and role in ('owner', 'moderator')
    )
  );

-- ── team_members ──
-- Members can view team assignments
create policy "Members can view team assignments"
  on public.team_members for select
  using (
    exists (
      select 1 from public.teams t
      join public.event_members em on em.event_id = t.event_id
      where t.id = public.team_members.team_id
        and em.user_id = auth.uid()
    )
  );

-- Owner/moderator can assign team members
create policy "Owner can assign team members"
  on public.team_members for all
  using (
    exists (
      select 1 from public.teams t
      join public.event_members em on em.event_id = t.event_id
      where t.id = public.team_members.team_id
        and em.user_id = auth.uid()
        and em.role in ('owner', 'moderator')
    )
  );

-- ── tiles ──
-- Members can view tiles
create policy "Members can view tiles"
  on public.tiles for select
  using (
    exists (
      select 1 from public.event_members
      where event_id = public.tiles.event_id
        and user_id = auth.uid()
    )
  );

-- Owner/moderator can manage tiles
create policy "Owner can manage tiles"
  on public.tiles for all
  using (
    exists (
      select 1 from public.event_members
      where event_id = public.tiles.event_id
        and user_id = auth.uid()
        and role in ('owner', 'moderator')
    )
  );

-- ── tile_completions ──
-- Members can view completions
create policy "Members can view completions"
  on public.tile_completions for select
  using (
    exists (
      select 1 from public.tiles tl
      join public.event_members em on em.event_id = tl.event_id
      where tl.id = public.tile_completions.tile_id
        and em.user_id = auth.uid()
    )
  );

-- Members can submit completions
create policy "Members can submit completions"
  on public.tile_completions for insert
  with check (
    auth.uid() = submitted_by
    and exists (
      select 1 from public.tiles tl
      join public.event_members em on em.event_id = tl.event_id
      where tl.id = tile_id
        and em.user_id = auth.uid()
    )
  );

-- Owner/moderator can approve/reject completions
create policy "Owner can review completions"
  on public.tile_completions for update
  using (
    exists (
      select 1 from public.tiles tl
      join public.event_members em on em.event_id = tl.event_id
      where tl.id = public.tile_completions.tile_id
        and em.user_id = auth.uid()
        and em.role in ('owner', 'moderator')
    )
  );

-- Team members can delete their own team's completions (for undo)
-- Owners and moderators can delete any completion
create policy "Members can delete own team completions"
  on public.tile_completions for delete
  using (
    exists (
      select 1 from public.tiles tl
      join public.event_members em on em.event_id = tl.event_id
      join public.team_members tm on tm.event_member_id = em.id
      where tl.id = public.tile_completions.tile_id
        and em.user_id = auth.uid()
        and tm.team_id = public.tile_completions.team_id
    )
    or
    exists (
      select 1 from public.tiles tl
      join public.event_members em on em.event_id = tl.event_id
      where tl.id = public.tile_completions.tile_id
        and em.user_id = auth.uid()
        and em.role in ('owner', 'moderator')
    )
  );

-- Add prize pool to events
alter table public.events add column if not exists prize_pool bigint default 0;

-- Proof required toggle
alter table public.events add column if not exists require_proof boolean not null default false;

-- Allow anyone to look up an event by invite code (needed to join)
create policy "Anyone can view events by invite code"
  on public.events for select
  using (invite_code is not null);
