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
  completed_at    timestamptz
);

create index if not exists dogs_owner_idx on dogs(owner_id);
create index if not exists stays_owner_idx on stays(owner_id);
create index if not exists stays_dog_idx on stays(dog_id);
create index if not exists tasks_owner_idx on tasks(owner_id);
create index if not exists tasks_stay_idx on tasks(stay_id);
create index if not exists tasks_scheduled_idx on tasks(scheduled_time);

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
