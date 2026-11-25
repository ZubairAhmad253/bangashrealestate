/* ==========================================================================
   BUILD-TIME DATA FROM SUPABASE
   --------------------------------------------------------------------------
   While the website builds (on Vercel), properties, projects, reviews and
   settings are loaded from here. The site stays static — fast + great SEO.

   • Database not set up yet (no tables)      → local sample data
   • Supabase down / network error (on Vercel) → build FAILS → the previous
     live site keeps running (an empty site is never published)
   ========================================================================== */
import { SITE, SUPABASE } from '../config/site';

export interface PropertyRow {
  id: string;
  slug: string;
  title: string;
  purpose: 'sale' | 'rent';
  type: 'plot' | 'house' | 'flat';
  price: number;
  area: string;
  location: string;
  size: string;
  beds: number | null;
  baths: number | null;
  description: string;
  features: string[];
  images: string[];
  videos?: string[];
  show_price?: boolean;
  featured: boolean;
  hot: boolean;
  status: 'available' | 'sold' | 'rented';
  created_at: string;
  updated_at?: string;
}

export interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  location: string;
  category: 'house' | 'flats' | 'renovation' | 'commercial';
  size: string;
  status: 'completed' | 'in_progress';
  year: number | null;
  description: string;
  images: string[];
  videos?: string[];
  featured: boolean;
  created_at: string;
}

export interface TestimonialRow {
  id: string;
  name: string;
  place: string;
  text: string;
  rating: number;
}

export interface SettingsRow {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: string | null;
  google_rating: number | null;
  stats: { value: number; suffix: string; label: string }[] | null;
}

export interface RemoteData {
  /** true = Supabase tables were found and data was loaded */
  connected: boolean;
  properties: PropertyRow[];
  projects: ProjectRow[];
  testimonials: TestimonialRow[];
  settings: SettingsRow | null;
}

const EMPTY: RemoteData = { connected: false, properties: [], projects: [], testimonials: [], settings: null };

class NotSetUpError extends Error {}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE.url}/rest/v1/${path}`, {
    headers: { apikey: SUPABASE.publishableKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 404) {
    const body = await res.json().catch(() => ({}));
    if (body?.code === 'PGRST205') throw new NotSetUpError(body.message);
  }
  if (!res.ok) throw new Error(`Supabase ${path} → HTTP ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function load(): Promise<RemoteData> {
  if (process.env.SKIP_SUPABASE === '1') return EMPTY;
  try {
    const [properties, projects, testimonials, settings] = await Promise.all([
      // Sold / rented listings are loaded too: their pages stay online (marked Sold, not indexed) so shared links still work
      get<PropertyRow[]>('properties?select=*&status=in.(available,sold,rented)&order=created_at.desc'),
      get<ProjectRow[]>('projects?select=*&published=eq.true&order=featured.desc,year.desc.nullslast,created_at.desc'),
      get<TestimonialRow[]>('testimonials?select=id,name,place,text,rating&published=eq.true&order=sort_order.asc,created_at.desc'),
      get<SettingsRow[]>('settings?select=phone,whatsapp,email,hours,google_rating,stats&id=eq.1'),
    ]);
    return { connected: true, properties, projects, testimonials, settings: settings[0] ?? null };
  } catch (err) {
    if (err instanceof NotSetUpError) {
      console.warn('[supabase] Database is not set up yet — using sample data.');
      return EMPTY;
    }
    // On Vercel: fail the build so the previous site stays live
    if (process.env.VERCEL) throw err;
    console.warn('[supabase] Could not load data (local build) — using sample data:', (err as Error).message);
    return EMPTY;
  }
}

export const remote: RemoteData = await load();

/* ---------- Admin panel settings → SITE (phone, WhatsApp, stats…) ---------- */
const s = remote.settings;
if (s) {
  const site = SITE as unknown as Record<string, unknown>;
  const digits = (v: string) => v.replace(/\D/g, '');
  if (s.phone?.trim()) {
    site.phone = s.phone.trim();
    const d = digits(s.phone);
    site.phoneLink = d.startsWith('0') ? `+92${d.slice(1)}` : `+${d}`;
  }
  if (s.whatsapp?.trim()) {
    const d = digits(s.whatsapp);
    site.whatsapp = d.startsWith('0') ? `92${d.slice(1)}` : d;
  }
  if (s.email?.trim()) site.email = s.email.trim();
  if (s.hours?.trim()) site.hours = s.hours.trim();
  if (s.google_rating) site.googleRating = Number(s.google_rating);
  if (Array.isArray(s.stats) && s.stats.length === 4 && s.stats.every((x) => x && Number.isFinite(Number(x.value)) && x.label)) {
    site.stats = s.stats.map((x) => ({ value: Number(x.value), suffix: String(x.suffix ?? ''), label: String(x.label) }));
  }
}
