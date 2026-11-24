/* Web app manifest for the admin panel, so it can be installed on a phone's home screen */
import type { APIRoute } from 'astro';
import { getImage } from 'astro:assets';
import logoMark from '../../assets/brand/logo-mark.png';

export const GET: APIRoute = async () => {
  const icons = await Promise.all(
    [192, 512].map(async (size) => {
      const img = await getImage({ src: logoMark, width: size, height: size, format: 'png' });
      return { src: img.src, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' };
    }),
  );
  const manifest = {
    name: 'Bangash Real Estate — Admin',
    short_name: 'Bangash Admin',
    description: 'Manage properties, leads, projects and reviews.',
    start_url: '/admin/',
    scope: '/admin/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f4ee',
    theme_color: '#f7f4ee',
    icons,
  };
  return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': 'application/manifest+json' } });
};
