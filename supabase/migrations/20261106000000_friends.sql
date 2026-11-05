-- Eternal Realms — friends lists (v1.1.0).
-- Run once: Supabase dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
-- Each player owns one row friends/<their id>: {user, list:[ids they added], no:[ids they declined]}.
-- Two players listing each other are friends; one-sided is a pending request.

alter table public.docs drop constraint if exists docs_col_check;
alter table public.docs add constraint docs_col_check check (col in ('players','chat','mail','world','friends'));

drop policy if exists "docs: write own row or world as admin" on public.docs;
create policy "docs: write own row or world as admin" on public.docs for all to authenticated
  using (
    (col in ('players','chat','mail','friends') and id = (select auth.uid())::text and owner = (select auth.uid()))
    or (col = 'world' and public.is_admin())
  )
  with check (
    (col in ('players','chat','mail','friends') and id = (select auth.uid())::text and owner = (select auth.uid()))
    or (col = 'world' and public.is_admin())
  );

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
  if new.col = 'friends' and (
       (jsonb_typeof(new.data->'list') = 'array' and jsonb_array_length(new.data->'list') > 200)
    or (jsonb_typeof(new.data->'no')   = 'array' and jsonb_array_length(new.data->'no')   > 200)) then
    raise exception 'Friends list is full.';
  end if;
  new.updated_at := now();
  return new;
end $$;
