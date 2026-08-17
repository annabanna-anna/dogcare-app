-- GoodPup database schema.
-- Run this once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.

-- ── Enums ──────────────────────────────────────────────────────────────────

do $$ begin
  create type dog_size as enum ('small', 'medium', 'large', 'extra-large');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_type as enum ('walk', 'meal', 'medication', 'potty', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('pending', 'done', 'skipped', 'overdue');
exception when duplicate_object then null; end $$;

-- ── Tables ─────────────────────────────────────────────────────────────────
-- owner_id ties every row to the signed-in user (auth.uid()); RLS below makes
-- sure a user can only ever see or touch their own dogs/stays/tasks.

create table if not exists dogs (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id) on delete cascade,
  name              text not null,
  breed             text not null default '',
  size              dog_size not null default 'medium',
  owner_name        text not null default '',
  owner_contact     text not null default '',
  photo_url         text,
  behavior_notes    text not null default '',
  food_notes        text not null default '',
  medication_notes  text not null default '',
  walk_notes        text not null default '',
  emergency_notes   text not null default '',
  other_notes       text not null default '',
  walk_time_flexible boolean not null default false,
  care_schedule     jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists stays (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  dog_id      uuid not null references dogs(id) on delete cascade,
  start_date  timestamptz not null,
  end_date    timestamptz not null,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists tasks (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  stay_id         uuid not null references stays(id) on delete cascade,
  dog_id          uuid not null references dogs(id) on delete cascade,
  dog_name        text not null,
  type            task_type not null,
  title           text not null,
  scheduled_time  timestamptz not null,
  note            text,
  status          task_status not null default 'pending',
  completed_at    timestamptz,
  -- Tracks what this task was last pushed to Google as, so a re-push can
  -- update that same event/task instead of creating a duplicate.
  google_ext_id   text,
  google_ext_kind text check (google_ext_kind in ('event', 'task'))
);

-- Patches an existing tasks table (created before the Google push-tracking
-- columns existed) — no-ops on a fresh install where the columns above
-- already cover this.
alter table tasks add column if not exists google_ext_id text;
alter table tasks add column if not exists google_ext_kind text;
do $$ begin
  alter table tasks add constraint tasks_google_ext_kind_check check (google_ext_kind in ('event', 'task'));
exception when duplicate_object then null; end $$;

-- Set once the send-task-reminders Edge Function has pushed a reminder for
-- this task, so each task only ever notifies once.
alter table tasks add column if not exists reminder_sent_at timestamptz;

-- Patches an existing dogs table (created before the catch-all notes field
-- existed) — no-ops on a fresh install where the column above already covers this.
alter table dogs add column if not exists other_notes text not null default '';
alter table dogs add column if not exists walk_time_flexible boolean not null default false;

-- One row per browser/device that turned on push reminders in Settings —
-- the endpoint/p256dh/auth triple is the Web Push subscription the browser
-- issued, and reminder_minutes is how far ahead that device wants nudging.
create table if not exists push_subscriptions (
  id                uuid primary key default gen_random_uuid(),
  owner_id          uuid not null references auth.users(id) on delete cascade,
  endpoint          text not null unique,
  p256dh            text not null,
  auth              text not null,
  reminder_minutes  int not null default 15,
  created_at        timestamptz not null default now()
);

-- One row per user who connected Google Calendar, holding the long-lived
-- refresh token Google issues alongside the 1-hour access token. Access
-- tokens are minted from this on demand by the google-oauth Edge Function,
-- so a user connects once instead of every hour.
--
-- Deliberately has NO RLS policies: with RLS on and no policy, anon and
-- authenticated are denied outright and only the service role (i.e. the
-- Edge Function) can touch it. The refresh token is never readable by the
-- browser, even with a valid user JWT. Clients go through the function for
-- storing and clearing, and through has_google_credentials() to ask whether
-- a connection exists.
create table if not exists google_credentials (
  owner_id      uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists dogs_owner_idx on dogs(owner_id);
create index if not exists stays_owner_idx on stays(owner_id);
create index if not exists stays_dog_idx on stays(dog_id);
create index if not exists tasks_owner_idx on tasks(owner_id);
create index if not exists tasks_stay_idx on tasks(stay_id);
create index if not exists tasks_scheduled_idx on tasks(scheduled_time);
create index if not exists push_subscriptions_owner_idx on push_subscriptions(owner_id);
-- The reminder sweep only ever looks at pending, not-yet-notified tasks.
create index if not exists tasks_reminder_due_idx
  on tasks(scheduled_time) where status = 'pending' and reminder_sent_at is null;

-- ── updated_at auto-touch ────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists dogs_set_updated_at on dogs;
create trigger dogs_set_updated_at
  before update on dogs
  for each row execute function set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table dogs enable row level security;
alter table stays enable row level security;
alter table tasks enable row level security;
alter table push_subscriptions enable row level security;
-- No policies by design — see the table comment. Service role only.
alter table google_credentials enable row level security;

-- Lets the app ask "is this user connected to Google Calendar?" without
-- being able to read the refresh token itself. security definer so it can
-- see past the deny-all RLS above; the where clause pins it to the caller.
create or replace function has_google_credentials()
returns boolean as $$
  select exists (select 1 from google_credentials where owner_id = auth.uid());
$$ language sql security definer stable set search_path = public;

revoke all on function has_google_credentials() from public, anon;
grant execute on function has_google_credentials() to authenticated;

drop policy if exists "Owners manage their push subscriptions" on push_subscriptions;
create policy "Owners manage their push subscriptions" on push_subscriptions
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Owners manage their dogs" on dogs;
create policy "Owners manage their dogs" on dogs
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Owners manage their stays" on stays;
create policy "Owners manage their stays" on stays
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Owners manage their tasks" on tasks;
create policy "Owners manage their tasks" on tasks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── Storage: dog photos ──────────────────────────────────────────────────────
-- Public bucket (photos are shown via plain <img src>); write access is still
-- locked to the authenticated owner via the folder-prefix policies below.

insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

drop policy if exists "Dog photos are publicly readable" on storage.objects;
create policy "Dog photos are publicly readable" on storage.objects
  for select using (bucket_id = 'dog-photos');

drop policy if exists "Owners upload their own dog photos" on storage.objects;
create policy "Owners upload their own dog photos" on storage.objects
  for insert with check (
    bucket_id = 'dog-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners update their own dog photos" on storage.objects;
create policy "Owners update their own dog photos" on storage.objects
  for update using (
    bucket_id = 'dog-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Owners delete their own dog photos" on storage.objects;
create policy "Owners delete their own dog photos" on storage.objects
  for delete using (
    bucket_id = 'dog-photos' and (storage.foldername(name))[1] = auth.uid()::text
  );
