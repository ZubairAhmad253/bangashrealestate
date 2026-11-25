/* Website areas list and URL — used by admin dropdowns */
import { AREAS } from '../data/areas';

export const AREA_OPTIONS = AREAS.map((a) => ({ slug: a.slug, name: a.name }));
export const areaName = (slug: string) => AREA_OPTIONS.find((a) => a.slug === slug)?.name ?? (slug === 'other' ? 'Other' : slug);
/** Website links from the admin panel stay on the same domain the admin is opened on */
export const SITE_URL = '';

/** Web addresses of the example listings that were copied from the original sample data
    (src/data/sample-properties.ts). Listed here so the admin can spot them without loading the samples. */
export const DEMO_SLUGS = [
  '10-marla-brand-new-house-airport-housing-society', '1-kanal-luxury-villa-bahria-town', '5-marla-residential-plot-airport-housing-society',
  '2-bed-apartment-bahria-town', '12-marla-corner-house-chaklala-scheme-3', '5-marla-house-ghauri-town',
  '8-marla-house-for-rent-airport-housing-society', '1-bed-flat-for-rent-ghauri-town', '3-bed-apartment-for-rent-bahria-town',
  '10-marla-plot-ghauri-town', '7-marla-upper-portion-for-rent-gulzar-e-quaid', '1-kanal-plot-dha', '6-marla-house-pwd-housing-society',
];
