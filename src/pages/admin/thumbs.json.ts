/* Small versions of every listing / project photo for the admin app.
   Phone photos are often 12 megapixels (3–4 MB); lists and photo grids in the admin only need
   ~480 px. These are made once when the website is built and served from the fast CDN.
   Output: { "original photo URL": "/_astro/…webp" } */
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import { remote } from '../../lib/remote';

export const GET: APIRoute = async () => {
  const urls = [...new Set([...remote.properties, ...remote.projects].flatMap((r) => r.images ?? []).filter((u) => /^https:\/\//.test(u)))];
  const map: Record<string, string> = {};
  await Promise.all(
    urls.map(async (src) => {
      try {
        // The admin shows photos in 4:3 boxes (centre-cropped) — crop the same way here, so the file is half the size
        const img = await getImage({ src, width: 480, height: 360, fit: 'cover', format: 'webp', quality: 66 });
        map[src] = img.src;
      } catch {
        /* a broken photo just keeps using the original */
      }
    }),
  );
  return new Response(JSON.stringify(map), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
