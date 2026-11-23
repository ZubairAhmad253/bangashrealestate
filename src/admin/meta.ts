/* Website ki areas list aur URL — admin dropdowns ke liye */
import { AREAS } from '../data/areas';
import { SITE } from '../config/site';

export const AREA_OPTIONS = AREAS.map((a) => ({ slug: a.slug, name: a.name }));
export const areaName = (slug: string) => AREA_OPTIONS.find((a) => a.slug === slug)?.name ?? (slug === 'other' ? 'Other' : slug);
export const SITE_URL = SITE.url;
