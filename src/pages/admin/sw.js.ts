/* Service worker for the installed admin app (scope: /admin/).
   • Opening the app always loads the newest published version when the phone is online. Only when the
     network is slow (over 3 seconds) or missing does the copy saved on the phone open instead.
   • Build files (/_astro/…) never change once published (a new version gets new file names), so they
     are kept on the phone and open instantly.
   • Nothing else is touched: database requests, sign-in and photos from Supabase always go to the network.
   The worker itself only changes when this file changes. Checking for newer versions of the app is done
   by the app (src/admin/update.tsx). */
import type { APIRoute } from 'astro';

const worker = String.raw`
const SHELL_CACHE = 'bangash-admin-shell-v2';   // the app page (same name in src/admin/update.tsx)
const ASSET_CACHE = 'bangash-admin-assets-v2';  // build files
const KEEP = [SHELL_CACHE, ASSET_CACHE];
const SHELL = '/admin/';
const FORM = /#\/(properties|projects)\/[^/]+/;
const NETWORK_WAIT = 3000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((c) => c.add(new Request(SHELL, { cache: 'reload' })))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Remove what older versions of this worker saved
    let replacedOlder = false;
    for (const key of await caches.keys()) {
      if (key.startsWith('bangash-admin-') && !KEEP.includes(key)) {
        await caches.delete(key);
        replacedOlder = true;
      }
    }
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable().catch(() => {});
    await self.clients.claim();
    // Screens opened by an older version reload once into the new one
    // (never a screen with a form on it, so nothing typed is lost)
    if (replacedOlder) {
      for (const client of await self.clients.matchAll({ type: 'window' })) {
        if (!FORM.test(client.url) && 'navigate' in client) client.navigate(client.url).catch(() => {});
      }
    }
    // Saved build files never grow without limit: the newest 150 stay
    const assets = await caches.open(ASSET_CACHE);
    const keys = await assets.keys();
    for (const req of keys.slice(0, Math.max(0, keys.length - 150))) await assets.delete(req);
  })());
});

// The page sends the build files it loaded before the worker was installed
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'precache') return;
  const urls = (event.data.urls || []).filter((u) => typeof u === 'string' && new URL(u).origin === location.origin && new URL(u).pathname.startsWith('/_astro/'));
  event.waitUntil(caches.open(ASSET_CACHE).then((c) => Promise.all(urls.map((u) => c.match(u).then((hit) => hit || c.add(u).catch(() => {}))))));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Opening the app: the newest version from the network; the saved copy only if the network is slow or offline
  if (req.mode === 'navigate' && url.pathname.startsWith('/admin')) {
    let saving = Promise.resolve();
    const network = (async () => {
      const res = (await event.preloadResponse) || (await fetch(req));
      if (res.ok && res.status === 200 && !res.redirected) {
        const copy = res.clone();
        saving = caches.open(SHELL_CACHE).then((c) => c.put(SHELL, copy)).catch(() => {});
      }
      return res;
    })();
    event.waitUntil(network.then(() => saving, () => {}));
    event.respondWith((async () => {
      const quick = await Promise.race([network.catch(() => null), new Promise((r) => setTimeout(r, NETWORK_WAIT, null))]);
      if (quick && quick.ok) return quick;
      const saved = await caches.match(SHELL, { cacheName: SHELL_CACHE });
      if (saved) return saved;
      return quick || network;
    })());
    return;
  }

  // Build files: from the phone first (they never change), otherwise download and keep
  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const saved = await cache.match(req);
      if (saved) return saved;
      const res = await fetch(req);
      if (res.ok && res.status === 200) cache.put(req, res.clone()).catch(() => {});
      return res;
    })());
    return;
  }

  // Photo thumbnail list: saved copy at once, refreshed in the background
  if (url.pathname === '/admin/thumbs.json') {
    event.respondWith((async () => {
      const cache = await caches.open(SHELL_CACHE);
      const saved = await cache.match(req);
      const fresh = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()).catch(() => {}); return res; });
      if (saved) { event.waitUntil(fresh.catch(() => {})); return saved; }
      return fresh;
    })());
  }
});
`;

export const GET: APIRoute = () =>
  new Response(worker.trim(), { headers: { 'Content-Type': 'text/javascript; charset=utf-8' } });
