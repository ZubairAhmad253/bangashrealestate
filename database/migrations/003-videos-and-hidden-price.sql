-- =====================================================================
--  MIGRATION 003 — property/project videos + option to hide the price
--  Supabase → SQL Editor → New query → paste → Run. Safe to run again.
-- =====================================================================

-- "Show price on website" switch (off = "Price on request")
alter table public.properties add column if not exists show_price boolean not null default true;

-- Videos: YouTube links or uploaded video files (public URLs)
alter table public.properties add column if not exists videos text[] not null default '{}';
alter table public.projects   add column if not exists videos text[] not null default '{}';

-- Allow short video uploads (max 50 MB — the Supabase free plan limit per file)
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']
where id = 'media';

-- Done ✅
