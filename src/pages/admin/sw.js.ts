/* Service worker for the installed admin app (scope: /admin/).
   • The app page opens instantly from the phone and quietly updates itself in the background.
   • Build files (/_astro/…) never change once published, so they are kept on the phone.
   • Nothing else is touched: database requests, sign-in and photos from Supabase always go to the network.
   A new version is generated on every website build, which replaces the stored files. */
import type { APIRoute } from 'astro';

const VERSION = Date.now().toString(36);

const worker = `
const CACHE = 'bangash-admin-${VERSION}';
const SHELL = '/admin/';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.add(new Request(SHELL, { cache: 'reload' }))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('bangash-admin-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// The page sends the files it loaded before the worker was installed
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'precache') return;
  const urls = (event.data.urls || []).filter((u) => typeof u === 'string' && new URL(u).origin === location.origin && new URL(u).pathname.startsWith('/_astro/'));
  event.waitUntil(caches.open(CACHE).then((c) => Promise.all(urls.map((u) => c.match(u).then((hit) => hit || c.add(u).catch(() => {}))))));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // The admin page: show the saved copy at once, refresh it for next time
  if (req.mode === 'navigate' && url.pathname.startsWith('/admin')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(SHELL);
      const fresh = fetch(req).then((res) => {
        if (res.ok && res.status === 200 && !res.redirected) cache.put(SHELL, res.clone());
        return res;
      });
      if (saved) {
        event.waitUntil(fresh.catch(() => {}));
        return saved;
      }
      return fresh;
    })());
    return;
  }

  // Build files: from the phone first (they never change), otherwise download and keep
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(req);
      if (saved) return saved;
      const res = await fetch(req);
      if (res.ok && res.status === 200) cache.put(req, res.clone());
      return res;
    })());
    return;
  }

  // Photo thumbnail list: saved copy at once, refreshed in the background
  if (url.pathname === '/admin/thumbs.json') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(req);
      const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; });
      if (saved) { event.waitUntil(fresh.catch(() => {})); return saved; }
      return fresh;
    })());
  }
});
`;

export const GET: APIRoute = () =>
  new Response(worker.trim(), { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
