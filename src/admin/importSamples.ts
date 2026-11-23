/* One-click import: copies the listings currently shown on the website (sample listings + their
   photos) into Supabase, so everything is managed from the database and admin panel.
   Photos are uploaded first; all rows are then inserted in ONE statement so the website
   rebuilds only once. Existing slugs are skipped, so it is safe to run again. */
import type { ImageMetadata } from 'astro';
import { SAMPLE_PROPERTIES } from '../data/sample-properties';
import { sb, uploadImage } from './lib';

export const SAMPLE_COUNT = SAMPLE_PROPERTIES.length;
export const SAMPLE_SLUGS = SAMPLE_PROPERTIES.map((p) => p.slug);

const srcOf = (img: ImageMetadata | string) => (typeof img === 'string' ? img : img.src);

async function fileFrom(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load photo ${name} (HTTP ${res.status})`);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || 'image/jpeg' });
}

export async function importSampleListings(onProgress: (done: number, total: number, label: string) => void): Promise<number> {
  const { data: existing, error } = await sb.from('properties').select('slug');
  if (error) throw error;
  const have = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  const todo = SAMPLE_PROPERTIES.filter((p) => !have.has(p.slug));
  if (!todo.length) return 0;

  const totalPhotos = todo.reduce((n, p) => n + 1 + (p.gallery?.length ?? 0), 0);
  let done = 0;
  const rows = [];
  for (const p of todo) {
    const images: string[] = [];
    for (const [i, img] of [p.image, ...(p.gallery ?? [])].entries()) {
      onProgress(done, totalPhotos, p.title);
      const file = await fileFrom(srcOf(img), `${p.slug}-${i + 1}.jpg`);
      images.push(await uploadImage(file, `properties/${p.slug}`));
      done++;
    }
    rows.push({
      slug: p.slug,
      title: p.title,
      purpose: p.purpose,
      type: p.type,
      price: p.price,
      area: p.area,
      location: p.location,
      size: p.size,
      beds: p.beds ?? null,
      baths: p.baths ?? null,
      description: p.description,
      features: p.features,
      images,
      featured: Boolean(p.featured),
      hot: Boolean(p.hot),
      status: 'available',
    });
  }
  onProgress(totalPhotos, totalPhotos, 'Saving listings…');
  const { error: insertError } = await sb.from('properties').insert(rows);
  if (insertError) throw insertError;
  return rows.length;
}
