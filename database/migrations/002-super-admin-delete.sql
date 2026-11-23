-- =====================================================================
--  MIGRATION 002 — only the super admin can DELETE content
--  Editors can still add, edit, hide and mark items as sold/rented.
--  Supabase → SQL Editor → New query → paste → Run. Safe to run again.
-- =====================================================================

-- properties
drop policy if exists "properties: admins write" on public.properties;
drop policy if exists "properties: admins insert" on public.properties;
drop policy if exists "properties: admins update" on public.properties;
drop policy if exists "properties: super delete" on public.properties;
create policy "properties: admins insert" on public.properties for insert to authenticated with check (public.is_admin());
create policy "properties: admins update" on public.properties for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "properties: super delete" on public.properties for delete to authenticated using (public.is_super_admin());

-- projects
drop policy if exists "projects: admins write" on public.projects;
drop policy if exists "projects: admins insert" on public.projects;
drop policy if exists "projects: admins update" on public.projects;
drop policy if exists "projects: super delete" on public.projects;
create policy "projects: admins insert" on public.projects for insert to authenticated with check (public.is_admin());
create policy "projects: admins update" on public.projects for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "projects: super delete" on public.projects for delete to authenticated using (public.is_super_admin());

-- testimonials
drop policy if exists "testimonials: admins write" on public.testimonials;
drop policy if exists "testimonials: admins insert" on public.testimonials;
drop policy if exists "testimonials: admins update" on public.testimonials;
drop policy if exists "testimonials: super delete" on public.testimonials;
create policy "testimonials: admins insert" on public.testimonials for insert to authenticated with check (public.is_admin());
create policy "testimonials: admins update" on public.testimonials for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "testimonials: super delete" on public.testimonials for delete to authenticated using (public.is_super_admin());

-- leads
drop policy if exists "leads: admins delete" on public.leads;
drop policy if exists "leads: super delete" on public.leads;
create policy "leads: super delete" on public.leads for delete to authenticated using (public.is_super_admin());

-- Done ✅
