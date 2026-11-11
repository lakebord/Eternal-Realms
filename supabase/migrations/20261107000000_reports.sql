-- Eternal Realms — player reports, automatic investigation and temporary sanctions (v1.1.0).
-- Run once: Supabase dashboard → SQL Editor → New query → paste → Run. Safe to re-run.
--
-- How it works
--   1. A player files a report (cheating, abuse, exploit, bug, spam), optionally naming another player.
--   2. The database investigates IMMEDIATELY, using only server-side records the reported player cannot fake or
--      delete afterwards: their recent chat, their public profile numbers, and their account age.
--   3. Only evidence leads to action, and only temporary action: mutes for abuse/spam, short bans for impossible stats.
--      Repeat offences escalate (but never become permanent automatically). Bugs and unclear cases go to the owner.
--   4. Admins (public.admins) see every report and can lift or change any sanction from the in-game moderation panel.

-- the friends list update (also in 20261106000000_friends.sql) so this file works on its own
alter table public.docs drop constraint if exists docs_col_check;
alter table public.docs add constraint docs_col_check check (col in ('players','chat','mail','world','friends'));

-- ---------- sanctions ----------
create table if not exists public.sanctions (
  id         bigserial primary key,
  user_id    uuid not null references auth.users on delete cascade,
  kind       text not null check (kind in ('mute','ban')),
  until      timestamptz not null,
  reason     text not null default '',
  report_id  bigint,
  lifted     boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists sanctions_user on public.sanctions (user_id, until);
alter table public.sanctions enable row level security;
drop policy if exists "sanctions: own or admin" on public.sanctions;
create policy "sanctions: own or admin" on public.sanctions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "sanctions: admin manages" on public.sanctions;
create policy "sanctions: admin manages" on public.sanctions for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.is_sanctioned(uid uuid, k text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.sanctions s where s.user_id = uid and s.kind = k and not s.lifted and s.until > now());
$$;
-- Everyone may know WHO is muted/banned right now (so their live messages can be hidden), not why.
create or replace function public.active_sanctions() returns table (user_id uuid, kind text, until timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.user_id, s.kind, max(s.until) from public.sanctions s where not s.lifted and s.until > now() group by s.user_id, s.kind;
$$;

-- ---------- reports ----------
create table if not exists public.reports (
  id         bigserial primary key,
  reporter   uuid not null default auth.uid() references auth.users on delete cascade,
  target     uuid references auth.users on delete set null,
  category   text not null check (category in ('cheating','abuse','exploit','bug','spam')),
  details    text not null default '' check (length(details) <= 600),
  context    jsonb not null default '{}'::jsonb check (pg_column_size(context) < 20000),
  evidence   jsonb not null default '{}'::jsonb,
  verdict    text not null default '',
  action     text not null default 'none',
  status     text not null default 'open',
  created_at timestamptz not null default now()
);
create index if not exists reports_target on public.reports (target, created_at);
create index if not exists reports_reporter on public.reports (reporter, created_at);
alter table public.reports enable row level security;
drop policy if exists "reports: file your own" on public.reports;
create policy "reports: file your own" on public.reports for insert to authenticated
  with check (reporter = (select auth.uid()) and (target is null or target <> (select auth.uid())));
drop policy if exists "reports: reporter or admin reads" on public.reports;
create policy "reports: reporter or admin reads" on public.reports for select to authenticated
  using (reporter = (select auth.uid()) or public.is_admin());
drop policy if exists "reports: admin updates" on public.reports;
create policy "reports: admin updates" on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- the investigator (runs inside the database on every new report) ----------
create or replace function public.investigate_report() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  msgs jsonb; prof jsonb; acct_created timestamptz; age_min numeric;
  recent int := 0; dupes int := 0; abusive jsonb := '[]'::jsonb; m jsonb;
  lvl int; gold numeric; kills int; priors int; dur interval; v_kind text := null;
  bad text := '(fuck|shit|cunt|bitch|whore|slut|nigg|faggot|fag\M|retard|\mkys\M|kill yourself|rape)';
  reasons text[] := '{}';
begin
  -- reporters: no self-reports (policy), at most 6 reports a day, one report per target+category a day
  if (select count(*) from public.reports r where r.reporter = new.reporter and r.created_at > now() - interval '1 day') >= 6 then
    raise exception 'You have sent a lot of reports today. Please try again tomorrow.';
  end if;
  if new.target is not null and exists (select 1 from public.reports r where r.reporter = new.reporter and r.target = new.target
       and r.category = new.category and r.created_at > now() - interval '1 day') then
    raise exception 'You already reported this player for that today. It is being handled.';
  end if;

  if new.category = 'bug' then
    new.status := 'for_owner'; new.verdict := 'Bug report saved for the developer.'; return new;
  end if;
  if new.target is null then
    new.status := 'for_owner'; new.verdict := 'No player named, so the owner will look into it.'; return new;
  end if;

  -- gather evidence the reported player cannot alter after the fact
  select d.data->'msgs' into msgs from public.docs d where d.col = 'chat' and d.id = new.target::text;
  select d.data into prof from public.docs d where d.col = 'players' and d.id = new.target::text;
  select u.created_at into acct_created from auth.users u where u.id = new.target;
  age_min := greatest(1, extract(epoch from (now() - coalesce(acct_created, now()))) / 60);
  msgs := coalesce(msgs, '[]'::jsonb);

  for m in select * from jsonb_array_elements(msgs) loop
    if (m->>'t')::numeric > extract(epoch from now() - interval '10 minutes') * 1000 then recent := recent + 1; end if;
    if coalesce(m->>'text','') ~* bad then abusive := abusive || jsonb_build_object('t', m->'t', 'ch', m->'ch', 'text', left(m->>'text', 200)); end if;
  end loop;
  select coalesce(max(c), 0) into dupes from (
    select count(*) c from jsonb_array_elements(msgs) x
    where (x->>'t')::numeric > extract(epoch from now() - interval '30 minutes') * 1000
    group by lower(trim(x->>'text'))) q;

  lvl := coalesce((prof->>'level')::int, 0); gold := coalesce((prof->>'gold')::numeric, 0); kills := coalesce((prof->>'kills')::int, 0);
  new.evidence := jsonb_build_object(
    'chat_recent_10min', recent, 'chat_max_repeats_30min', dupes, 'abusive_lines', abusive,
    'profile', jsonb_build_object('user', prof->>'user', 'level', lvl, 'gold', gold, 'kills', kills, 'power', prof->'power'),
    'account_age_minutes', round(age_min), 'checked_at', now());

  -- verdicts: each needs concrete evidence
  if new.category = 'abuse' and jsonb_array_length(abusive) > 0 then
    v_kind := 'mute'; reasons := reasons || format('%s abusive message(s) found in their recent chat', jsonb_array_length(abusive));
  elsif new.category = 'spam' and (recent >= 10 or dupes >= 4) then
    v_kind := 'mute'; reasons := reasons || format('%s messages in 10 minutes, the same message up to %s times', recent, dupes);
  elsif new.category in ('cheating','exploit') then
    -- generous limits: a dedicated player cannot level faster than ~1 level per 3 minutes, kill more than 6 monsters
    -- a minute, or hold millions of gold at a low level
    if lvl > 10 and age_min < lvl * 3 then reasons := reasons || format('level %s on an account only %s minutes old', lvl, round(age_min)); end if;
    if kills > age_min * 6 + 50 then reasons := reasons || format('%s kills in %s minutes', kills, round(age_min)); end if;
    if gold > greatest(50000, power(greatest(lvl,1), 2.2) * 400) then reasons := reasons || format('%s gold at level %s', gold, lvl); end if;
    if cardinality(reasons) > 0 then v_kind := 'ban'; end if;
  end if;

  if v_kind is null then
    -- no evidence: no punishment. If several different players report the same thing in a day, flag it for the owner.
    if (select count(distinct r.reporter) from public.reports r where r.target = new.target and r.category = new.category
          and r.reporter <> new.reporter and r.created_at > now() - interval '1 day') >= 1 then
      new.status := 'for_owner'; new.verdict := 'No proof found automatically, but several players reported this. Flagged for the owner.';
    else
      new.status := 'no_action'; new.verdict := 'Investigated: no evidence found, so no action was taken.';
    end if;
    return new;
  end if;

  -- temporary, escalating sanctions (never permanent automatically)
  select count(*) into priors from public.sanctions s where s.user_id = new.target and s.kind = v_kind and s.created_at > now() - interval '90 days';
  dur := case
    when v_kind = 'mute' and new.category = 'spam' then (array[interval '30 minutes', interval '6 hours', interval '3 days'])[least(priors+1,3)]
    when v_kind = 'mute' then (array[interval '1 hour', interval '1 day', interval '7 days'])[least(priors+1,3)]
    else (array[interval '1 day', interval '3 days', interval '7 days'])[least(priors+1,3)] end;
  insert into public.sanctions (user_id, kind, until, reason, report_id)
    values (new.target, v_kind, now() + dur, array_to_string(reasons, '; '), new.id);
  new.action := v_kind || ' ' || dur::text;
  new.status := 'actioned';
  new.verdict := format('Evidence found (%s). Temporary %s for %s.', array_to_string(reasons, '; '), v_kind, dur::text);
  return new;
end $$;
drop trigger if exists investigate_report on public.reports;
create trigger investigate_report before insert on public.reports for each row execute function public.investigate_report();

-- ---------- enforcement: banned players can't write shared data, muted players can't chat ----------
drop policy if exists "docs: write own row or world as admin" on public.docs;
create policy "docs: write own row or world as admin" on public.docs for all to authenticated
  using (
    (col in ('players','chat','mail','friends') and id = (select auth.uid())::text and owner = (select auth.uid()))
    or (col = 'world' and public.is_admin())
  )
  with check (
    (
      (col in ('players','mail','friends') and id = (select auth.uid())::text and owner = (select auth.uid()))
      or (col = 'chat' and id = (select auth.uid())::text and owner = (select auth.uid()) and not public.is_sanctioned((select auth.uid()), 'mute'))
      or (col = 'world' and public.is_admin())
    )
    and not public.is_sanctioned((select auth.uid()), 'ban')
  );

grant select, insert, update on public.reports to authenticated;
grant usage, select on sequence public.reports_id_seq to authenticated;
grant select, insert, update on public.sanctions to authenticated;
grant usage, select on sequence public.sanctions_id_seq to authenticated;
grant execute on function public.is_sanctioned(uuid, text) to authenticated;
grant execute on function public.active_sanctions() to authenticated;
revoke all on public.reports, public.sanctions from anon;
