-- Eternal Realms — database setup for Supabase.
-- Run once: Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
-- Safe to re-run: every statement checks before creating.
--
-- Security model (same as the claude.ai version):
--   * docs       — shared, readable by every signed-in player.
--                  players/<uid>, chat/<uid>, mail/<uid>: only that player can write their own row.
--                  world/*: only admins (you) can write — the shared world simulation.
--   * user_docs  — private per player (cloud saves). Nobody else can read or write them.
--   * admins     — who may write the shared world. Not writable from the app at all.

-- ---------- admins ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;
drop policy if exists "admins: read own row" on public.admins;
create policy "admins: read own row" on public.admins for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- ---------- shared documents ----------
create table if not exists public.docs (
  col        text not null check (col in ('players','chat','mail','world')),
  id         text not null check (length(id) between 1 and 80),
  owner      uuid not null default auth.uid() references auth.users on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (col, id),
  constraint docs_size check (pg_column_size(data) < 600000)
);
alter table public.docs enable row level security;

drop policy if exists "docs: signed-in players read" on public.docs;
create policy "docs: signed-in players read" on public.docs for select to authenticated using (true);

drop policy if exists "docs: write own row or world as admin" on public.docs;
create policy "docs: write own row or world as admin" on public.docs for all to authenticated
  using (
    (col in ('players','chat','mail') and id = (select auth.uid())::text and owner = (select auth.uid()))
    or (col = 'world' and public.is_admin())
  )
  with check (
    (col in ('players','chat','mail') and id = (select auth.uid())::text and owner = (select auth.uid()))
    or (col = 'world' and public.is_admin())
  );

-- server-side guards: timestamps, chat flood control, sane sizes
create or replace function public.docs_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.col = 'chat' then
    if tg_op = 'UPDATE' and old.updated_at > now() - interval '1500 milliseconds' then
      raise exception 'Slow down: one chat message every couple of seconds.';
    end if;
    if jsonb_typeof(new.data->'msgs') = 'array' and jsonb_array_length(new.data->'msgs') > 30 then
      raise exception 'Too many chat messages in one update.';
    end if;
  end if;
  if new.col = 'mail' and jsonb_typeof(new.data->'out') = 'array' and jsonb_array_length(new.data->'out') > 25 then
    raise exception 'Too many parcels in transit.';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists docs_guard on public.docs;
create trigger docs_guard before insert or update on public.docs for each row execute function public.docs_guard();

-- ---------- private per-player documents (cloud saves) ----------
create table if not exists public.user_docs (
  owner      uuid not null default auth.uid() references auth.users on delete cascade,
  id         text not null check (length(id) between 1 and 40),
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (owner, id),
  constraint user_docs_size check (pg_column_size(data) < 600000)
);
alter table public.user_docs enable row level security;
drop policy if exists "user_docs: only the owner" on public.user_docs;
create policy "user_docs: only the owner" on public.user_docs for all to authenticated
  using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

-- ---------- access grants (new tables are not exposed automatically) ----------
revoke all on public.docs, public.user_docs, public.admins from anon;
grant select, insert, update, delete on public.docs, public.user_docs to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ---------- live updates for chat, leaderboard, parcels ----------
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'docs') then
    alter publication supabase_realtime add table public.docs;
  end if;
end $$;

-- ---------- account deletion (required by Google Play) ----------
-- Deleting the auth user cascades to the player's profile, chat, parcels and saves.
create or replace function public.delete_my_account() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
