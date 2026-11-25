import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import { SITE, SUPABASE } from './src/config/site';

/* Sold / rented property pages stay online (so shared links keep working) but are "noindex",
   so they are left out of the sitemap. */
async function closedPropertyPaths() {
  if (process.env.SKIP_SUPABASE === '1') return new Set<string>();
  try {
    const res = await fetch(`${SUPABASE.url}/rest/v1/properties?select=slug&status=in.(sold,rented)`, {
      headers: { apikey: SUPABASE.publishableKey },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return new Set();
    return new Set<string>((await res.json() as { slug: string }[]).map((r) => `/properties/${r.slug}/`));
  } catch {
    return new Set();
  }
}
const closed = await closedPropertyPaths();

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
  integrations: [
    preact(),
    sitemap({
      filter: (page) => !/\/(404|thank-you|admin)\b/.test(page) && !closed.has(new URL(page).pathname),
      lastmod: new Date(),
      changefreq: 'weekly',
    }),
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
  image: { remotePatterns: [{ protocol: 'https', hostname: new URL(SUPABASE.url).hostname }] },
});
