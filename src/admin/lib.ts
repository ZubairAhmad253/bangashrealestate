/* Admin panel — Supabase client, types and helpers */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE } from '../config/site';

export const sb = createClient(SUPABASE.url, SUPABASE.publishableKey, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'bangash-admin' },
});

/* ---------------- Types ---------------- */
export type Role = 'super_admin' | 'editor';
export interface Admin { user_id: string; email: string; name: string | null; role: Role; created_at?: string; activity_seen_at?: string }

export type ActivityEntity = 'property' | 'project' | 'review' | 'lead' | 'settings' | 'admin';
export interface ActivityRow {
  id: number;
  created_at: string;
  actor_id: string | null;
  actor_name: string;
  action: 'created' | 'updated' | 'deleted' | 'status' | 'shown' | 'hidden' | 'role';
  entity: ActivityEntity;
  entity_id: string | null;
  title: string | null;
  details: { from?: string; to?: string; changed?: string[]; price_from?: number; price_to?: number; interest?: string; source?: string } | null;
}

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
  videos: string[];
  show_price: boolean;
  featured: boolean;
  hot: boolean;
  status: 'available' | 'sold' | 'rented' | 'hidden';
  created_at: string;
  updated_at: string;
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
  videos: string[];
  featured: boolean;
  published: boolean;
  created_at: string;
}

export interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  interest: string | null;
  area: string | null;
  budget: string | null;
  message: string | null;
  source: string;
  status: 'new' | 'contacted' | 'closed' | 'spam';
  notes: string;
  created_at: string;
}

export interface TestimonialRow {
  id: string;
  name: string;
  place: string;
  text: string;
  rating: number;
  published: boolean;
  sort_order: number;
  created_at: string;
}

export interface SettingsRow {
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  hours: string | null;
  google_rating: number | null;
  stats: { value: number; suffix: string; label: string }[] | null;
}

/* ---------------- Helpers ---------------- */
export function formatPrice(price: number): string {
  if (!price) return '0';
  if (price >= 10_000_000) return `${trim(price / 10_000_000)} Crore`;
  if (price >= 100_000) return `${trim(price / 100_000)} Lakh`;
  return price.toLocaleString('en-PK');
}
const trim = (n: number) => Number(n.toFixed(2)).toString();

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120)
    .replace(/^-|-$/g, '');
}

export const shortId = () => Math.random().toString(36).slice(2, 6);

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Pakistani number → WhatsApp digits (03xx… → 923xx…) */
export function waDigits(phone: string): string {
  const d = phone.replace(/\D/g, '');
  return d.startsWith('0') ? `92${d.slice(1)}` : d;
}

export function errorText(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/Invalid login credentials/i.test(msg)) return 'Incorrect email or password.';
  if (/duplicate key.*slug/i.test(msg)) return 'A listing with this name already exists — please change the title slightly.';
  if (/row-level security|permission denied|not allowed/i.test(msg)) return 'You do not have permission to do this.';
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return 'Please check your internet connection and try again.';
  return msg;
}

/* ---------------- Photos: compress + upload ---------------- */
const MAX_SIDE = 1920;

/** Resizes photos in the browser (max 1920px, WebP) — faster uploads, less storage. */
export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.82));
  return blob && blob.size < file.size ? blob : file;
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const blob = await compressImage(file);
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
  const path = `${folder}/${Date.now()}-${shortId()}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, blob, { contentType: blob.type || 'image/jpeg', cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/** Public URL → storage path */
const pathFromUrl = (url: string) => url.split('/storage/v1/object/public/media/')[1];

export async function removeImages(urls: string[]): Promise<void> {
  const paths = urls.map(pathFromUrl).filter(Boolean);
  if (paths.length) await sb.storage.from('media').remove(paths);
}

/* ---------------- Videos ---------------- */
export const MAX_VIDEO_MB = 50;

/** Returns the YouTube video id for watch / youtu.be / shorts / embed links, otherwise null. */
export function youtubeId(url: string): string | null {
  const m = url.trim().match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}

/** TikTok video id from a full link (tiktok.com/@user/video/ID) or a player/embed link, otherwise null. */
export function tiktokId(url: string): string | null {
  const m = url.trim().match(/tiktok\.com\/(?:@[\w.-]+\/video|player\/v1|embed(?:\/v2)?|video)\/(\d{8,25})/i);
  return m ? m[1] : null;
}
export const isTikTok = (url: string) => /(^|\.)tiktok\.com\//i.test(url.replace(/^https?:\/\//, ''));
export const tiktokPlayerUrl = (id: string) => `https://www.tiktok.com/player/v1/${id}`;

/** Turns any TikTok link (including short vt./vm. share links) into a player URL using TikTok's oEmbed. */
export async function normalizeTikTok(url: string): Promise<string> {
  const direct = tiktokId(url);
  if (direct) return tiktokPlayerUrl(direct);
  const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url.trim())}`);
  const data = res.ok ? await res.json().catch(() => null) : null;
  // A video id is always a long number — a profile link returns the username instead, which is not a video
  const product = String(data?.embed_product_id ?? '');
  const id = /^\d{8,25}$/.test(product) ? product : typeof data?.html === 'string' ? tiktokId(data.html) : null;
  if (!id && (data?.embed_type === 'profile' || /^@?[\w.]+$/.test(product) || /tiktok\.com\/@[\w.]+\/?(\?|$)/i.test(url.trim()))) {
    throw new Error('This is a TikTok profile link, not a video. Open the video itself in TikTok, tap Share → Copy link, and paste that link.');
  }
  if (!id) throw new Error('Could not read this TikTok link — open the video in TikTok, tap Share → Copy link, and paste it again.');
  return tiktokPlayerUrl(String(id));
}

export async function uploadVideo(file: File, folder: string): Promise<string> {
  if (!/^video\/(mp4|quicktime|webm)$/.test(file.type)) throw new Error('Please choose an MP4, MOV or WebM video.');
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    throw new Error(`This video is ${Math.round(file.size / 1048576)} MB — the limit is ${MAX_VIDEO_MB} MB. Upload it to YouTube and paste the link instead.`);
  }
  const ext = file.type === 'video/webm' ? 'webm' : file.type === 'video/quicktime' ? 'mov' : 'mp4';
  const path = `${folder}/videos/${Date.now()}-${shortId()}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}

/** Only files stored in our bucket can be removed (not YouTube links). */
export const isStoredMedia = (url: string) => url.includes('/storage/v1/object/public/media/');

/* ---------------- Website publish ---------------- */
export async function requestRebuild(): Promise<boolean> {
  const { data, error } = await sb.rpc('request_rebuild');
  if (error) throw error;
  return Boolean(data);
}
