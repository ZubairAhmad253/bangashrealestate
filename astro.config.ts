import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import { SITE, SUPABASE } from './src/config/site';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'always',
  integrations: [preact(), sitemap({ filter: (page) => !/\/(404|thank-you|admin)/.test(page), lastmod: new Date(), changefreq: 'weekly' })],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
  image: { remotePatterns: [{ protocol: 'https', hostname: new URL(SUPABASE.url).hostname }] },
});
