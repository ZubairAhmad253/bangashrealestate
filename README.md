# Bangash Real Estate & Builders

Official website of **Bangash Real Estate & Builders** — houses, flats and plots for sale and rent, plus house and apartment construction in Rawalpindi & Islamabad (Airport Housing Society, Ghauri Town, Bahria Town, DHA and more).

Built with [Astro](https://astro.build) — static HTML, near-zero JavaScript, optimized images and full SEO (sitemap, schema.org, Open Graph, canonical URLs). Content is managed through an admin panel backed by [Supabase](https://supabase.com).

## Run locally

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # production build → dist/
npm run preview   # preview the production build
npx astro check   # type check
```

## Where to edit

| What | Where |
|---|---|
| Listings, photos, projects, reviews, leads | **Admin panel** → `/admin/` |
| Phone, WhatsApp, email, hours, Google rating, home stats | Admin panel → Settings (or `src/config/site.ts`) |
| Address, map, social links, domain | `src/config/site.ts` |
| WhatsApp & email pre-filled messages, auto-reply text | `src/config/site.ts` → `MESSAGES` |
| **Colors, gradients, fonts** (whole color scheme) | `src/styles/theme.css` |
| Layout, component styles, animations | `src/styles/global.css` |
| Area / society pages | `src/data/areas.ts` |
| Service pages (plots, houses, flats, construction) | `src/data/services.ts` |
| City landing pages | `src/data/cities.ts` |
| FAQs and "Why choose us" | `src/data/content.ts` |
| Property guides (blog) | `src/content/guides/*.md` |
| Logo | `src/assets/brand/` · header logo: `src/components/Logo.astro` |

### Changing the color scheme
In `src/styles/theme.css`, edit only the **BRAND COLORS** values. All tints, gradients and shadows update automatically. Two themes are included: **gold** (default, matches the logo) and **blue** (matches the shop sign) — switch with `THEME` in `src/layouts/BaseLayout.astro`.

## Admin panel & backend (Supabase)

- **Admin panel:** `/admin/` — sign in with Supabase Auth; manage properties (with photo upload), leads, construction projects, reviews and site settings.
- **Roles:** `super_admin` (everything, including settings and admins) · `editor` (properties, leads, projects, reviews).
- **Database setup:** run `database/schema.sql` once in Supabase → SQL Editor.
- **Auto-publish:** add the Vercel deploy hook in the admin panel → Settings. Every content change rebuilds the website in 1–2 minutes.
- The website stays **static** — data is loaded from Supabase at build time (`src/lib/remote.ts`). While the database has no listings, sample listings are shown. If Supabase is unreachable during a Vercel build, the build fails and the previous version stays live.
- `.github/workflows/supabase-keepalive.yml` pings Supabase every 3 days so the free project does not pause.
- ⚠️ Never put the Supabase **secret key** in the code — only the publishable key (`src/config/site.ts`).

## Contact form

The contact form saves each enquiry to the admin **Leads** inbox and sends it by email through FormSubmit, which also sends the visitor an automatic reply. The first submission sends an activation email to the business address that must be confirmed once.

## Deploy

The site is deployed on **Vercel** from the `main` branch (build command `npm run build`, output `dist`). After connecting a custom domain, update `url` in `src/config/site.ts` and submit `/sitemap-index.xml` in Google Search Console.
