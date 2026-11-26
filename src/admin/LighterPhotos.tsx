/* ==========================================================================
   Lighter photos (Settings, super admin)
   Older photos were uploaded at full phone size (up to 3 MB each). Every website build reads them
   from Supabase, which uses up the free plan's data allowance (egress). This makes a light copy of
   each large photo (max 1920 px, ~300 KB — looks the same on the website) and uses it in the
   listing instead. The original files stay in storage, untouched.
   ========================================================================== */
import { useState } from 'preact/hooks';
import { sb, compressImage, shortId, isStoredMedia, requestRebuild } from './lib';
import { Icon, toast, confirmDialog } from './ui';
import { invalidate } from './store';

const LARGE = 600 * 1024; // photos above this size get a light copy
const MB = (b: number) => `${(b / 1048576).toFixed(1)} MB`;
const storagePath = (url: string) => url.split('/storage/v1/object/public/media/')[1] ?? '';

type Row = { table: 'properties' | 'projects'; id: string; images: string[] };
type Progress = { done: number; total: number; before: number; after: number };

async function sizeOf(url: string) {
  const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
  return res.ok ? Number(res.headers.get('content-length') || 0) : 0;
}

/** A light copy of one photo, uploaded next to the original. Returns null when it would not help. */
async function lightCopy(url: string): Promise<{ url: string; before: number; after: number } | null> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const original = await res.blob();
  const light = await compressImage(new File([original], 'photo', { type: original.type || 'image/jpeg' }));
  if (light.size > original.size * 0.8) return null; // already small enough
  const path = storagePath(url);
  const folder = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : 'properties';
  const ext = light.type === 'image/webp' ? 'webp' : 'jpg';
  const newPath = `${folder}/${Date.now()}-${shortId()}-light.${ext}`;
  const { error } = await sb.storage.from('media').upload(newPath, light, { contentType: light.type || 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;
  return { url: sb.storage.from('media').getPublicUrl(newPath).data.publicUrl, before: original.size, after: light.size };
}

export function LighterPhotos() {
  const [state, setState] = useState<'idle' | 'checking' | 'working' | 'done'>('idle');
  const [p, setP] = useState<Progress>({ done: 0, total: 0, before: 0, after: 0 });

  const run = async () => {
    setState('checking');
    try {
      // Listings on the website (hidden ones are not read by anyone, so they are skipped)
      const [a, b] = await Promise.all([
        sb.from('properties').select('id,images,status').neq('status', 'hidden'),
        sb.from('projects').select('id,images'),
      ]);
      if (a.error) throw a.error;
      if (b.error) throw b.error;
      const rows: Row[] = [
        ...((a.data ?? []) as { id: string; images: string[] }[]).map((r) => ({ table: 'properties' as const, id: r.id, images: r.images ?? [] })),
        ...((b.data ?? []) as { id: string; images: string[] }[]).map((r) => ({ table: 'projects' as const, id: r.id, images: r.images ?? [] })),
      ];
      // Find the large photos (only their size is asked for — nothing is downloaded yet)
      const large: { row: Row; url: string }[] = [];
      for (const row of rows) {
        for (const url of row.images) {
          if (isStoredMedia(url) && !url.includes('-light.') && (await sizeOf(url).catch(() => 0)) > LARGE) large.push({ row, url });
        }
      }
      if (!large.length) {
        setState('done');
        setP({ done: 0, total: 0, before: 0, after: 0 });
        toast.ok('All photos are already light.');
        return;
      }
      if (!(await confirmDialog(`Make ${large.length} photos lighter?`, 'Each large photo gets a light copy (same look on the website) and the listing uses it. The original files stay in storage. Takes about a minute — keep this screen open.', 'Make them lighter', false))) {
        setState('idle');
        return;
      }
      setState('working');
      const prog: Progress = { done: 0, total: large.length, before: 0, after: 0 };
      setP({ ...prog });
      const changed = new Map<Row, Map<string, string>>();
      for (const { row, url } of large) {
        const copy = await lightCopy(url).catch(() => null);
        if (copy) {
          if (!changed.has(row)) changed.set(row, new Map());
          changed.get(row)!.set(url, copy.url);
          prog.before += copy.before;
          prog.after += copy.after;
        }
        prog.done++;
        setP({ ...prog });
      }
      // Each listing is saved once, with its photos in the same order
      for (const [row, swaps] of changed) {
        const images = row.images.map((u) => swaps.get(u) ?? u);
        const { error } = await sb.from(row.table).update({ images }).eq('id', row.id);
        if (error) throw error;
      }
      invalidate('properties', 'projects');
      await requestRebuild().catch(() => false);
      setState('done');
      toast.ok(`${changed.size ? `Done — photos now ${MB(prog.after)} instead of ${MB(prog.before)}.` : 'Nothing needed changing.'} The website updates in a few minutes.`);
    } catch (e) {
      setState('idle');
      toast.err(e);
    }
  };

  const busy = state === 'checking' || state === 'working';
  return (
    <section class="a-card">
      <h2 class="a-card__title"><span><Icon name="image" size={16} /></span> Lighter photos</h2>
      <p class="a-muted">
        Older photos were uploaded at full phone size (up to 3 MB each). Making them lighter keeps the Supabase
        free plan within its monthly data allowance. Photos look the same on the website; the original files stay in storage.
      </p>
      {state === 'working' && (
        <div class="a-progress" role="progressbar" aria-valuemin={0} aria-valuemax={p.total} aria-valuenow={p.done}>
          <span style={{ width: `${p.total ? Math.round((p.done / p.total) * 100) : 0}%` }} />
          <small>Photo {Math.min(p.done + 1, p.total)} of {p.total} — {MB(p.before)} → {MB(p.after)}</small>
        </div>
      )}
      {state === 'done' && p.total > 0 && <p class="a-alert a-alert--info">{p.total} photos checked: {MB(p.before)} → {MB(p.after)}.</p>}
      <div class="a-row">
        <button type="button" class={`a-btn a-btn--soft${busy ? ' is-busy' : ''}`} onClick={run} disabled={busy}>
          <Icon name={busy ? 'refresh' : 'image'} size={16} /> {state === 'checking' ? 'Checking photos…' : state === 'working' ? 'Working…' : 'Make photos lighter'}
        </button>
      </div>
    </section>
  );
}
