/* Width and height of a photo stored in Supabase, needed while the website builds.
   Reading them means opening the photo on Supabase, and the same photo appears on many pages
   (home, listings, area pages, its own page, similar listings…). Each photo is now opened once
   per build and remembered, instead of once for every place it appears — this keeps the
   Supabase data allowance (egress) low. */
import { inferRemoteSize } from 'astro:assets';

type Size = { width: number; height: number };
const known = new Map<string, Promise<Size>>();

export function photoSize(url: string): Promise<Size> {
  let size = known.get(url);
  if (!size) {
    size = inferRemoteSize(url).then(({ width, height }) => ({ width, height }));
    // a failed check is not remembered, so the next page can try again
    size.catch(() => known.delete(url));
    known.set(url, size);
  }
  return size;
}
