-- =====================================================================
--  BANGASH REAL ESTATE & BUILDERS — DATABASE SETUP
--  Supabase → SQL Editor → New query → paste this whole file → Run.
--  Safe to run again (nothing is deleted).
-- =====================================================================

create extension if not exists pg_net with schema extensions;

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Admins & roles  (super_admin = everything incl. deleting, editor = add/edit content + leads)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text,
  role       text not null default 'editor' check (role in ('super_admin', 'editor')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid() and role = 'super_admin');
$$;

-- ---------------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------------
create table if not exists public.properties (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{3,160}$'),
  title       text not null check (char_length(title) between 3 and 140),
  purpose     text not null check (purpose in ('sale', 'rent')),
  type        text not null check (type in ('plot', 'house', 'flat')),
  price       bigint not null check (price >= 0),
  area        text not null,
  location    text not null check (char_length(location) <= 160),
  size        text not null check (char_length(size) <= 60),
  beds        smallint check (beds between 0 and 50),
  baths       smallint check (baths between 0 and 50),
  description text not null default '' check (char_length(description) <= 5000),
  features    text[] not null default '{}',
  images      text[] not null default '{}',
  featured    boolean not null default false,
  hot         boolean not null default false,
  status      text not null default 'available' check (status in ('available', 'sold', 'rented', 'hidden')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Construction projects (gallery)
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9-]{3,160}$'),
  title       text not null check (char_length(title) between 3 and 140),
  location    text not null default '',
  category    text not null default 'house' check (category in ('house', 'flats', 'renovation', 'commercial')),
  size        text not null default '',
  status      text not null default 'completed' check (status in ('completed', 'in_progress')),
  year        smallint check (year between 1990 and 2100),
  description text not null default '' check (char_length(description) <= 5000),
  images      text[] not null default '{}',
  featured    boolean not null default false,
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Testimonials / reviews
-- ---------------------------------------------------------------------
create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 80),
  place      text not null default '',
  text       text not null check (char_length(text) between 5 and 1200),
  rating     smallint not null default 5 check (rating between 1 and 5),
  published  boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Leads (website enquiries)
-- ---------------------------------------------------------------------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  phone      text not null check (char_length(phone) between 5 and 40),
  email      text check (char_length(email) <= 200),
  interest   text check (char_length(interest) <= 120),
  area       text check (char_length(area) <= 120),
  budget     text check (char_length(budget) <= 120),
  message    text check (char_length(message) <= 3000),
  source     text not null default 'website' check (char_length(source) <= 40),
  status     text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  notes      text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Site settings (single row) + private settings (super admin only)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id            smallint primary key default 1 check (id = 1),
  phone         text,
  whatsapp      text,
  email         text,
  hours         text,
  google_rating numeric(2, 1) check (google_rating between 1 and 5),
  stats         jsonb,
  updated_at    timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.private_settings (
  id              smallint primary key default 1 check (id = 1),
  deploy_hook_url text,
  updated_at      timestamptz not null default now()
);
insert into public.private_settings (id) values (1) on conflict (id) do nothing;

-- updated_at triggers
drop trigger if exists touch_properties on public.properties;
create trigger touch_properties before update on public.properties for each row execute function public.touch_updated_at();
drop trigger if exists touch_projects on public.projects;
create trigger touch_projects before update on public.projects for each row execute function public.touch_updated_at();
drop trigger if exists touch_leads on public.leads;
create trigger touch_leads before update on public.leads for each row execute function public.touch_updated_at();
drop trigger if exists touch_settings on public.settings;
create trigger touch_settings before update on public.settings for each row execute function public.touch_updated_at();
drop trigger if exists touch_private on public.private_settings;
create trigger touch_private before update on public.private_settings for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.admins           enable row level security;
alter table public.properties       enable row level security;
alter table public.projects         enable row level security;
alter table public.testimonials     enable row level security;
alter table public.leads            enable row level security;
alter table public.settings         enable row level security;
alter table public.private_settings enable row level security;

-- admins
drop policy if exists "admins: read self or super" on public.admins;
create policy "admins: read self or super" on public.admins for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists "admins: super manages" on public.admins;
create policy "admins: super manages" on public.admins for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- properties (public can read; hidden ones only admins)
drop policy if exists "properties: public read" on public.properties;
create policy "properties: public read" on public.properties for select to anon, authenticated
  using (status <> 'hidden' or public.is_admin());
drop policy if exists "properties: admins write" on public.properties;
drop policy if exists "properties: admins insert" on public.properties;
create policy "properties: admins insert" on public.properties for insert to authenticated with check (public.is_admin());
drop policy if exists "properties: admins update" on public.properties;
create policy "properties: admins update" on public.properties for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "properties: super delete" on public.properties;
create policy "properties: super delete" on public.properties for delete to authenticated using (public.is_super_admin());

-- projects
drop policy if exists "projects: public read" on public.projects;
create policy "projects: public read" on public.projects for select to anon, authenticated
  using (published or public.is_admin());
drop policy if exists "projects: admins write" on public.projects;
drop policy if exists "projects: admins insert" on public.projects;
create policy "projects: admins insert" on public.projects for insert to authenticated with check (public.is_admin());
drop policy if exists "projects: admins update" on public.projects;
create policy "projects: admins update" on public.projects for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "projects: super delete" on public.projects;
create policy "projects: super delete" on public.projects for delete to authenticated using (public.is_super_admin());

-- testimonials
drop policy if exists "testimonials: public read" on public.testimonials;
create policy "testimonials: public read" on public.testimonials for select to anon, authenticated
  using (published or public.is_admin());
drop policy if exists "testimonials: admins write" on public.testimonials;
drop policy if exists "testimonials: admins insert" on public.testimonials;
create policy "testimonials: admins insert" on public.testimonials for insert to authenticated with check (public.is_admin());
drop policy if exists "testimonials: admins update" on public.testimonials;
create policy "testimonials: admins update" on public.testimonials for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "testimonials: super delete" on public.testimonials;
create policy "testimonials: super delete" on public.testimonials for delete to authenticated using (public.is_super_admin());

-- leads (the website can only submit new leads; only admins can read them)
drop policy if exists "leads: website insert" on public.leads;
create policy "leads: website insert" on public.leads for insert to anon, authenticated
  with check (status = 'new' and notes = '');
drop policy if exists "leads: admins read" on public.leads;
create policy "leads: admins read" on public.leads for select to authenticated using (public.is_admin());
drop policy if exists "leads: admins update" on public.leads;
create policy "leads: admins update" on public.leads for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "leads: admins delete" on public.leads;
drop policy if exists "leads: super delete" on public.leads;
create policy "leads: super delete" on public.leads for delete to authenticated using (public.is_super_admin());

-- settings (everyone can read; only the super admin can change them)
drop policy if exists "settings: public read" on public.settings;
create policy "settings: public read" on public.settings for select to anon, authenticated using (true);
drop policy if exists "settings: super update" on public.settings;
create policy "settings: super update" on public.settings for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- private settings (super admin only)
drop policy if exists "private: super only" on public.private_settings;
create policy "private: super only" on public.private_settings for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------
-- Photos storage (public bucket "media"; only admins can upload/delete)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media: admins read" on storage.objects;
create policy "media: admins read" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media: admins upload" on storage.objects;
create policy "media: admins upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media: admins update" on storage.objects;
create policy "media: admins update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media: admins delete" on storage.objects;
create policy "media: admins delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------
-- Auto-publish: content changes trigger a Vercel rebuild (the deploy hook
-- is set in the admin panel → Settings). Leads do not trigger a rebuild.
-- ---------------------------------------------------------------------
create or replace function public.trigger_site_rebuild() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  hook text;
begin
  select deploy_hook_url into hook from public.private_settings where id = 1;
  if hook is not null and hook like 'https://api.vercel.com/%' then
    perform net.http_post(url := hook, body := '{}'::jsonb);
  end if;
  return null;
end $$;

drop trigger if exists rebuild_properties on public.properties;
create trigger rebuild_properties after insert or update or delete on public.properties
  for each statement execute function public.trigger_site_rebuild();
drop trigger if exists rebuild_projects on public.projects;
create trigger rebuild_projects after insert or update or delete on public.projects
  for each statement execute function public.trigger_site_rebuild();
drop trigger if exists rebuild_testimonials on public.testimonials;
create trigger rebuild_testimonials after insert or update or delete on public.testimonials
  for each statement execute function public.trigger_site_rebuild();
drop trigger if exists rebuild_settings on public.settings;
create trigger rebuild_settings after update on public.settings
  for each statement execute function public.trigger_site_rebuild();

-- Admin panel "Publish website now" button
create or replace function public.request_rebuild() returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare
  hook text;
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  select deploy_hook_url into hook from public.private_settings where id = 1;
  if hook is null or hook not like 'https://api.vercel.com/%' then
    return false;
  end if;
  perform net.http_post(url := hook, body := '{}'::jsonb);
  return true;
end $$;
revoke all on function public.request_rebuild() from public, anon;
grant execute on function public.request_rebuild() to authenticated;

-- Each admin can change their own name (not their role)
create or replace function public.set_my_name(new_name text) returns void
language sql security definer set search_path = public as $$
  update public.admins set name = nullif(trim(new_name), '') where user_id = auth.uid();
$$;
revoke all on function public.set_my_name(text) from public, anon;
grant execute on function public.set_my_name(text) to authenticated;

-- ---------------------------------------------------------------------
-- Table access (GRANTs). New Supabase projects do not grant table access
-- automatically — only the access that is needed is granted here. The real
-- protection comes from the Row Level Security policies above.
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

-- Website (not signed in): read only + submit new leads
grant select on public.properties, public.projects, public.testimonials, public.settings to anon;
grant insert on public.leads to anon;

-- Admin panel (signed in) — RLS decides who can do what
grant select, insert, update, delete on public.properties, public.projects, public.testimonials, public.leads to authenticated;
grant select, update on public.settings to authenticated;
grant select, insert, update, delete on public.admins, public.private_settings to authenticated;

grant execute on function public.is_admin(), public.is_super_admin() to anon, authenticated;

-- Done ✅
