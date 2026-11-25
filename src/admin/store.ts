/* ==========================================================================
   ADMIN DATA CACHE — makes every screen open instantly
   --------------------------------------------------------------------------
   • A screen shows the last loaded data straight away and refreshes it quietly
     in the background ("stale-while-revalidate"), so changing tabs never waits
     for the internet.
   • Data for the other tabs is fetched ahead of time while the app is idle.
   • Listings, projects, reviews, photo thumbnails and counts are also kept on
     the phone, so the app opens with content even before the network answers.
     Website visitors' enquiries (leads) are personal data: memory only.
   ========================================================================== */
import { useEffect, useState } from 'preact/hooks';

interface Entry {
  data?: unknown;
  /** When the data was loaded (0 = must reload) */
  at: number;
  error?: unknown;
  promise?: Promise<unknown>;
}

const mem = new Map<string, Entry>();
const listeners = new Map<string, Set<() => void>>();
const STORAGE_KEY = 'bangash-admin-cache-v1';
const persistable = (key: string) => ['counts', 'properties', 'projects', 'testimonials', 'thumbs'].includes(key) || key.startsWith('me:');

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, { data: unknown; at: number }>;
  for (const [k, v] of Object.entries(saved)) if (persistable(k)) mem.set(k, { data: v.data, at: v.at });
} catch {
  /* private mode or unreadable data — start empty */
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const out: Record<string, { data: unknown; at: number }> = {};
    for (const [k, e] of mem) if (persistable(k) && e.data !== undefined) out[k] = { data: e.data, at: e.at };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(out)); } catch { /* storage full or blocked */ }
  }, 600);
}
const emit = (key: string) => listeners.get(key)?.forEach((l) => l());

let reportError: (e: unknown) => void = () => {};
/** Errors from screen loads are shown as a toast (set once by the app) */
export const setErrorHandler = (fn: (e: unknown) => void) => { reportError = fn; };

let afterWriteHandler: () => void = () => {};
export const setAfterWrite = (fn: () => void) => { afterWriteHandler = fn; };
/** Call after saving anything — refreshes the notification bell and counts */
export const afterWrite = () => afterWriteHandler();

/** The cached data, without loading */
export function peek<T>(key: string): T | undefined {
  return mem.get(key)?.data as T | undefined;
}
/** How old the cached data is (ms) — Infinity when there is none */
export function age(key: string): number {
  const e = mem.get(key);
  return !e || e.data === undefined ? Infinity : Date.now() - e.at;
}

/** Change cached data right away (optimistic update) */
export function mutate<T>(key: string, next: T | ((prev: T | undefined) => T)) {
  const e = mem.get(key);
  const data = typeof next === 'function' ? (next as (p: T | undefined) => T)(e?.data as T | undefined) : next;
  mem.set(key, { ...e, data, at: e?.data === undefined ? Date.now() : e.at, error: undefined });
  if (persistable(key)) saveSoon();
  emit(key);
}

/** Keeps the old objects for rows that did not change, so the screen only redraws what really changed.
    Returns the old value itself when nothing changed at all. */
function share<T>(prev: unknown, next: T): T {
  if (prev === undefined) return next;
  if (Array.isArray(prev) && Array.isArray(next)) {
    const old = new Map<unknown, unknown>();
    for (const r of prev) if (r && typeof r === 'object' && 'id' in r) old.set((r as { id: unknown }).id, r);
    let same = prev.length === next.length;
    const out = next.map((r, i) => {
      const o = r && typeof r === 'object' && 'id' in r ? old.get((r as { id: unknown }).id) : undefined;
      const keep = o !== undefined && JSON.stringify(o) === JSON.stringify(r) ? o : r;
      if (keep !== prev[i]) same = false;
      return keep;
    });
    return (same ? prev : out) as T;
  }
  return JSON.stringify(prev) === JSON.stringify(next) ? (prev as T) : next;
}

/** Load a key (a load that is already running is reused) */
export function load<T>(key: string, fetcher: () => Promise<T>, { silent = false } = {}): Promise<T> {
  const running = mem.get(key)?.promise;
  if (running) return running as Promise<T>;
  const promise = fetcher().then(
    (fresh) => {
      const prev = mem.get(key)?.data;
      const data = share(prev, fresh);
      mem.set(key, { data, at: Date.now() });
      if (persistable(key)) saveSoon();
      // Nothing changed → nothing to redraw (the usual case when a screen refreshes in the background)
      if (data !== prev) emit(key);
      return data;
    },
    (error) => {
      const cur = mem.get(key);
      mem.set(key, { data: cur?.data, at: cur?.at ?? 0, error });
      emit(key);
      if (!silent) reportError(error);
      throw error;
    },
  );
  mem.set(key, { ...(mem.get(key) ?? { at: 0 }), promise });
  return promise;
}

/** Fetch ahead of time (quietly) unless fresh data is already there */
export function prefetch<T>(key: string, fetcher: () => Promise<T>, maxAge = 30_000): Promise<T | undefined> {
  if (mem.get(key)?.promise || age(key) < maxAge) return Promise.resolve(peek<T>(key));
  return load(key, fetcher, { silent: true }).catch(() => undefined);
}

/** Mark data as old so the next screen that shows it refreshes it */
export function invalidate(...keys: string[]) {
  for (const k of keys) {
    const e = mem.get(k);
    if (e) e.at = 0;
  }
}

/** Forget everything (sign-out) */
export function clearAll() {
  mem.clear();
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* blocked */ }
  listeners.forEach((set) => set.forEach((l) => l()));
}

/** Data for a screen: cached data at once, refreshed in the background when older than `maxAge` */
export function useQuery<T>(key: string, fetcher: () => Promise<T>, maxAge = 15_000, enabled = true) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const l = () => setTick((n) => n + 1);
    let set = listeners.get(key);
    if (!set) listeners.set(key, (set = new Set()));
    set.add(l);
    if (age(key) > maxAge && !mem.get(key)?.promise) load(key, fetcher).catch(() => {});
    return () => { set!.delete(l); };
  }, [key, enabled]);
  const e = mem.get(key);
  return {
    data: e?.data as T | undefined,
    error: e?.error,
    loading: Boolean(e?.promise),
    reload: () => load(key, fetcher),
    mutate: (next: T | ((prev: T | undefined) => T)) => mutate(key, next),
  };
}
