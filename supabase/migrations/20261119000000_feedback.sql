-- Eternal Realms — player feedback, bug reports and automatic error reports.
-- Run once: Supabase dashboard → SQL Editor → New query → paste this whole file → Run. Safe to re-run.
--
-- Security model:
--   * Players (signed in or not) can only INSERT a new report. They can never read, change or delete reports.
--   * Reading and triage happen with the service-role key (the daily maintenance routine) or as an admin.
--   * A trigger keeps reports small and stops flooding (per player and overall).

create table if not exists public.feedback (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  kind        text not null check (kind in ('bug','idea','balance','other','crash')),
  msg         text not null check (char_length(msg) between 3 and 2000),
  meta        jsonb not null default '{}'::jsonb check (pg_column_size(meta) <= 6000),
  cid         text check (cid is null or char_length(cid) <= 64),       -- anonymous per-device id from the game
  uid         uuid default auth.uid(),                                   -- set when the player is signed in
  status      text not null default 'new' check (status in ('new','triaged','fixed','planned','wontfix','duplicate')),
  notes       text,
  updated_at  timestamptz not null default now()
);
create index if not exists feedback_status_idx on public.feedback (status, created_at desc);
create index if not exists feedback_cid_idx on public.feedback (cid, created_at desc);

alter table public.feedback enable row level security;
drop policy if exists "feedback: anyone can submit" on public.feedback;
create policy "feedback: anyone can submit" on public.feedback for insert to anon, authenticated
  with check (status = 'new' and notes is null and (uid is null or uid = (select auth.uid())));
drop policy if exists "feedback: admins read" on public.feedback;
create policy "feedback: admins read" on public.feedback for select to authenticated using (public.is_admin());
drop policy if exists "feedback: admins triage" on public.feedback;
create policy "feedback: admins triage" on public.feedback for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- flood control: at most 8 reports per device per hour, 20 crash reports per device per day, 600 reports per hour overall
create or replace function public.feedback_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then new.updated_at := now(); return new; end if;
  new.created_at := now(); new.updated_at := now(); new.status := 'new'; new.notes := null;
  if new.uid is not null and new.uid is distinct from auth.uid() then new.uid := auth.uid(); end if;
  if new.cid is not null then
    if (select count(*) from public.feedback where cid = new.cid and created_at > now() - interval '1 hour' and kind <> 'crash') >= 8 and new.kind <> 'crash' then
      raise exception 'Too many reports from this device. Please try again later.';
    end if;
    if new.kind = 'crash' and (select count(*) from public.feedback where cid = new.cid and kind = 'crash' and created_at > now() - interval '1 day') >= 20 then
      return null;   -- silently drop extra automatic error reports
    end if;
  end if;
  if (select count(*) from public.feedback where created_at > now() - interval '1 hour') >= 600 then
    raise exception 'Reports are temporarily paused. Please try again later.';
  end if;
  return new;
end $$;
drop trigger if exists feedback_guard on public.feedback;
create trigger feedback_guard before insert or update on public.feedback for each row execute function public.feedback_guard();

grant insert on public.feedback to anon, authenticated;
grant select, update on public.feedback to authenticated;

-- ---------- maintenance access (least privilege) ----------
-- The daily maintenance routine does NOT get the service-role key. It gets an "ops token" that can only list and
-- label feedback, through the functions below. Only a hash of the token is stored.
-- To create a token: run   select public.ops_new_token();   in the SQL editor and copy the result once.
-- To revoke every token:   delete from public.ops_tokens;
create table if not exists public.ops_tokens (
  hash bytea primary key,
  created_at timestamptz not null default now()
);
alter table public.ops_tokens enable row level security;   -- no policies: unreachable from the app

create or replace function public.ops_new_token() returns text
language plpgsql security definer set search_path = '' as $$
declare t text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  insert into public.ops_tokens(hash) values (sha256(convert_to(t, 'utf8')));
  return t;
end $$;
revoke all on function public.ops_new_token() from public, anon, authenticated;

create or replace function public.ops_ok() returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare t text;
begin
  t := coalesce(current_setting('request.headers', true), '{}')::json ->> 'x-ops-token';
  if t is null or char_length(t) < 32 then return false; end if;
  return exists (select 1 from public.ops_tokens where hash = sha256(convert_to(t, 'utf8')));
end $$;

create or replace function public.ops_feedback(p_status text default 'new', p_days int default 30, p_limit int default 200)
returns setof public.feedback
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ops_ok() then raise exception 'not allowed'; end if;
  return query select * from public.feedback
    where (p_status = 'all' or status = p_status) and created_at > now() - make_interval(days => greatest(1, least(p_days, 365)))
    order by created_at desc limit greatest(1, least(p_limit, 1000));
end $$;

create or replace function public.ops_feedback_set(p_id bigint, p_status text, p_notes text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.ops_ok() then raise exception 'not allowed'; end if;
  update public.feedback set status = p_status, notes = left(p_notes, 2000) where id = p_id;
end $$;

create or replace function public.ops_feedback_stats(p_days int default 7) returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.ops_ok() then raise exception 'not allowed'; end if;
  return (select json_build_object(
    'total', count(*),
    'by_kind', (select json_object_agg(kind, n) from (select kind, count(*) n from public.feedback where created_at > now() - make_interval(days => p_days) group by kind) k),
    'by_status', (select json_object_agg(status, n) from (select status, count(*) n from public.feedback where created_at > now() - make_interval(days => p_days) group by status) s))
    from public.feedback where created_at > now() - make_interval(days => p_days));
end $$;

revoke all on function public.ops_ok() from public;
grant execute on function public.ops_feedback(text, int, int), public.ops_feedback_set(bigint, text, text), public.ops_feedback_stats(int) to anon, authenticated;
