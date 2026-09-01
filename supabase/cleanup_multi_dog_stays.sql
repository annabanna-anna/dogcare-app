-- Cleanup: removes the stay_dogs table and NOT NULL relaxation added by
-- migrate_multi_dog_stays.sql. That feature was reverted in the app (it
-- solved the wrong problem — see the "multiple dogs per stay" vs "one dog
-- profile with multiple names/breeds" mixup), so this undoes it in the DB.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.

drop table if exists stay_dogs;

alter table stays alter column dog_id set not null;
