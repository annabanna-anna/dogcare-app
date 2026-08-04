-- Schedules the send-task-reminders Edge Function to run every minute.
-- Run AFTER schema.sql and after deploying the function (see the header of
-- supabase/functions/send-task-reminders/index.ts).
--
-- Before running, replace the two placeholders below:
--   YOUR_PROJECT_REF — from Supabase → Settings → General (e.g. uakozrrrcouqncgtyyja)
--   YOUR_ANON_KEY    — from Supabase → Settings → API (the public anon key,
--                      same one as VITE_SUPABASE_ANON_KEY in .env.local)
-- Safe to re-run: unschedules any previous copy first.

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$ begin
  perform cron.unschedule('send-task-reminders');
exception when others then null; end $$;

select cron.schedule(
  'send-task-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-task-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
