/* What each admin screen loads — shared by the screens and by prefetching */
import { sb, type ActivityRow, type Admin, type LeadRow, type ProjectRow, type PropertyRow, type TestimonialRow } from './lib';
import { load, peek, prefetch, useQuery } from './store';

async function rows<T>(query: PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw error;
  return (data as T[]) ?? [];
}

export const fetchers = {
  properties: () => rows<PropertyRow>(sb.from('properties').select('*').order('created_at', { ascending: false })),
  projects: () => rows<ProjectRow>(sb.from('projects').select('*').order('created_at', { ascending: false })),
  leads: () => rows<LeadRow>(sb.from('leads').select('*').order('created_at', { ascending: false }).limit(500)),
  /** Just the 5 latest enquiries (dashboard), when the full list is not loaded yet */
  recentLeads: () => rows<LeadRow>(sb.from('leads').select('*').neq('status', 'spam').order('created_at', { ascending: false }).limit(5)),
  testimonials: () => rows<TestimonialRow>(sb.from('testimonials').select('*').order('sort_order').order('created_at', { ascending: false })),
  /** Small photo versions made when the website is built: { original URL: thumbnail URL } */
  thumbs: async (): Promise<Record<string, string>> => {
    try {
      const res = await fetch('/admin/thumbs.json');
      return res.ok ? await res.json() : {};
    } catch {
      return {};
    }
  },
  me: async (uid: string): Promise<Admin | null> => {
    const { data, error } = await sb.from('admins').select('*').eq('user_id', uid).maybeSingle();
    if (error) throw error;
    return (data as Admin | null) ?? null;
  },
};

export const ACTIVITY_PAGE = 40;
export const activityKey = (filter: string) => `activity:${filter}`;
export function fetchActivity(filter: string, offset = 0) {
  let q = sb.from('activity').select('*').order('created_at', { ascending: false }).range(offset, offset + ACTIVITY_PAGE - 1);
  if (filter === 'team') q = q.in('entity', ['settings', 'admin']);
  else if (filter) q = q.eq('entity', filter);
  return rows<ActivityRow>(q);
}

export const useProperties = () => useQuery('properties', fetchers.properties);
export const useProjects = () => useQuery('projects', fetchers.projects);
export const useLeads = () => useQuery('leads', fetchers.leads);
export const useTestimonials = () => useQuery('testimonials', fetchers.testimonials);

/** Photo → fast thumbnail (falls back to the original until the website has been rebuilt) */
export function useThumbs() {
  const { data } = useQuery('thumbs', fetchers.thumbs, 10 * 60_000);
  return (url: string) => data?.[url] ?? url;
}

/** While the app is idle: load every tab's data and the first thumbnails, so each tab opens instantly */
export function prefetchAll() {
  const idle = (fn: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 800));
  idle(() => {
    const props = prefetch('properties', fetchers.properties);
    const projects = prefetch('projects', fetchers.projects);
    const thumbs = prefetch('thumbs', fetchers.thumbs, 10 * 60_000);
    void prefetch('leads', fetchers.leads);
    void prefetch('testimonials', fetchers.testimonials);
    void prefetch(activityKey(''), () => fetchActivity(''), 10_000);
    // Warm up the thumbnails at the top of the Properties and Projects lists
    Promise.all([props, projects, thumbs]).then(([p, pr, map]) => {
      if (!map) return;
      const first = [...(p ?? []).slice(0, 8), ...(pr ?? []).slice(0, 4)].map((x) => x.images?.[0]).filter(Boolean) as string[];
      for (const url of first) {
        if (!map[url]) continue; // never pre-load full-size originals
        const img = new Image();
        img.decoding = 'async';
        img.src = map[url];
      }
    });
  });
}

/** A listing from the cache (for opening the edit form instantly) */
export const cachedProperty = (id: string) => peek<PropertyRow[]>('properties')?.find((p) => p.id === id);
export const cachedProject = (id: string) => peek<ProjectRow[]>('projects')?.find((p) => p.id === id);
export { load };
