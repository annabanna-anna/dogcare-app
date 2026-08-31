-- Migration: support up to 3 dogs sharing one stay (e.g. two dogs from the
-- same owner with the same schedule/instructions).
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run. Independent of any other pending schema changes.

create table if not exists stay_dogs (
  stay_id  uuid not null references stays(id) on delete cascade,
  dog_id   uuid not null references dogs(id) on delete cascade,
  primary key (stay_id, dog_id)
);

-- Carry every existing stay's single dog over into the join table so
-- current stays keep working once the app switches to reading stay_dogs.
insert into stay_dogs (stay_id, dog_id)
select id, dog_id from stays
where dog_id is not null
on conflict do nothing;

-- dog_id on stays is now legacy — stay_dogs is the source of truth.
alter table stays alter column dog_id drop not null;

create index if not exists stay_dogs_stay_idx on stay_dogs(stay_id);
create index if not exists stay_dogs_dog_idx on stay_dogs(dog_id);

alter table stay_dogs enable row level security;

drop policy if exists "Owners manage their stay dogs" on stay_dogs;
create policy "Owners manage their stay dogs" on stay_dogs
  for all
  using (exists (
    select 1 from stays where stays.id = stay_dogs.stay_id and stays.owner_id = auth.uid()
  ))
  with check (exists (
    select 1 from stays where stays.id = stay_dogs.stay_id and stays.owner_id = auth.uid()
  ));
