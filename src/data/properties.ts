/* ==========================================================================
   PROPERTY LISTINGS
   --------------------------------------------------------------------------
   Real properties are added in the ADMIN PANEL (/admin, stored in Supabase).
   The SAMPLE listings (sample-properties.ts) are only used for local
   development before the database exists — never on the live website.
   Every property gets its own SEO page; sold / rented ones keep their page
   (marked as sold, not indexed) but are left out of all listings.
   ========================================================================== */
import type { ImageMetadata } from 'astro';
import { remote, type PropertyRow } from '../lib/remote';
import { SAMPLE_PROPERTIES, type Property, type PropertyType, type Purpose } from './sample-properties';
import house1 from '../assets/images/house-1.jpg';
import flat1 from '../assets/images/flat-1.jpg';
import plot1 from '../assets/images/plot-1.jpg';

export type { Property, Purpose, PropertyType } from './sample-properties';
export { SAMPLE_PROPERTIES };

/* ---------------- Supabase → Property ---------------- */
const PLACEHOLDER: Record<PropertyType, ImageMetadata> = { plot: plot1, house: house1, flat: flat1 };
const fromRow = (r: PropertyRow): Property => ({
  slug: r.slug,
  title: r.title,
  purpose: r.purpose,
  type: r.type,
  price: Number(r.price),
  area: r.area,
  location: r.location,
  size: r.size,
  beds: r.beds ?? undefined,
  baths: r.baths ?? undefined,
  image: r.images?.[0] ?? PLACEHOLDER[r.type],
  gallery: (r.images ?? []).slice(1),
  featured: r.featured,
  hot: r.hot,
  description: r.description,
  features: r.features ?? [],
  showPrice: r.show_price !== false,
  videos: r.videos ?? [],
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at ?? r.created_at,
});

/** Samples only when the database is not set up (local development). An empty database shows no listings. */
export const USING_SAMPLES = !remote.connected;
/** Every property that has a page — available, sold and rented */
export const ALL_PROPERTIES: Property[] = USING_SAMPLES ? SAMPLE_PROPERTIES : remote.properties.map(fromRow);
/** Properties that can still be bought or rented — used for every listing on the website */
export const PROPERTIES: Property[] = ALL_PROPERTIES.filter((p) => isAvailable(p));

/* ---------------- Helpers ---------------- */

export function isAvailable(p: Pick<Property, 'status'>): boolean {
  return !p.status || p.status === 'available';
}

/** Formats PKR as Crore / Lakh: 42,500,000 → "4.25 Crore" */
export function formatPrice(price: number): string {
  if (price >= 10_000_000) return `${trim(price / 10_000_000)} Crore`;
  if (price >= 100_000) return `${trim(price / 100_000)} Lakh`;
  return price.toLocaleString('en-PK');
}
const trim = (n: number) => Number(n.toFixed(2)).toString();

/** Price as shown on the website — respects "Show price on website" */
export function priceText(p: Pick<Property, 'price' | 'purpose' | 'showPrice'>): string {
  if (p.showPrice === false || !p.price) return 'Price on request';
  return `PKR ${formatPrice(p.price)}${p.purpose === 'rent' ? ' /month' : ''}`;
}

export const typeLabel: Record<PropertyType, string> = { plot: 'Plot', house: 'House', flat: 'Flat' };
export const purposeLabel: Record<Purpose, string> = { sale: 'For Sale', rent: 'For Rent' };

export const getProperty = (slug: string) => ALL_PROPERTIES.find((p) => p.slug === slug);
export const featuredProperties = () => {
  const f = PROPERTIES.filter((p) => p.featured);
  return f.length >= 3 ? f : [...f, ...PROPERTIES.filter((p) => !p.featured)];
};
export const propertiesInArea = (area: string) => PROPERTIES.filter((p) => p.area === area);
