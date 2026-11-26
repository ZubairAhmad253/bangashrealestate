/* ==========================================================================
   Keeps the installed app on the newest version
   • Whenever the app is opened or comes back to the screen, it quietly asks the website whether a
     newer version of the admin panel has been published (website rebuilds after a listing is saved
     keep the same version — only real changes to the admin panel count).
   • Newer version and nothing is being edited → the app reloads itself at once (a blink).
   • Newer version while a form or a dialog is open → a small "Update ready" bar appears instead,
     so nothing that was typed is ever lost.
   ========================================================================== */
import { useEffect, useState } from 'preact/hooks';
import { Icon, toast } from './ui';

/** Same name as in /admin/sw.js — the saved copy of the app page */
export const SHELL_CACHE = 'bangash-admin-shell-v2';
const MARK = 'bangash-updated';
const CURRENT = document.querySelector<HTMLMetaElement>('meta[name="app-version"]')?.content ?? '';

let ready = false;
let lastCheck = 0;
const listeners = new Set<(on: boolean) => void>();

type Mark = { t: number; told?: boolean };
const readMark = (): Mark | null => { try { return JSON.parse(sessionStorage.getItem(MARK) ?? 'null') as Mark | null; } catch { return null; } };
const writeMark = (m: Mark) => { try { sessionStorage.setItem(MARK, JSON.stringify(m)); } catch { /* private mode */ } };

/** A form screen, an open dialog or a field being typed in: never reload under the user's hands */
const busy = () => {
  const el = document.activeElement as HTMLElement | null;
  return /^#\/(properties|projects)\/[^/]+/.test(location.hash)
    || !!document.querySelector('.a-modal')
    || !!el?.matches?.('input, textarea, select, [contenteditable="true"]');
};

export function reloadNow() {
  writeMark({ t: Date.now() });
  location.reload();
}

async function newerVersionPublished() {
  const res = await fetch('/admin/', { cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) return false;
  const html = await res.text();
  const latest = new DOMParser().parseFromString(html, 'text/html').querySelector('meta[name="app-version"]')?.getAttribute('content');
  if (!latest || latest === CURRENT) return false;
  // Keep the new version on the phone, so the reload opens it even on a slow connection
  if ('caches' in window) {
    await caches.open(SHELL_CACHE)
      .then((c) => c.put('/admin/', new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
      .catch(() => {});
  }
  return true;
}

/** `opened` — the app has just started or has come back to the screen */
async function checkForUpdate(opened: boolean) {
  if (!ready) {
    if (Date.now() - lastCheck < 45_000) return;
    lastCheck = Date.now();
    ready = await newerVersionPublished().catch(() => false);
    if (!ready) return;
  }
  // Reload by itself only at a calm moment, and never twice in a row (no reload loops)
  const reloadedJustNow = Date.now() - (readMark()?.t ?? 0) < 60_000;
  if (opened && !busy() && !reloadedJustNow) return reloadNow();
  listeners.forEach((fn) => fn(true));
}

/** Starts the checks; returns a function that stops them */
export function watchForUpdates() {
  if (import.meta.env.DEV || !CURRENT) return () => {};
  // Just updated: say so once
  const mark = readMark();
  if (mark && !mark.told && Date.now() - mark.t < 30_000) {
    writeMark({ ...mark, told: true });
    setTimeout(() => toast.ok('App updated to the newest version.'), 700);
  }
  const onShow = () => { if (document.visibilityState === 'visible') void checkForUpdate(true); };
  const first = setTimeout(() => void checkForUpdate(true), 1500);
  const every = setInterval(() => { if (document.visibilityState === 'visible') void checkForUpdate(false); }, 10 * 60_000);
  document.addEventListener('visibilitychange', onShow);
  return () => {
    clearTimeout(first);
    clearInterval(every);
    document.removeEventListener('visibilitychange', onShow);
  };
}

/** The small bar shown when a newer version is ready but the user is in the middle of something */
export function UpdateBar() {
  const [on, setOn] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    listeners.add(setOn);
    return () => { listeners.delete(setOn); };
  }, []);
  if (!on || hidden) return null;
  return (
    <div class="a-update" role="status">
      <span class="a-update__icon"><Icon name="refresh" size={18} /></span>
      <span class="a-update__text">
        <strong>New version ready</strong>
        <small>Tap Update when you are done.</small>
      </span>
      <button type="button" class="a-btn a-btn--gold a-btn--sm" onClick={reloadNow}>Update</button>
      <button type="button" class="a-update__close" onClick={() => setHidden(true)} aria-label="Later"><Icon name="x" size={16} /></button>
    </div>
  );
}
