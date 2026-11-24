-- =====================================================================
-- 004 — Notifications (activity log) for the admin bell
-- Run once in Supabase → SQL Editor. Safe to run again.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Activity log — every change is recorded automatically by the
--  database, so nothing can be added, edited or deleted unnoticed.
-- ---------------------------------------------------------------------
create table if not exists public.activity (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  actor_id   uuid,                                  -- null = website visitor / system
  actor_name text not null default 'Website visitor',
  action     text not null,                         -- created | updated | deleted | status | shown | hidden | role
  entity     text not null,                         -- property | project | review | lead | settings | admin
  entity_id  text,
  title      text,
  details    jsonb
);
create index if not exists activity_created_idx on public.activity (created_at desc);

-- When each admin last opened the notifications (for the unread count)
alter table public.admins add column if not exists activity_seen_at timestamptz not null default now();

alter table public.activity enable row level security;
drop policy if exists "activity: admins read" on public.activity;
create policy "activity: admins read" on public.activity for select to authenticated using (public.is_admin());
-- Nobody can write or delete activity from the app; only the trigger below adds rows.
grant select on public.activity to authenticated;

create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o       jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  n       jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  r       jsonb := coalesce(n, o);
  ent     text  := case tg_table_name
                     when 'properties' then 'property' when 'projects' then 'project'
                     when 'testimonials' then 'review' when 'leads' then 'lead'
                     when 'settings' then 'settings' else 'admin' end;
  uid     uuid  := auth.uid();
  who     text;
  act     text;
  det     jsonb := '{}'::jsonb;
  changed text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(e.key order by e.key) into changed
      from jsonb_each(n) e
     where e.value is distinct from o -> e.key
       and e.key not in ('updated_at', 'created_at', 'activity_seen_at');
    if changed is null then return null; end if;   -- nothing meaningful changed

    if 'status' = any (changed) then
      act := 'status';
      det := jsonb_build_object('from', o ->> 'status', 'to', n ->> 'status');
    elsif 'published' = any (changed) and cardinality(changed) = 1 then
      act := case when (n ->> 'published')::boolean then 'shown' else 'hidden' end;
    elsif 'role' = any (changed) then
      act := 'role';
      det := jsonb_build_object('from', o ->> 'role', 'to', n ->> 'role');
    else
      act := 'updated';
    end if;
    det := det || jsonb_build_object('changed', to_jsonb(changed));
    if 'price' = any (changed) then
      det := det || jsonb_build_object('price_from', o -> 'price', 'price_to', n -> 'price');
    end if;
  else
    act := case when tg_op = 'INSERT' then 'created' else 'deleted' end;
  end if;

  if ent = 'lead' then
    det := det || jsonb_strip_nulls(jsonb_build_object('interest', r ->> 'interest', 'source', r ->> 'source'));
  end if;

  select coalesce(nullif(trim(a.name), ''), split_part(a.email, '@', 1)) into who
    from public.admins a where a.user_id = uid;
  who := coalesce(who, case when uid is null and ent = 'lead' then 'Website visitor' else 'System' end);

  insert into public.activity (actor_id, actor_name, action, entity, entity_id, title, details)
  values (
    uid, who, act, ent,
    coalesce(r ->> 'id', r ->> 'user_id'),
    case ent when 'settings' then 'Site settings'
             when 'admin' then r ->> 'email'
             else coalesce(r ->> 'title', r ->> 'name') end,
    nullif(det, '{}'::jsonb)
  );

  -- Keep one year of history
  delete from public.activity where created_at < now() - interval '1 year';
  return null;
end $$;

drop trigger if exists activity_properties on public.properties;
create trigger activity_properties after insert or update or delete on public.properties
  for each row execute function public.log_activity();
drop trigger if exists activity_projects on public.projects;
create trigger activity_projects after insert or update or delete on public.projects
  for each row execute function public.log_activity();
drop trigger if exists activity_testimonials on public.testimonials;
create trigger activity_testimonials after insert or update or delete on public.testimonials
  for each row execute function public.log_activity();
drop trigger if exists activity_leads on public.leads;
create trigger activity_leads after insert or update or delete on public.leads
  for each row execute function public.log_activity();
drop trigger if exists activity_settings on public.settings;
create trigger activity_settings after update on public.settings
  for each row execute function public.log_activity();
drop trigger if exists activity_admins on public.admins;
create trigger activity_admins after insert or update or delete on public.admins
  for each row execute function public.log_activity();

-- "Mark as read" — each admin updates only their own timestamp
create or replace function public.mark_activity_seen() returns void
language sql security definer set search_path = public as $$
  update public.admins set activity_seen_at = now() where user_id = auth.uid();
$$;
revoke all on function public.mark_activity_seen() from public, anon;
grant execute on function public.mark_activity_seen() to authenticated;

-- Done ✅
